import { ReactNode, useState } from "react";
import { ArrowRight, CheckSquare, Pencil, Square } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { BODY, MONO, P, RADIUS, UI } from "../theme";
import { GoblinIcon } from "./GoblinMascot";
import { classifySource, computeSuspicion, SourceTag } from "../sources";
import { useLocalStorage } from "../useLocalStorage";
import type { Chapter } from "../types";

function Card({ icon, title, children }: { icon?: ReactNode; title: string; children: ReactNode }) {
  const { c } = useTheme();
  return (
    <div
      style={{
        background: c(...P.cardBg),
        border: `1px solid ${c(...P.borderSoft)}`,
        borderRadius: RADIUS,
        padding: "12px 14px",
        marginBottom: "10px",
        transition: "background 0.3s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "9px" }}>
        {icon}
        <span style={{ fontFamily: MONO, fontSize: "8.5px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: c(...P.green) }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

const TAG_KEYS: Record<SourceTag, { light: string; dark: string }> = {
  "Corporate / self-disclosure": { light: "#9a6510", dark: "#d9a23f" },
  "Government / official": { light: "#1a2e4a", dark: "#7ab4e8" },
  "Academic / peer-reviewed": { light: "#2d5a27", dark: "#74b85e" },
  Journalism: { light: "#7a3e6a", dark: "#c98ab8" },
  "Civil society / advocacy": { light: "#206058", dark: "#5ab8a8" },
  Other: { light: "#7c7460", dark: "#5d6878" },
};

export function RightSidebar({ chapter }: { chapter: Chapter }) {
  const { c } = useTheme();
  const [receiptsOpen, setReceiptsOpen] = useState(false);
  const [note, setNote] = useLocalStorage<string>(`goblin-notes-ch${chapter.number}`, "");
  const [done, setDone] = useLocalStorage<number[]>(`goblin-quests-ch${chapter.number}`, []);

  const green = c(...P.green);
  const muted = c(...P.muted);
  const body = c(...P.body);
  const border = c(...P.borderSoft);

  const suspicion = computeSuspicion(chapter.verifyFlags, chapter.sources);
  const pct = Math.round(suspicion.value * 100);
  const meterColor =
    suspicion.value < 0.15 ? c("#5a8a3a", "#74b85e") : suspicion.value < 0.35 ? c("#b8860b", "#d9a23f") : c("#a8321f", "#e06848");

  const toggleQuest = (i: number) =>
    setDone((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  return (
    <aside
      style={{
        height: "100%",
        overflowY: "auto",
        background: c(...P.panelBgAlt),
        borderLeft: `1px solid ${border}`,
        padding: "12px 12px 24px",
        transition: "background 0.3s",
      }}
    >
      <div style={{ fontFamily: MONO, fontSize: "8.5px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: muted, margin: "2px 2px 10px" }}>
        Field Guide Tools ·{" "}
        {chapter.number === 0 ? "Front Matter" : chapter.number === 20 ? "Appendix" : `Ch. ${chapter.number}`}
      </div>

      {/* Goblin Notes */}
      <Card icon={<Pencil size={13} color={green} />} title="Goblin Notes">
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
            fontSize: "12px",
            lineHeight: 1.55,
            color: body,
            resize: "vertical",
            outline: "none",
          }}
        />
      </Card>

      {/* Suspicion Meter — only meaningful when the document cites sources
          (the front matter and appendix have none, so it is hidden there). */}
      {chapter.sources.length > 0 && (
      <Card icon={<GoblinIcon size={18} />} title="Suspicion Meter">
        <div
          title={`Computed, not random: ½·min(1, openVerifyFlags/4) + ½·(corporate-source share). This chapter: ${suspicion.openFlags} open verification flag${suspicion.openFlags === 1 ? "" : "s"}; ${Math.round(suspicion.corporateShare * 100)}% of ${suspicion.totalSources} sources are corporate self-disclosure.`}
        >
          <div style={{ height: "10px", background: c("#ded6c2", "#1d2230"), borderRadius: "5px", overflow: "hidden", border: `1px solid ${border}` }}>
            <div style={{ width: `${pct}%`, height: "100%", background: meterColor, transition: "width 0.4s" }} />
          </div>
          <div style={{ fontFamily: UI, fontSize: "11px", fontWeight: 700, color: meterColor, margin: "7px 0 4px" }}>
            {suspicion.label} ({pct}%)
          </div>
        </div>
        <p style={{ fontFamily: UI, fontSize: "9.5px", lineHeight: 1.5, color: muted, margin: 0 }}>
          Computed from this chapter&rsquo;s open verification flags ({suspicion.openFlags}) and the share of corporate
          self-disclosure in its {suspicion.totalSources} sources ({Math.round(suspicion.corporateShare * 100)}%). Hover for the formula.
        </p>
      </Card>
      )}

      {/* Quest Items — hidden when the document has no recap (front matter, appendix). */}
      {chapter.recap.length > 0 && (
      <Card icon={<CheckSquare size={13} color={green} />} title="Quest Items">
        <p style={{ fontFamily: UI, fontSize: "9.5px", color: muted, margin: "0 0 8px", lineHeight: 1.45 }}>
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
                gap: "8px",
                alignItems: "flex-start",
                width: "100%",
                background: "none",
                border: "none",
                padding: "4px 0",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {checked ? (
                <CheckSquare size={13} color={green} style={{ flexShrink: 0, marginTop: "2px" }} />
              ) : (
                <Square size={13} color={muted} style={{ flexShrink: 0, marginTop: "2px" }} />
              )}
              <span
                style={{
                  fontFamily: UI,
                  fontSize: "10.5px",
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
      </Card>
      )}

      {/* Show Receipts — hidden when the document cites no sources. */}
      {chapter.sources.length > 0 && (
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
          padding: "8px 13px",
          cursor: "pointer",
          fontFamily: UI,
          fontSize: "9.5px",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: receiptsOpen ? c("#f4f0e0", "#0d1018") : green,
          transition: "all 0.15s",
          marginBottom: receiptsOpen ? "10px" : 0,
        }}
      >
        {receiptsOpen ? "Hide Receipts" : "Show Receipts"}
        <ArrowRight size={11} strokeWidth={2} />
      </button>

      {receiptsOpen && (
        <div style={{ background: c(...P.cardBg), border: `1px solid ${border}`, borderRadius: RADIUS, padding: "10px 12px" }}>
          <div style={{ fontFamily: MONO, fontSize: "8px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: muted, marginBottom: "8px" }}>
            Sources cited in this chapter ({chapter.sources.length})
          </div>
          {chapter.sources.map((s, i) => {
            const tag = classifySource(s);
            const tagColor = c(TAG_KEYS[tag].light, TAG_KEYS[tag].dark);
            return (
              <div key={i} style={{ marginBottom: "8px", paddingBottom: "8px", borderBottom: i < chapter.sources.length - 1 ? `1px solid ${border}` : "none" }}>
                <p style={{ fontFamily: BODY, fontSize: "11px", color: body, margin: "0 0 3px", lineHeight: 1.45 }}>{s}</p>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: "7.5px",
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
      )}
    </aside>
  );
}
