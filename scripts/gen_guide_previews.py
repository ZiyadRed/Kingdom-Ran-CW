"""Create Home previews from the existing Guide art without changing originals.

Run from any directory with Python 3 and Pillow installed. This intentionally
touches only public/guide/previews and leaves the original Guide screenshots,
character artwork, hero variants, and other generated assets alone.
"""
from pathlib import Path
from PIL import Image

GUIDE = Path(__file__).resolve().parents[1] / "public" / "guide"
SOURCES = ("basics-map-en.webp", "roles-selection.webp", "cw-stats-screen.webp")


def generate():
    output = GUIDE / "previews"
    output.mkdir(exist_ok=True)
    for name in SOURCES:
        source = GUIDE / name
        with Image.open(source) as original:
            width = min(320, original.width)
            height = round(original.height * width / original.width)
            preview = original.resize((width, height), Image.Resampling.LANCZOS)
            target = output / name
            preview.save(target, "WEBP", quality=82, method=6)
            print(f"{name}: {original.width}x{original.height} / {source.stat().st_size}B -> {width}x{height} / {target.stat().st_size}B")


if __name__ == "__main__":
    generate()
