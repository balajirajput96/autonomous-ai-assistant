#!/usr/bin/env python3
"""Render Reel 0021 with original deterministic visual scenes after a quota-blocked image attempt."""

from __future__ import annotations

import subprocess
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
REEL = ROOT / "batches" / "Batch_001" / "Reel_0021"
ASSETS = REEL / "assets"
VOICE = REEL / "voice" / "Reel_0021_hi.wav"
CAPTIONS = REEL / "captions" / "Reel_0021_hi_final.srt"
VIDEO = REEL / "video" / "Reel_0021_final_1080x1920.mp4"
WIDTH, HEIGHT = 1080, 1920


def rounded(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], fill: str, radius: int = 48) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill)


def background(color_top: tuple[int, int, int], color_bottom: tuple[int, int, int]) -> Image.Image:
    image = Image.new("RGB", (WIDTH, HEIGHT))
    pixels = image.load()
    for y in range(HEIGHT):
        ratio = y / (HEIGHT - 1)
        colour = tuple(round(color_top[i] * (1 - ratio) + color_bottom[i] * ratio) for i in range(3))
        for x in range(WIDTH):
            pixels[x, y] = colour
    return image


def draw_mug(draw: ImageDraw.ImageDraw, x: int, y: int, scale: float, body: str) -> None:
    w, h = int(220 * scale), int(250 * scale)
    rounded(draw, (x, y, x + w, y + h), body, int(32 * scale))
    draw.ellipse((x + int(w * .08), y - int(h * .08), x + int(w * .92), y + int(h * .14)), fill="#F6EBD9")
    draw.ellipse((x + int(w * .18), y - int(h * .02), x + int(w * .82), y + int(h * .09)), fill="#233142")
    draw.arc((x + int(w * .72), y + int(h * .22), x + int(w * 1.22), y + int(h * .78)), start=280, end=80, fill="#F6EBD9", width=max(8, int(18 * scale)))


def draw_scene(index: int) -> Path:
    palettes = [((18, 35, 61), (109, 71, 57)), ((15, 45, 67), (51, 105, 113)), ((18, 55, 72), (42, 109, 108))]
    image = background(*palettes[index])
    draw = ImageDraw.Draw(image)
    rounded(draw, (70, 165, 1010, 1600), "#10263D", 72)
    draw.ellipse((120, 215, 960, 1055), outline="#F2B56B" if index == 0 else "#57CAD2", width=16)
    draw.ellipse((200, 295, 880, 975), outline="#274C6C", width=10)
    if index == 0:
        rounded(draw, (145, 1060, 935, 1360), "#513A33", 44)
        draw.rectangle((145, 1295, 935, 1360), fill="#382D2C")
        draw_mug(draw, 400, 970, 1.25, "#D4774E")
        draw.arc((325, 675, 755, 1105), 195, 500, fill="#F2B56B", width=26)
        draw.polygon([(740, 865), (788, 884), (750, 925)], fill="#F2B56B")
    elif index == 1:
        draw.line((540, 445, 540, 1250), fill="#5CC7CF", width=24)
        draw.ellipse((430, 610, 650, 830), outline="#F2B56B", width=18)
        draw.line((540, 790, 310, 1040), fill="#F2B56B", width=20)
        draw.line((540, 790, 770, 1040), fill="#5CC7CF", width=20)
        draw_mug(draw, 185, 1000, .85, "#D4774E")
        rounded(draw, (720, 925, 890, 1260), "#376D7A", 28)
        draw.ellipse((767, 1085, 812, 1130), fill="#F2B56B")
        draw.arc((260, 430, 820, 990), 215, 485, fill="#E89B62", width=20)
    else:
        rounded(draw, (190, 590, 460, 1275), "#2E6470", 36)
        rounded(draw, (585, 790, 930, 1320), "#2A8084", 48)
        draw.ellipse((675, 1010, 745, 1080), fill="#F2B56B")
        draw_mug(draw, 270, 1030, .75, "#55C5C9")
        draw.line((455, 1130, 655, 1130), fill="#F2B56B", width=24)
        draw.polygon([(640, 1088), (725, 1130), (640, 1172)], fill="#F2B56B")
        draw.ellipse((270, 415, 810, 955), outline="#5CC7CF", width=14)
    draw.rounded_rectangle((0, 1510, WIDTH, HEIGHT), radius=0, fill="#081521")
    path = ASSETS / f"reel_0021_scene_{index + 1}.png"
    image.save(path, "PNG", optimize=True)
    return path


def main() -> int:
    if not VOICE.exists() or not CAPTIONS.exists():
        raise SystemExit("Narration and captions must exist before rendering.")
    ASSETS.mkdir(parents=True, exist_ok=True)
    VIDEO.parent.mkdir(parents=True, exist_ok=True)
    scenes = [draw_scene(index) for index in range(3)]
    subs = str(CAPTIONS.resolve()).replace("\\", "\\\\").replace(":", "\\:")
    filters = (
        "[0:v]scale=1080:1920,format=yuv420p[a];"
        "[1:v]scale=1080:1920,format=yuv420p[b];"
        "[2:v]scale=1080:1920,format=yuv420p[c];"
        "[a][b]xfade=transition=fade:duration=1:offset=22[ab];"
        "[ab][c]xfade=transition=fade:duration=1:offset=44[bg];"
        f"[bg]subtitles='{subs}':force_style='FontName=Noto Sans Devanagari,FontSize=36,PrimaryColour=&H00FFFFFF,OutlineColour=&H00111A22,BorderStyle=1,Outline=3,Shadow=1,Alignment=2,MarginV=150'[v]"
    )
    command = [
        "ffmpeg", "-y",
        "-loop", "1", "-framerate", "15", "-t", "23", "-i", str(scenes[0]),
        "-loop", "1", "-framerate", "15", "-t", "23", "-i", str(scenes[1]),
        "-loop", "1", "-framerate", "15", "-t", "23", "-i", str(scenes[2]),
        "-i", str(VOICE),
        "-filter_complex", filters, "-map", "[v]", "-map", "3:a:0",
        "-r", "15", "-c:v", "libx264", "-preset", "veryfast", "-crf", "24",
        "-c:a", "aac", "-b:a", "96k", "-t", "65", "-shortest", "-movflags", "+faststart", str(VIDEO),
    ]
    subprocess.run(command, check=True)
    print(VIDEO)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
