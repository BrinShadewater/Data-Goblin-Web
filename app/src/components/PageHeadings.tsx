import { useTheme } from "../ThemeContext";
import { useReader } from "../reader";
import { DISPLAY, MONO, P, TOKENS } from "../theme";
import { displayRegion } from "../regionLabels";
import { artDimensions, artSrcSet, artUrl, useArtMap } from "../useContent";
import type { Chapter } from "../types";
import { chapterWordCount, readingMinutes } from "../readingText";
import { GoblinMascot, NavIcon } from "./GoblinMascot";
import { artBlendStyle } from "./PageArt";


export function SectionHeading({ heading, first, accent }: { heading: string; first: boolean; accent?: string }) {
  const { c, dark } = useTheme();
  const { t, mode } = useReader();
  const navy = c(...P.navy);
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

export function OpenerHeader({ chapter }: { chapter: Chapter }) {
  const { c, dark } = useTheme();
  const { t, mode } = useReader();
  const { data: artMap } = useArtMap();
  const [mainTitle, ...subParts] = chapter.title.split(" — ");
  const subtitle = subParts.join(" — ");
  const openerArt = artMap?.docs?.[String(chapter.number)]?.opener ?? null;
  const readMins = readingMinutes(chapterWordCount(chapter));
  const openerDimensions = openerArt ? artDimensions(openerArt) : undefined;
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
        {readMins ? ` · ${readMins} min read` : ""}
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
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: chapter.number === 0 ? "8px" : 0, margin: "14px 0 22px", minHeight: chapter.number === 0 || openerArt ? undefined : 0 }}>
        {openerArt ? (
          <img
            src={artUrl(openerArt)}
            srcSet={artSrcSet(openerArt)}
            sizes="(max-width: 760px) 70vw, 250px"
            width={openerDimensions?.width}
            height={openerDimensions?.height ?? artHeight}
            alt=""
            aria-hidden
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
