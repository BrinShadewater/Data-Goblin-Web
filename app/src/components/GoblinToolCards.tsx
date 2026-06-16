import { useState } from "react";
import { Check, CheckSquare, Copy, Square } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { BODY, P, RADIUS, TOKENS, UI } from "../theme";
import { computeSuspicion } from "../sources";
import { useLocalStorage } from "../useLocalStorage";
import type { Chapter } from "../types";
import { NavIcon } from "./GoblinMascot";
import { ToolCard } from "./ToolCard";
import { tr } from "../i18n";

export function NotesCard({ chapterNumber }: { chapterNumber: number }) {
  const { c } = useTheme();
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useLocalStorage<string>(`goblin-notes-ch${chapterNumber}`, "");
  const green = c(...P.green);
  const muted = c(...P.muted);
  const body = c(...P.body);
  const border = c(...P.borderSoft);

  return (
    <ToolCard icon={<NavIcon name="note-nav" size={TOKENS.icon.sidebarTool} />} title={tr("Goblin Notes")} storageKey="notes">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={tr("Short observations from a curious goblin… (saved on this device)")}
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
        {copied ? tr("Copied") : tr("Copy Text")}
      </button>
    </ToolCard>
  );
}

export function SuspicionMeterCard({ chapter }: { chapter: Chapter }) {
  const { c } = useTheme();
  const border = c(...P.borderSoft);
  const muted = c(...P.muted);
  const suspicion = computeSuspicion(chapter.verifyFlags, chapter.sources);
  const pct = Math.round(suspicion.value * 100);
  const meterColor =
    suspicion.value < 0.15 ? c("#5a8a3a", "#74b85e") : suspicion.value < 0.35 ? c("#b8860b", "#d9a23f") : c("#a8321f", "#e06848");

  if (chapter.sources.length === 0) return null;

  return (
    <ToolCard icon={<NavIcon name="insight-nav" size={TOKENS.icon.sidebarTool} />} title={tr("Suspicion Meter")}>
      <div
        title={`Computed, not random: min(1, corporate-source share + 0.4·min(1, openVerifyFlags/4)). This chapter: ${suspicion.openFlags} open verification flag${suspicion.openFlags === 1 ? "" : "s"}; ${Math.round(suspicion.corporateShare * 100)}% of ${suspicion.totalSources} sources are corporate self-disclosure.`}
      >
        <div style={{ height: "10px", background: c("#ded6c2", "#1d2230"), borderRadius: "5px", overflow: "hidden", border: `1px solid ${border}` }}>
          <div style={{ width: `${pct}%`, height: "100%", background: meterColor, transition: "width 0.4s" }} />
        </div>
        <div style={{ fontFamily: UI, fontSize: "12.5px", fontWeight: TOKENS.weight.toolLabel, color: meterColor, margin: "7px 0 4px" }}>
          {tr(suspicion.label)} ({pct}%)
        </div>
      </div>
      <p style={{ fontFamily: UI, fontSize: "11px", lineHeight: 1.5, color: muted, margin: 0 }}>
        {tr("Computed from this chapter’s open verification flags (")}{suspicion.openFlags}{tr(") and the share of corporate self-disclosure in its")} {suspicion.totalSources} {tr("sources (")}{Math.round(suspicion.corporateShare * 100)}{tr("%). Hover for the formula.")}
      </p>
    </ToolCard>
  );
}

export function QuestItemsCard({ chapter }: { chapter: Chapter }) {
  const { c } = useTheme();
  const [done, setDone] = useLocalStorage<number[]>(`goblin-quests-ch${chapter.number}`, []);
  const green = c(...P.green);
  const muted = c(...P.muted);
  const body = c(...P.body);

  if (chapter.recap.length === 0) return null;

  const toggleQuest = (i: number) =>
    setDone((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  return (
    <ToolCard icon={<NavIcon name="key-takeaways-nav" size={TOKENS.icon.sidebarTool} />} title={tr("Quest Items")} storageKey="quests" defaultOpen>
      <p style={{ fontFamily: UI, fontSize: "11px", color: muted, margin: "0 0 8px", lineHeight: 1.45 }}>
        {tr("What you should carry out of this chapter. Check items off as you collect them.")}
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
