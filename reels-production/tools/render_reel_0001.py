#!/usr/bin/env python3
"""Render Reel 0001 only when all generated visual assets are present."""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path


PROJECT = Path("/home/ubuntu/autonomous-ai-assistant")
REEL = PROJECT / "reels-production/batches/Batch_001/Reel_0001"
SOURCE_IMAGES = [
    Path("/home/ubuntu/webdev-static-assets/reel_0001_scene_01_reference.png"),
    Path("/home/ubuntu/webdev-static-assets/reel_0001_scene_02_v2.png"),
    Path("/home/ubuntu/webdev-static-assets/reel_0001_scene_03_v2.png"),
]
ASSET_DIR = REEL / "assets"
TEMP_DIR = REEL / "video" / "render_tmp"
CAPTIONS = REEL / "captions" / "voiceover_hi_final.srt"
AUDIO = REEL / "voice" / "Reel_0001_hi_final_60s.wav"
OUTPUT = REEL / "video" / "Reel_0001_final_1080x1920.mp4"
HOOK_MOTION = REEL / "assets" / "scene_01_hook_motion.mp4"


def run(command: list[str]) -> None:
    subprocess.run(command, check=True)


def main() -> int:
    missing = [str(path) for path in SOURCE_IMAGES + [CAPTIONS, AUDIO, HOOK_MOTION] if not path.exists() or path.stat().st_size == 0]
    if missing:
        print("Render blocked; required artifacts unavailable:", *missing, sep="\n", file=sys.stderr)
        return 2

    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    for index, source in enumerate(SOURCE_IMAGES, start=1):
        target = ASSET_DIR / f"scene_{index:02d}.png"
        shutil.copy2(source, target)
        clip = TEMP_DIR / f"scene_{index:02d}.mp4"
        if index == 1:
            run([
                "ffmpeg", "-y", "-i", str(HOOK_MOTION), "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,format=yuv420p",
                "-t", "8", "-r", "30", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-an", str(clip),
            ])
            continue
        scene_duration = "12" if index == 2 else "10"
        zoom_expression = "min(zoom+0.000055,1.08)" if index % 2 else "max(zoom-0.00004,1.0)"
        filter_complex = (
            "scale=1200:2134:force_original_aspect_ratio=increase,"
            "crop=1200:2134,"
            f"zoompan=z='{zoom_expression}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30,"
            "format=yuv420p"
        )
        run([
            "ffmpeg", "-y", "-loop", "1", "-framerate", "30", "-t", scene_duration, "-i", str(target),
            "-vf", filter_complex, "-r", "30", "-c:v", "libx264", "-preset", "medium", "-crf", "18",
            "-pix_fmt", "yuv420p", "-an", str(clip),
        ])

    list_file = TEMP_DIR / "scenes.txt"
    clip_order = [1, 2, 3, 2, 3, 2]
    list_file.write_text("".join(f"file '{TEMP_DIR / f'scene_{idx:02d}.mp4'}'\n" for idx in clip_order), encoding="utf-8")
    subtitle_path = CAPTIONS.as_posix().replace("'", r"\'")
    subtitle_filter = (
        f"subtitles='{subtitle_path}':charenc=UTF-8:"
        "force_style='FontName=Noto Sans Devanagari,FontSize=50,PrimaryColour=&H00FFFFFF,"
        "OutlineColour=&H0010141F,BackColour=&H8010141F,BorderStyle=1,Outline=2,Shadow=0,"
        "Alignment=2,MarginV=210'"
    )
    run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(list_file), "-i", str(AUDIO),
        "-vf", subtitle_filter, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "libx264", "-preset", "medium",
        "-crf", "18", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", str(OUTPUT),
    ])
    print(OUTPUT)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
