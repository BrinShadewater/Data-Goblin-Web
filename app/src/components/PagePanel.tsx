import { memo, useMemo } from "react";
import { useTheme } from "../ThemeContext";
import { useReader } from "../reader";
import { DISPLAY, MONO, P, RADIUS, TOKENS, UI } from "../theme";
import { GoblinMascot, NavIcon } from "./GoblinMascot";
import { Markdown } from "./Markdown";
import { autolinkBlocks } from "../links";
import { artUrl, useArtMap, useLinks } from "../useContent";
import { displayRegion } from "../regionLabels";
import type { Block } from "../pagination";
import type { Chapter, Trap } from "../types";

/**
 * Art PNGs ship with true alpha, so no blend trickery is needed to remove
 * boxes; "multiply" in light mode beds the colours into the parchment and
 * kills any residual light fringing, while dark mode renders normally at
 * slightly reduced opacity (multiply would sink the art into a dark page).
 */
function artBlendStyle(dark: boolean) {
  return {
    mixBlendMode: dark ? ("normal" as const) : ("multiply" as const),
    opacity: dark ? 0.92 : 1,
  };
}

function SectionHeading({ heading, first, accent }: { heading: string; first: boolean; accent?: string }) {
  const { c, dark } = useTheme();
  const { t, mode } = useReader();
  const navy = c(...P.navy);
  // Manuscript headings look like "One: What 'learning' actually means".
  const m = heading.match(/^([^:]+):\s*(.*)$/);
  const margin = first ? "0 0 12px" : "24px 0 12px";
  const h2 = (
    <h2
      style={{
        fontFamily: DISPLAY,
        fontSize: `${t.section}px`,
        fontWeight: 700,
        color: navy,
        margin: accent ? 0 : margin,
        lineHeight: 1.25,
        minWidth: 0,
        flex: accent ? 1 : undefined,
      }}
    >
      {m ? (
        <>
          <em style={{ fontWeight: 400, fontStyle: t.italicsOff ? "normal" : "italic" }}>{m[1]}: </em>
          {m[2]}
        </>
      ) : (
        heading
      )}
    </h2>
  );
  if (!accent) return h2;
  // Section-break ornament from art-map.json, right-aligned beside the heading.
  const size = mode === "phone" ? 108 : 144;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "14px", margin }}>
      {h2}
      <img
        src={artUrl(accent)}
        alt=""
        aria-hidden
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        style={{ flexShrink: 0, objectFit: "contain", ...artBlendStyle(dark) }}
      />
    </div>
  );
}

