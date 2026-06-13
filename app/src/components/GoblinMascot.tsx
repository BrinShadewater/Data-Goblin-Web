import goblinMascotImg from "../assets/goblin-mascot.webp";
import goblinHeadImg from "../assets/goblin-head-icon.webp";
import { artUrl } from "../useContent";

interface GoblinMascotProps {
  size?: number;
}

/** The full field-guide mascot — a friendly green goblin presenting data charts. */
export function GoblinMascot({ size = 170 }: GoblinMascotProps) {
  const h = Math.round(size * (482 / 607));
  return (
    <img
      src={goblinMascotImg}
      width={size}
      height={h}
      decoding="async"
      alt="Data Goblin mascot — a friendly green goblin presenting data charts on an easel"
      style={{ display: "block", objectFit: "contain" }}
    />
  );
}

/** Small goblin-head icon (the head-nav hero asset) used in the header,
 *  sidebars and callouts. Ships with true alpha and wide ears, so it renders
 *  uncropped — no circle mask. */
export function GoblinIcon({ size = 20 }: { size?: number }) {
  return (
    <img
      src={goblinHeadImg}
      width={size}
      height={size}
      decoding="async"
      alt="Data Goblin"
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        objectFit: "contain",
        transform: "scale(1.16)",
      }}
    />
  );
}

/** One of the image-generated nav/callout icons in public/art/icons/
 *  (e.g. name="check-nav" → art/icons/check-nav.webp). Decorative by
 *  default; pass `alt` when the icon carries meaning on its own. */
export function NavIcon({ name, size = 16, alt = "" }: { name: string; size?: number; alt?: string }) {
  return (
    <img
      src={artUrl(`icons/${name}.webp`)}
      width={size}
      height={size}
      alt={alt}
      aria-hidden={alt === "" || undefined}
      loading="lazy"
      decoding="async"
      style={{ display: "inline-block", verticalAlign: "middle", objectFit: "contain", flexShrink: 0 }}
    />
  );
}
