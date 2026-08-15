const fs = require("fs");
const http = require("http");
const path = require("path");

const appDir = path.resolve(__dirname, "..");
const distDir = path.join(appDir, "dist");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Visible text a crawler that does not run JavaScript would read: drop script, style and
 * comments, then tags. GPTBot, ClaudeBot and PerplexityBot do not execute JS — they read the
 * raw HTML once and move on. Googlebot DOES render, so a prerender regression is invisible in
 * Search Console and needs catching here.
 */
function crawlerVisibleText(html) {
  return html
    .replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Every dist/**\/index.html prerender-meta produced, relative to dist. */
function collectRouteShells(dir = distDir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "assets" || entry.name === "content") continue;
      collectRouteShells(full, out);
    } else if (entry.name === "index.html") {
      out.push(path.relative(distDir, full).replace(/\\/g, "/"));
    }
  }
  return out;
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    const requestedPath = decodeURIComponent(url.pathname);
    const relativePath = requestedPath === "/" ? "index.html" : requestedPath.replace(/^\/+/, "");
    const filePath = path.resolve(distDir, relativePath);
    const safePath = filePath.startsWith(distDir + path.sep) || filePath === path.join(distDir, "index.html");
    const finalPath = safePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()
      ? filePath
      : path.join(distDir, "index.html");
    res.writeHead(200, { "content-type": contentType(finalPath) });
    fs.createReadStream(finalPath).pipe(res);
  });
}

async function fetchText(baseUrl, route) {
  const response = await fetch(`${baseUrl}${route}`);
  assert(response.ok, `${route} returned ${response.status}`);
  return response.text();
}

async function main() {
  const indexPath = path.join(distDir, "index.html");
  assert(fs.existsSync(indexPath), "dist/index.html not found. Run npm run build first.");

  const indexHtml = fs.readFileSync(indexPath, "utf8");
  const scriptMatch = indexHtml.match(/<script[^>]+src="([^"]+index-[^"]+\.js)"/);
  assert(scriptMatch, "Could not find built index script in dist/index.html.");
  assert(fs.readdirSync(path.join(distDir, "assets")).some((name) => /^react-vendor-.*\.js$/.test(name)), "Could not find split react-vendor chunk.");

  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const shell = await fetchText(baseUrl, "/");
    assert(shell.includes('id="root"'), "App shell is missing #root.");

    const script = await fetchText(baseUrl, scriptMatch[1]);
    assert(script.length > 20000, "Built app script looks unexpectedly small.");

    const book = JSON.parse(await fetchText(baseUrl, "/content/book.json"));
    assert(Array.isArray(book.parts) && book.parts.length > 0, "book.json has no parts.");

    const glossary = JSON.parse(await fetchText(baseUrl, "/content/glossary.json"));
    assert(Array.isArray(glossary) && glossary.length > 0, "glossary.json is empty.");

    for (const route of ["/#/","/#/guide","/#/map","/#/loot","/#/receipts","/#/about","/#/contribute","/#/privacy"]) {
      const routeShell = await fetchText(baseUrl, route);
      assert(routeShell.includes('id="root"'), `${route} did not return the app shell.`);
    }

    // ── Prerender guard ────────────────────────────────────────────────────────
    // prerender-meta.cjs writes a per-route shell with real copy into each
    // dist/<route>/index.html. That is what makes this site readable to AI crawlers,
    // which do not run JavaScript. If it silently stopped emitting them — or emitted
    // empty ones — every check above would still pass: dist/index.html would exist,
    // #root would be present, the bundle would be fine, and Googlebot (which renders)
    // would see no change. Nothing else in this suite would notice.
    //
    // Measured 2026-08-15: 84 shells; home 435 chars, /guide 1,181, /chapter/1 29,718,
    // /about 270 (the thinnest). Thresholds sit below the real values so ordinary copy
    // edits do not trip them, while a collapse to a bare shell fails hard.
    const shells = collectRouteShells();
    assert(
      shells.length >= 50,
      `expected prerender-meta to emit many route shells, found ${shells.length}. ` +
        "It may have failed silently — the build still exits 0 when it writes nothing useful.",
    );

    for (const shell of shells) {
      const html = fs.readFileSync(path.join(distDir, shell), "utf8");
      const body = html.replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, " ");
      const text = crawlerVisibleText(html);

      assert(/<h1[\s>]/i.test(body), `${shell} has no <h1> — crawlers cannot identify the page.`);
      assert(
        text.length > 200,
        `${shell} carries only ${text.length} chars of crawler-visible text. ` +
          "The prerendered copy has probably been lost.",
      );
    }

    // The chapters are the book. A hero-sized shell here means chapter prose stopped
    // being prerendered, which is the regression that would actually cost readers.
    // Existence is asserted separately so a missing shell reports as a prerender failure
    // rather than a raw ENOENT stack.
    const chapterOnePath = path.join(distDir, "chapter", "1", "index.html");
    assert(
      fs.existsSync(chapterOnePath),
      "chapter/1 shell is missing entirely — prerender-meta did not emit chapter routes.",
    );
    assert(
      crawlerVisibleText(fs.readFileSync(chapterOnePath, "utf8")).length > 5000,
      "chapter/1 shell lost its prerendered prose — chapters must ship real text, not just a hero.",
    );

    console.log(`Built site smoke checks passed (${shells.length} prerendered route shells verified).`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
