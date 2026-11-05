"""Check required sitemap URLs and, optionally, their language metadata."""

import argparse
from collections import defaultdict
from html.parser import HTMLParser
from pathlib import Path
import sys
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET


class HeadLinks(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_head = False
        self.canonicals = []
        self.links = []

    def handle_starttag(self, tag, attrs):
        if tag == "head":
            self.in_head = True
        elif tag == "link" and self.in_head:
            link = dict(attrs)
            if "canonical" in (link.get("rel") or "").lower().split():
                self.canonicals.append(link.get("href"))
            self.links.append(link)

    def handle_endtag(self, tag):
        if tag == "head":
            self.in_head = False


def alternate_errors(url, source, links, expected):
    actual = defaultdict(list)
    for link in links:
        if "alternate" in (link.get("rel") or "").lower().split() and "hreflang" in link:
            actual[(link.get("hreflang") or "").lower()].append(link.get("href"))
    for language in sorted(expected.keys() | actual.keys()):
        targets = [expected[language]] if language in expected else []
        if actual[language] != targets:
            yield f"{url} ({source}): hreflang {language!r} expected {targets!r}, found {actual[language]!r}"


def check_language_metadata(dist, entries):
    errors = []
    for url, entry in sorted(entries.items()):
        location = urlsplit(url)
        if (location.scheme, location.netloc) != ("https", "datagoblin.ca") or location.query or location.fragment:
            raise ValueError(f"Unexpected sitemap location {url!r}.")
        route = location.path
        english = route
        if route == "/fr" or route.startswith("/fr/"):
            english = route.removeprefix("/fr") or "/"
        origin = f"{location.scheme}://{location.netloc}"
        en_url = origin + english
        fr_url = origin + "/fr" + ("" if english == "/" else english)
        expected = {"en-ca": en_url, "fr-ca": fr_url, "x-default": en_url}
        for alternate in {en_url, fr_url} - entries.keys():
            errors.append(f"{url}: missing language counterpart in sitemap: {alternate}")
        errors.extend(alternate_errors(url, "sitemap", (
            link.attrib for link in entry.findall("{http://www.w3.org/1999/xhtml}link")
        ), expected))

        page = (dist / route.lstrip("/") / "index.html").resolve()
        if not page.is_relative_to(dist):
            raise ValueError(f"Sitemap route escapes the build directory: {url!r}.")
        if not page.is_file():
            errors.append(f"{url}: missing built HTML.")
            continue
        head = HeadLinks()
        head.feed(page.read_text(encoding="utf-8"))
        head.close()
        if head.canonicals != [url]:
            errors.append(f"{url} (HTML head): canonical expected {[url]!r}, found {head.canonicals!r}")
        errors.extend(alternate_errors(url, "HTML head", head.links, expected))
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("sitemap", type=Path)
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--check-language-metadata", action="store_true")
    args = parser.parse_args()

    try:
        lines = args.manifest.read_text(encoding="utf-8").splitlines()
        urls = [url for line in lines if (url := line.strip()) and not url.startswith("#")]
        expected = set(urls)
        if not expected or len(expected) != len(urls):
            raise ValueError("Expected URL manifest must contain a non-empty list of unique URLs.")
        sitemap = ET.parse(args.sitemap)
        entries = {}
        duplicates = set()
        for entry in sitemap.findall("{*}url"):
            url = (entry.findtext("{*}loc") or "").strip()
            if url:
                if url in entries:
                    duplicates.add(url)
                entries[url] = entry
        metadata_errors = []
        if args.check_language_metadata:
            metadata_errors = [f"Duplicate sitemap URL: {url}" for url in sorted(duplicates)]
            metadata_errors.extend(check_language_metadata(args.sitemap.resolve().parent, entries))
    except (OSError, ValueError, ET.ParseError) as exc:
        sys.exit(f"Could not check sitemap completeness: {exc}")

    missing = sorted(expected - entries.keys())
    for url in missing:
        print(f"Missing sitemap URL: {url}", file=sys.stderr)
    print(f"Sitemap lists {len(expected) - len(missing)}/{len(expected)} expected URLs.")
    for error in metadata_errors:
        print(error, file=sys.stderr)
    if args.check_language_metadata and not missing and not metadata_errors:
        print(f"Canonical and reciprocal hreflang checks passed for {len(entries)} sitemap URLs.")
    return int(bool(missing or metadata_errors))


if __name__ == "__main__":
    raise SystemExit(main())
