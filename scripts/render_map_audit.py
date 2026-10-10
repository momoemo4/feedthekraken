"""Render a deterministic debug overlay for visual comparison with the board photo."""

from math import cos, pi, sin, sqrt
from pathlib import Path
import sys

ROOT = Path(__file__).parents[1]
sys.path.insert(0, str(ROOT / ".tools/python"))

from PIL import Image, ImageDraw, ImageFont

SOURCE = ROOT / "client/public/reference/long-journey-board.png"
OUTPUT = ROOT / ".tools/crops/overlay.png"
LABEL_OUTPUT = ROOT / ".tools/crops/labels.png"

radius = 96
origin_x = 600
origin_y = 600
cells = [
    ("H01", 0, -3), ("H02", 1, -3), ("H03", 2, -3), ("H04", 3, -3),
    ("H05", -1, -2), ("H06", 0, -2), ("H07", 1, -2), ("H08", 2, -2), ("H09", 3, -2),
    ("H10", -2, -1), ("H11", -1, -1), ("H12", 0, -1), ("H13", 1, -1), ("H14", 2, -1),
    ("H15", -3, 0), ("H16", -2, 0), ("H17", -1, 0), ("H18", 0, 0), ("H19", 1, 0), ("H31", 2, 0),
    ("H20", -3, 1), ("H21", -2, 1), ("H22", -1, 1), ("H23", 0, 1), ("H24", 1, 1),
    ("H25", -2, 2), ("H26", -1, 2), ("H27", 0, 2), ("H28", 1, 2),
    ("H29", -1, 3), ("H30", 0, 3),
]

image = Image.open(SOURCE).convert("RGBA")
overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
draw = ImageDraw.Draw(overlay)
labels = Image.new("RGBA", image.size, (0, 0, 0, 0))
label_draw = ImageDraw.Draw(labels)
font = ImageFont.load_default(size=16)

for cell_id, q, r in cells:
    x = origin_x + 1.5 * radius * q
    y = origin_y + sqrt(3) * radius * (r + q / 2)
    points = [
        (x + (radius - 2) * cos(index * pi / 3), y + (radius - 2) * sin(index * pi / 3))
        for index in range(6)
    ]
    draw.polygon(points, fill=(7, 24, 25, 30), outline=(255, 225, 115, 235), width=3)
    box = draw.textbbox((0, 0), cell_id, font=font)
    text_width = box[2] - box[0]
    draw.rounded_rectangle((x - text_width / 2 - 5, y - 12, x + text_width / 2 + 5, y + 12), 4, fill=(3, 20, 20, 210))
    draw.text((x - text_width / 2, y - 9), cell_id, font=font, fill=(255, 238, 176, 255))
    label_draw.rounded_rectangle((x - text_width / 2 - 5, y - 12, x + text_width / 2 + 5, y + 12), 4, fill=(3, 20, 20, 220))
    label_draw.text((x - text_width / 2, y - 9), cell_id, font=font, fill=(255, 238, 176, 255))

Image.alpha_composite(image, overlay).convert("RGB").save(OUTPUT, quality=94)
label_composite = Image.alpha_composite(image, labels).convert("RGB")
label_composite.save(LABEL_OUTPUT, quality=94)

focus_ids = {"H25", "H31", "H20", "H16", "H07", "H08", "H09", "H23"}
for cell_id, q, r in cells:
    if cell_id not in focus_ids:
        continue
    x = int(origin_x + 1.5 * radius * q)
    y = int(origin_y + sqrt(3) * radius * (r + q / 2))
    bounds = (max(0, x - 180), max(0, y - 180), min(image.width, x + 180), min(image.height, y + 180))
    crop = label_composite.crop(bounds)
    crop.resize((crop.width * 3, crop.height * 3), Image.Resampling.LANCZOS).save(ROOT / f".tools/crops/focus-{cell_id}.png")
print(OUTPUT)
