#!/usr/bin/env python3
"""Render Reel 0004 with a documented existing-asset fallback after image quota exhaustion."""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

PROJECT = Path("/home/ubuntu/autonomous-ai-assistant")
REEL = PROJECT / "reels-production/batches/Batch_001/Reel_0004"
SOURCES = [
    Path("/home/ubuntu/webdev-static-assets/reel_0002_scene_02.png"),
    Path("/home/ubuntu/webdev-static-assets/reel_0001_scene_03_v2.png"),
    Path("/home/ubuntu/webdev-static-assets/reel_0001_scene_01_reference.png"),
    Path("/home/ubuntu/webdev-static-assets/reel_0002_scene_01.png"),
    Path("/home/ubuntu/webdev-static-assets/reel_0001_scene_02_v2.png"),
]
ASSETS, TMP = REEL / "assets", REEL / "video" / "render_tmp"
AUDIO = REEL / "voice" / "Reel_0004_hi_final_60s.wav"
SRT = REEL / "captions" / "voiceover_hi_final.srt"
OUT = REEL / "video" / "Reel_0004_final_1080x1920.mp4"

def call(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True)

def main() -> int:
    required = SOURCES + [AUDIO, SRT]
    if any(not item.exists() or item.stat().st_size == 0 for item in required):
        print("Required fallback asset unavailable", file=sys.stderr)
        return 2
    ASSETS.mkdir(parents=True, exist_ok=True)
    TMP.mkdir(parents=True, exist_ok=True)
    clips = []
    for number, source in enumerate(SOURCES, 1):
        asset = ASSETS / f"fallback_source_{number:02d}.png"
        shutil.copy2(source, asset)
        clip = TMP / f"clip_{number:02d}.mp4"
        zoom = "min(zoom+0.000055,1.075)" if number % 2 else "min(zoom+0.000035,1.050)"
        vf = (
            "scale=1200:2134:force_original_aspect_ratio=increase,crop=1200:2134,"
            f"zoompan=z='{zoom}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30,"
            "eq=contrast=1.07:saturation=0.80:brightness=-0.02,format=yuv420p"
        )
        call(["ffmpeg", "-y", "-loop", "1", "-framerate", "30", "-t", "10", "-i", str(asset), "-vf", vf, "-r", "30", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-an", str(clip)])
        clips.append(clip)
    sequence = [clips[0], clips[1], clips[2], clips[3], clips[4], clips[1]]
    listing = TMP / "sequence.txt"
    listing.write_text("".join(f"file '{clip}'\n" for clip in sequence), encoding="utf-8")
    subtitle = SRT.as_posix().replace("'", r"\'")
    style = "FontName=Noto Sans Devanagari,FontSize=50,PrimaryColour=&H00FFFFFF,OutlineColour=&H0010141F,BackColour=&H8010141F,BorderStyle=1,Outline=2,Shadow=0,Alignment=2,MarginV=210"
    call(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(listing), "-i", str(AUDIO), "-vf", f"subtitles='{subtitle}':charenc=UTF-8:force_style='{style}'", "-map", "0:v:0", "-map", "1:a:0", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", str(OUT)])
    print(OUT)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
