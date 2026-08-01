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
    let b = blocks;
    // Receipts run in BOTH editions. The anchors are verbatim prose phrases, so
    // the French edition loads its own hand-checked set (fr/claim-anchors.json);
    // before that existed the English anchors matched nothing and the receipts
    // apparatus was invisible in French — on the one page whose whole argument
    // is showing its work.
    const anchors = claimAnchors?.[String(chapter.number)];
    if (anchors && anchors.length > 0) b = receiptLinkBlocks(b, anchors);
    // Reference autolinks and glossary tooltips are still keyed on English text
    // and would silently no-op on French content. Their French curation is a
    // separate pass; leaving them off is honest, running them would not help.
    if (lang === "en") {
      if (links && links.length > 0) b = autolinkBlocks(b, links);
      if (glossary && glossary.length > 0) b = glossaryLinkBlocks(b, glossary);
    }
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
