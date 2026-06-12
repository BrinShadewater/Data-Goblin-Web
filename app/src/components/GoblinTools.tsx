import { useState } from "react";
import { ArrowRight, Check, CheckSquare, Copy, Square, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { BODY, MONO, P, RADIUS, TOKENS, UI } from "../theme";
import { classifySource, computeSuspicion, TAG_COLORS } from "../sources";
import { matchSource } from "../links";
import { useLinks } from "../useContent";
import { useLocalStorage } from "../useLocalStorage";
import { removeBookmark, saveLastLocation, useBookmarks } from "../bookmarks";
import { savePanel } from "../pagination";
import type { Chapter } from "../types";
import { NavIcon } from "./GoblinMascot";
import { ToolCard } from "./ToolCard";

export function BookmarksCard() {
  const { c } = useTheme();
  const navigate = useNavigate();
  const bookmarks = useBookmarks();
  const navy = c(...P.navy);
  const muted = c(...P.muted);
  const body = c(...P.body);
  const border = c(...P.borderSoft);

  return (
    <ToolCard icon={<NavIcon name="journal-nav" size={TOKENS.icon.sidebarTool} />} title="Bookmarks" storageKey="bookmarks">
      {bookmarks.length === 0 ? (
        <p style={{ fontFamily: UI, fontSize: "12px", color: muted, margin: 0, lineHeight: 1.5 }}>
          No bookmarks yet. Tap the 🔖 in the page bar to save your place.
        </p>
      ) : (
        bookmarks.map((bm) => (
          <div
            key={`${bm.doc}-${bm.panelIndex}-${bm.ts}`}
            style={{ display: "flex", gap: "6px", alignItems: "flex-start", padding: "5px 0", borderBottom: `1px solid ${border}` }}
          >
            <button
              onClick={() => {
                savePanel(bm.doc, bm.panelIndex);
                saveLastLocation(bm.doc, bm.panelIndex);
                navigate(`/chapter/${bm.doc}`);
              }}
              style={{ flex: 1, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", minWidth: 0 }}
            >
              <div style={{ fontFamily: UI, fontSize: "12px", fontWeight: 700, color: navy, marginBottom: "2px" }}>
                {bm.chapterTitle}
              </div>
              <div style={{ fontFamily: BODY, fontSize: "12px", color: body, lineHeight: 1.4, overflow: "hidden" }}>
                {bm.snippet}
              </div>
            </button>
            <button
              onClick={() => removeBookmark(bm.doc, bm.panelIndex)}
              aria-label="Remove bookmark"
              style={{ background: "none", border: "none", padding: "2px", cursor: "pointer", color: muted, flexShrink: 0 }}
            >
              <X size={15} />
            </button>
          </div>
        ))
      )}
    </ToolCard>
  );
}

function NotesCard({ chapterNumber }: { chapterNumber: number }) {
  const { c } = useTheme();
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useLocalStorage<string>(`goblin-notes-ch${chapterNumber}`, "");
  const green = c(...P.green);
  const muted = c(...P.muted);
  const body = c(...P.body);
  const border = c(...P.borderSoft);

  return (
    <ToolCard icon={<NavIcon name="note-nav" size={TOKENS.icon.sidebarTool} />} title="Goblin Notes" storageKey="notes">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Short observations from a curious goblin… (saved on this device)"
        rows={4}
        style={{
          width: "100%",
          background: c(...P.inputBg),
          border: `1px solid ${border}`,
          borderRadius: RADIUS,
          padding: "8px 10px",
          fontFamily: BODY,
          fontSize: "14px",
          lineHeight: 1.55,
          color: body,
          resize: "vertical",
          outline: "none",
        }}
      />
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(note);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1400);
          } catch {
            setCopied(false);
          }
        }}
        disabled={note.trim().length === 0}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "7px",
          marginTop: "9px",
          background: "transparent",
          border: `1px solid ${border}`,
          borderRadius: RADIUS,
          color: note.trim().length === 0 ? muted : green,
          cursor: note.trim().length === 0 ? "not-allowed" : "pointer",
          fontFamily: UI,
          fontSize: "11px",
          fontWeight: 800,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          padding: "8px 10px",
          opacity: note.trim().length === 0 ? 0.55 : 1,
        }}
      >
        {copied ? <Check size={15} /> : <Copy size={15} />}
        {copied ? "Copied" : "Copy Text"}
      </button>
    </ToolCard>
  );
}

