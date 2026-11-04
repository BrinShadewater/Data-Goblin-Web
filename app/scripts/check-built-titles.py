"""Check <title> in the built HTML for each Data Goblin sitemap route."""

import argparse
from html.parser import HTMLParser
from pathlib import Path, PurePosixPath
import sys
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET


class HeadTitles(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_head = False
        self.title = None
        self.titles = []

    def handle_starttag(self, tag, attrs):
        if tag == "head":
            self.in_head = True
        elif tag == "title" and self.in_head:
            self.title = []

    def handle_data(self, data):
        if self.title is not None:
            self.title.append(data)

    def handle_endtag(self, tag):
        if tag == "title" and self.title is not None:
            self.titles.append("".join(self.title).strip())
            self.title = None
        elif tag == "head":
            self.in_head = False
            self.title = None


def check_titles(dist):
    root = ET.parse(dist / "sitemap.xml").getroot()
    locations = root.findall("{*}url/{*}loc")
    if not locations:
        raise ValueError("The built sitemap contains no page URLs.")

    errors = {}
    seen = set()
    for location in locations:
        url = urlsplit(location.text or "")
        route = url.path or "/"
        if (url.scheme, url.netloc) != ("https", "datagoblin.ca") or url.query or url.fragment:
            raise ValueError(f"Unexpected sitemap location {location.text!r}.")
        if route in seen:
            raise ValueError(f"Duplicate sitemap route {route!r}.")
        seen.add(route)
        relative = PurePosixPath(route.lstrip("/")) / "index.html"
        page = (dist / relative).resolve()
        if not page.is_relative_to(dist):
            raise ValueError(f"Sitemap route escapes the build directory: {route!r}.")
        if not page.is_file():
            errors[route] = "Missing built HTML."
            continue
        head = HeadTitles()
        head.feed(page.read_text(encoding="utf-8"))
        head.close()
        if len(head.titles) != 1 or not head.titles[0]:
            errors[route] = "Expected exactly one non-empty <title> in the built HTML head."
            continue
    return len(seen), errors


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("dist", type=Path)
    args = parser.parse_args()
    try:
        checked, errors = check_titles(args.dist.resolve())
    except (OSError, ValueError, ET.ParseError) as exc:
        sys.exit(f"Could not check built titles: {exc}")

    for route, error in errors.items():
        print(f"{route}: {error}", file=sys.stderr)
    print(f"Built titles: {checked - len(errors)}/{checked} sitemap routes passed.")
    raise SystemExit(bool(errors))
