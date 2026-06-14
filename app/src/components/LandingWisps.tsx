import { useTheme } from "../ThemeContext";

// Each wisp: x start (%), size scale, start delay (s), sway amplitude (px),
// fall duration (s), sway duration (s). Varied so they never move in lockstep.
const WISPS = [
  { x: 6, s: 0.8, d: -3, sway: 30, fall: 52, sw: 11 },
  { x: 13, s: 1.05, d: -14, sway: 20, fall: 60, sw: 14 },
  { x: 19, s: 0.6, d: -26, sway: 38, fall: 47, sw: 9 },
  { x: 26, s: 0.92, d: -7, sway: 16, fall: 66, sw: 16 },
  { x: 33, s: 0.7, d: -34, sway: 30, fall: 55, sw: 12 },
  { x: 40, s: 1.18, d: -20, sway: 24, fall: 71, sw: 18 },
  { x: 47, s: 0.66, d: -10, sway: 40, fall: 50, sw: 10 },
  { x: 54, s: 1.0, d: -40, sway: 18, fall: 63, sw: 15 },
  { x: 61, s: 0.58, d: -5, sway: 34, fall: 46, sw: 8.5 },
  { x: 68, s: 1.25, d: -28, sway: 22, fall: 74, sw: 17 },
  { x: 74, s: 0.78, d: -16, sway: 36, fall: 57, sw: 13 },
  { x: 81, s: 0.95, d: -44, sway: 26, fall: 68, sw: 15.5 },
  { x: 88, s: 0.64, d: -9, sway: 32, fall: 49, sw: 9.5 },
  { x: 94, s: 1.08, d: -22, sway: 20, fall: 64, sw: 14.5 },
  { x: 3, s: 0.55, d: -33, sway: 28, fall: 53, sw: 11.5 },
  { x: 44, s: 0.85, d: -48, sway: 38, fall: 70, sw: 16.5 },
  { x: 78, s: 0.7, d: -52, sway: 24, fall: 58, sw: 12.5 },
];

export function LandingWispStyles() {
  return (
    <style>{`
      @keyframes dg-wisp-fall {
        0%   { transform: translateY(-8vh); opacity: 0; }
        9%   { opacity: 0.7; }
        88%  { opacity: 0.5; }
        100% { transform: translateY(112vh); opacity: 0; }
      }
      @keyframes dg-wisp-sway {
        0%   { transform: translateX(calc(var(--sway) * -1)) scale(0.9); }
        50%  { transform: translateX(var(--sway)) scale(1.05); }
        100% { transform: translateX(calc(var(--sway) * -1)) scale(0.9); }
      }
      @media (prefers-reduced-motion: reduce) { [data-wisp] { display: none; } }
    `}</style>
  );
}

export function LandingWisps() {
  const { c } = useTheme();
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {WISPS.map((w, i) => (
        <span
          key={i}
          data-wisp
          style={{
            position: "absolute",
            left: `${w.x}%`,
            top: 0,
            willChange: "transform, opacity",
            animation: `dg-wisp-fall ${w.fall}s linear ${w.d}s infinite`,
          }}
        >
          <span
            style={{
              display: "block",
              ["--sway" as string]: `${w.sway}px`,
              animation: `dg-wisp-sway ${w.sw}s ease-in-out ${w.d}s infinite`,
            }}
          >
            <span
              style={{
                display: "block",
                width: `${9 * w.s}px`,
                height: `${9 * w.s}px`,
                borderRadius: "999px",
                background: `radial-gradient(circle at 38% 35%, ${c("#dcefff", "#e2ffd2")} 0%, ${c("#1c6aa0", "#82ee62")} 52%, transparent 78%)`,
                boxShadow: c("0 0 8px rgba(20, 88, 138, 0.7), 0 0 20px rgba(12, 56, 92, 0.4)", "0 0 12px rgba(138, 246, 107, 0.7), 0 0 24px rgba(116, 216, 86, 0.3)"),
              }}
            />
          </span>
        </span>
      ))}
    </div>
  );
}
