#!/usr/bin/env python3
"""Render Reel 0022 with original deterministic cue-to-action visuals.

This fallback deliberately does not represent itself as fresh generative footage. It
keeps the visual explanation readable while a fresh-image request is quota- or
availability-constrained.
"""

from __future__ import annotations

import subprocess
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
REEL = ROOT / "batches" / "Batch_001" / "Reel_0022"
ASSETS = REEL / "assets"
VOICE = REEL / "voice" / "Reel_0022_hi.wav"
CAPTIONS = REEL / "captions" / "Reel_0022_hi_final.srt"
VIDEO = REEL / "video" / "Reel_0022_final_1080x1920.mp4"
WIDTH, HEIGHT = 1080, 1920


def rounded(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], fill: str, radius: int = 38) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill)


def gradient(top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    image = Image.new("RGB", (WIDTH, HEIGHT))
    draw = ImageDraw.Draw(image)
    for y in range(HEIGHT):
        mix = y / (HEIGHT - 1)
        colour = tuple(round(top[index] * (1 - mix) + bottom[index] * mix) for index in range(3))
        draw.line((0, y, WIDTH, y), fill=colour)
    return image


def person(draw: ImageDraw.ImageDraw, x: int, y: int, scale: float, shirt: str, facing_right: bool = True) -> None:
    head = int(100 * scale)
    skin = "#D9A37D"
    draw.ellipse((x, y, x + head, y + head), fill=skin)
    torso_top = y + int(92 * scale)
    torso_width, torso_height = int(165 * scale), int(270 * scale)
    rounded(draw, (x - int(32 * scale), torso_top, x - int(32 * scale) + torso_width, torso_top + torso_height), shirt, int(30 * scale))
    arm_y = torso_top + int(82 * scale)
    direction = 1 if facing_right else -1
    draw.line((x + int(80 * scale), arm_y, x + int((185 if facing_right else -55) * scale), arm_y + int(70 * scale)), fill=skin, width=int(32 * scale))
    draw.line((x + int(25 * scale), torso_top + torso_height, x - int(10 * scale), torso_top + torso_height + int(220 * scale)), fill="#18354D", width=int(44 * scale))
    draw.line((x + int(105 * scale), torso_top + torso_height, x + int(155 * scale), torso_top + torso_height + int(220 * scale)), fill="#18354D", width=int(44 * scale))
    if direction < 0:
        draw.ellipse((x + int(20 * scale), y + int(28 * scale), x + int(42 * scale), y + int(50 * scale)), fill="#173046")
    else:
        draw.ellipse((x + int(58 * scale), y + int(28 * scale), x + int(80 * scale), y + int(50 * scale)), fill="#173046")


def shoe(draw: ImageDraw.ImageDraw, x: int, y: int, scale: float, fill: str) -> None:
    w, h = int(250 * scale), int(105 * scale)
    rounded(draw, (x, y, x + w, y + h), fill, int(38 * scale))
    draw.polygon([(x + int(w * .72), y), (x + w, y + int(h * .35)), (x + w, y + h), (x + int(w * .62), y + h)], fill=fill)
    draw.line((x + int(w * .18), y + int(h * .36), x + int(w * .68), y + int(h * .36)), fill="#E9E6D8", width=max(4, int(8 * scale)))
    draw.line((x + int(w * .18), y + int(h * .57), x + int(w * .61), y + int(h * .57)), fill="#E9E6D8", width=max(4, int(8 * scale)))


def draw_scene(index: int) -> Path:
    palettes = [((13, 35, 65), (40, 92, 115)), ((16, 45, 70), (42, 118, 123)), ((22, 52, 71), (100, 80, 66))]
    image = gradient(*palettes[index])
    draw = ImageDraw.Draw(image)
    rounded(draw, (68, 138, 1012, 1552), "#0B2138", 72)
    draw.ellipse((148, 220, 932, 1004), outline="#4ED4D3", width=15)
    draw.ellipse((222, 294, 858, 930), outline="#2B607E", width=9)

    if index == 0:
        # An abstract goal orbit: it is deliberately unconnected to a next action.
        draw.ellipse((382, 390, 698, 706), outline="#F0B36A", width=22)
        draw.arc((300, 308, 780, 788), 205, 515, fill="#F0B36A", width=22)
        draw.polygon([(714, 526), (758, 556), (712, 588)], fill="#F0B36A")
        person(draw, 455, 840, 1.15, "#D16D55", True)
        rounded(draw, (166, 1248, 914, 1362), "#173A55", 34)
        draw.ellipse((232, 1284, 314, 1366), fill="#F0B36A")
        draw.line((355, 1324, 746, 1324), fill="#5ECED0", width=17)
    elif index == 1:
        # A concrete lunch cue connects to a small walking action.
        rounded(draw, (142, 1022, 938, 1305), "#62483E", 44)
        draw.rectangle((142, 1240, 938, 1305), fill="#453735")
        draw.ellipse((388, 1045, 688, 1168), fill="#EFE6D5")
        draw.ellipse((436, 1070, 640, 1145), fill="#D26E55")
        draw.ellipse((470, 1092, 606, 1130), fill="#F0B36A")
        draw.ellipse((452, 820, 612, 980), outline="#F0B36A", width=18)
        draw.arc((355, 716, 792, 1150), 200, 492, fill="#F0B36A", width=24)
        draw.polygon([(748, 876), (795, 908), (748, 940)], fill="#F0B36A")
        shoe(draw, 674, 1282, .8, "#55BDC6")
        shoe(draw, 458, 1312, .7, "#419AA7")
    else:
        # A doorway and stepped path signal a feasible small response, not success.
        rounded(draw, (228, 345, 852, 1222), "#234C61", 48)
        rounded(draw, (307, 424, 776, 1222), "#102C43", 28)
        draw.rectangle((378, 512, 714, 1222), fill="#D98B58")
        draw.ellipse((632, 830, 658, 856), fill="#F4D39E")
        draw.polygon([(407, 1222), (690, 1222), (854, 1410), (234, 1410)], fill="#4DAEB5")
        for offset in range(4):
            draw.line((300 + offset * 55, 1320 + offset * 22, 780 - offset * 55, 1320 + offset * 22), fill="#A3E0D8", width=8)
        shoe(draw, 188, 1115, .9, "#52C2C5")
        person(draw, 565, 690, .85, "#D16D55", True)
        draw.arc((152, 520, 490, 912), 215, 492, fill="#F0B36A", width=20)
        draw.polygon([(440, 710), (484, 741), (440, 772)], fill="#F0B36A")

    draw.rectangle((0, 1510, WIDTH, HEIGHT), fill="#071521")
    path = ASSETS / f"reel_0022_scene_{index + 1}.png"
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
        "[a][b]xfade=transition=fade:duration=1:offset=18[ab];"
        "[ab][c]xfade=transition=fade:duration=1:offset=36[bg];"
        f"[bg]subtitles='{subs}':force_style='FontName=Noto Sans Devanagari,FontSize=36,PrimaryColour=&H00FFFFFF,OutlineColour=&H00101A24,BorderStyle=1,Outline=3,Shadow=1,Alignment=2,MarginV=150'[v]"
    )
    command = [
        "ffmpeg", "-y",
        "-loop", "1", "-framerate", "15", "-t", "20", "-i", str(scenes[0]),
        "-loop", "1", "-framerate", "15", "-t", "20", "-i", str(scenes[1]),
        "-loop", "1", "-framerate", "15", "-t", "20", "-i", str(scenes[2]),
        "-i", str(VOICE),
        "-filter_complex", filters, "-map", "[v]", "-map", "3:a:0",
        "-r", "15", "-c:v", "libx264", "-preset", "veryfast", "-crf", "24",
        "-c:a", "aac", "-b:a", "96k", "-t", "60", "-shortest", "-movflags", "+faststart", str(VIDEO),
    ]
    subprocess.run(command, check=True)
    print(VIDEO)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
