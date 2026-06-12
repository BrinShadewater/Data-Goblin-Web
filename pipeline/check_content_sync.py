#!/usr/bin/env python3
"""Verify generated content and deployed public content are byte-for-byte equal."""

from __future__ import annotations

import filecmp
import os
import sys
from pathlib import Path


def json_files(root: Path) -> dict[str, Path]:
    return {
        path.relative_to(root).as_posix(): path
        for path in root.rglob("*.json")
        if path.is_file()
    }


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print("Usage: check_content_sync.py <source-content-dir> <public-content-dir>")
        return 2

    source = Path(argv[1]).resolve()
    public = Path(argv[2]).resolve()
    if not source.is_dir():
        print(f"Source content directory not found: {source}")
        return 1
    if not public.is_dir():
        print(f"Public content directory not found: {public}")
        return 1

    source_files = json_files(source)
    public_files = json_files(public)
    source_set = set(source_files)
    public_set = set(public_files)

    missing = sorted(source_set - public_set)
    extra = sorted(public_set - source_set)
    changed = sorted(
        rel
        for rel in source_set & public_set
        if not filecmp.cmp(os.fspath(source_files[rel]), os.fspath(public_files[rel]), shallow=False)
    )

    if missing or extra or changed:
        if missing:
            print("Missing public content:")
            for rel in missing:
                print(f"  {rel}")
        if extra:
            print("Extra public content:")
            for rel in extra:
                print(f"  {rel}")
        if changed:
            print("Out-of-sync public content:")
            for rel in changed:
                print(f"  {rel}")
        return 1

    print(f"Content sync OK: {len(source_files)} JSON files match.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
