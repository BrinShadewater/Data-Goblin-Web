import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "./i18nNav";
import { getLastLocation, saveLastLocation, toggleBookmark, useBookmarks } from "./bookmarks";
import {
  budgetsFor,
  getSavedPanel,
  hasAnySavedPosition,
  LAST_PANEL,
  paginatePanelsCached,
  savePanel,
  type Block,
} from "./pagination";
import { useReader } from "./reader";
import { FIRST_DOC, LAST_DOC, panelSnippet } from "./readerUtils";
import { chapterPath, fetchJson, useArtMap, useChapter, useTraps } from "./useContent";
import { useLanguage } from "./LanguageContext";
import type { Chapter } from "./types";

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return Boolean(
    el &&
      (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)
  );
}

export function useChapterRoute(): number {
  const params = useParams<{ num?: string }>();
  const navigate = useNavigate();

  const [defaultDoc] = useState(() => {
    const last = getLastLocation();
    if (last) return Math.max(FIRST_DOC, Math.min(LAST_DOC, Math.round(last.doc)));
    return hasAnySavedPosition() ? 1 : FIRST_DOC;
  });
  const parsed = parseInt(params.num ?? "", 10);
  const num =
    params.num == null
      ? defaultDoc
      : Math.max(FIRST_DOC, Math.min(LAST_DOC, Number.isFinite(parsed) ? parsed : 1));

  useEffect(() => {
    if (params.num && String(num) !== params.num) navigate(`/chapter/${num}`, { replace: true });
  }, [params.num, num, navigate]);

  return num;
}

export function usePaginatedChapter(num: number) {
  const { mode, dyslexic, heightScale } = useReader();
  const { data: chapter, error } = useChapter(num);
  const { data: traps } = useTraps();
  const { data: artMap } = useArtMap();

  const trap = traps?.[String(num)] ?? null;
  const accents = useMemo(() => artMap?.docs?.[String(num)]?.accents ?? [], [artMap, num]);
  const artPanels = useMemo(() => artMap?.docs?.[String(num)]?.panels ?? [], [artMap, num]);
  const budgets = useMemo(() => budgetsFor(mode, dyslexic, heightScale), [mode, dyslexic, heightScale]);
  const panels = useMemo(
    () => (chapter ? paginatePanelsCached(chapter, trap, budgets, accents, artPanels) : null),
    [chapter, trap, budgets, accents, artPanels]
  );

  return { chapter, error, panels };
}

export function usePageNavigation({
  num,
  panels,
  single,
}: {
  num: number;
  panels: Block[][] | null;
  single: boolean;
}) {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const step = single ? 1 : 2;

  const [panelIdx, setPanelIdx] = useState(() => getSavedPanel(num));
  useEffect(() => {
    setPanelIdx(getSavedPanel(num));
  }, [num]);

  const panelCount = panels ? panels.length : 1;
  const clamped = Math.max(0, Math.min(panelIdx, panelCount - 1));
  const aligned = single ? clamped : clamped - (clamped % 2);
  const pageCount = Math.max(1, Math.ceil(panelCount / step));
  const page = Math.floor(aligned / step);

  useEffect(() => {
    if (panels) {
      savePanel(num, aligned);
      saveLastLocation(num, aligned);
    }
  }, [panels, num, aligned]);

  useEffect(() => {
    if (!panels) return;
    const turnsToEnd = Math.ceil((panelCount - (aligned + step)) / step);
    if (num < LAST_DOC && turnsToEnd <= 3) {
      fetchJson(chapterPath(num + 1), lang).catch(() => {});
    }
    if (num > FIRST_DOC && aligned / step <= 3) {
      fetchJson(chapterPath(num - 1), lang).catch(() => {});
    }
  }, [panels, panelCount, aligned, step, num, lang]);

  const goNext = useCallback(() => {
    if (!panels) return;
    if (page < pageCount - 1) {
      setPanelIdx(aligned + step);
    } else if (num < LAST_DOC) {
      savePanel(num + 1, 0);
      navigate(`/chapter/${num + 1}`);
    }
  }, [panels, page, pageCount, aligned, step, num, navigate]);

  const goPrev = useCallback(() => {
    if (!panels) return;
    if (page > 0) {
      setPanelIdx(aligned - step);
    } else if (num > FIRST_DOC) {
      savePanel(num - 1, LAST_PANEL);
      navigate(`/chapter/${num - 1}`);
    }
  }, [panels, page, aligned, step, num, navigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  return { aligned, page, pageCount, step, goNext, goPrev };
}

export function useReaderBookmark({
  num,
  chapter,
  panels,
  aligned,
  step,
}: {
  num: number;
  chapter: Chapter | null;
  panels: Block[][] | null;
  aligned: number;
  step: number;
}) {
  const bookmarks = useBookmarks();
  const bookmarked = bookmarks.some(
    (b) => b.doc === num && b.panelIndex >= aligned && b.panelIndex < aligned + step
  );
  const onToggleBookmark = useCallback(() => {
    if (!chapter || !panels) return;
    const existing = bookmarks.find(
      (b) => b.doc === num && b.panelIndex >= aligned && b.panelIndex < aligned + step
    );
    toggleBookmark(
      existing ?? {
        doc: num,
        panelIndex: aligned,
        chapterTitle:
          num === FIRST_DOC ? "Front Matter" : num === LAST_DOC ? "Appendix" : `${num}. ${chapter.title.split(" — ")[0]}`,
        snippet: panelSnippet(panels[aligned] ?? [], chapter),
        ts: Date.now(),
      }
    );
  }, [chapter, panels, bookmarks, num, aligned, step]);

  return { bookmarked, onToggleBookmark };
}

export function useSwipePaging({ goNext, goPrev }: { goNext: () => void; goPrev: () => void }) {
  const edgeGuard = 28;
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: TouchEvent) => {
    if (isEditableTarget(e.target)) {
      touchStart.current = null;
      return;
    }
    const t0 = e.touches[0];
    if (t0.clientX < edgeGuard || t0.clientX > window.innerWidth - edgeGuard) {
      touchStart.current = null;
      return;
    }
    touchStart.current = { x: t0.clientX, y: t0.clientY };
  };

  const onTouchEnd = (e: TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t0 = e.changedTouches[0];
    const dx = t0.clientX - start.x;
    const dy = t0.clientY - start.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > 1.5 * Math.abs(dy)) {
      if (dx < 0) goNext();
      else goPrev();
    }
  };

  return { onTouchStart, onTouchEnd };
}

export function useToolsSheet(num: number) {
  const [toolsOpen, setToolsOpen] = useState(false);

  useEffect(() => {
    if (!toolsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setToolsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toolsOpen]);

  useEffect(() => setToolsOpen(false), [num]);

  return { toolsOpen, setToolsOpen };
}
