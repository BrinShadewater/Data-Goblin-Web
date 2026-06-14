import { useEffect, useRef, useState } from "react";
import { Pause, Play, Square, Volume2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { BODY, P, TOKENS, UI } from "../theme";
import { removeBookmark, saveLastLocation, useBookmarks } from "../bookmarks";
import { savePanel } from "../pagination";
import { chapterPlainText } from "../readingText";
import type { Chapter } from "../types";
import { ChapterReceiptsCard } from "./ChapterReceiptsCard";
import { NotesCard, QuestItemsCard, SuspicionMeterCard } from "./GoblinToolCards";
import { NavIcon } from "./GoblinMascot";
import { ToolCard } from "./ToolCard";
import { tr } from "../i18n";
import { useLanguage } from "../LanguageContext";
import { useLocalStorage } from "../useLocalStorage";

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

type ListenState = "idle" | "playing" | "paused";

// Rank a device voice by likely quality. Modern OS "natural / neural" voices are
// dramatically better than the default robotic one, so prefer them; online
// (non-local) voices also tend to be richer.
const QUALITY_VOICE = /natural|neural|premium|enhanced|siri|google|wavenet|studio|journey|multilingual/i;
function rankVoice(v: SpeechSynthesisVoice): number {
  let s = 0;
  if (QUALITY_VOICE.test(v.name)) s += 10;
  if (!v.localService) s += 3;
  if (/(en-CA|fr-CA)/i.test(v.lang)) s += 2; // a Canadian guide → Canadian accent when offered
  return s;
}
function pickBestVoice(voices: SpeechSynthesisVoice[], langPrefix: string): SpeechSynthesisVoice | null {
  const matches = voices.filter((v) => v.lang.toLowerCase().startsWith(langPrefix));
  if (matches.length === 0) return null;
  return [...matches].sort((a, b) => rankVoice(b) - rankVoice(a))[0];
}

export function ListenCard({ chapter }: { chapter: Chapter }) {
  const { c } = useTheme();
  const { lang } = useLanguage();
  const [state, setState] = useState<ListenState>("idle");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useLocalStorage<string>(`goblin-tts-voice-${lang}`, "");
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const endGuard = useRef(0);

  // The device's voice list populates asynchronously in most browsers.
  useEffect(() => {
    if (!supported) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, [supported]);

  // Cancel speech on unmount and whenever the chapter or language changes.
  useEffect(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setState("idle");
    return () => window.speechSynthesis.cancel();
  }, [chapter.number, supported, lang]);

  if (!supported) return null;

  const navy = c(...P.navy);
  const muted = c(...P.muted);
  const green = c(...P.green);
  const border = c(...P.borderSoft);

  const langPrefix = lang === "fr" ? "fr" : "en";
  const langVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(langPrefix));
  const chosen = langVoices.find((v) => v.voiceURI === voiceURI) ?? pickBestVoice(voices, langPrefix);

  const play = () => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const text = chapterPlainText(chapter);
    // Chunk into sentences: dodges the Chrome long-utterance cutoff bug.
    const chunks = text.match(/[^.!?]+[.!?]*/g)?.map((x) => x.trim()).filter(Boolean) ?? [text];
    const total = chunks.length;
    const stamp = ++endGuard.current;
    chunks.forEach((ch, i) => {
      const u = new SpeechSynthesisUtterance(ch);
      u.rate = 1;
      if (chosen) u.voice = chosen;
      u.lang = chosen?.lang ?? (lang === "fr" ? "fr-CA" : "en-CA");
      if (i === total - 1) u.onend = () => { if (endGuard.current === stamp) setState("idle"); };
      synth.speak(u);
    });
    setState("playing");
  };
  const pauseResume = () => {
    const synth = window.speechSynthesis;
    if (state === "playing") { synth.pause(); setState("paused"); }
    else { synth.resume(); setState("playing"); }
  };
  const stop = () => { endGuard.current++; window.speechSynthesis.cancel(); setState("idle"); };

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
      {langVoices.length > 1 && (
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
          {langVoices.map((v) => (
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
