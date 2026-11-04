"""Check that the built sitemap lists every URL in the independent manifest."""

import argparse
from pathlib import Path
import sys
import xml.etree.ElementTree as ET


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("sitemap", type=Path)
    parser.add_argument("manifest", type=Path)
    args = parser.parse_args()

    try:
        lines = args.manifest.read_text(encoding="utf-8").splitlines()
        urls = [url for line in lines if (url := line.strip()) and not url.startswith("#")]
        expected = set(urls)
        if not expected or len(expected) != len(urls):
            raise ValueError("Expected URL manifest must contain a non-empty list of unique URLs.")
        sitemap = ET.parse(args.sitemap)
    except (OSError, ValueError, ET.ParseError) as exc:
        sys.exit(f"Could not check sitemap completeness: {exc}")

    listed = {entry.text.strip() for entry in sitemap.findall("{*}url/{*}loc") if entry.text}
    missing = sorted(expected - listed)
    for url in missing:
        print(f"Missing sitemap URL: {url}", file=sys.stderr)
    print(f"Sitemap lists {len(expected) - len(missing)}/{len(expected)} expected URLs.")
    return int(bool(missing))


if __name__ == "__main__":
    raise SystemExit(main())