export function GoblinTrapCard({ trap }: { trap: Trap }) {
  const { c } = useTheme();
  const { t } = useReader();
  const red = c(...P.red);
  const amber = c(...P.amber);
  return (
    <div
      style={{
        background: c(...P.amberBg),
        border: `1px solid ${c(...P.amberBorder)}`,
        borderLeft: `4px solid ${amber}`,
        borderRadius: RADIUS,
        padding: "12px 15px",
        display: "flex",
        gap: "10px",
        alignItems: "flex-start",
        margin: "14px 0",
      }}
    >
      <span style={{ flexShrink: 0, marginTop: "1px" }}>
        <NavIcon name="alert-nav" size={TOKENS.icon.calloutTrap} />
      </span>
      <div>
        <div style={{ fontFamily: MONO, fontSize: "9px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: red, marginBottom: "4px" }}>
          Goblin Trap
        </div>
        <div
          style={{
            fontFamily: t.bodyFont,
            fontSize: `${t.callout}px`,
            fontWeight: 700,
            fontStyle: t.italicsOff ? "normal" : "italic",
            color: c(...P.ink),
            marginBottom: "5px",
            lineHeight: 1.45,
          }}
        >
          &ldquo;{trap.trapTitle}&rdquo;
        </div>
        <p style={{ fontFamily: t.bodyFont, fontSize: `${t.callout - 0.5}px`, lineHeight: t.bodyLh, letterSpacing: t.letterSpacing, color: c(...P.body), margin: 0 }}>
          {trap.text}
        </p>
      </div>
    </div>
  );
}

/**
 * Near-full-page art plate (art-map.json `panels`). Fills the page panel with
 * the illustration, optional caption beneath — printed-field-guide style.
 * Most plates carry their own painted title, so captions are optional.
 */
function ArtPlate({ src, caption }: { src: string; caption?: string | null }) {
  const { c, dark } = useTheme();
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        padding: "4px 0",
      }}
    >
      <img
        src={artUrl(src)}
        alt={caption ?? "Field guide illustration"}
        decoding="async"
        style={{
          flex: 1,
          minHeight: 0,
          width: "100%",
          objectFit: "contain",
          ...artBlendStyle(dark),
        }}
      />
      {caption && (
        <div
          style={{
            fontFamily: DISPLAY,
            fontStyle: "italic",
            fontSize: "14px",
            fontWeight: 500,
            color: c(...P.ink),
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          {caption}
        </div>
      )}
    </div>
  );
}

function BlockView({ block, first }: { block: Block; first: boolean }) {
  const { c } = useTheme();
  const { t } = useReader();
  switch (block.kind) {
    case "heading":
      return <SectionHeading heading={block.heading} first={first} accent={block.accent} />;
    case "panel":
      return <ArtPlate src={block.src} caption={block.caption} />;
    case "md":
      return <Markdown markdown={block.text} />;
    case "trap":
      return <GoblinTrapCard trap={block.trap} />;
    case "bias":
      return (
        <p
          style={{
            fontFamily: UI,
            fontSize: `${t.small}px`,
            fontStyle: t.italicsOff ? "normal" : "italic",
            lineHeight: 1.6,
            color: c(...P.faint),
            borderTop: `1px solid ${c(...P.borderSoft)}`,
            paddingTop: "12px",
            marginTop: "18px",
          }}
        >
          {block.text}
        </p>
      );
  }
}

/**
 * Chapter-opener header: region + chapter label, display title, mascot.
 * Styled like a confident book title page: full-contrast title ink, generous
 * letter-spacing on the small-caps label, breathing room between label /
 * title / subtitle / rule.
 */
function OpenerHeader({ chapter }: { chapter: Chapter }) {
  const { c, dark } = useTheme();
  const { t, mode } = useReader();
  const { data: artMap } = useArtMap();
  const [mainTitle, ...subParts] = chapter.title.split(" — ");
  const subtitle = subParts.join(" — ");
  // Opener art from art-map.json replaces the mascot placeholder.
  const openerArt = artMap?.docs?.[String(chapter.number)]?.opener ?? null;
  const artHeight = mode === "phone" ? 170 : mode === "tablet" ? 220 : 250;
  return (
    <>
      <div
        style={{
          fontFamily: MONO,
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          color: c(...P.red),
          marginBottom: "18px",
        }}
      >
        {displayRegion(chapter.region)}
        {chapter.number === 0 ? "" : chapter.number === 20 ? " · Appendix" : ` · Chapter ${chapter.number}`}
      </div>
      <h1
        style={{
          fontFamily: DISPLAY,
          fontSize: `${t.openerTitle}px`,
          fontWeight: 900,
          color: c(...P.titleInk),
          textTransform: "uppercase",
          lineHeight: 1.12,
          margin: "0 0 10px",
          letterSpacing: "0.015em",
        }}
      >
        {mainTitle}
      </h1>
      {subtitle && (
        <div
          style={{
            fontFamily: DISPLAY,
            fontStyle: "italic",
            fontSize: `${t.openerSub}px`,
            fontWeight: 500,
            color: c(...P.ink),
            lineHeight: 1.45,
            marginBottom: "18px",
          }}
        >
          {subtitle}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "center", margin: "14px 0 22px", minHeight: chapter.number === 0 || openerArt ? undefined : 0 }}>
        {openerArt ? (
          // Current opener stays eager (it is the page's hero); the fixed
          // height + reserved row prevent layout shift while it decodes.
          <img
            src={artUrl(openerArt)}
            alt=""
            aria-hidden
            height={artHeight}
            decoding="async"
            style={{
              height: `${artHeight}px`,
              width: "auto",
              maxWidth: "86%",
              objectFit: "contain",
              ...artBlendStyle(dark),
            }}
          />
        ) : chapter.number === 0 ? (
          <GoblinMascot size={artHeight} />
        ) : null}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "0 0 16px" }}>
        <div style={{ flex: 1, borderTop: `1px solid ${c(...P.border)}` }} />
        <NavIcon name="trailmarker-nav" size={TOKENS.icon.calloutTrailmarker} />
        <div style={{ fontFamily: MONO, fontSize: "9.5px", fontWeight: 800, letterSpacing: "0.34em", textTransform: "uppercase", color: c(...P.faint) }}>
          Start Here
        </div>
        <div style={{ flex: 1, borderTop: `1px solid ${c(...P.border)}` }} />
      </div>
    </>
  );
}

/**
 * One page panel of the book. Renders a packed list of blocks; the opener
 * variant (panel 0) prefixes the chapter header + mascot. Internal overflow
 * scrolls as a fallback, but the pagination budget should normally keep
 * content within the fixed panel height.
 *
 * Memoized: panels receive stable block arrays from the pagination cache, so
 * unrelated reader re-renders (search box, tool sheets) skip both panels.
 */
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
  /** Preformatted page label: "7" for chapters, "iv" for front matter, "A-3" for the appendix. */
  folio: string;
  opener?: boolean;
}) {
  const { c } = useTheme();
  const { mode } = useReader();
  const { data: links } = useLinks();
  // Curated body autolinks: first verbatim mention per page of a long
  // references-list name becomes a quietly-styled link (rules in links.ts).
  const linkedBlocks = useMemo(
    () => (links && links.length > 0 ? autolinkBlocks(blocks, links) : blocks),
    [blocks, links]
  );
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
