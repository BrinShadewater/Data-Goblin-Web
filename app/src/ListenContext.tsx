import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useLanguage } from "./LanguageContext";
import { useLocalStorage } from "./useLocalStorage";
import { chapterPlainText } from "./readingText";
import type { Chapter } from "./types";

// Shared read-aloud (TTS) state, lifted so both the sidebar Listen card and the
// persistent bottom bar drive the same playback. Browser Web Speech API: it has
// no timeline, so "progress" is approximated by counting sentence chunks.
type ListenState = "idle" | "playing" | "paused";

const QUALITY_VOICE = /natural|neural|premium|enhanced|siri|google|wavenet|studio|journey|multilingual/i;
// iOS / macOS novelty & "character" voices that clutter the picker and sound
// wrong for a serious read-aloud (Albert, Zarvox, Bubbles, Grandpa, Eddy…).
// They carry no quality marker in their name, so they must be excluded by name.
const NOVELTY_VOICE = /\b(albert|bad news|good news|bahh|bells|boing|bubbles|cellos|deranged|hysterical|jester|pipe organ|organ|superstar|trinoids|whisper|wobble|zarvox|junior|kathy|princess|ralph|fred|grandma|grandpa|reed|rocko|sandy|shelley|flo|eddy)\b/i;
function rankVoice(v: SpeechSynthesisVoice): number {
  let s = 0;
  if (v.default) s += 50; // respect the device's own chosen voice (esp. iOS)
  if (QUALITY_VOICE.test(v.name)) s += 10;
  if (!v.localService) s += 3;
  if (/(en-CA|fr-CA)/i.test(v.lang)) s += 2;
  return s;
}
export { QUALITY_VOICE };

export const SPEEDS = [0.75, 1, 1.25, 1.5] as const;

interface ListenCtx {
  supported: boolean;
  state: ListenState;
  chapterNumber: number | null;
  progress: number; // 0..1, approximate
  rate: number;
  setRate: (r: number) => void;
  volume: number; // 0..1
  setVolume: (v: number) => void;
  voiceOptions: SpeechSynthesisVoice[];
  chosen: SpeechSynthesisVoice | null;
  setVoiceURI: (uri: string) => void;
  play: (chapter: Chapter) => void;
  pauseResume: () => void;
  stop: () => void;
}

const Ctx = createContext<ListenCtx>({
  supported: false, state: "idle", chapterNumber: null, progress: 0, rate: 1,
  setRate: () => {}, volume: 1, setVolume: () => {}, voiceOptions: [], chosen: null, setVoiceURI: () => {},
  play: () => {}, pauseResume: () => {}, stop: () => {},
});

export function ListenProvider({ children }: { children: ReactNode }) {
  const { lang } = useLanguage();
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [state, setState] = useState<ListenState>("idle");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useLocalStorage<string>(`goblin-tts-voice-${lang}`, "");
  const [rate, setRateStored] = useLocalStorage<number>("goblin-tts-rate", 1);
  const [volume, setVolumeStored] = useLocalStorage<number>("goblin-tts-volume", 1);
  const [chapterNumber, setChapterNumber] = useState<number | null>(null);
  const [idx, setIdx] = useState(0);
  const chunksRef = useRef<string[]>([]);
  const guard = useRef(0);

  useEffect(() => {
    if (!supported) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, [supported]);

  // Stop playback if the language changes or the provider unmounts.
  useEffect(() => {
    if (!supported) return;
    return () => window.speechSynthesis.cancel();
  }, [supported]);
  useEffect(() => {
    if (!supported) return;
    guard.current++;
    window.speechSynthesis.cancel();
    setState("idle");
    setChapterNumber(null);
  }, [lang, supported]);

  const langPrefix = lang === "fr" ? "fr" : "en";
  const inLang = voices.filter((v) => v.lang.toLowerCase().startsWith(langPrefix));
  const ranked = inLang
    .filter((v) => !NOVELTY_VOICE.test(v.name))
    .sort((a, b) => rankVoice(b) - rankVoice(a));
  // Never end up empty: if the blocklist removed everything, fall back to all.
  const voiceOptions = (ranked.length ? ranked : inLang).slice(0, 5);
  const chosen = voiceOptions.find((v) => v.voiceURI === voiceURI) ?? voiceOptions[0] ?? null;

  // The Web Speech API can't change rate or volume mid-utterance, so both are
  // passed in explicitly and a change re-speaks from the current chunk.
  const speakFrom = (startIdx: number, r: number, vol: number) => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const chunks = chunksRef.current;
    const total = chunks.length;
    const stamp = ++guard.current;
    for (let i = startIdx; i < total; i++) {
      const u = new SpeechSynthesisUtterance(chunks[i]);
      u.rate = r;
      u.volume = vol;
      if (chosen) u.voice = chosen;
      u.lang = chosen?.lang ?? (lang === "fr" ? "fr-CA" : "en-CA");
      u.onstart = () => { if (guard.current === stamp) setIdx(i); };
      if (i === total - 1) {
        u.onend = () => { if (guard.current === stamp) { setState("idle"); setChapterNumber(null); } };
      }
      synth.speak(u);
    }
    setState("playing");
  };

  const play = (chapter: Chapter) => {
    if (!supported) return;
    const text = chapterPlainText(chapter);
    chunksRef.current = text.match(/[^.!?]+[.!?]*/g)?.map((x) => x.trim()).filter(Boolean) ?? [text];
    setChapterNumber(chapter.number);
    setIdx(0);
    speakFrom(0, rate, volume);
  };
  const pauseResume = () => {
    const synth = window.speechSynthesis;
    if (state === "playing") { synth.pause(); setState("paused"); }
    else if (state === "paused") { synth.resume(); setState("playing"); }
  };
  const stop = () => {
    guard.current++;
    window.speechSynthesis.cancel();
    setState("idle");
    setChapterNumber(null);
    setIdx(0);
  };
  // The API can't change rate mid-utterance, so re-speak from the current chunk.
  const setRate = (r: number) => {
    setRateStored(r);
    if (state === "playing") speakFrom(idx, r, volume);
  };
  // Same constraint for volume: store it, and if playing, re-speak so the new
  // level takes effect immediately rather than only on the next chunk.
  const setVolume = (v: number) => {
    setVolumeStored(v);
    if (state === "playing") speakFrom(idx, rate, v);
  };

  const progress = chunksRef.current.length ? Math.min(1, (idx + 1) / chunksRef.current.length) : 0;

  return (
    <Ctx.Provider value={{ supported, state, chapterNumber, progress, rate, setRate, volume, setVolume, voiceOptions, chosen, setVoiceURI, play, pauseResume, stop }}>
      {children}
    </Ctx.Provider>
  );
}

export const useListen = () => useContext(Ctx);
