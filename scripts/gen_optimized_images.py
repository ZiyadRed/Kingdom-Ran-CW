# Generates mobile-optimized image assets:
#   public/persos/thumbs/*.webp        320px-wide grid thumbnails
#   public/ranhq-home-banner-{640,1200}.webp  responsive hero sizes
#   public/ranhq-og.jpg                1200x630 link-preview image (jpg for FB/WA compat)
#   public/apple-touch-icon.png, icon-192.png, icon-512.png
import os
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', 'public')

def save_webp(img, path, quality=82):
    img.save(path, 'WEBP', quality=quality, method=6)

# 1) persos thumbs
src_dir = os.path.join(ROOT, 'persos')
thumb_dir = os.path.join(src_dir, 'thumbs')
os.makedirs(thumb_dir, exist_ok=True)
n, before, after = 0, 0, 0
for f in os.listdir(src_dir):
    if not (f.endswith('.webp') or f.endswith('.png')):
        continue
    src = os.path.join(src_dir, f)
    if not os.path.isfile(src):
        continue
    im = Image.open(src)
    w, h = im.size
    tw = 320
    if w <= tw:
        # source is already thumb-sized (e.g. 213x300 pngs) — copying beats
        # re-encoding, which would upscale and bloat it
        import shutil
        shutil.copyfile(src, os.path.join(thumb_dir, f))
        n += 1
        before += os.path.getsize(src)
        after += os.path.getsize(os.path.join(thumb_dir, f))
        continue
    th = round(h * tw / w)
    resized = im.resize((tw, th), Image.LANCZOS)
    if f.endswith('.png'):
        # keep extension so the /persos/ -> /persos/thumbs/ path rewrite works
        resized.save(os.path.join(thumb_dir, f), 'PNG', optimize=True)
    else:
        save_webp(resized, os.path.join(thumb_dir, f))
    n += 1
    before += os.path.getsize(src)
    after += os.path.getsize(os.path.join(thumb_dir, f))
print(f'persos thumbs: {n} files, {before/1e6:.1f}MB -> {after/1e6:.1f}MB')

# 2) banner responsive sizes
banner = Image.open(os.path.join(ROOT, 'ranhq-home-banner.webp'))
bw, bh = banner.size
for tw in (640, 1200):
    th = round(bh * tw / bw)
    out = os.path.join(ROOT, f'ranhq-home-banner-{tw}.webp')
    save_webp(banner.resize((tw, th), Image.LANCZOS), out)
    print(f'banner {tw}w: {os.path.getsize(out)/1024:.0f}KB')

# 3) og image 1200x630 (center crop then resize), jpg for widest platform support
target_ratio = 1200 / 630
ratio = bw / bh
if ratio > target_ratio:  # too wide -> crop sides
    cw = round(bh * target_ratio)
    box = ((bw - cw) // 2, 0, (bw - cw) // 2 + cw, bh)
else:  # too tall -> crop top/bottom
    ch = round(bw / target_ratio)
    box = (0, (bh - ch) // 2, bw, (bh - ch) // 2 + ch)
og = banner.crop(box).resize((1200, 630), Image.LANCZOS).convert('RGB')
og_path = os.path.join(ROOT, 'ranhq-og.jpg')
og.save(og_path, 'JPEG', quality=82, optimize=True, progressive=True)
print(f'og image: {os.path.getsize(og_path)/1024:.0f}KB')

# 4) PWA / iOS icons (PNG — apple-touch-icon must be png on older iOS)
icon = Image.open(os.path.join(ROOT, 'ranhq-icon.webp')).convert('RGBA')
print(f'icon source: {icon.size}')
for size, name in ((180, 'apple-touch-icon.png'), (192, 'icon-192.png'), (512, 'icon-512.png')):
    icon.resize((size, size), Image.LANCZOS).save(os.path.join(ROOT, name), 'PNG', optimize=True)
    print(f'{name}: {os.path.getsize(os.path.join(ROOT, name))/1024:.0f}KB')