function SuspicionMeterCard({ chapter }: { chapter: Chapter }) {
  const { c } = useTheme();
  const border = c(...P.borderSoft);
  const muted = c(...P.muted);
  const suspicion = computeSuspicion(chapter.verifyFlags, chapter.sources);
  const pct = Math.round(suspicion.value * 100);
  const meterColor =
    suspicion.value < 0.15 ? c("#5a8a3a", "#74b85e") : suspicion.value < 0.35 ? c("#b8860b", "#d9a23f") : c("#a8321f", "#e06848");

  if (chapter.sources.length === 0) return null;

  return (
    <ToolCard icon={<NavIcon name="insight-nav" size={TOKENS.icon.sidebarTool} />} title="Suspicion Meter">
      <div
        title={`Computed, not random: ½·min(1, openVerifyFlags/4) + ½·(corporate-source share). This chapter: ${suspicion.openFlags} open verification flag${suspicion.openFlags === 1 ? "" : "s"}; ${Math.round(suspicion.corporateShare * 100)}% of ${suspicion.totalSources} sources are corporate self-disclosure.`}
      >
        <div style={{ height: "10px", background: c("#ded6c2", "#1d2230"), borderRadius: "5px", overflow: "hidden", border: `1px solid ${border}` }}>
          <div style={{ width: `${pct}%`, height: "100%", background: meterColor, transition: "width 0.4s" }} />
        </div>
        <div style={{ fontFamily: UI, fontSize: "12.5px", fontWeight: TOKENS.weight.toolLabel, color: meterColor, margin: "7px 0 4px" }}>
          {suspicion.label} ({pct}%)
        </div>
      </div>
      <p style={{ fontFamily: UI, fontSize: "11px", lineHeight: 1.5, color: muted, margin: 0 }}>
        Computed from this chapter&rsquo;s open verification flags ({suspicion.openFlags}) and the share of corporate
        self-disclosure in its {suspicion.totalSources} sources ({Math.round(suspicion.corporateShare * 100)}%). Hover for the formula.
      </p>
    </ToolCard>
  );
}

function QuestItemsCard({ chapter }: { chapter: Chapter }) {
  const { c } = useTheme();
  const [done, setDone] = useLocalStorage<number[]>(`goblin-quests-ch${chapter.number}`, []);
  const green = c(...P.green);
  const muted = c(...P.muted);
  const body = c(...P.body);

  if (chapter.recap.length === 0) return null;

  const toggleQuest = (i: number) =>
    setDone((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  return (
    <ToolCard icon={<NavIcon name="key-takeaways-nav" size={TOKENS.icon.sidebarTool} />} title="Quest Items" storageKey="quests" defaultOpen>
      <p style={{ fontFamily: UI, fontSize: "11px", color: muted, margin: "0 0 8px", lineHeight: 1.45 }}>
        What you should carry out of this chapter. Check items off as you collect them.
      </p>
      {chapter.recap.map((item, i) => {
        const checked = done.includes(i);
        return (
          <button
            key={i}
            onClick={() => toggleQuest(i)}
            style={{
              display: "flex",
              gap: "9px",
              alignItems: "flex-start",
              width: "100%",
              background: "none",
              border: "none",
              padding: "6px 0",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            {checked ? (
              <CheckSquare size={16} color={green} style={{ flexShrink: 0, marginTop: "2px" }} />
            ) : (
              <Square size={16} color={muted} style={{ flexShrink: 0, marginTop: "2px" }} />
            )}
            <span
              style={{
                fontFamily: UI,
                fontSize: "12.5px",
                lineHeight: 1.45,
                color: checked ? muted : body,
                textDecoration: checked ? "line-through" : "none",
              }}
            >
              {item}
            </span>
          </button>
        );
      })}
    </ToolCard>
  );
}

function ChapterReceiptsCard({ chapter }: { chapter: Chapter }) {
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
            Sources cited in this chapter ({chapter.sources.length})
          </div>
          {chapter.sources.map((s, i) => {
            const tag = classifySource(s);
            const tagColor = c(TAG_COLORS[tag].light, TAG_COLORS[tag].dark);
            const link = links ? matchSource(s, links) : null;
            return (
              <div key={i} style={{ marginBottom: "8px", paddingBottom: "8px", borderBottom: i < chapter.sources.length - 1 ? `1px solid ${border}` : "none" }}>
                <p style={{ fontFamily: BODY, fontSize: "12px", color: body, margin: "0 0 3px", lineHeight: 1.45 }}>
                  {link ? (
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="gob-link" style={{ color: c(...P.navy) }}>
                      {s}
                    </a>
                  ) : (
                    s
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

export function GoblinTools({ chapter, showBookmarks = false }: { chapter: Chapter; showBookmarks?: boolean }) {
  return (
    <>
      <NotesCard chapterNumber={chapter.number} />
      <SuspicionMeterCard chapter={chapter} />
      <QuestItemsCard chapter={chapter} />
      {showBookmarks && <BookmarksCard />}
      <ChapterReceiptsCard chapter={chapter} />
    </>
  );
}
