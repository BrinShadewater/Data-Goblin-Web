"use strict";
// ---------------------------------------------------------------------------
// Book pagination — pure logic, no React. Flattens a chapter into an ordered
// list of logical blocks, then packs blocks into page panels using a
// character-count height heuristic with BALANCED fill: total cost is measured
// first, a page count derived, and blocks are packed toward an even per-page
// target so the last page is never a stub. On desktop two panels = one
// spread; on phone/tablet each panel is its own page. Panel 0 is the chapter
// opener (title + mascot + Start Here) and carries a fixed overhead.
// Also owns the per-chapter "last panel read" localStorage store.
// ---------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.LAST_PANEL = exports.ACCENT_COST = exports.OPENER_BUDGET = exports.PANEL_BUDGET = void 0;
exports.budgetsFor = budgetsFor;
exports.splitBlocks = splitBlocks;
exports.blockCost = blockCost;
exports.flattenChapter = flattenChapter;
exports.paginatePanels = paginatePanels;
exports.paginatePanelsCached = paginatePanelsCached;
exports.paginateChapter = paginateChapter;
exports.getSavedPanel = getSavedPanel;
exports.savePanel = savePanel;
exports.hasAnySavedPosition = hasAnySavedPosition;
// Desktop budgets, calibrated for the 16px/1.65 reader type (was 1800/850 at
// the old 13.5px/1.74 type — capacity scales with the font metrics).
exports.PANEL_BUDGET = 1350;
exports.OPENER_BUDGET = 630;
/**
 * Extra budget cost charged to a section heading that carries an accent
 * ornament (small art PNG rendered beside the heading, see art-map.json).
 * ~72px of image against the ~1.9 chars/px panel metric, less the heading's
 * own row height that the image shares.
 */
exports.ACCENT_COST = 80;
/**
 * Budget for the active viewport mode + reading mode. Phone panels hold
 * ≈60% of a desktop panel; tablet single pages ≈85%; the dyslexia-friendly
 * face (larger metrics, 1.8 line-height) costs a further ~15%.
 */
function budgetsFor(mode, dyslexic) {
    const scale = (mode === "phone" ? 0.6 : mode === "tablet" ? 0.85 : 1) * (dyslexic ? 0.85 : 1);
    return {
        panel: Math.round(exports.PANEL_BUDGET * scale),
        opener: Math.round(exports.OPENER_BUDGET * scale),
    };
}
const DEFAULT_BUDGETS = { panel: exports.PANEL_BUDGET, opener: exports.OPENER_BUDGET };
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
            return 150 + (block.accent ? exports.ACCENT_COST : 0);
        case "trap":
            return Math.round((block.trap.trapTitle.length + block.trap.text.length) * 1.15) + 120;
        case "bias":
            return block.text.length + 80;
        case "md": {
            const t = block.text.trimStart();
            const isCalloutOrTable = t.startsWith(">") || t.startsWith("|");
            return Math.round(block.text.length * (isCalloutOrTable ? 1.15 : 1)) + 40;
        }
        case "panel":
            // Never packed with prose — paginatePanels appends plates as their
            // own pages — but cost a full panel for safety if one ever flows.
            return exports.PANEL_BUDGET;
    }
}
/**
 * Flatten a chapter into its ordered block list: Start-Here intro blocks,
 * then per section a heading block + its content blocks. The Goblin Trap is
 * inserted as an atomic block after the first section; the bias label is the
 * final block. When `accents` (art-map paths like "small/water.png") is
 * non-empty, section headings carry them as ornaments, cycling in order.
 */
