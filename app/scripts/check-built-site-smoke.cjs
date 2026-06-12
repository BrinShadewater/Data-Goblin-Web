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

  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const shell = await fetchText(baseUrl, "/");
    assert(shell.includes('id="root"'), "App shell is missing #root.");

    const script = await fetchText(baseUrl, scriptMatch[1]);
    assert(script.length > 100000, "Built app script looks unexpectedly small.");

    const book = JSON.parse(await fetchText(baseUrl, "/content/book.json"));
    assert(Array.isArray(book.parts) && book.parts.length > 0, "book.json has no parts.");

    const glossary = JSON.parse(await fetchText(baseUrl, "/content/glossary.json"));
    assert(Array.isArray(glossary) && glossary.length > 0, "glossary.json is empty.");

    for (const route of ["/#/","/#/guide","/#/map","/#/loot","/#/receipts","/#/about","/#/contribute","/#/privacy"]) {
      const routeShell = await fetchText(baseUrl, route);
      assert(routeShell.includes('id="root"'), `${route} did not return the app shell.`);
    }

    console.log("Built site smoke checks passed.");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
