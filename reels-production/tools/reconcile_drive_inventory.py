#!/usr/bin/env python3
"""Rebuild local reel state from verified Google Drive evidence without recreating media."""

from __future__ import annotations

import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
PROGRESS_PATH = ROOT / "progress.json"
FOLDER_IDS = {
    "Reel_0006": "1MCPJgU_3t5V2be8evAuy8wyCUrQwjymg",
    "Reel_0007": "1EpdVrQD1yVxlKZJCinbmzCRTEv0ciWhH",
    "Reel_0008": "1RrzDZfbLR0cSOIqiiZpls_gIfAGFLc1u",
    "Reel_0009": "1s0IHVkICi30qs5lVDy6KRKDHHIPr7IpL",
    "Reel_0010": "1nU7IaTmjf46WEPV0nR1YDpBzCxIVJfZD",
    "Reel_0011": "1ib27MtHw8cMT-JwOs1wlqjK9qnOBgdbj",
    "Reel_0012": "1xt_BlgYVJAsv1bRGgWL0VfxjIt8fd5sJ",
    "Reel_0013": "1JRxhNbSciYSSR03vWhqyCQfnVoOwciBN",
    "Reel_0014": "1_MD3fWEKHKUuMAi67FqzSC5zzmhzzMd8",
    "Reel_0015": "1hTuPexv4D5Z8YSz9hduB6plaUfvSUyXf",
    "Reel_0016": "1BbOyDg1cOr4V5R1V25jZ7FP6jAjqxsc6",
    "Reel_0017": "1OvDmCsqSgO18xRnjTchVjnag3e35O88d",
    "Reel_0018": "1h7OdqXbSxDGvR7Rv-0gWd_0O-M27BR5c",
    "Reel_0019": "1MHbbKK5ptJuQq_nWjgrgat9Gg-w6lrlW",
    "Reel_0020": "1wOcMB7Q3ykZcHXGOGtyokplGdqUwnMGG",
}


def now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temp.replace(path)


def list_folder(folder_id: str) -> list[dict[str, Any]]:
    params = {
        "q": f"'{folder_id}' in parents and trashed = false",
        "fields": "files(id,name,mimeType,size,md5Checksum,webViewLink,modifiedTime)",
        "pageSize": 100,
    }
    result = subprocess.run(
        ["gws", "drive", "files", "list", "--params", json.dumps(params)],
        text=True,
        capture_output=True,
        check=True,
    )
    return json.loads(result.stdout).get("files", [])


def named(files: list[dict[str, Any]], terms: tuple[str, ...]) -> dict[str, Any] | None:
    return next((item for item in files if all(term in item["name"].lower() for term in terms)), None)


def reconcile_one(reel_id: str, folder_id: str) -> dict[str, Any]:
    files = list_folder(folder_id)
    video = next((item for item in files if item.get("mimeType") == "video/mp4"), None)
    qc = next((item for item in files if "qc" in item["name"].lower() and item["name"].lower().endswith(".json")), None)
    manifest = next((item for item in files if "manifest" in item["name"].lower() and item["name"].lower().endswith(".json")), None)
    research = next((item for item in files if "research" in item["name"].lower() or "source" in item["name"].lower()), None)
    metadata = named(files, ("metadata",))
    captions = next((item for item in files if item["name"].lower().endswith(".srt")), None)
    voiceover = next((item for item in files if item.get("mimeType", "").startswith("audio/")), None)
    script = next((item for item in files if "voiceover" in item["name"].lower() and item["name"].lower().endswith(".md")), None)
    completion_record = manifest or metadata
    # Every record had a prior file-level audit. Custom 0016/0017 manifests, metadata-backed packages, and embedded-audio packages are valid exceptions.
    critical_missing = [
        name for name, value in {"final_video": video, "technical_qc": qc, "manifest_or_metadata": completion_record}.items() if value is None
    ]
    status = "complete" if not critical_missing else "needs_review"
    return {
        "reel_id": reel_id,
        "folder_id": folder_id,
        "status": status,
        "critical_missing": critical_missing,
        "selected": {
            "video": video,
            "technical_qc": qc,
            "manifest": completion_record,
            "research": research,
            "metadata": metadata,
            "captions": captions,
            "voiceover": voiceover,
            "script": script,
        },
        "all_files": files,
    }


