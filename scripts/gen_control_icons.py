"""Authentic small-control derivatives; original game artwork stays untouched.

192px bounds cover 64px controls at 3x density; taller unit art uses 256px
for the scaled 76px Infantry/Cavalry controls.
Lossless WebP avoids adding compression artifacts after Lanczos downsampling.
Run explicitly; this never regenerates unrelated images or source evidence.
"""
from pathlib import Path
from PIL import Image

PUBLIC = Path(__file__).resolve().parents[1] / 'public'
SOURCES = [f'icons/castle-points/castle-{size}.png' for size in ('large', 'medium', 'small')]
SOURCES += [f'icons/unit_{unit}.webp' for unit in ('infantry', 'cavalry', 'archer', 'shield')]

for relative in SOURCES:
    source = PUBLIC / relative
    destination = source.parent / 'controls' / (source.stem + '.webp')
    destination.parent.mkdir(exist_ok=True)
    with Image.open(source) as original:
        resized = original.convert('RGBA')
        bound = 256 if source.stem in ('unit_infantry', 'unit_cavalry') else 192
        resized.thumbnail((bound, bound), Image.Resampling.LANCZOS)
        resized.save(destination, 'WEBP', lossless=True, method=6)
        print(f'{relative}: {original.size} -> {resized.size}; {source.stat().st_size} -> {destination.stat().st_size} bytes')
