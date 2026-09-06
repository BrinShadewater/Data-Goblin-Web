import type { PointerEvent } from "react";
import { useEffect, useRef } from "react";
import { useNavigate } from "../i18nNav";
import { useTheme } from "../ThemeContext";
import { P, UI } from "../theme";
import { LandingHero, LandingQuickLinks, LandingWisps, LandingWispStyles } from "../components/LandingSections";
import { savePanel } from "../pagination";
import { preloadReaderRoute } from "../lazyRoutes";
import { useBook } from "../useContent";
import { CONTACT_EMAIL } from "../contribute";
import { tr } from "../i18n";

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
      // The skip link in App.tsx targets #dg-main; the reader and static pages had it, the
      // landing did not, so on the home page it jumped nowhere (Lighthouse skip-link, live).
      id="dg-main"
      tabIndex={-1}
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
      <section style={{ maxWidth: "1480px", margin: "0 auto", padding: "0 clamp(20px, 5vw, 68px) 56px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <p style={{ fontFamily: UI, fontSize: "14px", lineHeight: 1.6, color: c(...P.muted), margin: 0 }}>
          {tr("Questions, a correction, or a tip?")}{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: c(...P.navy), fontWeight: 700, textDecoration: "none" }}>
            {CONTACT_EMAIL}
          </a>
        </p>
      </section>
    </main>
  );
}
