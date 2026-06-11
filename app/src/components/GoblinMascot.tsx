import goblinMascotImg from "../assets/goblin-mascot.png";
import goblinHeadImg from "../assets/goblin-head-icon.png";

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
      alt="Data Goblin mascot — a friendly green goblin presenting data charts on an easel"
      style={{ display: "block", objectFit: "contain" }}
    />
  );
}

/** Small round goblin-head icon used in sidebars and callouts. */
export function GoblinIcon({ size = 20 }: { size?: number }) {
  return (
    <img
      src={goblinHeadImg}
      width={size}
      height={size}
      alt="Data Goblin"
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        objectFit: "cover",
        borderRadius: "50%",
      }}
    />
  );
}
