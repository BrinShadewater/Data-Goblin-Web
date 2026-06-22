import { Pause, Play, Square, Volume2 } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { MONO, P, UI } from "../theme";
import { tr } from "../i18n";
import { useListen, SPEEDS } from "../ListenContext";
import { isBackMatter } from "../readerUtils";

/**
 * Persistent read-aloud strip. Appears under the header whenever audio is
 * playing, so play/pause/stop/speed/volume follow the reader across page turns
 * (and is reachable on mobile without opening the tools sheet). Progress is
 * approximate — the Web Speech API exposes no real timeline, so it can't seek.
 */
export function ListenBar() {
  const { c } = useTheme();
  const { state, progress, rate, setRate, volume, setVolume, pauseResume, stop, chapterNumber } = useListen();
  if (state === "idle") return null;

  const bg = c(...P.panelBg);
  const border = c(...P.border);
  const ink = c(...P.ink);
  const muted = c(...P.muted);
  const green = c(...P.green);

  const label =
    chapterNumber === 0 ? tr("Front Matter")
      : isBackMatter(chapterNumber) ? tr("Appendix")
        : `${tr("Ch.")} ${chapterNumber}`;

  const iconBtn = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: "34px", height: "34px", borderRadius: "3px", cursor: "pointer",
    border: `1px solid ${border}`, background: "none", color: ink, flexShrink: 0,
  } as const;

  return (
    <div
      role="region"
      aria-label={tr("Listen")}
      style={{
        flexShrink: 0, display: "flex", alignItems: "center", gap: "12px",
        padding: "6px 14px", background: bg, borderBottom: `1px solid ${border}`,
        transition: "background 0.3s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "7px", flexShrink: 0 }}>
        <Volume2 size={15} color={green} />
        <span style={{ fontFamily: MONO, fontSize: "10px", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, whiteSpace: "nowrap" }}>
          {tr("Listen")} · {label}
        </span>
      </div>
      <button onClick={pauseResume} aria-label={state === "playing" ? tr("Pause") : tr("Resume")} style={iconBtn}>
        {state === "playing" ? <Pause size={15} /> : <Play size={15} />}
      </button>
      <button onClick={stop} aria-label={tr("Stop")} style={iconBtn}>
        <Square size={13} />
      </button>
      <div style={{ flex: 1, minWidth: "40px", height: "5px", background: c(...P.inputBg), borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ width: `${Math.round(progress * 100)}%`, height: "100%", background: green, transition: "width 0.3s" }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }} title={tr("Volume")}>
        <Volume2 size={14} color={muted} aria-hidden="true" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          aria-label={tr("Volume")}
          style={{ width: "68px", accentColor: green, cursor: "pointer" }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
        <span style={{ fontFamily: MONO, fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: muted }}>{tr("Speed")}</span>
        <select
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
          aria-label={tr("Speed")}
          style={{ fontFamily: UI, fontSize: "11.5px", color: ink, background: c(...P.inputBg), border: `1px solid ${border}`, borderRadius: "3px", padding: "4px 6px" }}
        >
          {SPEEDS.map((s) => <option key={s} value={s}>{s}×</option>)}
        </select>
      </div>
    </div>
  );
}