def manifest_from(record: dict[str, Any]) -> dict[str, Any]:
    reel_id = record["reel_id"]
    number = int(reel_id[-4:])
    chosen = record["selected"]
    video = chosen["video"]
    return {
        "schema_version": 1,
        "reel_id": reel_id,
        "batch_id": f"Batch_{((number - 1) // 30) + 1:03d}",
        "title": f"Drive-reconciled {reel_id}",
        "topic": "Use the verified Drive research record; local media cache was intentionally not restored.",
        "claim_type": "Drive-reconciled historical record",
        "status": record["status"],
        "created_at_utc": now(),
        "updated_at_utc": now(),
        "source_record": f"drive://{(chosen['research'] or chosen['metadata'] or {}).get('id', '')}",
        "drive": {
            "root_folder_id": "1-sIkvOsLlfTCY4CPC0Cb1B6St72UrqFj",
            "reel_folder_id": record["folder_id"],
            "upload_records": [] if not video else [{
                "at_utc": now(),
                "local_file": None,
                "sha256": None,
                "drive_file_id": video["id"],
                "drive_parent_id": record["folder_id"],
                "drive_web_view_link": video.get("webViewLink"),
                "drive_md5_checksum": video.get("md5Checksum"),
                "reconciled_from_file_level_drive_readback": True,
            }],
        },
        "artifacts": {
            "script": f"drive://{(chosen['script'] or {}).get('id', '')}",
            "voiceover": f"drive://{(chosen['voiceover'] or {}).get('id', '')}",
            "captions": f"drive://{(chosen['captions'] or {}).get('id', '')}",
            "video": f"drive://{(video or {}).get('id', '')}",
            "qc_report": f"drive://{(chosen['technical_qc'] or {}).get('id', '')}",
        },
        "attempts": [],
        "events": [{
            "at_utc": now(),
            "event": "drive_reconciled",
            "detail": "Local manifest rebuilt from file-level Google Drive readback; local generated media was not recreated.",
        }],
        "reconciliation": {
            "audit_record": "reels-production/audits/drive_reconciliation_20260826.json",
            "critical_missing": record["critical_missing"],
            "custom_package_note": "0016 and 0017 use producer-specific manifest formats; prior audit accepted their embedded-audio/custom-package evidence.",
        },
    }


def update_progress() -> None:
    progress = json.loads(PROGRESS_PATH.read_text(encoding="utf-8"))
    manifests = [json.loads(path.read_text(encoding="utf-8")) for path in ROOT.glob("batches/Batch_*/Reel_*/manifest.json")]
    batch = next((item for item in progress["batches"] if item["batch_id"] == "Batch_001"), None)
    if batch is None:
        batch = {"batch_id": "Batch_001", "reels": {}}
        progress["batches"].append(batch)
    batch["reels"] = {
        item["reel_id"]: {"status": item["status"], "title": item["title"], "updated_at_utc": item["updated_at_utc"], "attempt_count": len(item.get("attempts", []))}
        for item in manifests if item["batch_id"] == "Batch_001"
    }
    completed = sorted(item["reel_id"] for item in manifests if item["status"] == "complete")
    progress["completion"]["completed_reels"] = len(completed)
    progress["completion"]["failed_reels"] = sum(item["status"] == "failed" for item in manifests)
    progress["completion"]["needs_review_reels"] = sum(item["status"] == "needs_review" for item in manifests)
    progress["last_successful_reel_id"] = completed[-1] if completed else None
    complete_set = set(completed)
    progress["next_reel_id"] = next((f"Reel_{number:04d}" for number in range(1, 3001) if f"Reel_{number:04d}" not in complete_set), None)
    progress["last_updated_utc"] = now()
    progress["reconciliation"] = {"source": "file-level Drive readback", "reconciled_reels": list(FOLDER_IDS)}
    write_json(PROGRESS_PATH, progress)


def main() -> int:
    records = [reconcile_one(reel_id, folder_id) for reel_id, folder_id in FOLDER_IDS.items()]
    for record in records:
        path = ROOT / "batches" / "Batch_001" / record["reel_id"] / "manifest.json"
        write_json(path, manifest_from(record))
    write_json(ROOT / "audits" / "drive_reconciliation_20260826.json", {"generated_at_utc": now(), "source": "file-level Google Drive readback", "records": records})
    update_progress()
    print(json.dumps({"reconciled": len(records), "complete": sum(item["status"] == "complete" for item in records), "needs_review": [item["reel_id"] for item in records if item["status"] != "complete"]}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
