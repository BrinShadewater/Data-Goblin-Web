// Inline claim-receipts. A curated anchor map (claim-anchors.json, keyed by
// chapter number) pins each ledger receipt to the exact verbatim phrase in the
// prose it verifies. The first eligible occurrence of that phrase becomes
// [phrase](#receipt-<id> "goblin-receipt"), which the Markdown <a> renderer
// turns into a tappable receipt seal + popover (status, detail, sources).
//
// Receipts run BEFORE reference-autolinks and glossary tooltips so a
// load-bearing claim gets the first chance to link.
import type { Block } from "./pagination";

export const RECEIPT_TITLE = "goblin-receipt";

export interface ClaimAnchor { anchor: string; id: number; status: string; }
export type ClaimAnchors = Record<string, ClaimAnchor[]>;

function lineEligible(line: string): boolean {
  const t = line.trimStart();
  return !(t.startsWith("#") || t.startsWith(">") || t.startsWith("|") || line.includes("](") || line.includes("`"));
}

interface ReceiptEdit {
  start: number;
  end: number;
  markdown: string;
}

export function receiptLinkBlocks(blocks: Block[], anchors: ClaimAnchor[] | undefined): Block[] {
  if (!anchors || anchors.length === 0) return blocks;
  const texts = blocks.map((b) => (b.kind === "md" ? b.text : null));
  const joined = texts.filter((t): t is string => t != null).join("\n");
  if (!joined) return blocks;
  const present = anchors.filter((a) => joined.includes(a.anchor));
  if (present.length === 0) return blocks;

  // Check eligibility against the original Markdown. Inserting one marker
  // must not make a different claim on the same line look like a source link.
  const edits = texts.map((): ReceiptEdit[] => []);
  for (const a of present) {
    outer: for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      if (text == null || !text.includes(a.anchor)) continue;
      const lines = text.split("\n");
      let offset = 0;
      for (const line of lines) {
        const at = line.indexOf(a.anchor);
        if (at >= 0 && lineEligible(line)) {
          const start = offset + at;
          const end = start + a.anchor.length;
          if (!edits[i].some((edit) => start < edit.end && end > edit.start)) {
            edits[i].push({ start, end, markdown: `[${a.anchor}](#receipt-${a.id} "${RECEIPT_TITLE}")` });
            break outer;
          }
        }
        offset += line.length + 1;
      }
    }
  }
  return blocks.map((block, i) => {
    if (block.kind !== "md" || edits[i].length === 0) return block;
    const text = edits[i].sort((a, b) => b.start - a.start).reduce(
      (text, { start, end, markdown }) => text.slice(0, start) + markdown + text.slice(end),
      block.text,
    );
    return { ...block, text };
  });
}
