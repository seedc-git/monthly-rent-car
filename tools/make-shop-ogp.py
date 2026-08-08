#!/usr/bin/env python3
"""Build the three shop OGP images by swapping the shop name on an existing shop's artwork.

  python3 tools/make-shop-ogp.py <reference-slug> <new-slug> <新店名> [--check]

The artwork is identical across shops except for the navy shop name, so the name is masked out,
painted over with the white background it sits on, and redrawn in M PLUS 1p Black.

The design source lives with the vendor, so this is a reproduction, not the original. Have the
result looked at before it goes live.

Requires Pillow. The other tools here are Node; this one is Python because it needs an imaging
library, and Pillow is already on the machine.
"""

import math
import statistics
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OGP_DIR = ROOT / "assets" / "ogp" / "shops"
FONT = Path.home() / "Library/Fonts/MPLUS1p-Black.ttf"
NAVY = (0, 35, 126)

# Rendered name weight and white outline, tuned against the existing artwork.
FATTEN = 3
OUTLINE = 10

SIZES = [
    ("1731x909", "png", None),
    ("1200x630", "jpg", 92),
    ("1200x1200", "png", None),
]


def is_navy(pixel):
    r, g, b = pixel[:3]
    return r < 80 and g < 80 and 90 < b < 190


def name_band(image):
    """Locate the shop-name block.

    The ribbon above it is navy too, so the band is found by scanning rows for navy density and
    taking the run separated from the ribbon by a blank row. Returns the bounding box.
    """
    w, h = image.size
    px = image.load()
    x0, x1 = int(w * 0.10), int(w * 0.68)

    density = []
    for y in range(h):
        density.append(sum(1 for x in range(x0, x1) if is_navy(px[x, y])))

    runs, start = [], None
    for y, count in enumerate(density):
        if count and start is None:
            start = y
        elif not count and start is not None:
            runs.append((start, y - 1))
            start = None
    if start is not None:
        runs.append((start, h - 1))
    if not runs:
        raise SystemExit("error: no navy text found")

    # The shop name is the heaviest run; the ribbon lettering is thinner.
    top, bottom = max(runs, key=lambda r: sum(density[r[0]:r[1] + 1]))

    def column_has_navy(x):
        return any(is_navy(px[x, y]) for y in range(top, bottom + 1))

    seed = [x for x in range(x0, x1) if column_has_navy(x)]
    if not seed:
        raise SystemExit("error: no navy text found")
    left, right = seed[0], seed[-1]

    # x0/x1 only seed the search. The square artwork puts the name past x1, and stopping there
    # left the tail of the old name unmasked, so the new name landed on top of it (練馬店店).
    # Walk outwards from the seed instead, ending at the first gap wider than a character space.
    gap = max(6, (bottom - top) // 4)
    for step, edge in ((1, w - 1), (-1, 0)):
        x, blank = (right if step > 0 else left) + step, 0
        while 0 <= x <= edge and blank <= gap:
            if column_has_navy(x):
                blank = 0
                if step > 0:
                    right = x
                else:
                    left = x
            else:
                blank += 1
            x += step
    return left, top, right, bottom


def tilt_degrees(image, box):
    """Measure how far the existing name rises to the right, so the replacement matches."""
    px = image.load()
    left, top, right, bottom = box
    centres = {}
    for x in range(left, right + 1):
        ys = [y for y in range(top, bottom + 1) if is_navy(px[x, y])]
        if ys:
            centres[x] = statistics.mean(ys)
    if len(centres) < 20:
        return 0.0
    xs = sorted(centres)
    mid = xs[len(xs) // 2]
    lo = [x for x in xs if x < mid]
    hi = [x for x in xs if x >= mid]
    dy = statistics.mean(centres[x] for x in lo) - statistics.mean(centres[x] for x in hi)
    dx = statistics.mean(hi) - statistics.mean(lo)
    return math.degrees(math.atan2(dy, dx))


def render_name(text, width, height, angle):
    """Draw the name on a transparent layer, sized to the box and tilted to match."""
    pad = max(width, height) // 2
    layer = Image.new("RGBA", (width + pad * 2, height + pad * 2), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    size = 40
    while True:
        probe = ImageFont.truetype(str(FONT), size)
        box = draw.textbbox((0, 0), text, font=probe, stroke_width=FATTEN)
        if box[2] - box[0] > width or box[3] - box[1] > height:
            break
        size += 2
    font = ImageFont.truetype(str(FONT), size - 2)
    box = draw.textbbox((0, 0), text, font=font, stroke_width=FATTEN)

    x = pad + (width - (box[2] - box[0])) / 2 - box[0]
    y = pad + (height - (box[3] - box[1])) / 2 - box[1]
    draw.text((x, y), text, font=font, fill=NAVY, stroke_width=FATTEN + OUTLINE, stroke_fill=(255, 255, 255, 255))
    draw.text((x, y), text, font=font, fill=NAVY, stroke_width=FATTEN, stroke_fill=NAVY)

    if abs(angle) > 0.2:
        layer = layer.rotate(angle, resample=Image.BICUBIC, center=(layer.width / 2, layer.height / 2))
    return layer.crop((pad, pad, pad + width, pad + height))


def build(reference_slug, new_slug, shop_name, check_only):
    made = []
    for suffix, ext, quality in SIZES:
        source = OGP_DIR / f"{reference_slug}-{suffix}.{ext}"
        if not source.exists():
            raise SystemExit(f"error: reference image not found: {source.relative_to(ROOT)}")
        image = Image.open(source).convert("RGB")

        box = name_band(image)
        angle = tilt_degrees(image, box)
        left, top, right, bottom = box
        print(f"{suffix:10s} name box {right - left}x{bottom - top} at ({left},{top}), tilt {angle:+.1f}deg")

        # Mask the old name, grown by the outline width, and paint it out with the white it sits on.
        mask = Image.new("L", image.size, 0)
        mp = mask.load()
        px = image.load()
        for y in range(top, bottom + 1):
            for x in range(left, right + 1):
                if is_navy(px[x, y]):
                    mp[x, y] = 255
        mask = mask.filter(ImageFilter.MaxFilter(15))

        out = image.copy()
        out.paste(Image.new("RGB", image.size, (255, 255, 255)), (0, 0), mask)
        layer = render_name(shop_name, right - left, bottom - top, angle)
        out.paste(layer, (left, top), layer)

        target = OGP_DIR / f"{new_slug}-{suffix}.{ext}"
        if not check_only:
            if quality:
                out.save(target, quality=quality)
            else:
                out.save(target)
            made.append(target.relative_to(ROOT))
    return made


def main():
    if len(sys.argv) < 4:
        raise SystemExit(__doc__)
    reference_slug, new_slug, shop_name = sys.argv[1], sys.argv[2], sys.argv[3]
    check_only = "--check" in sys.argv
    if not FONT.exists():
        raise SystemExit(f"error: font not found: {FONT}")

    made = build(reference_slug, new_slug, shop_name, check_only)
    if check_only:
        print("\n--check: nothing written.")
        return
    print("\nwrote:")
    for path in made:
        print(f"  {path}")
    print("\nHave these looked at before publishing; the design source belongs to the vendor.")


if __name__ == "__main__":
    main()
