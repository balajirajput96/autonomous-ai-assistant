from pathlib import Path

from PIL import Image


SOURCE = Path("/home/ubuntu/webdev-static-assets/autonomous-app-icon.png")
TARGETS = [
    Path("/home/ubuntu/autonomous-ai-assistant/assets/images/icon.png"),
    Path("/home/ubuntu/autonomous-ai-assistant/assets/images/splash-icon.png"),
    Path("/home/ubuntu/autonomous-ai-assistant/assets/images/favicon.png"),
    Path("/home/ubuntu/autonomous-ai-assistant/assets/images/android-icon-foreground.png"),
]

with Image.open(SOURCE) as source:
    image = source.convert("RGBA")
    image.thumbnail((512, 512), Image.Resampling.LANCZOS)
    for target in TARGETS:
        image.save(target, format="PNG", optimize=True, compress_level=9)
        print(f"{target.name}: {target.stat().st_size} bytes")
