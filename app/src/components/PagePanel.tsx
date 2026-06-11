import { AlertTriangle } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { BODY, DISPLAY, MONO, P, RADIUS, UI } from "../theme";
import { GoblinMascot } from "./GoblinMascot";
import { Markdown } from "./Markdown";
import type { Block } from "../pagination";
import type { Chapter, Trap } from "../types";

function SectionHeading({ heading, first }: { heading: string; first: boolean }) {
  const { c } = useTheme();
  const navy = c(...P.navy);
  // Manuscript headings look like "One: What 'learning' actually means".
  const m = heading.match(/^([^:]+):\s*(.*)$/);
  return (
    <h2
      style={{
        fontFamily: DISPLAY,
        fontSize: "17.5px",
        fontWeight: 700,
        color: navy,
        margin: first ? "0 0 11px" : "22px 0 11px",
        lineHeight: 1.25,
      }}
    >
      {m ? (
        <>
          <em style={{ fontWeight: 400 }}>{m[1]}: </em>
          {m[2]}
        </>
      ) : (
        heading
      )}
    </h2>
  );
}

export function GoblinTrapCard({ trap }: { trap: Trap }) {
  const { c } = useTheme();
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
      <AlertTriangle size={15} color={red} strokeWidth={2} style={{ flexShrink: 0, marginTop: "2px" }} />
      <div>
        <div style={{ fontFamily: MONO, fontSize: "9px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: red, marginBottom: "4px" }}>
          Goblin Trap
        </div>
        <div style={{ fontFamily: BODY, fontSize: "13px", fontWeight: 700, fontStyle: "italic", color: c(...P.ink), marginBottom: "5px", lineHeight: 1.45 }}>
          &ldquo;{trap.trapTitle}&rdquo;
        </div>
        <p style={{ fontFamily: BODY, fontSize: "12.5px", lineHeight: 1.6, color: c(...P.body), margin: 0 }}>
          {trap.text}
        </p>
      </div>
    </div>
  );
}

function BlockView({ block, first }: { block: Block; first: boolean }) {
  const { c } = useTheme();
  switch (block.kind) {
    case "heading":
      return <SectionHeading heading={block.heading} first={first} />;
    case "md":
      return <Markdown markdown={block.text} />;
    case "trap":
      return <GoblinTrapCard trap={block.trap} />;
    case "bias":
      return (
        <p
          style={{
            fontFamily: UI,
            fontSize: "11px",
            fontStyle: "italic",
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

/** Chapter-opener header: region + chapter label, display title, mascot. */
function OpenerHeader({ chapter }: { chapter: Chapter }) {
  const { c } = useTheme();
  const [mainTitle, ...subParts] = chapter.title.split(" — ");
  const subtitle = subParts.join(" — ");
  return (
    <>
      <div
        style={{
          fontFamily: MONO,
          fontSize: "9.5px",
          fontWeight: 700,
          letterSpacing: "0.26em",
          textTransform: "uppercase",
          color: c(...P.red),
          marginBottom: "12px",
        }}
      >
        {chapter.region}
        {chapter.number === 0 ? "" : chapter.number === 20 ? " · Appendix" : ` · Chapter ${chapter.number}`}
      </div>
      <h1
        style={{
          fontFamily: DISPLAY,
          fontSize: "27px",
          fontWeight: 900,
          color: c(...P.navy),
          textTransform: "uppercase",
          lineHeight: 1.14,
          margin: "0 0 6px",
          letterSpacing: "0.01em",
        }}
      >
        {mainTitle}
      </h1>
      {subtitle && (
        <div
          style={{
            fontFamily: DISPLAY,
            fontStyle: "italic",
            fontSize: "15px",
            fontWeight: 500,
            color: c(...P.ink),
            lineHeight: 1.35,
            marginBottom: "12px",
          }}
        >
          {subtitle}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "center", margin: "6px 0 14px" }}>
        <GoblinMascot size={160} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "0 0 12px" }}>
        <div style={{ flex: 1, borderTop: `1px solid ${c(...P.border)}` }} />
        <div style={{ fontFamily: MONO, fontSize: "9px", fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", color: c(...P.faint) }}>
          Start Here
        </div>
        <div style={{ flex: 1, borderTop: `1px solid ${c(...P.border)}` }} />
      </div>
    </>
  );
}

/**
 * One page panel of the book spread. Renders a packed list of blocks; the
 * opener variant (spread 0, left page) prefixes the chapter header + mascot.
 * Internal overflow scrolls as a fallback, but the pagination budget should
 * normally keep content within the fixed panel height.
 */
export function PagePanel({
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
  return (
    <div
      style={{
        background: c(...P.pageBg),
        height: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        padding: side === "left" ? "26px 30px 14px 36px" : "26px 36px 14px 30px",
        display: "flex",
        flexDirection: "column",
        transition: "background 0.3s",
      }}
    >
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {opener && <OpenerHeader chapter={chapter} />}
        {blocks.map((block, i) => (
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
