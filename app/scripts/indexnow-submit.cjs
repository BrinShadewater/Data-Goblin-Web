// IndexNow submitter. Reads the freshly built dist/sitemap.xml, pulls every <loc>,
// and pings the IndexNow API so participating engines (Bing, Yandex, Naver, Seznam)
// recrawl changed URLs within minutes instead of waiting to rediscover them.
//
// Runs as the last step of `npm run build`. It only actually submits on a Vercel
// PRODUCTION build (VERCEL_ENV=production) or when passed --force, so local builds
// and Vercel preview/dependabot builds do NOT spam the API. It NEVER fails the
// build: any error is logged and the process still exits 0.
//
// Key: the file public/16ecd1f71d3d7f14815d207aaefa1719.txt is copied to the site
// root at build time and is what IndexNow fetches to verify ownership.
const fs = require("fs");
const path = require("path");

const HOST = "datagoblin.ca";
const KEY = "16ecd1f71d3d7f14815d207aaefa1719";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";
const DIST = process.env.PRERENDER_DIST ? path.resolve(process.env.PRERENDER_DIST) : path.resolve(__dirname, "../dist");

async function main() {
  const force = process.argv.includes("--force");
  const isProd = process.env.VERCEL_ENV === "production";

  const sitemapPath = path.join(DIST, "sitemap.xml");
  if (!fs.existsSync(sitemapPath)) {
    console.log("indexnow: no dist/sitemap.xml — skipping");
    return;
  }
  const xml = fs.readFileSync(sitemapPath, "utf8");
  const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()).filter(Boolean);
  if (!urlList.length) {
    console.log("indexnow: sitemap had no <loc> URLs — skipping");
    return;
  }

  if (!isProd && !force) {
    console.log(`indexnow: not a production build (VERCEL_ENV=${process.env.VERCEL_ENV || "unset"}) — skipping submit of ${urlList.length} URLs. Pass --force to override.`);
    return;
  }

  const body = { host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    console.log(`indexnow: submitted ${urlList.length} URLs -> HTTP ${res.status} ${res.statusText}`);
  } catch (e) {
    console.warn("indexnow: submit failed (non-fatal) —", e.message);
  } finally {
    clearTimeout(timeout);
  }
}

main().catch((e) => console.warn("indexnow: unexpected error (non-fatal) —", e && e.message)).finally(() => process.exit(0));
