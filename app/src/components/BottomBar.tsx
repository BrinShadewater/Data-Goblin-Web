import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { P, UI } from "../theme";
import type { Book } from "../types";

export function BottomBar({ book, activeChapter }: { book: Book | null; activeChapter: number }) {
  const { c } = useTheme();
  const navigate = useNavigate();

  const allChapters = book ? book.parts.flatMap((p) => p.chapters) : [];
  const totalChapters = allChapters.length || 19;
  const titleOf = (n: number) => allChapters.find((ch) => ch.number === n)?.title.split(" — ")[0] ?? "";

  const canPrev = activeChapter > 1;
  const canNext = activeChapter < totalChapters;
  const green = c(...P.green);
  const muted = c(...P.faint);
  const bg = c(...P.panelBgAlt);
  const border = c(...P.borderSoft);

  return (
    <div
      style={{
        background: bg,
        borderTop: `1px solid ${border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        height: "48px",
        flexShrink: 0,
        zIndex: 40,
        boxShadow: c("0 -1px 4px rgba(0,0,0,0.04)", "0 -1px 8px rgba(0,0,0,0.2)"),
        transition: "background 0.3s",
      }}
    >
      <button
        onClick={() => canPrev && navigate(`/chapter/${activeChapter - 1}`)}
        disabled={!canPrev}
        style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: canPrev ? "pointer" : "not-allowed", opacity: canPrev ? 1 : 0.3, padding: 0 }}
      >
        <ChevronLeft size={15} color={green} strokeWidth={2} />
        <div style={{ textAlign: "left" }}>
          <div style={{ fontFamily: UI, fontSize: "7.5px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: muted, lineHeight: 1, marginBottom: "2px" }}>
            &larr; Previous Chapter
          </div>
          {canPrev && (
            <div style={{ fontFamily: UI, fontSize: "10.5px", color: green, fontWeight: 500 }}>
              {activeChapter - 1}. {titleOf(activeChapter - 1)}
            </div>
          )}
        </div>
      </button>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
        <div style={{ fontFamily: UI, fontSize: "7.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: muted }}>
          Your Progress Through the Guide
        </div>
        <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
          {Array.from({ length: totalChapters }, (_, i) => {
            const ch = i + 1;
            const isActive = ch === activeChapter;
            const isDone = ch < activeChapter;
            return (
              <button
                key={ch}
                onClick={() => navigate(`/chapter/${ch}`)}
                title={`${ch}. ${titleOf(ch)}`}
                style={{
                  width: isActive ? "10px" : "7px",
                  height: isActive ? "10px" : "7px",
                  borderRadius: "50%",
                  background: isActive ? green : isDone ? c("#7a9a58", "#4a7a5a") : c("#bcb29a", "#2a3040"),
                  border: isActive ? `2px solid ${c("#94b87e", "#3a6047")}` : "none",
                  transition: "all 0.2s",
                  flexShrink: 0,
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            );
          })}
        </div>
      </div>

      <button
        onClick={() => canNext && navigate(`/chapter/${activeChapter + 1}`)}
        disabled={!canNext}
        style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: canNext ? "pointer" : "not-allowed", opacity: canNext ? 1 : 0.3, padding: 0, textAlign: "right" }}
      >
        <div>
          <div style={{ fontFamily: UI, fontSize: "7.5px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: muted, lineHeight: 1, marginBottom: "2px" }}>
            Next Chapter &rarr;
          </div>
          {canNext && (
            <div style={{ fontFamily: UI, fontSize: "10.5px", color: green, fontWeight: 500 }}>
              {activeChapter + 1}. {titleOf(activeChapter + 1)}
            </div>
          )}
        </div>
        <ChevronRight size={15} color={green} strokeWidth={2} />
      </button>
    </div>
  );
}
