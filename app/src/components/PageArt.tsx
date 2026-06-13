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
        decoding="async"
        style={{
          flex: 1,
          minHeight: 0,
          width: "92%",
          maxWidth: "640px",
          aspectRatio: artAspectRatio(src),
          objectFit: "contain",
          ...artBlendStyle(dark),
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
