import { useTheme } from "../ThemeContext";
import { useReader } from "../reader";
import { DISPLAY, MONO, P, RADIUS, TOKENS, UI } from "../theme";
import { GoblinMascot, NavIcon } from "./GoblinMascot";
import { Markdown } from "./Markdown";
import { artSrcSet, artUrl, useArtMap } from "../useContent";
import { displayRegion } from "../regionLabels";
import type { Block } from "../pagination";
import type { Chapter, Trap } from "../types";

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

function GoblinTrapCard({ trap }: { trap: Trap }) {
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
        srcSet={artSrcSet(src)}
        sizes="(max-width: 760px) 92vw, 42vw"
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

export function BlockView({ block, first }: { block: Block; first: boolean }) {
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

export function OpenerHeader({ chapter }: { chapter: Chapter }) {
  const { c, dark } = useTheme();
  const { t, mode } = useReader();
  const { data: artMap } = useArtMap();
  const [mainTitle, ...subParts] = chapter.title.split(" — ");
  const subtitle = subParts.join(" — ");
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
          <img
            src={artUrl(openerArt)}
            srcSet={artSrcSet(openerArt)}
            sizes="(max-width: 760px) 70vw, 250px"
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