function flattenChapter(chapter, trap, accents = []) {
    const blocks = [];
    for (const text of splitBlocks(chapter.startHere))
        blocks.push({ kind: "md", text });
    chapter.sections.forEach((section, i) => {
        blocks.push({
            kind: "heading",
            heading: section.heading,
            ...(accents.length > 0 ? { accent: accents[i % accents.length] } : {}),
        });
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
 * Balanced-fill packer. Computes the total cost (the opener header counts as
 * fixed overhead on panel 0), derives pageCount = ceil(total / budget), then
 * packs toward target = total / pageCount: a panel closes when adding the
 * next block would overshoot the target by more than stopping undershoots
 * it. This keeps pages visually even and avoids a stub last page. A section
 * heading is never left as the last block of a panel — it is carried over to
 * the next panel instead.
 */
function paginatePanels(chapter, trap, budgets = DEFAULT_BUDGETS, accents = [], artPanels = []) {
    const blocks = flattenChapter(chapter, trap, accents);
    const openerOverhead = Math.max(0, budgets.panel - budgets.opener);
    const total = blocks.reduce((t, b) => t + blockCost(b), 0) + openerOverhead;
    const pageCount = Math.max(1, Math.ceil(total / budgets.panel));
    const target = total / pageCount;
    const panels = [];
    let cur = [];
    let used = openerOverhead; // panel 0 is pre-charged with the opener header
    for (const block of blocks) {
        const cost = blockCost(block);
        const overshoot = used + cost - target;
        const undershoot = target - used;
        if (cur.length > 0 && overshoot > 0 && overshoot > undershoot) {
            const lastIsHeading = cur[cur.length - 1].kind === "heading";
            if (lastIsHeading && cur.length === 1) {
                // The panel holds only a heading and the next block alone exceeds the
                // target: keep them together (small overflow) rather than orphan it.
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
    // Art plates (art-map.json `panels`) close the document, one full page
    // each — like the plates section of a printed field guide.
    for (const p of artPanels) {
        panels.push([{ kind: "panel", src: p.src, caption: p.caption ?? null }]);
    }
    return panels;
}
// ---------------------------------------------------------------------------
// Memoized pagination. Chapter JSON objects are cached per session
// (useContent), so a WeakMap keyed on the chapter object plus a small string
// key for (budgets, trap, accents) gives one packing per (doc, viewport mode,
// reading mode) — page turns and remounts reuse the same panel arrays.
// ---------------------------------------------------------------------------
const panelCache = new WeakMap();
function paginatePanelsCached(chapter, trap, budgets = DEFAULT_BUDGETS, accents = [], artPanels = []) {
    let inner = panelCache.get(chapter);
    if (!inner) {
        inner = new Map();
        panelCache.set(chapter, inner);
    }
    const key = `${budgets.panel}|${budgets.opener}|${trap ? trap.trapTitle : ""}|${accents.join(",")}|${artPanels
        .map((p) => p.src)
        .join(",")}`;
    const hit = inner.get(key);
    if (hit)
        return hit;
    const panels = paginatePanels(chapter, trap, budgets, accents, artPanels);
    inner.set(key, panels);
    return panels;
}
/**
 * Desktop pairing: pack panels (with the given budgets), then pair them into
 * two-page spreads, padding with an empty right page when the count is odd.
 */
function paginateChapter(chapter, trap, budgets = DEFAULT_BUDGETS, accents = [], artPanels = []) {
    const panels = paginatePanels(chapter, trap, budgets, accents, artPanels).slice();
    if (panels.length % 2 === 1)
        panels.push([]);
    const spreads = [];
    for (let i = 0; i < panels.length; i += 2) {
        spreads.push({ left: panels[i], right: panels[i + 1] });
    }
    return spreads;
}
// ---------------------------------------------------------------------------
// Per-chapter reading-position persistence. Positions are stored as a PANEL
// index (stable packing order across modes; desktop derives the spread).
// Saved indices are clamped to the current panel count on load, so the
// reader recovers gracefully if the pagination changes between visits.
// Legacy goblin-spread-ch{n} keys (spread indices) are migrated on read.
// ---------------------------------------------------------------------------
/** Sentinel meaning "open the chapter at its last panel" (clamped on load). */
exports.LAST_PANEL = 1000000;
const panelKey = (chapter) => `goblin-panel-ch${chapter}`;
const legacyKey = (chapter) => `goblin-spread-ch${chapter}`;
function getSavedPanel(chapter) {
    try {
        const raw = localStorage.getItem(panelKey(chapter));
        if (raw != null) {
            const v = parseInt(raw, 10);
            return Number.isFinite(v) && v >= 0 ? v : 0;
        }
        // Migrate the pre-responsive store: one spread = two panels.
        const legacy = localStorage.getItem(legacyKey(chapter));
        if (legacy != null) {
            const v = parseInt(legacy, 10);
            return Number.isFinite(v) && v >= 0 ? Math.min(v * 2, exports.LAST_PANEL) : 0;
        }
    }
    catch {
        /* storage unavailable */
    }
    return 0;
}
function savePanel(chapter, index) {
    // NaN/negative guard: never persist an unusable position.
    const safe = Number.isFinite(index) && index >= 0 ? Math.floor(index) : 0;
    try {
        localStorage.setItem(panelKey(chapter), String(safe));
    }
    catch {
        /* storage unavailable — position just won't persist */
    }
}
/**
 * True if any reading position has ever been saved on this device. Used by
 * the "/" route: first-time visitors land on the Front Matter title page;
 * returning readers resume where they left off.
 */
function hasAnySavedPosition() {
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith("goblin-panel-ch") || key.startsWith("goblin-spread-ch")))
                return true;
        }
    }
    catch {
        /* storage unavailable — treat as first visit */
    }
    return false;
}
