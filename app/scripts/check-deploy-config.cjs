// vercel.json is the whole deploy contract for this site, and until now nothing checked it.
// `git grep vercel.json` found two hits, both descriptive: app/README.md and a comment in
// vite.config.ts. The file could be deleted outright and every one of the nine checks in
// verify.cjs would still pass, because all of them enumerate from src/, public/ and dist/ and
// none of them asks whether the config that decides how the site is SERVED is still there.
//
// Three things live in it and each fails differently:
//   - the security header stack, which fails silently and invisibly
//   - the /assets/ Cache-Control rule from #43, whose loss reverts every hashed bundle to
//     max-age=0, must-revalidate — a change no page would look different for
//   - the SPA rewrite, whose loss 404s every deep link on a site that is entirely deep links
//
// Values are asserted by role, not literally, so tightening a CSP or lengthening HSTS does not
// fail the build. max-age is the exception: a rule that is still present but weakened is exactly
// what a presence check cannot see.

const fs = require("fs");
const path = require("path");

const appDir = path.resolve(__dirname, "..");
const configPath = path.join(appDir, "vercel.json");

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

if (!fs.existsSync(configPath)) {
  fail("vercel.json is missing — the deploy contract is gone (security headers, the /assets/ "
       + "cache rule, and the SPA rewrite all go with it).");
  console.error("Deploy config check FAILED.");
  return;
}

let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, "utf8"));
} catch (error) {
  fail(`vercel.json does not parse: ${error.message}`);
  console.error("Deploy config check FAILED.");
  return;
}

const rules = Array.isArray(config.headers) ? config.headers : [];
const ruleFor = (source) => rules.find((rule) => rule.source === source);
const valueOf = (rule, key) =>
  (rule?.headers ?? []).find((h) => h.key.toLowerCase() === key.toLowerCase())?.value;

// --- security headers -----------------------------------------------------------------
const catchAll = ruleFor("/(.*)");
if (!catchAll) {
  fail("vercel.json has no catch-all /(.*) header rule — every security header is gone.");
} else {
  for (const key of [
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Referrer-Policy",
    "Permissions-Policy",
    "Strict-Transport-Security",
    "Content-Security-Policy",
  ]) {
    if (!valueOf(catchAll, key)) fail(`vercel.json catch-all rule lost ${key}.`);
  }
  const nosniff = valueOf(catchAll, "X-Content-Type-Options");
  if (nosniff && !/nosniff/.test(nosniff)) {
    fail(`X-Content-Type-Options is "${nosniff}", expected nosniff.`);
  }
}

// --- the cache rule from #43 ----------------------------------------------------------
const assets = ruleFor("/assets/(.*)");
if (!assets) {
  fail("the /assets/(.*) Cache-Control rule is gone — Vercel's default is max-age=0, "
       + "must-revalidate, so every repeat visit re-checks every content-hashed bundle.");
} else {
  const cacheControl = valueOf(assets, "Cache-Control");
  if (!cacheControl) {
    fail("the /assets/(.*) rule carries no Cache-Control.");
  } else {
    if (!/immutable/.test(cacheControl)) {
      fail(`/assets/ Cache-Control lost immutable: "${cacheControl}".`);
    }
    const maxAge = cacheControl.match(/max-age=(\d+)/);
    if (!maxAge) {
      fail(`/assets/ Cache-Control has no max-age: "${cacheControl}".`);
    } else if (Number(maxAge[1]) < 2592000) {
      fail(`/assets/ max-age is ${maxAge[1]}s, under 30 days. Content-hashed files should be `
           + "cached for a year — a changed file gets a changed name.");
    }
  }
}

// --- the SPA rewrite ------------------------------------------------------------------
// Without it every route except / is a 404 on a site that is almost entirely deep links.
const rewrites = Array.isArray(config.rewrites) ? config.rewrites : [];
const spa = rewrites.find((r) => r.destination === "/index.html");
if (!spa) {
  fail("vercel.json has no rewrite to /index.html — every deep route would 404.");
} else if (!/assets|content|art/.test(spa.source)) {
  fail(`the SPA rewrite no longer excludes the static directories: "${spa.source}". `
       + "Without those exclusions /assets/, /content/ and /art/ get index.html instead of files.");
}

if (process.exitCode) {
  console.error("Deploy config check FAILED — see above.");
} else {
  console.log(`Deploy config intact: ${rules.length} header rule(s), `
              + `${rewrites.length} rewrite(s), /assets/ cached immutable.`);
}
