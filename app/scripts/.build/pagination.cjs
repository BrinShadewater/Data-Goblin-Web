"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/pagination.ts
var pagination_exports = {};
__export(pagination_exports, {
  LAST_SPREAD: () => LAST_SPREAD,
  OPENER_BUDGET: () => OPENER_BUDGET,
  PANEL_BUDGET: () => PANEL_BUDGET,
  blockCost: () => blockCost,
  flattenChapter: () => flattenChapter,
  getSavedSpread: () => getSavedSpread,
  paginateChapter: () => paginateChapter,
  saveSpread: () => saveSpread,
  splitBlocks: () => splitBlocks
});
module.exports = __toCommonJS(pagination_exports);
var PANEL_BUDGET = 1800;
var OPENER_BUDGET = 850;
function splitBlocks(markdown) {
  const chunks = markdown.split(/\n[ \t]*\n+/).map((s) => s.trim()).filter((s) => s.length > 0);
  const merged = [];
  const startsAs = (s) => s.startsWith(">") ? "quote" : s.startsWith("|") ? "table" : "text";
  for (const chunk of chunks) {
    const prev = merged[merged.length - 1];
    const kind = startsAs(chunk);
    if (prev !== void 0 && kind !== "text" && startsAs(prev) === kind) {
      merged[merged.length - 1] = `${prev}

${chunk}`;
    } else {
      merged.push(chunk);
    }
  }
  return merged;
}
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
function flattenChapter(chapter, trap) {
  const blocks = [];
  for (const text of splitBlocks(chapter.startHere)) blocks.push({ kind: "md", text });
  chapter.sections.forEach((section, i) => {
    blocks.push({ kind: "heading", heading: section.heading });
    for (const text of splitBlocks(section.markdown)) blocks.push({ kind: "md", text });
    if (i === 0 && trap) blocks.push({ kind: "trap", trap });
  });
  if (chapter.biasLabel) blocks.push({ kind: "bias", text: chapter.biasLabel });
  return blocks;
}
function paginateChapter(chapter, trap) {
  const blocks = flattenChapter(chapter, trap);
  const panels = [];
  let cur = [];
  let used = 0;
  for (const block of blocks) {
    const cost = blockCost(block);
    const budget = panels.length === 0 ? OPENER_BUDGET : PANEL_BUDGET;
    if (cur.length > 0 && used + cost > budget) {
      const lastIsHeading = cur[cur.length - 1].kind === "heading";
      if (lastIsHeading && cur.length === 1) {
      } else {
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
  if (cur.length > 0) panels.push(cur);
  if (panels.length === 0) panels.push([]);
  if (panels.length % 2 === 1) panels.push([]);
  const spreads = [];
  for (let i = 0; i < panels.length; i += 2) {
    spreads.push({ left: panels[i], right: panels[i + 1] });
  }
  return spreads;
}
var LAST_SPREAD = 1e6;
var spreadKey = (chapter) => `goblin-spread-ch${chapter}`;
function getSavedSpread(chapter) {
  try {
    const raw = localStorage.getItem(spreadKey(chapter));
    const v = raw == null ? 0 : parseInt(raw, 10);
    return Number.isFinite(v) && v >= 0 ? v : 0;
  } catch {
    return 0;
  }
}
function saveSpread(chapter, index) {
  try {
    localStorage.setItem(spreadKey(chapter), String(index));
  } catch {
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LAST_SPREAD,
  OPENER_BUDGET,
  PANEL_BUDGET,
  blockCost,
  flattenChapter,
  getSavedSpread,
  paginateChapter,
  saveSpread,
  splitBlocks
});
