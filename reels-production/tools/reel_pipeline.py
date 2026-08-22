#!/usr/bin/env python3
"""Idempotent local state manager and technical QC for research-reel production.

This tool never fabricates research, media, or upload success. It records only
artifacts that exist, enforces legal status transitions, and stores failures
explicitly for later retry.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
PROGRESS_PATH = ROOT / "progress.json"
VALID_STATUSES = [
    "planned",
    "researched",
    "verified",
    "scripted",
    "voiced",
    "rendered",
    "qc_passed",
    "uploaded",
    "complete",
]
TERMINAL_STATUSES = {"complete"}


def now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)


def valid_reel_id(value: str) -> str:
    if not value.startswith("Reel_") or len(value) != 9 or not value[5:].isdigit():
        raise ValueError("रील ID का प्रारूप Reel_0001 से Reel_3000 होना चाहिए।")
    number = int(value[5:])
    if not 1 <= number <= 3000:
        raise ValueError("रील ID 0001 से 3000 के बीच होना चाहिए।")
    return value


def batch_for(reel_id: str) -> str:
    number = int(reel_id[5:])
    return f"Batch_{((number - 1) // 30) + 1:03d}"


def reel_dir(reel_id: str) -> Path:
    return ROOT / "batches" / batch_for(reel_id) / reel_id


def manifest_path(reel_id: str) -> Path:
    return reel_dir(reel_id) / "manifest.json"


def load_manifest(reel_id: str) -> dict[str, Any]:
    path = manifest_path(reel_id)
    if not path.exists():
        raise FileNotFoundError(f"{reel_id} का manifest मौजूद नहीं है। पहले init चलाएँ।")
    return load_json(path)


def save_manifest(reel_id: str, manifest: dict[str, Any]) -> None:
    manifest["updated_at_utc"] = now()
    write_json(manifest_path(reel_id), manifest)


def update_progress(manifest: dict[str, Any]) -> None:
    progress = load_json(PROGRESS_PATH)
    reel_id = manifest["reel_id"]
    batch_id = manifest["batch_id"]
    batches = {item["batch_id"]: item for item in progress["batches"]}
    batch = batches.setdefault(batch_id, {"batch_id": batch_id, "reels": {}})
    batch["reels"][reel_id] = {
        "status": manifest["status"],
        "title": manifest["title"],
        "updated_at_utc": manifest["updated_at_utc"],
        "attempt_count": len(manifest["attempts"]),
    }
    progress["batches"] = [batches[key] for key in sorted(batches)]
    all_manifests = []
    for item in ROOT.glob("batches/Batch_*/Reel_*/manifest.json"):
        all_manifests.append(load_json(item))
    progress["completion"]["completed_reels"] = sum(item["status"] == "complete" for item in all_manifests)
    progress["completion"]["failed_reels"] = sum(item["status"] == "failed" for item in all_manifests)
    progress["completion"]["needs_review_reels"] = sum(item["status"] == "needs_review" for item in all_manifests)
    completed = [item["reel_id"] for item in all_manifests if item["status"] == "complete"]
    progress["last_successful_reel_id"] = max(completed, default=None)
    pending = [f"Reel_{index:04d}" for index in range(1, 3001) if f"Reel_{index:04d}" not in completed]
    progress["next_reel_id"] = pending[0] if pending else None
    progress["last_updated_utc"] = now()
    write_json(PROGRESS_PATH, progress)


def add_event(manifest: dict[str, Any], event: str, detail: str) -> None:
    manifest["events"].append({"at_utc": now(), "event": event, "detail": detail})


def initialize(args: argparse.Namespace) -> int:
    reel_id = valid_reel_id(args.reel_id)
    target = manifest_path(reel_id)
    if target.exists():
        existing = load_json(target)
        print(json.dumps({"result": "existing", "reel_id": reel_id, "status": existing["status"]}, ensure_ascii=False))
        return 0
    directory = reel_dir(reel_id)
    for name in ("assets", "captions", "qc", "scripts", "sources", "voice", "video"):
        (directory / name).mkdir(parents=True, exist_ok=True)
    progress = load_json(PROGRESS_PATH)
    manifest = {
        "schema_version": 1,
        "reel_id": reel_id,
        "batch_id": batch_for(reel_id),
        "title": args.title,
        "topic": args.topic,
        "claim_type": args.claim_type,
        "status": "planned",
        "created_at_utc": now(),
        "updated_at_utc": now(),
        "source_record": args.source_record,
        "drive": {
            "root_folder_id": progress.get("storage", {}).get("root_folder_id"),
            "reel_folder_id": None,
            "upload_records": [],
        },
        "artifacts": {
            "script": None,
            "voiceover": None,
            "captions": None,
            "video": None,
            "qc_report": None,
        },
        "attempts": [],
        "events": [],
    }
    add_event(manifest, "initialized", "Manifest और स्थानीय कार्य-निर्देशिका बनाई गई; कोई मीडिया अभी उत्पन्न नहीं।")
    write_json(target, manifest)
    update_progress(manifest)
    print(json.dumps({"result": "initialized", "reel_id": reel_id, "directory": str(directory)}, ensure_ascii=False))
    return 0


def transition(args: argparse.Namespace) -> int:
    reel_id = valid_reel_id(args.reel_id)
    manifest = load_manifest(reel_id)
    if manifest["status"] in TERMINAL_STATUSES:
        raise ValueError("complete रील में कोई परिवर्तन नहीं किया जा सकता।")
    if args.to not in VALID_STATUSES:
        raise ValueError("अवैध लक्ष्य स्थिति।")
    old_index = VALID_STATUSES.index(manifest["status"])
    new_index = VALID_STATUSES.index(args.to)
    if new_index != old_index + 1:
        raise ValueError(f"स्थिति केवल अगले चरण में जा सकती है: वर्तमान {manifest['status']}।")
    if args.to == "qc_passed" and not manifest["artifacts"]["qc_report"]:
        raise ValueError("qc_passed से पहले QC रिपोर्ट अनिवार्य है।")
    if args.to in {"uploaded", "complete"} and not manifest["drive"]["upload_records"]:
        raise ValueError("uploaded/complete से पहले सत्यापित Drive upload record अनिवार्य है।")
    manifest["status"] = args.to
    add_event(manifest, "status_transition", f"{VALID_STATUSES[old_index]} → {args.to}. {args.note}")
    save_manifest(reel_id, manifest)
    update_progress(manifest)
    print(json.dumps({"result": "advanced", "reel_id": reel_id, "status": args.to}, ensure_ascii=False))
    return 0


def record_failure(args: argparse.Namespace) -> int:
    reel_id = valid_reel_id(args.reel_id)
    manifest = load_manifest(reel_id)
    attempt = {
        "at_utc": now(),
        "stage": args.stage,
        "error": args.error,
        "next_action": args.next_action,
    }
    manifest["attempts"].append(attempt)
    manifest["status"] = "needs_review" if args.needs_review else "failed"
    add_event(manifest, "failure_recorded", f"{args.stage}: {args.error}")
    save_manifest(reel_id, manifest)
    update_progress(manifest)
    print(json.dumps({"result": "failure_recorded", "reel_id": reel_id, "status": manifest["status"]}, ensure_ascii=False))
    return 0


def resume_after_failure(args: argparse.Namespace) -> int:
    """Resume a recoverable failed reel at an explicitly chosen prior valid stage.

    This records a recovery event; it never removes the original failure attempt.
    """
    reel_id = valid_reel_id(args.reel_id)
    manifest = load_manifest(reel_id)
    if manifest["status"] not in {"failed", "needs_review"}:
        raise ValueError("resume केवल failed या needs_review रील के लिए उपलब्ध है।")
    if args.to not in VALID_STATUSES:
        raise ValueError("resume का लक्ष्य वैध production status होना चाहिए।")
    previous = manifest["status"]
    manifest["status"] = args.to
    add_event(manifest, "recovery_resumed", f"{previous} → {args.to}. {args.note}")
    save_manifest(reel_id, manifest)
    update_progress(manifest)
    print(json.dumps({"result": "resumed", "reel_id": reel_id, "status": args.to}, ensure_ascii=False))
    return 0


def record_artifact(args: argparse.Namespace) -> int:
    reel_id = valid_reel_id(args.reel_id)
    manifest = load_manifest(reel_id)
    if args.kind not in manifest["artifacts"]:
        raise ValueError("artifact kind script, voiceover, captions, video या qc_report में से एक होना चाहिए।")
    artifact = Path(args.path).resolve()
    if not artifact.exists() or artifact.stat().st_size == 0:
        raise FileNotFoundError("रिकॉर्ड करने के लिए artifact उपलब्ध नहीं है या रिक्त है।")
    manifest["artifacts"][args.kind] = str(artifact)
    add_event(manifest, "artifact_recorded", f"{args.kind}: {artifact.name}")
    save_manifest(reel_id, manifest)
    update_progress(manifest)
    print(json.dumps({"result": "artifact_recorded", "reel_id": reel_id, "kind": args.kind}, ensure_ascii=False))
    return 0


def record_upload(args: argparse.Namespace) -> int:
    reel_id = valid_reel_id(args.reel_id)
    manifest = load_manifest(reel_id)
    uploaded_file = Path(args.local_file).resolve()
    if not uploaded_file.exists() or uploaded_file.stat().st_size == 0:
        raise FileNotFoundError("अपलोड रिकॉर्ड के लिए स्थानीय फ़ाइल उपलब्ध नहीं है या रिक्त है।")
    if not args.drive_file_id or not args.drive_parent_id:
        raise ValueError("Drive file ID और parent folder ID दोनों अनिवार्य हैं।")
    record = {
        "at_utc": now(),
        "local_file": str(uploaded_file),
        "sha256": file_hash(uploaded_file),
        "drive_file_id": args.drive_file_id,
        "drive_parent_id": args.drive_parent_id,
        "drive_web_view_link": args.drive_web_view_link,
    }
    manifest["drive"]["reel_folder_id"] = args.drive_parent_id
    manifest["drive"]["upload_records"].append(record)
    add_event(manifest, "upload_recorded", f"{uploaded_file.name} → {args.drive_file_id}")
    save_manifest(reel_id, manifest)
    update_progress(manifest)
    print(json.dumps({"result": "upload_recorded", "reel_id": reel_id, "drive_file_id": args.drive_file_id}, ensure_ascii=False))
    return 0


def file_hash(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def ffprobe(path: Path) -> dict[str, Any]:
    command = [
        "ffprobe",
        "-v", "error",
        "-show_entries", "format=duration:stream=codec_type,width,height",
        "-of", "json",
        str(path),
    ]
    completed = subprocess.run(command, check=True, text=True, capture_output=True)
    return json.loads(completed.stdout)


def run_qc(args: argparse.Namespace) -> int:
    reel_id = valid_reel_id(args.reel_id)
    manifest = load_manifest(reel_id)
    video = Path(args.video).resolve()
    checks: list[dict[str, Any]] = []
    if not video.exists() or video.stat().st_size == 0:
        checks.append({"name": "file_exists", "passed": False, "detail": "वीडियो फ़ाइल उपलब्ध नहीं है या रिक्त है।"})
        probe: dict[str, Any] = {}
    else:
        checks.append({"name": "file_exists", "passed": True, "detail": f"{video.stat().st_size} bytes"})
        try:
            probe = ffprobe(video)
        except subprocess.CalledProcessError as exc:
            probe = {"error": exc.stderr}
            checks.append({"name": "file_integrity", "passed": False, "detail": exc.stderr.strip()})
    streams = probe.get("streams", [])
    video_streams = [stream for stream in streams if stream.get("codec_type") == "video"]
    audio_streams = [stream for stream in streams if stream.get("codec_type") == "audio"]
    if video_streams:
        stream = video_streams[0]
        width, height = int(stream.get("width", 0)), int(stream.get("height", 0))
        portrait = height > width and abs((width / height) - (9 / 16)) < 0.01
        checks.append({"name": "vertical_9_16", "passed": portrait, "detail": f"{width}x{height}"})
    else:
        checks.append({"name": "vertical_9_16", "passed": False, "detail": "वीडियो स्ट्रीम नहीं मिली।"})
    checks.append({"name": "audio_stream", "passed": bool(audio_streams), "detail": f"audio streams: {len(audio_streams)}"})
    duration = float(probe.get("format", {}).get("duration", 0) or 0)
    checks.append({"name": "duration_55_to_65_seconds", "passed": 55 <= duration <= 65, "detail": f"{duration:.3f} seconds"})
    passed = all(check["passed"] for check in checks)
    report = {
        "reel_id": reel_id,
        "generated_at_utc": now(),
        "video": str(video),
        "sha256": file_hash(video) if video.exists() and video.stat().st_size else None,
        "duration_seconds": duration,
        "passed": passed,
        "checks": checks,
    }
    report_path = reel_dir(reel_id) / "qc" / "technical_qc.json"
    write_json(report_path, report)
    manifest["artifacts"]["video"] = str(video)
    manifest["artifacts"]["qc_report"] = str(report_path)
    add_event(manifest, "technical_qc", "PASS" if passed else "FAIL")
    save_manifest(reel_id, manifest)
    update_progress(manifest)
    print(json.dumps(report, ensure_ascii=False))
    return 0 if passed else 2


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)

    init = commands.add_parser("init", help="नया, idempotent रील manifest बनाएँ")
    init.add_argument("reel_id")
    init.add_argument("--title", required=True)
    init.add_argument("--topic", required=True)
    init.add_argument("--claim-type", required=True)
    init.add_argument("--source-record", required=True)
    init.set_defaults(handler=initialize)

    stage = commands.add_parser("advance", help="अगली वैध उत्पादन-स्थिति में बढ़ाएँ")
    stage.add_argument("reel_id")
    stage.add_argument("--to", required=True)
    stage.add_argument("--note", default="")
    stage.set_defaults(handler=transition)

    failure = commands.add_parser("fail", help="विफलता दर्ज करें; इसे छिपाएँ नहीं")
    failure.add_argument("reel_id")
    failure.add_argument("--stage", required=True)
    failure.add_argument("--error", required=True)
    failure.add_argument("--next-action", required=True)
    failure.add_argument("--needs-review", action="store_true")
    failure.set_defaults(handler=record_failure)

    resume = commands.add_parser("resume", help="recoverable failure के बाद prior valid stage से resume करें")
    resume.add_argument("reel_id")
    resume.add_argument("--to", required=True)
    resume.add_argument("--note", required=True)
    resume.set_defaults(handler=resume_after_failure)

    artifact = commands.add_parser("artifact", help="मौजूद local artifact को manifest में दर्ज करें")
    artifact.add_argument("reel_id")
    artifact.add_argument("--kind", required=True)
    artifact.add_argument("--path", required=True)
    artifact.set_defaults(handler=record_artifact)

    upload = commands.add_parser("upload-record", help="सत्यापित Drive upload का manifest record जोड़ें")
    upload.add_argument("reel_id")
    upload.add_argument("--local-file", required=True)
    upload.add_argument("--drive-file-id", required=True)
    upload.add_argument("--drive-parent-id", required=True)
    upload.add_argument("--drive-web-view-link", required=True)
    upload.set_defaults(handler=record_upload)

    qc = commands.add_parser("qc", help="MP4 की तकनीकी गुणवत्ता-जाँच")
    qc.add_argument("reel_id")
    qc.add_argument("--video", required=True)
    qc.set_defaults(handler=run_qc)

    args = parser.parse_args()
    try:
        return args.handler(args)
    except (FileNotFoundError, ValueError, subprocess.CalledProcessError, json.JSONDecodeError) as exc:
        print(json.dumps({"error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
