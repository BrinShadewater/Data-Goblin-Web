import { memo, useMemo } from "react";
import { useTheme } from "../ThemeContext";
import { useReader } from "../reader";
import { MONO, P } from "../theme";
import { autolinkBlocks } from "../links";
import { glossaryLinkBlocks } from "../glossaryLinks";
import { useLinks, useGlossary } from "../useContent";
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
  const { data: links } = useLinks();
  const { data: glossary } = useGlossary();
  const linkedBlocks = useMemo(() => {
    let b = links && links.length > 0 ? autolinkBlocks(blocks, links) : blocks;
    if (glossary && glossary.length > 0) b = glossaryLinkBlocks(b, glossary);
    return b;
  }, [blocks, links, glossary]);
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
