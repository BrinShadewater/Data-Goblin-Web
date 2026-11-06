"""Check required sitemap URLs, language metadata, and built links."""

import argparse
from collections import defaultdict
from html.parser import HTMLParser
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urljoin, urlsplit
import xml.etree.ElementTree as ET


SITE_ORIGIN = "https://datagoblin.ca"
PADDED_CHAPTER = re.compile(r"(/(?:fr/)?chapter/)0+(2[0-2]|1[0-9]|[0-9])")


def is_french(path):
    return path == "/fr" or path.startswith("/fr/")


class PageLinks(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_head = False
        self.in_body = False
        self.template_depth = 0
        self.canonicals = []
        self.links = []
        self.anchors = []
        self.fragment_targets = set()
        self.base_href = None

    def handle_starttag(self, tag, attrs):
        if tag == "template":
            self.template_depth += 1
        if self.template_depth:
            return
        attributes = dict(attrs)
        if identifier := attributes.get("id"):
            self.fragment_targets.add(identifier)
        if tag == "head":
            self.in_head = True
        elif tag == "body":
            self.in_body = True
        elif tag == "base" and self.in_head and self.base_href is None:
            self.base_href = attributes.get("href")
        elif tag == "link" and self.in_head:
            link = attributes
            if "canonical" in (link.get("rel") or "").lower().split():
                self.canonicals.append(link.get("href"))
            self.links.append(link)
        elif tag == "a" and self.in_body:
            if name := attributes.get("name"):
                self.fragment_targets.add(name)
            if href := (attributes.get("href") or "").strip():
                self.anchors.append((href, attributes))

    def handle_endtag(self, tag):
        if tag == "template" and self.template_depth:
            self.template_depth -= 1
        elif self.template_depth:
            return
        elif tag == "head":
            self.in_head = False
        elif tag == "body":
            self.in_body = False


def alternate_errors(url, source, links, expected):
    actual = defaultdict(list)
    for link in links:
        if "alternate" in (link.get("rel") or "").lower().split() and "hreflang" in link:
            actual[(link.get("hreflang") or "").lower()].append(link.get("href"))
    for language in sorted(expected.keys() | actual.keys()):
        targets = [expected[language]] if language in expected else []
        if actual[language] != targets:
            yield f"{url} ({source}): hreflang {language!r} expected {targets!r}, found {actual[language]!r}"


def read_built_pages(dist, entries):
    pages = {}
    errors = []
    for url in sorted(entries):
        location = urlsplit(url)
        if (location.scheme, location.netloc) != ("https", "datagoblin.ca") or location.query or location.fragment or not location.path.startswith("/"):
            raise ValueError(f"Unexpected sitemap location {url!r}.")
        page = (dist / location.path.lstrip("/") / "index.html").resolve()
        if not page.is_relative_to(dist):
            raise ValueError(f"Sitemap route escapes the build directory: {url!r}.")
        if not page.is_file():
            errors.append(f"{url}: missing built HTML.")
            continue
        links = PageLinks()
        links.feed(page.read_text(encoding="utf-8"))
        links.close()
        pages[url] = links
    return pages, errors


def check_language_metadata(entries, pages):
    errors = []
    for url, entry in sorted(entries.items()):
        route = urlsplit(url).path
        english = route
        if is_french(route):
            english = route.removeprefix("/fr") or "/"
        en_url = SITE_ORIGIN + english
        fr_url = SITE_ORIGIN + "/fr" + ("" if english == "/" else english)
        expected = {"en-ca": en_url, "fr-ca": fr_url, "x-default": en_url}
        for alternate in {en_url, fr_url} - entries.keys():
            errors.append(f"{url}: missing language counterpart in sitemap: {alternate}")
        errors.extend(alternate_errors(url, "sitemap", (
            link.attrib for link in entry.findall("{http://www.w3.org/1999/xhtml}link")
        ), expected))

        if url not in pages:
            continue
        head = pages[url]
        if head.canonicals != [url]:
            errors.append(f"{url} (HTML head): canonical expected {[url]!r}, found {head.canonicals!r}")
        errors.extend(alternate_errors(url, "HTML head", head.links, expected))
    return errors


def check_reachability(entries, pages):
    graph = {}
    for url, page in pages.items():
        base = urljoin(url, page.base_href or "")
        targets = set()
        for href, attributes in page.anchors:
            if "nofollow" in (attributes.get("rel") or "").lower().split():
                continue
            target = urlsplit(urljoin(base, href))
            if (target.scheme, target.netloc) == ("https", "datagoblin.ca"):
                targets.add(SITE_ORIGIN + (target.path.rstrip("/") or "/"))
        graph[url] = targets

    errors = []
    for language, homepage, french in (("English", "/", False), ("French", "/fr", True)):
        # An edition switch cannot substitute for navigation within the edition.
        edition = {url for url in entries if is_french(urlsplit(url).path) == french}
        start = SITE_ORIGIN + homepage
        if start not in edition:
            errors.append(f"{language} homepage is missing from the sitemap: {start}")
            continue
        reached = set()
        pending = [start]
        while pending:
            url = pending.pop()
            if url in reached or url not in graph:
                continue
            reached.add(url)
            pending.extend((graph[url] & edition) - reached)
        print(f"Static reachability ({language}): {len(reached)}/{len(edition)} sitemap URLs.")
        for url in sorted(edition - reached):
            errors.append(f"Unreachable from the {language} homepage {start}: {url}")
    return errors


def check_link_integrity(dist, pages):
    errors = []
    count = 0
    for source, page in pages.items():
        base = urljoin(source, page.base_href or "")
        for href, attributes in page.anchors:
            target = urlsplit(urljoin(base, href))
            if target.hostname != "datagoblin.ca" or target.scheme not in ("http", "https"):
                continue
            count += 1
            path = unquote(target.path).rstrip("/") or "/"
            label = f"{source}: href {href!r}"
            alias = PADDED_CHAPTER.fullmatch(path)
            if alias:
                errors.append(f"{label} uses a chapter redirect. Link directly to {alias[1]}{alias[2]}.")
                continue
            if target.scheme != "https":
                errors.append(f"{label} uses HTTP. Link directly to HTTPS.")
            destination = pages.get(SITE_ORIGIN + path)
            if destination is None:
                # Downloads and other public files can be valid without a sitemap entry.
                file = (dist / unquote(target.path).lstrip("/")).resolve()
                if not file.is_relative_to(dist) or not file.is_file():
                    errors.append(f"{label} points to a missing built destination.")
                continue

            if is_french(urlsplit(source).path) != is_french(path):
                expected_language = "fr-ca" if is_french(path) else "en-ca"
                if (attributes.get("hreflang") or "").lower() != expected_language:
                    errors.append(f"{label} crosses editions without hreflang={expected_language}.")
            fragment = unquote(target.fragment.split(":~:", 1)[0])
            if fragment and fragment.lower() != "top" and fragment not in destination.fragment_targets:
                errors.append(f"{label} points to missing fragment {fragment!r}.")
    print(f"Checked {count} internal links across {len(pages)} built sitemap pages.")
    return list(dict.fromkeys(errors))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("sitemap", type=Path)
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--check-language-metadata", action="store_true")
    parser.add_argument("--check-reachability", action="store_true",
                        help="Follow same-edition links in the built HTML from each homepage.")
    parser.add_argument("--check-link-integrity", action="store_true",
                        help="Check built destinations, fragments, language and known redirects.")
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
        errors = []
        dist = args.sitemap.resolve().parent
        if args.check_language_metadata or args.check_reachability or args.check_link_integrity:
            errors = [f"Duplicate sitemap URL: {url}" for url in sorted(duplicates)]
            pages, page_errors = read_built_pages(dist, entries)
            errors.extend(page_errors)
        if args.check_language_metadata:
            errors.extend(check_language_metadata(entries, pages))
        if args.check_reachability:
            errors.extend(check_reachability(entries, pages))
        if args.check_link_integrity:
            errors.extend(check_link_integrity(dist, pages))
    except (OSError, ValueError, ET.ParseError) as exc:
        sys.exit(f"Could not check sitemap completeness: {exc}")

    missing = sorted(expected - entries.keys())
    for url in missing:
        print(f"Missing sitemap URL: {url}", file=sys.stderr)
    print(f"Sitemap lists {len(expected) - len(missing)}/{len(expected)} expected URLs.")
    for error in errors:
        print(error, file=sys.stderr)
    if args.check_language_metadata and not missing and not errors:
        print(f"Canonical and reciprocal hreflang checks passed for {len(entries)} sitemap URLs.")
    return int(bool(missing or errors))


if __name__ == "__main__":
    raise SystemExit(main())
