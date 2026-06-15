import { createPortal } from "react-dom";
import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";

/**
 * Renders popover content in a portal on document.body with fixed positioning
 * clamped to the viewport, so glossary/receipt tooltips are never clipped by
 * the reader page's `overflow: hidden` or by the window edge. Positions below
 * the anchor by default, flipping above when there isn't room.
 */
export function AnchoredPopover({
  anchorRef,
  open,
  width,
  children,
}: {
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  width: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const anchor = anchorRef.current;
    if (!anchor) return;
    const a = anchor.getBoundingClientRect();
    const m = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = Math.min(width, vw - 2 * m);
    const left = Math.min(Math.max(a.left, m), vw - w - m);
    const h = ref.current?.offsetHeight ?? 0;
    let top = a.bottom + 6;
    if (h && top + h > vh - m) {
      const above = a.top - 6 - h;
      top = above >= m ? above : Math.max(m, vh - h - m);
    }
    setPos({ left, top });
  }, [open, width, anchorRef]);

  if (!open) return null;
  return createPortal(
    <div
      ref={ref}
      role="tooltip"
      style={{
        position: "fixed",
        left: pos ? pos.left : -9999,
        top: pos ? pos.top : -9999,
        width: `min(${width}px, calc(100vw - 16px))`,
        zIndex: 1000,
        visibility: pos ? "visible" : "hidden",
      }}
    >
      {children}
    </div>,
    document.body
  );
}
