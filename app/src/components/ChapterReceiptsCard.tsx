import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { BODY, MONO, P, RADIUS, UI } from "../theme";
import { matchSource } from "../links";
import { classifySource, TAG_COLORS } from "../sources";
import { useLinks } from "../useContent";
import type { Chapter } from "../types";
import { tr } from "../i18n";

export function ChapterReceiptsCard({ chapter }: { chapter: Chapter }) {
  const { c } = useTheme();
  const [receiptsOpen, setReceiptsOpen] = useState(false);
  const { data: links } = useLinks();
  const green = c(...P.green);
  const muted = c(...P.muted);
  const body = c(...P.body);
  const border = c(...P.borderSoft);

  if (chapter.sources.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setReceiptsOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "7px",
          width: "100%",
          background: receiptsOpen ? green : "transparent",
          border: `1.5px solid ${green}`,
          borderRadius: RADIUS,
          padding: "10px 13px",
          cursor: "pointer",
          fontFamily: UI,
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: receiptsOpen ? c("#f4f0e0", "#0d1018") : green,
          transition: "all 0.15s",
          marginBottom: receiptsOpen ? "10px" : 0,
        }}
      >
        {receiptsOpen ? "Hide Receipts" : "Show Receipts"}
        <ArrowRight size={14} strokeWidth={2} />
      </button>

      {receiptsOpen && (
        <div style={{ background: c(...P.cardBg), border: `1px solid ${border}`, borderRadius: RADIUS, padding: "10px 12px" }}>
          <div style={{ fontFamily: MONO, fontSize: "9px", fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: muted, marginBottom: "8px" }}>
            {tr("Sources cited in this chapter (")}{chapter.sources.length})
          </div>
          {chapter.sources.map((source, i) => {
            const tag = classifySource(source);
            const tagColor = c(TAG_COLORS[tag].light, TAG_COLORS[tag].dark);
            const link = links ? matchSource(source, links) : null;
            return (
              <div key={i} style={{ marginBottom: "8px", paddingBottom: "8px", borderBottom: i < chapter.sources.length - 1 ? `1px solid ${border}` : "none" }}>
                <p style={{ fontFamily: BODY, fontSize: "12px", color: body, margin: "0 0 3px", lineHeight: 1.45 }}>
                  {link ? (
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="gob-link" style={{ color: c(...P.navy) }}>
                      {source}
                    </a>
                  ) : (
                    source
                  )}
                </p>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: "8.5px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: tagColor,
                    border: `1px solid ${tagColor}55`,
                    borderRadius: RADIUS,
                    padding: "1px 5px",
                  }}
                >
                  {tag}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
