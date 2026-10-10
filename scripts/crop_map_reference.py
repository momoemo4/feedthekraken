"""Generate close-up crops for the one-time Long Journey visual audit."""

from pathlib import Path
import sys

ROOT = Path(__file__).parents[1]
sys.path.insert(0, str(ROOT / ".tools/python"))

from PIL import Image

SOURCE = ROOT / "client/public/reference/long-journey-board.png"
OUTPUT = ROOT / ".tools/crops"
OUTPUT.mkdir(parents=True, exist_ok=True)

image = Image.open(SOURCE)
overlay_path = OUTPUT / "overlay.png"
overlay = Image.open(overlay_path) if overlay_path.exists() else None
labels_path = OUTPUT / "labels.png"
labels = Image.open(labels_path) if labels_path.exists() else None
regions = {
    "top": (100, 40, 1100, 470),
    "middle": (100, 360, 1100, 800),
    "bottom": (100, 700, 1100, 1160),
    "left": (90, 120, 650, 1090),
    "right": (550, 120, 1110, 1090),
    "bottom_routes": (250, 800, 950, 1160),
    "middle_routes": (120, 300, 1080, 760),
}

for name, bounds in regions.items():
    crop = image.crop(bounds)
    crop.save(OUTPUT / f"{name}.png")
    if name in {"bottom_routes", "middle_routes"}:
        crop.resize((crop.width * 3, crop.height * 3), Image.Resampling.LANCZOS).save(OUTPUT / f"{name}-3x.png")
    if overlay is not None:
        overlay.crop(bounds).save(OUTPUT / f"{name}-overlay.png")
    if labels is not None:
        labels.crop(bounds).save(OUTPUT / f"{name}-labels.png")

print(f"Wrote {len(regions)} audit crops to {OUTPUT}")
