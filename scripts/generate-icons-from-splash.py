"""Generate app icons from a centered crop of assets/splash.png."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SPLASH_PATH = ROOT / "assets" / "splash.png"
ICON_SIZE = 1024
FILL_RATIO = 0.68
BG_DIFF_THRESHOLD = 30


def _estimate_background_color(image: Image.Image) -> tuple[int, int, int]:
    pixels = image.load()
    width, height = image.size
    samples = [
        pixels[0, 0],
        pixels[width - 1, 0],
        pixels[0, height - 1],
        pixels[width - 1, height - 1],
    ]
    return tuple(sum(channel[i] for channel in samples) // 4 for i in range(3))  # type: ignore[return-value]


def _content_bbox(image: Image.Image, background: tuple[int, int, int]) -> tuple[int, int, int, int]:
    pixels = image.load()
    width, height = image.size
    min_x, min_y = width, height
    max_x, max_y = 0, 0

    for y in range(height):
        for x in range(width):
            pixel = pixels[x, y]
            diff = sum(abs(pixel[i] - background[i]) for i in range(3))
            if diff <= BG_DIFF_THRESHOLD:
                continue
            min_x = min(min_x, x)
            min_y = min(min_y, y)
            max_x = max(max_x, x)
            max_y = max(max_y, y)

    if max_x <= min_x or max_y <= min_y:
        raise RuntimeError("Could not detect icon content in splash image")

    return min_x, min_y, max_x, max_y


def _crop_centered_square(image: Image.Image, bbox: tuple[int, int, int, int]) -> Image.Image:
    min_x, min_y, max_x, max_y = bbox
    content_width = max_x - min_x
    content_height = max_y - min_y
    center_x = (min_x + max_x) // 2
    center_y = (min_y + max_y) // 2

    crop_size = int(max(content_width, content_height) / FILL_RATIO)
    crop_size += crop_size % 2

    width, height = image.size
    left = max(0, center_x - crop_size // 2)
    top = max(0, center_y - crop_size // 2)
    right = min(width, left + crop_size)
    bottom = min(height, top + crop_size)

    # Keep a square crop even when we hit image bounds.
    actual_width = right - left
    actual_height = bottom - top
    crop_side = min(actual_width, actual_height)
    right = left + crop_side
    bottom = top + crop_side

    cropped = image.crop((left, top, right, bottom))
    return cropped.resize((ICON_SIZE, ICON_SIZE), Image.Resampling.LANCZOS)


def _make_foreground(icon: Image.Image, background: tuple[int, int, int]) -> Image.Image:
    rgba = icon.convert("RGBA")
    pixels = rgba.load()
    for y in range(ICON_SIZE):
        for x in range(ICON_SIZE):
            red, green, blue, _alpha = pixels[x, y]
            diff = abs(red - background[0]) + abs(green - background[1]) + abs(blue - background[2])
            if diff <= BG_DIFF_THRESHOLD * 3:
                pixels[x, y] = (0, 0, 0, 0)
    return rgba


def _save_public_icons(icon: Image.Image) -> None:
    public_dir = ROOT / "public"
    public_dir.mkdir(parents=True, exist_ok=True)

    icon.save(public_dir / "favicon.png", format="PNG", optimize=True)
    icon.resize((180, 180), Image.Resampling.LANCZOS).save(
        public_dir / "apple-touch-icon.png",
        format="PNG",
        optimize=True,
    )
    icon.resize((32, 32), Image.Resampling.LANCZOS).save(
        public_dir / "favicon-32.png",
        format="PNG",
        optimize=True,
    )
    icon.resize((16, 16), Image.Resampling.LANCZOS).save(
        public_dir / "favicon-16.png",
        format="PNG",
        optimize=True,
    )


def main() -> None:
    splash = Image.open(SPLASH_PATH).convert("RGB")
    background = _estimate_background_color(splash)
    bbox = _content_bbox(splash, background)
    icon = _crop_centered_square(splash, bbox)
    foreground = _make_foreground(icon, background)
    background_image = Image.new("RGB", (ICON_SIZE, ICON_SIZE), background)

    assets_dir = ROOT / "assets"
    icon.save(assets_dir / "icon-only.png", format="PNG", optimize=True)
    foreground.save(assets_dir / "icon-foreground.png", format="PNG", optimize=True)
    background_image.save(assets_dir / "icon-background.png", format="PNG", optimize=True)

    _save_public_icons(icon)

    content_width = bbox[2] - bbox[0]
    content_height = bbox[3] - bbox[1]
    crop_side = max(content_width, content_height) / FILL_RATIO
    fill_percent = max(content_width, content_height) / crop_side * 100
    print(f"Generated icons from {SPLASH_PATH.name}")
    print(f"  background: rgb{background}")
    print(f"  content bbox: {bbox}")
    print(f"  logo fill: {fill_percent:.1f}% of {ICON_SIZE}px canvas")


if __name__ == "__main__":
    main()
