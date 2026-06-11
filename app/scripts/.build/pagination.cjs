"use strict";
// ---------------------------------------------------------------------------
// Book pagination — pure logic, no React. Flattens a chapter into an ordered
// list of logical blocks, then greedily packs blocks into page panels using a
// character-count height heuristic. Two panels = one spread. Spread 0 is the
// chapter opener (title + mascot + Start Here), so panel 0 gets a reduced
// budget. Also owns the per-chapter "last spread read" localStorage store.
// ---------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.LAST_SPREAD = exports.OPENER_BUDGET = exports.PANEL_BUDGET = void 0;
exports.splitBlocks = splitBlocks;
exports.blockCost = blockCost;
exports.flattenChapter = flattenChapter;
exports.paginateChapter = paginateChapter;
exports.getSavedSpread = getSavedSpread;
exports.saveSpread = saveSpread;
exports.hasAnySavedSpread = hasAnySavedSpread;
/** Estimated character budget for a full flowing panel. */
exports.PANEL_BUDGET = 1800;
/** Reduced budget for the opener panel (title + mascot eat most of it). */
exports.OPENER_BUDGET = 850;
/**
 * Split markdown into logical blocks on blank lines, but keep multi-line
 * blockquote runs (🧌 GOBLIN CHECK / 📦 CHAPTER RECAP callouts) and markdown
 * tables atomic — they must never be broken across pages.
 */
function splitBlocks(markdown) {
    const chunks = markdown
        .split(/\n[ \t]*\n+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    // Merge consecutive blockquote chunks (or table chunks) into one atomic
    // block so a callout split by a stray blank line still moves as a unit.
    const merged = [];
    const startsAs = (s) => (s.startsWith(">") ? "quote" : s.startsWith("|") ? "table" : "text");
    for (const chunk of chunks) {
        const prev = merged[merged.length - 1];
        const kind = startsAs(chunk);
        if (prev !== undefined && kind !== "text" && startsAs(prev) === kind) {
            merged[merged.length - 1] = `${prev}\n\n${chunk}`;
        }
        else {
            merged.push(chunk);
        }
    }
    return merged;
}
/** Heuristic "height" cost of a block, in budget characters. */
function blockCost(block) {
    switch (block.kind) {
        case "heading":
            return 150;
        case "trap":
            return Math.round((block.trap.trapTitle.length + block.trap.text.length) * 1.15) + 120;
        case "bias":
            return block.text.length + 80;
        case "md": {
            const t = block.text.trimStart();
            const isCalloutOrTable = t.startsWith(">") || t.startsWith("|");
            return Math.round(block.text.length * (isCalloutOrTable ? 1.15 : 1)) + 40;
        }
    }
}
/**
 * Flatten a chapter into its ordered block list: Start-Here intro blocks,
 * then per section a heading block + its content blocks. The Goblin Trap is
 * inserted as an atomic block after the first section; the bias label is the
 * final block.
 */
function flattenChapter(chapter, trap) {
    const blocks = [];
    for (const text of splitBlocks(chapter.startHere))
        blocks.push({ kind: "md", text });
    chapter.sections.forEach((section, i) => {
        blocks.push({ kind: "heading", heading: section.heading });
        for (const text of splitBlocks(section.markdown))
            blocks.push({ kind: "md", text });
        if (i === 0 && trap)
            blocks.push({ kind: "trap", trap });
    });
    if (chapter.biasLabel)
        blocks.push({ kind: "bias", text: chapter.biasLabel });
    return blocks;
}
/**
 * Greedily pack blocks into panels, then pair panels into spreads.
 * Panel 0 (the opener's left page) gets the reduced opener budget.
 * A section heading is never left as the last block of a panel — it is
 * carried over to the next panel instead.
 */
function paginateChapter(chapter, trap) {
    const blocks = flattenChapter(chapter, trap);
    const panels = [];
    let cur = [];
    let used = 0;
    for (const block of blocks) {
        const cost = blockCost(block);
        const budget = panels.length === 0 ? exports.OPENER_BUDGET : exports.PANEL_BUDGET;
        if (cur.length > 0 && used + cost > budget) {
            const lastIsHeading = cur[cur.length - 1].kind === "heading";
            if (lastIsHeading && cur.length === 1) {
                // The panel holds only a heading and the next block alone exceeds the
                // budget: keep them together (small overflow) rather than orphan it.
            }
            else {
                // Close the panel — but never orphan a heading at a page bottom.
                let carry = null;
                if (lastIsHeading) {
                    carry = cur.pop();
                }
                panels.push(cur);
                cur = carry ? [carry] : [];
                used = carry ? blockCost(carry) : 0;
            }
        }
        cur.push(block);
        used += cost;
    }
    if (cur.length > 0)
        panels.push(cur);
    if (panels.length === 0)
        panels.push([]);
    if (panels.length % 2 === 1)
        panels.push([]);
    const spreads = [];
    for (let i = 0; i < panels.length; i += 2) {
        spreads.push({ left: panels[i], right: panels[i + 1] });
    }
    return spreads;
}
// ---------------------------------------------------------------------------
// Per-chapter reading-position persistence. Saved indices are clamped to the
// current spread count on load, so the reader recovers gracefully if the
// pagination changes between visits.
// ---------------------------------------------------------------------------
/** Sentinel meaning "open the chapter at its last spread" (clamped on load). */
exports.LAST_SPREAD = 1000000;
const spreadKey = (chapter) => `goblin-spread-ch${chapter}`;
function getSavedSpread(chapter) {
    try {
        const raw = localStorage.getItem(spreadKey(chapter));
        const v = raw == null ? 0 : parseInt(raw, 10);
        return Number.isFinite(v) && v >= 0 ? v : 0;
    }
    catch {
        return 0;
    }
}
function saveSpread(chapter, index) {
    try {
        localStorage.setItem(spreadKey(chapter), String(index));
    }
    catch {
        /* storage unavailable — position just won't persist */
    }
}
/**
 * True if any reading position has ever been saved on this device. Used by
 * the "/" route: first-time visitors land on the Front Matter title page;
 * returning readers keep the existing behaviour (chapter 1 at its saved spread).
 */
function hasAnySavedSpread() {
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("goblin-spread-ch"))
                return true;
        }
    }
    catch {
        /* storage unavailable — treat as first visit */
    }
    return false;
}
