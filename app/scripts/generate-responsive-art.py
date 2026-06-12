from pathlib import Path
from PIL import Image

APP_DIR = Path(__file__).resolve().parents[1]
ART_DIR = APP_DIR / "public" / "art"

TARGETS = {
    "panels/themap.webp": [640, 960],
    "panels/insight2-panel.webp": [640, 960],
    "panels/source-verification-panel.webp": [640, 960],
}


def format_kb(size: int) -> str:
    return f"{round(size / 1024)} kB"


def save_variant(source: Path, width: int) -> Path | None:
    with Image.open(source) as image:
        image.load()
        original_width, original_height = image.size
        if original_width <= width:
            return None
        height = round(original_height * (width / original_width))
        variant = image.resize((width, height), Image.Resampling.LANCZOS)
        target = source.with_name(f"{source.stem}-{width}w.webp")
        variant.save(target, "WEBP", quality=82, method=6)
        return target


def main() -> None:
    written: list[Path] = []
    for rel, widths in TARGETS.items():
        source = ART_DIR / rel
        if not source.exists():
            raise FileNotFoundError(source)
        for width in widths:
            target = save_variant(source, width)
            if target:
                written.append(target)
                print(f"{target.relative_to(APP_DIR)} {format_kb(target.stat().st_size)}")
            else:
                print(f"Skipped {rel} at {width}w; source is not larger than requested width.")
    print(f"Generated {len(written)} responsive art variants.")


if __name__ == "__main__":
    main()
