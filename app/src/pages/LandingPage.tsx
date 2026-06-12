import type { PointerEvent } from "react";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { P } from "../theme";
import { LandingHero, LandingQuickLinks, LandingWisps, LandingWispStyles } from "../components/LandingSections";
import { savePanel } from "../pagination";
import { preloadReaderRoute } from "../lazyRoutes";
import { useBook } from "../useContent";

export function LandingPage() {
  const { c } = useTheme();
  const navigate = useNavigate();
  const { data: book } = useBook();
  const wispFrame = useRef<number | null>(null);
  const wispPoint = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    return () => {
      if (wispFrame.current !== null) {
        window.cancelAnimationFrame(wispFrame.current);
      }
    };
  }, []);

  const begin = () => {
    preloadReaderRoute();
    savePanel(1, 0);
    navigate("/chapter/1");
  };

  const moveWisps = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const root = e.currentTarget;
    wispPoint.current = { x: e.clientX, y: e.clientY };
    if (wispFrame.current !== null) return;
    wispFrame.current = window.requestAnimationFrame(() => {
      wispFrame.current = null;
      const point = wispPoint.current;
      if (!point) return;
      root.querySelectorAll<HTMLElement>("[data-wisp]").forEach((el) => {
        const r = el.getBoundingClientRect();
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        const dx = x - point.x;
        const dy = y - point.y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const force = Math.max(0, 1 - dist / 170);
        el.style.setProperty("--push-x", `${(dx / dist) * force * 72}px`);
        el.style.setProperty("--push-y", `${(dy / dist) * force * 72}px`);
      });
    });
  };

  const resetWisps = (e: PointerEvent<HTMLElement>) => {
    wispPoint.current = null;
    if (wispFrame.current !== null) {
      window.cancelAnimationFrame(wispFrame.current);
      wispFrame.current = null;
    }
    e.currentTarget.querySelectorAll<HTMLElement>("[data-wisp]").forEach((el) => {
      el.style.setProperty("--push-x", "0px");
      el.style.setProperty("--push-y", "0px");
    });
  };

  return (
    <main
      onPointerMove={moveWisps}
      onPointerLeave={resetWisps}
      style={{ flex: 1, overflowY: "auto", background: c(...P.panelBg), transition: "background 0.3s", position: "relative" }}
    >
      <LandingWispStyles />
      <LandingWisps />
      <LandingHero
        title={book?.title ?? "Data Goblin"}
        subtitle={book?.subtitle ?? "A Field Guide to AI, Power, and Data in Canada"}
        asOf={book?.asOf ?? "June 2026"}
        begin={begin}
        preloadGuide={preloadReaderRoute}
      />
      <LandingQuickLinks preloadGuide={preloadReaderRoute} />
    </main>
  );
}
