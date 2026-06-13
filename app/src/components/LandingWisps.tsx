import { useTheme } from "../ThemeContext";

const WISPS = [
  { x: 5, s: 0.75, d: -1, drift: -18 },
  { x: 10, s: 1.05, d: -8, drift: 22 },
  { x: 15, s: 0.55, d: -14, drift: -10 },
  { x: 21, s: 0.9, d: -4, drift: 18 },
  { x: 27, s: 0.65, d: -19, drift: -24 },
  { x: 32, s: 1.2, d: -11, drift: 16 },
  { x: 38, s: 0.7, d: -6, drift: -14 },
  { x: 44, s: 1.0, d: -22, drift: 26 },
  { x: 50, s: 0.58, d: -3, drift: -20 },
  { x: 56, s: 1.3, d: -16, drift: 14 },
  { x: 61, s: 0.78, d: -9, drift: -28 },
  { x: 67, s: 0.95, d: -24, drift: 20 },
  { x: 73, s: 0.6, d: -12, drift: -16 },
  { x: 79, s: 1.12, d: -5, drift: 24 },
  { x: 85, s: 0.82, d: -18, drift: -22 },
  { x: 91, s: 0.7, d: -10, drift: 12 },
  { x: 96, s: 1.0, d: -26, drift: -18 },
  { x: 2, s: 0.52, d: -21, drift: 26 },
  { x: 35, s: 0.86, d: -29, drift: -30 },
  { x: 70, s: 0.66, d: -31, drift: 30 },
];

export function LandingWispStyles() {
  return (
    <style>{`
      @keyframes dg-wisp-fall {
        0%   { transform: translate3d(0, -12vh, 0) scale(0.76); opacity: 0; }
        10%  { opacity: 0.8; }
        22%  { transform: translate3d(calc(var(--drift) * 1.2), 16vh, 0) scale(1); opacity: 0.74; }
        40%  { transform: translate3d(calc(var(--drift) * -1.05), 38vh, 0) scale(0.95); opacity: 0.7; }
        58%  { transform: translate3d(calc(var(--drift) * 1.15), 58vh, 0) scale(1.04); opacity: 0.64; }
        76%  { transform: translate3d(calc(var(--drift) * -0.7), 80vh, 0) scale(0.9); opacity: 0.5; }
        100% { transform: translate3d(calc(var(--drift) * 0.5), 112vh, 0) scale(0.74); opacity: 0; }
      }
      @keyframes dg-wisp-breathe {
        0%, 100% { filter: blur(0.15px); }
        50% { filter: blur(0.9px); }
      }
      @media (prefers-reduced-motion: reduce) {
        [data-wisp] { display: none; }
      }
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
            width: `${9 * w.s}px`,
            height: `${9 * w.s}px`,
            transform: "translate(var(--push-x, 0), var(--push-y, 0))",
            transition: "transform 0.22s ease-out",
            ["--drift" as string]: `${w.drift}px`,
          }}
        >
          <span
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              borderRadius: "999px",
              background: `radial-gradient(circle at center, ${c("#cfe9ff", "#d7ffc7")} 0%, ${c("#155e92", "#8af66b")} 48%, transparent 76%)`,
              boxShadow: c("0 0 9px rgba(21, 94, 146, 0.8), 0 0 22px rgba(12, 56, 92, 0.46)", "0 0 12px rgba(138, 246, 107, 0.72), 0 0 26px rgba(116, 216, 86, 0.32)"),
              opacity: 0.82,
              animation: `dg-wisp-fall ${40 + i * 1.0}s ease-in-out ${w.d}s infinite, dg-wisp-breathe ${6.4 + i * 0.18}s ease-in-out ${w.d}s infinite`,
            }}
          />
        </span>
      ))}
    </div>
  );
}
