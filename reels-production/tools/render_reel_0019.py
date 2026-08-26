#!/usr/bin/env python3
"""Render Reel 0019 from its generated master visual, Hindi narration and captions."""

from __future__ import annotations

import subprocess
from pathlib import Path


PROJECT = Path("/home/ubuntu/autonomous-ai-assistant")
REEL = PROJECT / "reels-production" / "batches" / "Batch_001" / "Reel_0019"
MASTER = Path("/home/ubuntu/webdev-static-assets/reel_0019_affect_labelling_master.png")
VOICE = REEL / "voice" / "Reel_0019_hi_draft.wav"
CAPTIONS = REEL / "captions" / "Reel_0019_hi_final.srt"
OUTPUT = REEL / "video" / "Reel_0019_final_1080x1920.mp4"


def ensure(path: Path) -> None:
    if not path.exists() or path.stat().st_size == 0:
        raise FileNotFoundError(f"Required Reel 0019 asset is unavailable: {path}")


def main() -> int:
    for path in (MASTER, VOICE, CAPTIONS):
        ensure(path)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    subtitle_path = str(CAPTIONS).replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'")
    video_filter = (
        "scale=1080:1920:force_original_aspect_ratio=increase,"
        "crop=1080:1920,"
        "eq=contrast=1.03:saturation=1.04,"
        "drawbox=x=0:y=0:w=1080:h=1920:color=0x091224@0.18:t=fill,"
        "drawbox=x=72:y=115:w=936:h=3:color=0xF4C95D@0.88:t=fill,"
        "drawbox=x=72:y=1802:w=936:h=3:color=0x61D7E8@0.70:t=fill,"
        f"subtitles='{subtitle_path}':force_style='FontName=Noto Sans Devanagari,FontSize=32,PrimaryColour=&H00FFFFFF,OutlineColour=&H00151B2B,BorderStyle=1,Outline=2,Shadow=0,Alignment=2,MarginV=94'"
    )
    command = [
        "ffmpeg", "-y", "-loop", "1", "-framerate", "15", "-i", str(MASTER), "-i", str(VOICE),
        "-filter_complex", f"[0:v]{video_filter}[v]",
        "-map", "[v]", "-map", "1:a:0", "-t", "60.64", "-r", "15",
        "-c:v", "libx264", "-preset", "ultrafast", "-tune", "stillimage", "-crf", "22", "-threads", "2", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", str(OUTPUT),
    ]
    subprocess.run(command, check=True)
    print(OUTPUT)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
