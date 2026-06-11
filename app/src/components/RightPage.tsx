import { Fragment } from "react";
import { AlertTriangle } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { BODY, DISPLAY, MONO, P, RADIUS, UI } from "../theme";
import { Markdown } from "./Markdown";
import type { Chapter, Trap } from "../types";

function SectionHeading({ heading }: { heading: string }) {
  const { c } = useTheme();
  const navy = c(...P.navy);
  // Manuscript headings look like "One: What 'learning' actually means".
  const m = heading.match(/^([^:]+):\s*(.*)$/);
  return (
    <h2 style={{ fontFamily: DISPLAY, fontSize: "17.5px", fontWeight: 700, color: navy, margin: "22px 0 11px", lineHeight: 1.25 }}>
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

/**
 * Right page of the spread: every chapter section rendered as markdown
 * (Goblin Check blockquotes become green callouts, the recap blockquote a
 * recap box), the chapter's Goblin Trap after the first section, and the
 * bias label in small italic at the end.
 */
export function RightPage({ chapter, trap }: { chapter: Chapter; trap: Trap | null }) {
  const { c } = useTheme();
  const pageBg = c(...P.pageBg);
  const muted = c(...P.faint);

  return (
    <div
      style={{
        background: pageBg,
        width: "100%",
        minHeight: "100%",
        padding: "30px 34px 22px 30px",
        display: "flex",
        flexDirection: "column",
        transition: "background 0.3s",
      }}
    >
      <div style={{ flex: 1 }}>
        {chapter.sections.map((section, i) => (
          <Fragment key={i}>
            <SectionHeading heading={section.heading} />
            <Markdown markdown={section.markdown} />
            {i === 0 && trap && <GoblinTrapCard trap={trap} />}
          </Fragment>
        ))}

        {chapter.biasLabel && (
          <p
            style={{
              fontFamily: UI,
              fontSize: "11px",
              fontStyle: "italic",
              lineHeight: 1.6,
              color: muted,
              borderTop: `1px solid ${c(...P.borderSoft)}`,
              paddingTop: "12px",
              marginTop: "22px",
            }}
          >
            {chapter.biasLabel}
          </p>
        )}
      </div>

      <div
        style={{
          marginTop: "16px",
          paddingTop: "10px",
          textAlign: "center",
          fontFamily: MONO,
          fontSize: "10px",
          color: muted,
          letterSpacing: "0.14em",
        }}
      >
        — {chapter.number * 2} —
      </div>
    </div>
  );
}
