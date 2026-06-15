import { useTheme } from "../ThemeContext";
import { DISPLAY, P } from "../theme";
import { artAspectRatio, artDimensions, artSrcSet, artUrl } from "../useContent";

export function artBlendStyle(dark: boolean) {
  return {
    mixBlendMode: dark ? ("normal" as const) : ("multiply" as const),
    opacity: dark ? 0.92 : 1,
  };
}

export function ArtPlate({ src, caption }: { src: string; caption?: string | null }) {
  const { c, dark } = useTheme();
  const dimensions = artDimensions(src);
  const isFigure = src.startsWith("figures/");
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
        src={artUrl(src)}
        srcSet={artSrcSet(src)}
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
  const { c } = useTheme();
  const dimensions = artDimensions(src);
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
        src={artUrl(src)}
        srcSet={artSrcSet(src)}
        sizes="(max-width: 760px) 90vw, 40vw"
        width={dimensions?.width}
        height={dimensions?.height}
        alt={caption ?? "Field guide figure"}
        loading="lazy"
        decoding="async"
        style={{
          width: "100%",
          maxWidth: "480px",
          maxHeight: "300px",
          height: "auto",
          aspectRatio: artAspectRatio(src),
          objectFit: "contain",
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
