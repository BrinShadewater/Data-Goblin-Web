import { useTheme } from "../ThemeContext";
import { BODY, DISPLAY, MONO, P } from "../theme";
import { GoblinMascot } from "./GoblinMascot";
import { GoblinCheckCard, Markdown } from "./Markdown";
import type { Chapter } from "../types";

/**
 * Left page of the book spread: region + chapter label, display title,
 * mascot, the "Start Here" orientation section, and the chapter's first
 * Goblin Check as the Goblin Note callout.
 */
export function LeftPage({ chapter }: { chapter: Chapter }) {
  const { c } = useTheme();
  const pageBg = c(...P.pageBg);
  const ink = c(...P.ink);
  const red = c(...P.red);
  const muted = c(...P.faint);

  const [mainTitle, ...subParts] = chapter.title.split(" — ");
  const subtitle = subParts.join(" — ");
  const firstCheck = chapter.goblinChecks[0];
  // Strip the "**🧌 GOBLIN CHECK** — " prefix for the note card; the card
  // supplies its own label.
  const noteMarkdown = firstCheck
    ? firstCheck.markdown.replace(/\*\*🧌 GOBLIN CHECK\*\*\s*—?\s*/, "")
    : null;

  return (
    <div
      style={{
        background: pageBg,
        width: "100%",
        minHeight: "100%",
        padding: "30px 30px 22px 34px",
        display: "flex",
        flexDirection: "column",
        transition: "background 0.3s",
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: "9.5px",
          fontWeight: 700,
          letterSpacing: "0.26em",
          textTransform: "uppercase",
          color: red,
          marginBottom: "14px",
        }}
      >
        {chapter.region} · Chapter {chapter.number}
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
            color: ink,
            lineHeight: 1.35,
            marginBottom: "16px",
          }}
        >
          {subtitle}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center", margin: "8px 0 18px" }}>
        <GoblinMascot size={190} />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          margin: "0 0 12px",
        }}
      >
        <div style={{ flex: 1, borderTop: `1px solid ${c(...P.border)}` }} />
        <div style={{ fontFamily: MONO, fontSize: "9px", fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", color: muted }}>
          Start Here
        </div>
        <div style={{ flex: 1, borderTop: `1px solid ${c(...P.border)}` }} />
      </div>

      <Markdown markdown={chapter.startHere} />

      {noteMarkdown && (
        <div style={{ marginTop: "4px" }}>
          <GoblinCheckCard>
            <Markdown markdown={noteMarkdown} style={{ fontFamily: BODY }} />
          </GoblinCheckCard>
        </div>
      )}

      <div
        style={{
          marginTop: "auto",
          paddingTop: "14px",
          textAlign: "center",
          fontFamily: MONO,
          fontSize: "10px",
          color: muted,
          letterSpacing: "0.14em",
        }}
      >
        — {chapter.number * 2 - 1} —
      </div>
    </div>
  );
}
