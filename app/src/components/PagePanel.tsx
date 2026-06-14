import { memo, useMemo } from "react";
import { useTheme } from "../ThemeContext";
import { useLanguage } from "../LanguageContext";
import { useReader } from "../reader";
import { MONO, P } from "../theme";
import { autolinkBlocks } from "../links";
import { glossaryLinkBlocks } from "../glossaryLinks";
import { receiptLinkBlocks } from "../receiptLinks";
import { useLinks, useGlossary, useClaimAnchors } from "../useContent";
import type { Block } from "../pagination";
import type { Chapter } from "../types";
import { BlockView, OpenerHeader } from "./PagePanelContent";

export const PagePanel = memo(PagePanelInner);

function PagePanelInner({
  chapter,
  blocks,
  side,
  folio,
  opener = false,
}: {
  chapter: Chapter;
  blocks: Block[];
  side: "left" | "right";
  folio: string;
  opener?: boolean;
}) {
  const { c } = useTheme();
  const { mode } = useReader();
  const { lang } = useLanguage();
  const { data: links } = useLinks();
  const { data: glossary } = useGlossary();
  const { data: claimAnchors } = useClaimAnchors();
  const linkedBlocks = useMemo(() => {
    // The inline auto-linkers (receipts, reference links, glossary tooltips)
    // are keyed on English text and would silently no-op on French content, so
    // they only run for the English edition. (FR re-curation is a future pass.)
    if (lang !== "en") return blocks;
    let b = blocks;
    const anchors = claimAnchors?.[String(chapter.number)];
    if (anchors && anchors.length > 0) b = receiptLinkBlocks(b, anchors);
    if (links && links.length > 0) b = autolinkBlocks(b, links);
    if (glossary && glossary.length > 0) b = glossaryLinkBlocks(b, glossary);
    return b;
  }, [blocks, links, glossary, claimAnchors, chapter.number, lang]);
  const padding =
    mode === "phone"
      ? "20px 18px 10px"
      : mode === "tablet"
        ? "26px 32px 12px"
        : side === "left"
          ? "26px 30px 14px 36px"
          : "26px 36px 14px 30px";

  return (
    <div
      style={{
        background: c(...P.pageBg),
        height: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        padding,
        display: "flex",
        flexDirection: "column",
        transition: "background 0.3s",
      }}
    >
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        {opener && <OpenerHeader chapter={chapter} />}
        {linkedBlocks.map((block, i) => (
          <BlockView key={i} block={block} first={!opener && i === 0} />
        ))}
      </div>
      <div
        style={{
          paddingTop: "10px",
          textAlign: "center",
          fontFamily: MONO,
          fontSize: "10px",
          color: c(...P.faint),
          letterSpacing: "0.14em",
          flexShrink: 0,
        }}
      >
        — {folio} —
      </div>
    </div>
  );
}
