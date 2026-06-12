import type { ReactNode } from "react";
import { useTheme } from "../ThemeContext";
import { BODY, DISPLAY, MONO, P } from "../theme";

export function StaticPageShell({
  children,
  maxWidth = "980px",
  padding = "32px clamp(16px, 5vw, 40px) 64px",
}: {
  children: ReactNode;
  maxWidth?: string;
  padding?: string;
}) {
  const { c } = useTheme();
  return (
    <main style={{ flex: 1, overflowY: "auto", background: c(...P.panelBg), padding, transition: "background 0.3s" }}>
      <div style={{ maxWidth, margin: "0 auto" }}>{children}</div>
    </main>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
  icon,
  centered = false,
  eyebrowSize = "9px",
  eyebrowLetterSpacing = "0.28em",
  eyebrowMarginBottom = "8px",
  titleSize = "36px",
  titleLineHeight = 1.05,
  titleMargin = "0 0 10px",
  descriptionSize = "15.5px",
  descriptionLineHeight = 1.65,
  descriptionMaxWidth = "700px",
  descriptionMargin,
  marginBottom = "28px",
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  centered?: boolean;
  eyebrowSize?: string;
  eyebrowLetterSpacing?: string;
  eyebrowMarginBottom?: string;
  titleSize?: string;
  titleLineHeight?: number;
  titleMargin?: string;
  descriptionSize?: string;
  descriptionLineHeight?: number;
  descriptionMaxWidth?: string;
  descriptionMargin?: string;
  marginBottom?: string;
  children?: ReactNode;
}) {
  const { c } = useTheme();
  const bodyMargin = descriptionMargin ?? (centered ? "0 auto 22px" : "0");
  return (
    <div style={{ marginBottom, textAlign: centered ? "center" : "left" }}>
      <div style={{ fontFamily: MONO, fontSize: eyebrowSize, fontWeight: 800, letterSpacing: eyebrowLetterSpacing, textTransform: "uppercase", color: c(...P.red), marginBottom: eyebrowMarginBottom }}>
        {eyebrow}
      </div>
      <h1 style={{ display: icon ? "flex" : undefined, alignItems: icon ? "center" : undefined, gap: icon ? "12px" : undefined, fontFamily: DISPLAY, fontSize: titleSize, fontWeight: 900, color: c(...P.navy), margin: titleMargin, lineHeight: titleLineHeight, textTransform: "uppercase", justifyContent: centered && icon ? "center" : undefined }}>
        {icon}
        {title}
      </h1>
      {description && (
        <p style={{ fontFamily: BODY, fontSize: descriptionSize, color: c(...P.body), lineHeight: descriptionLineHeight, margin: bodyMargin, maxWidth: descriptionMaxWidth }}>
          {description}
        </p>
      )}
      {children}
    </div>
  );
}

export function LoadingMessage({
  children,
  fontSize,
  margin,
}: {
  children: ReactNode;
  fontSize?: string;
  margin?: string | number;
}) {
  const { c } = useTheme();
  return <p style={{ fontFamily: BODY, fontSize, fontStyle: "italic", color: c(...P.muted), margin }}>{children}</p>;
}
