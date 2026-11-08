"""Apply the reviewed French C-16 wording to generated content."""

import argparse
import json
from pathlib import Path


SITE = Path(__file__).resolve().parents[1]
EDITS = Path(__file__).with_name("chapter13-legal-update.json")


def update(document, edits, file):
    for edit in edits:
        *parents, key = edit["path"]
        node = document
        for parent in parents:
            node = node[parent]
        current = node[key]
        before, after = edit["before"], edit["after"]
        if isinstance(current, str):
            if current.count(after) == 1:
                continue
            if current.count(before) == 1:
                node[key] = current.replace(before, after, 1)
                continue
        elif isinstance(current, list):
            if current[:len(after)] == after:
                continue
            if current[:len(before)] == before:
                node[key] = after + current[len(before):]
                continue
        raise ValueError(f"{file}: reviewed text no longer matches {edit['path']}; review before reapplying")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("roots", type=Path, nargs="*")
    parser.add_argument("--check", action="store_true", help="Verify without writing")
    args = parser.parse_args()
    roots = args.roots or [SITE / "content", SITE / "app/public/content"]
    patches = json.loads(EDITS.read_text(encoding="utf-8"))
    changes = {}
    try:
        for root in roots:
            for filename, edits in patches.items():
                file = root / filename
                original = file.read_bytes()
                document = json.loads(original)
                update(document, edits, file)
                if document != json.loads(original):
                    ending = "\n" if original.endswith(b"\n") else ""
                    if b"\r\n" in original:
                        ending = "\r\n" if ending else ""
                    output = json.dumps(document, ensure_ascii=False, indent=1) + ending
                    if b"\r\n" in original:
                        output = output.replace("\r\n", "\n").replace("\n", "\r\n")
                    changes[file] = output.encode("utf-8")
    except (OSError, ValueError, KeyError, IndexError, TypeError) as error:
        parser.exit(1, f"{error}\n")
    if args.check and changes:
        parser.exit(1, "Reviewed C-16 text missing in: " + ", ".join(map(str, changes)) + "\n")
    for file, contents in changes.items():
        file.write_bytes(contents)
    print(f"French C-16 legal text: {len(patches) * len(roots)} files checked, {len(changes)} updated.")


if __name__ == "__main__":
    main()
