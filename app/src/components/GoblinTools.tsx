import { Pause, Play, Square, Volume2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { BODY, P, TOKENS, UI } from "../theme";
import { removeBookmark, saveLastLocation, useBookmarks } from "../bookmarks";
import { savePanel } from "../pagination";
import type { Chapter } from "../types";
import { ChapterReceiptsCard } from "./ChapterReceiptsCard";
import { NotesCard, QuestItemsCard, SuspicionMeterCard } from "./GoblinToolCards";
import { NavIcon } from "./GoblinMascot";
import { ToolCard } from "./ToolCard";
import { tr } from "../i18n";
import { useListen, QUALITY_VOICE } from "../ListenContext";

export function BookmarksCard() {
  const { c } = useTheme();
  const navigate = useNavigate();
  const bookmarks = useBookmarks();
  const navy = c(...P.navy);
  const muted = c(...P.muted);
  const body = c(...P.body);
  const border = c(...P.borderSoft);

  return (
    <ToolCard icon={<NavIcon name="journal-nav" size={TOKENS.icon.sidebarTool} />} title={tr("Bookmarks")} storageKey="bookmarks">
      {bookmarks.length === 0 ? (
        <p style={{ fontFamily: UI, fontSize: "12px", color: muted, margin: 0, lineHeight: 1.5 }}>
          {tr("No bookmarks yet. Tap the 🔖 in the page bar to save your place.")}
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
              aria-label={tr("Remove bookmark")}
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

export function ListenCard({ chapter }: { chapter: Chapter }) {
  const { c } = useTheme();
  const {
    supported, state: ctxState, chapterNumber,
    play: startListen, pauseResume, stop,
    voiceOptions, chosen, setVoiceURI,
  } = useListen();
  if (!supported) return null;

  const navy = c(...P.navy);
  const muted = c(...P.muted);
  const green = c(...P.green);
  const border = c(...P.borderSoft);

  // Reflect playback state only when it's THIS chapter being read aloud.
  const state = chapterNumber === chapter.number ? ctxState : "idle";
  const play = () => startListen(chapter);

  const btn = (extra: object = {}) => ({
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px",
    fontFamily: UI, fontSize: "12px", fontWeight: 700, cursor: "pointer",
    borderRadius: "3px", padding: "7px 12px", border: `1px solid ${border}`,
    background: "none", color: navy, ...extra,
  });

  return (
    <ToolCard icon={<Volume2 size={TOKENS.icon.sidebarTool} color={green} />} title={tr("Listen")} storageKey="listen">
      <p style={{ fontFamily: BODY, fontSize: "12px", color: muted, margin: "0 0 9px", lineHeight: 1.5 }}>
        {tr("Read this chapter aloud with your browser’s voice. Pause or stop any time.")}
      </p>
      {voiceOptions.length > 1 && (
        <select
          value={chosen?.voiceURI ?? ""}
          onChange={(e) => setVoiceURI(e.target.value)}
          aria-label={tr("Voice")}
          style={{
            width: "100%", marginBottom: "9px", padding: "6px 8px",
            fontFamily: UI, fontSize: "11.5px", color: navy,
            background: c(...P.inputBg), border: `1px solid ${border}`, borderRadius: "3px",
          }}
        >
          {voiceOptions.map((v) => (
            <option key={v.voiceURI} value={v.voiceURI}>
              {v.name}{QUALITY_VOICE.test(v.name) ? " ★" : ""}
            </option>
          ))}
        </select>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
        {state === "idle" ? (
          <button onClick={play} style={btn({ background: green, color: c("#f4f0e0", "#0d1018"), border: `1px solid ${green}` })}>
            <Play size={14} /> {tr("Listen")}
          </button>
        ) : (
          <>
            <button onClick={pauseResume} style={btn()}>
              {state === "playing" ? <><Pause size={14} /> {tr("Pause")}</> : <><Play size={14} /> {tr("Resume")}</>}
            </button>
            <button onClick={stop} style={btn()}>
              <Square size={13} /> {tr("Stop")}
            </button>
          </>
        )}
      </div>
    </ToolCard>
  );
}

export function GoblinTools({ chapter, showBookmarks = false }: { chapter: Chapter; showBookmarks?: boolean }) {
  return (
    <>
      <NotesCard chapterNumber={chapter.number} />
      <SuspicionMeterCard chapter={chapter} />
      <ListenCard chapter={chapter} />
      <QuestItemsCard chapter={chapter} />
      {showBookmarks && <BookmarksCard />}
      <ChapterReceiptsCard chapter={chapter} />
    </>
  );
}
