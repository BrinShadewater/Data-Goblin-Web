import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../ThemeContext";
import { useLanguage, type Lang } from "../LanguageContext";
import { DISPLAY, P } from "../theme";
import { artAspectRatio, artDimensions, artSrcSet, artUrl } from "../useContent";

export function artBlendStyle(dark: boolean) {
  return {
    mixBlendMode: dark ? ("normal" as const) : ("multiply" as const),
    opacity: dark ? 0.92 : 1,
  };
}

/**
 * Data figures ship in up to four baked variants: light-EN (base), dark-EN
 * (`-dark`), light-FR (`-fr`), and dark-FR (`-dark-fr`). The reader picks the
 * right file by theme + language. Variants that don't exist yet fall back
 * gracefully (e.g. an FR reader in dark mode gets the dark-EN figure rather
 * than a glaring light one) via a progressive onError chain. Non-figure art
 * (full-page plates) is unaffected and keeps its responsive srcSet + blend.
 */
function useVariantSrc(src: string, dark: boolean, lang: Lang) {
  const isFigure = src.startsWith("figures/") && src.endsWith(".webp");
  const candidates = useMemo(() => {
    if (!isFigure) return [src];
    const stem = src.slice(0, -".webp".length);
    const c: string[] = [];
    if (dark && lang === "fr") c.push(`${stem}-dark-fr.webp`);
    if (dark) c.push(`${stem}-dark.webp`);
    if (!dark && lang === "fr") c.push(`${stem}-fr.webp`);
    c.push(src);
    return Array.from(new Set(c));
  }, [src, dark, lang, isFigure]);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    setIdx(0);
  }, [candidates]);
  const onError = () => setIdx((i) => (i < candidates.length - 1 ? i + 1 : i));
  return { url: artUrl(candidates[idx]), onError, isFigure };
}

export function ArtPlate({ src, caption }: { src: string; caption?: string | null }) {
  const { c, dark } = useTheme();
  const { lang } = useLanguage();
  const dimensions = artDimensions(src);
  const { url, onError, isFigure } = useVariantSrc(src, dark, lang);
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        padding: "10px 0",
      }}
    >
      <img
        src={url}
        onError={onError}
        srcSet={isFigure ? undefined : artSrcSet(src)}
        sizes="(max-width: 760px) 92vw, 42vw"
        width={dimensions?.width}
        height={dimensions?.height}
        alt={caption ?? "Field guide illustration"}
        loading="lazy"
        decoding="async"
        style={{
          flex: 1,
          minHeight: 0,
          width: "92%",
          maxWidth: "640px",
          aspectRatio: artAspectRatio(src),
          objectFit: "contain",
          ...(isFigure ? {} : artBlendStyle(dark)),
        }}
      />
      {caption && (
        <div
          style={{
            fontFamily: DISPLAY,
            fontStyle: "italic",
            fontSize: "14px",
            fontWeight: 500,
            color: c(...P.ink),
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          {caption}
        </div>
      )}
    </div>
  );
}

/**
 * Inline data figure — flows between paragraphs (not a full-page plate), with
 * the image contained to a readable size and the caption directly underneath.
 */
export function FigureBlock({ src, caption }: { src: string; caption?: string | null }) {
  const { c, dark } = useTheme();
  const { lang } = useLanguage();
  const dimensions = artDimensions(src);
  const { url, onError, isFigure } = useVariantSrc(src, dark, lang);
  return (
    <figure
      style={{
        margin: "24px 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <img
        src={url}
        onError={onError}
        srcSet={isFigure ? undefined : artSrcSet(src)}
        sizes="(max-width: 760px) 90vw, 40vw"
        width={dimensions?.width}
        height={dimensions?.height}
        alt={caption ?? "Field guide figure"}
        loading="lazy"
        decoding="async"
        style={{
          width: "100%",
          maxWidth: isFigure ? "480px" : "520px",
          maxHeight: isFigure ? "300px" : "360px",
          height: "auto",
          aspectRatio: artAspectRatio(src),
          objectFit: "contain",
          ...(isFigure ? {} : artBlendStyle(dark)),
        }}
      />
      {caption && (
        <figcaption
          style={{
            fontFamily: DISPLAY,
            fontStyle: "italic",
            fontSize: "13.5px",
            fontWeight: 500,
            lineHeight: 1.5,
            color: c(...P.faint),
            textAlign: "center",
            maxWidth: "520px",
          }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
