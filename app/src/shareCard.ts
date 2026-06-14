// Render a Goblin Check into a branded, shareable PNG (1200x630, OG-sized).
// Pure client-side canvas; no network. Returns nothing (triggers a download).

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Draw the card and return a PNG data URL (also used by tests). */
export async function renderCheckCard(rawText: string): Promise<string> {
  const W = 1200, H = 630, PAD = 64;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d")!;

  // Background + parchment panel + green accent rail.
  ctx.fillStyle = "#16301f"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#f4ecd8"; roundRect(ctx, 48, 48, W - 96, H - 96, 20); ctx.fill();
  ctx.fillStyle = "#2f7d4f"; ctx.fillRect(48, 48, 12, H - 96);

  const left = 48 + PAD;
  const contentW = W - 96 - PAD * 2 - 40;

  // Eyebrow.
  ctx.fillStyle = "#256b41";
  ctx.font = "800 28px Georgia, 'Times New Roman', serif";
  ctx.fillText("GOBLIN CHECK", left, 150);

  // Quote — size shrinks to fit a clean number of lines.
  const text = rawText
    .replace(/\s+/g, " ")
    .replace(/^[\u{1F9CC}\s]*GOBLIN CHECK\s*[\u2014\u2013-]\s*/iu, "")
    .trim();
  let size = 44;
  let lines: string[] = [];
  for (; size >= 26; size -= 2) {
    ctx.font = `italic ${size}px Georgia, 'Times New Roman', serif`;
    lines = wrapLines(ctx, text, contentW);
    if (lines.length * (size * 1.32) <= 300) break;
  }
  if (lines.length > 9) { lines = lines.slice(0, 9); lines[8] = lines[8].replace(/.{0,3}$/, "…"); }

  ctx.fillStyle = "#1b2a20";
  ctx.font = `italic ${size}px Georgia, 'Times New Roman', serif`;
  const lh = size * 1.34;
  let y = 210;
  for (const ln of lines) { ctx.fillText(ln, left, y); y += lh; }

  // Footer wordmark.
  ctx.fillStyle = "#6b6450";
  ctx.font = "700 24px Georgia, 'Times New Roman', serif";
  ctx.fillText("DATA GOBLIN", left, H - 110);
  ctx.fillStyle = "#8a8266";
  ctx.font = "400 20px Georgia, 'Times New Roman', serif";
  ctx.fillText("A field guide to AI, power & data in Canada · datagoblin.ca", left, H - 82);

  // Goblin check icon, top-right (best-effort).
  const icon = await loadImg("/art/icons/check-nav.webp");
  if (icon) {
    const s = 150;
    ctx.drawImage(icon, W - 48 - PAD - s, 92, s, s);
  }

  return cv.toDataURL("image/png");
}

export async function downloadCheckCard(text: string): Promise<void> {
  const url = await renderCheckCard(text);
  const a = document.createElement("a");
  a.href = url;
  a.download = "goblin-check.png";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
