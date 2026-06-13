import { useTheme } from "../ThemeContext";
import { P } from "../theme";
import { artAspectRatio, artDimensions, artSrcSet, artUrl } from "../useContent";

export function StaticHeroArt({
  art,
  alt,
  maxWidth = "520px",
  maxHeight = "440px",
  sizes = "(max-width: 760px) 92vw, 520px",
  eager = false,
}: {
  art: string;
  alt: string;
  maxWidth?: string;
  maxHeight?: string;
  sizes?: string;
  eager?: boolean;
}) {
  const { c, dark } = useTheme();
  const dimensions = artDimensions(art);
  return (
    <div
      style={{
        background: c(...P.pageBg),
        border: `1px solid ${c(...P.borderSoft)}`,
        borderRadius: "6px",
        padding: "18px",
        boxShadow: c("0 12px 32px rgba(60,50,30,0.16)", "0 12px 32px rgba(0,0,0,0.4)"),
        maxWidth,
        margin: "0 auto",
      }}
    >
      <img
        src={artUrl(art)}
        srcSet={artSrcSet(art)}
        sizes={sizes}
        width={dimensions?.width}
        height={dimensions?.height}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        decoding="async"
        style={{
          display: "block",
          width: "100%",
          height: "auto",
          aspectRatio: artAspectRatio(art),
          maxHeight,
          objectFit: "contain",
          mixBlendMode: dark ? "normal" : "multiply",
          opacity: dark ? 0.92 : 1,
        }}
      />
    </div>
  );
}
