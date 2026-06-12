import registry from "./image-registry.json";

export type ResponsiveArtRole = "priority" | "content-panel";

export type ResponsiveArtEntry = {
  role: ResponsiveArtRole;
  width: number;
  height: number;
  widths: number[];
  alt?: string;
};

export const RESPONSIVE_ART = registry.responsive as Record<string, ResponsiveArtEntry>;
