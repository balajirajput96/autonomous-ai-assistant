#!/usr/bin/env python3
"""Render Reel 0023 with original deterministic reward-prediction-error visuals.

The renderer deliberately uses a disclosed deterministic fallback while the
separate fresh-image request remains asynchronous. It depicts a conceptual
expectation-versus-outcome model, not a literal brain scan or emotion meter.
"""

from __future__ import annotations

import subprocess
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
REEL = ROOT / "batches" / "Batch_001" / "Reel_0023"
ASSETS = REEL / "assets"
VOICE = REEL / "voice" / "Reel_0023_hi.wav"
CAPTIONS = REEL / "captions" / "Reel_0023_hi_final.srt"
VIDEO = REEL / "video" / "Reel_0023_final_1080x1920.mp4"
WIDTH, HEIGHT = 1080, 1920


def rounded(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], fill: str, radius: int) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill)


def background(top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    image = Image.new("RGB", (WIDTH, HEIGHT))
    draw = ImageDraw.Draw(image)
    for y in range(HEIGHT):
        mix = y / (HEIGHT - 1)
        color = tuple(round(top[index] * (1 - mix) + bottom[index] * mix) for index in range(3))
        draw.line((0, y, WIDTH, y), fill=color)
    return image


def marker(draw: ImageDraw.ImageDraw, x: int, y: int, color: str, glow: str) -> None:
    for radius, width in ((182, 5), (138, 9), (92, 15)):
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), outline=glow, width=width)
    draw.ellipse((x - 58, y - 58, x + 58, y + 58), fill=color)
    draw.ellipse((x - 19, y - 19, x + 19, y + 19), fill="#FFF8E8")


def arrow(draw: ImageDraw.ImageDraw, start: tuple[int, int], end: tuple[int, int], color: str, width: int = 18) -> None:
    draw.line((start, end), fill=color, width=width)
    x, y = end
    draw.polygon([(x, y), (x - 46, y - 27), (x - 44, y + 32)], fill=color)


def draw_scene(index: int) -> Path:
    palettes = [((9, 25, 52), (18, 66, 99)), ((12, 37, 63), (33, 91, 112)), ((13, 32, 59), (78, 64, 85))]
    image = background(*palettes[index])
    draw = ImageDraw.Draw(image)
    rounded(draw, (64, 130, 1016, 1548), "#0A1E36", 74)
    for radius, color in ((420, "#173C5C"), (342, "#205C76"), (266, "#1A7790")):
        draw.ellipse((540 - radius, 698 - radius, 540 + radius, 698 + radius), outline=color, width=6)

    if index == 0:
        # Expectation: a modest neutral token is paired with an actual brighter token.
        marker(draw, 334, 675, "#5CA9BD", "#2C6685")
        marker(draw, 748, 675, "#F2B75D", "#E8D08B")
        arrow(draw, (470, 675), (630, 675), "#DCECF1", 15)
        rounded(draw, (198, 1038, 882, 1182), "#163A55", 42)
        for x, color in ((290, "#5CA9BD"), (496, "#EDF2E9"), (702, "#F2B75D")):
            draw.ellipse((x - 44, 1080 - 44, x + 44, 1080 + 44), fill=color)
    elif index == 1:
        # Three possible outcome relationships shown as equal-height, higher, lower tokens.
        line_y = 792
        draw.line((190, line_y, 890, line_y), fill="#C9E6E8", width=14)
        for x, y, color in ((286, 570, "#F0B35B"), (540, 792, "#77BBC7"), (794, 1014, "#B76E78")):
            draw.line((x, line_y, x, y), fill="#5DA4B3", width=10)
            marker(draw, x, y, color, "#397589")
        draw.arc((202, 1174, 878, 1500), 198, 342, fill="#65D0CA", width=18)
        draw.polygon([(780, 1284), (838, 1314), (782, 1350)], fill="#65D0CA")
    else:
        # Prediction revision: one marker moves toward a newly calibrated position.
        marker(draw, 330, 720, "#6AAFC1", "#285F7F")
        marker(draw, 750, 558, "#F0B35B", "#E7C77D")
        arrow(draw, (414, 680), (634, 590), "#EAF6F5", 18)
        rounded(draw, (172, 1050, 908, 1248), "#153850", 40)
        for x, fill in ((314, "#5CA9BD"), (542, "#75D4CC"), (770, "#F0B35B")):
            draw.ellipse((x - 58, 1148 - 58, x + 58, 1148 + 58), fill=fill)
        draw.arc((240, 1210, 840, 1512), 198, 342, fill="#F0B35B", width=20)
        draw.polygon([(738, 1292), (804, 1325), (740, 1362)], fill="#F0B35B")

    # Caption-safe lower band, intentionally without any source-image text.
    draw.rectangle((0, 1518, WIDTH, HEIGHT), fill="#061421")
    path = ASSETS / f"reel_0023_scene_{index + 1}.png"
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
        "[a][b]xfade=transition=fade:duration=1:offset=21[ab];"
        "[ab][c]xfade=transition=fade:duration=1:offset=42[bg];"
        f"[bg]subtitles='{subs}':force_style='FontName=Noto Sans Devanagari,FontSize=36,PrimaryColour=&H00FFFFFF,OutlineColour=&H00101A24,BorderStyle=1,Outline=3,Shadow=1,Alignment=2,MarginV=150'[v]"
    )
    command = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-loop", "1", "-framerate", "15", "-t", "22", "-i", str(scenes[0]),
        "-loop", "1", "-framerate", "15", "-t", "22", "-i", str(scenes[1]),
        "-loop", "1", "-framerate", "15", "-t", "22", "-i", str(scenes[2]),
        "-i", str(VOICE),
        "-filter_complex", filters, "-map", "[v]", "-map", "3:a:0",
        "-r", "15", "-c:v", "libx264", "-preset", "veryfast", "-crf", "24",
        "-c:a", "aac", "-b:a", "96k", "-t", "64", "-shortest", "-movflags", "+faststart", str(VIDEO),
    ]
    subprocess.run(command, check=True)
    print(VIDEO)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
