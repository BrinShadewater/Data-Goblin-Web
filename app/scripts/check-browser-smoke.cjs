const fs = require("fs");
const http = require("http");
const path = require("path");
const { chromium } = require("playwright");

const appDir = path.resolve(__dirname, "..");
const distDir = path.join(appDir, "dist");
const artifactDir = path.join(appDir, "output", "playwright", "browser-smoke");

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 900, height: 1100 },
  { name: "mobile", width: 390, height: 844 },
];

const ROUTES = [
  { path: "/", text: /Data Goblin/i },
  { path: "/guide", text: /Front\s*Matter|Trailhead|Data\s*Goblin/i },
  { path: "/chapter/1", text: /What\s*AI\s*Actually\s*Is|Training\s*Set|First\s*Clearing/i },
  { path: "/map", text: /The Map/i },
  { path: "/loot", text: /Loot \(Glossary\)/i },
  { path: "/receipts", text: /Receipts/i },
  { path: "/about", text: /About This Guide|Why/i },
  { path: "/contribute", text: /Contribute/i },
  { path: "/privacy", text: /Privacy Policy/i },
];

const TIMED_ROUTES = [
  { name: "landing", path: "/", text: /Data\s*Goblin/i, maxMs: 3000 },
  { name: "guide", path: "/guide", text: /Front\s*Matter|Trailhead|Data\s*Goblin/i, maxMs: 4500 },
  { name: "map", path: "/map", text: /The Map/i, maxMs: 3500 },
];

const CONSENT = {
  essential: true,
  preferences: true,
  analytics: false,
  decidedAt: "2026-06-12T00:00:00.000Z",
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".webp")) return "image/webp";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  return "application/octet-stream";
}

function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    const requestedPath = decodeURIComponent(url.pathname);
    const relativePath = requestedPath === "/" ? "index.html" : requestedPath.replace(/^\/+/, "");
    let filePath = path.resolve(distDir, relativePath);
    const safePath = filePath.startsWith(distDir + path.sep) || filePath === path.join(distDir, "index.html");
    if (safePath && fs.statSync(filePath, { throwIfNoEntry: false })?.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
    const finalPath = safePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()
      ? filePath
      : path.join(distDir, "index.html");
    res.writeHead(200, { "content-type": contentType(finalPath) });
    fs.createReadStream(finalPath).pipe(res);
  });
}

async function withAppPage(browser, baseUrl, viewport, fn, { javaScriptEnabled = true } = {}) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    colorScheme: "light",
    reducedMotion: "reduce",
    javaScriptEnabled,
  });
  if (javaScriptEnabled) {
    await context.addInitScript((consent) => {
      window.localStorage.setItem("data-goblin-cookie-consent", JSON.stringify(consent));
    }, CONSENT);
  }
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  try {
    await fn(page);
    assert(pageErrors.length === 0, `Page errors: ${pageErrors.join("; ")}`);
  } catch (error) {
    await fs.promises.mkdir(artifactDir, { recursive: true });
    const safeName = `${viewport.name}-${Date.now()}.png`;
    await page.screenshot({ path: path.join(artifactDir, safeName), fullPage: true }).catch(() => {});
    error.message = `${error.message} (screenshot: output/playwright/browser-smoke/${safeName})`;
    throw error;
  } finally {
    await context.close();
  }
}

async function assertLoadedPage(page, baseUrl, route, expectedText) {
  await page.goto(`${baseUrl}${route.path}`, { waitUntil: "networkidle" });
  await page.locator("#root").waitFor({ state: "visible", timeout: 10000 });
  const rootBox = await page.locator("#root").boundingBox();
  assert(rootBox && rootBox.width > 250 && rootBox.height > 250, `${route.path} app root is too small or missing.`);
  const bodyText = await page.locator("body").innerText();
  assert(expectedText.test(bodyText), `${route.path} did not render expected text ${expectedText}.`);
  const bodyLength = bodyText.trim().length;
  assert(bodyLength > 80, `${route.path} looks blank.`);
}

async function assertImagesLoaded(page, routeName) {
  await page.waitForFunction(() =>
    Array.from(document.images)
      .filter((img) => {
        if (img.offsetParent === null) return false;
        const rect = img.getBoundingClientRect();
        return rect.bottom >= 0 && rect.right >= 0 && rect.top <= window.innerHeight && rect.left <= window.innerWidth;
      })
      .every((img) => img.complete && img.naturalWidth > 0),
    null,
    { timeout: 5000 }
  ).catch(() => {});
  const broken = await page.evaluate(() =>
    Array.from(document.images)
      .filter((img) => {
        if (img.offsetParent === null || (img.complete && img.naturalWidth > 0)) return false;
        const rect = img.getBoundingClientRect();
        return rect.bottom >= 0 && rect.right >= 0 && rect.top <= window.innerHeight && rect.left <= window.innerWidth;
      })
      .map((img) => img.getAttribute("src") || img.currentSrc || img.alt || "unknown image")
  );
  assert(broken.length === 0, `${routeName} has broken visible images: ${broken.join(", ")}`);
}

async function runRouteSmoke(browser, baseUrl) {
  for (const viewport of VIEWPORTS) {
    await withAppPage(browser, baseUrl, viewport, async (page) => {
      for (const route of ROUTES) {
        await assertLoadedPage(page, baseUrl, route, route.text);
        await assertImagesLoaded(page, `${viewport.name} ${route.path}`);
      }
    });
    console.log(`PASS routes: ${viewport.name}`);
  }
}

async function runCookieSmoke(browser, baseUrl) {
  const context = await browser.newContext({ viewport: { width: 1200, height: 820 } });
  const page = await context.newPage();
  try {
    await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
    await page.getByText("Cookie Notice").waitFor({ state: "visible" });

    await page.getByRole("button", { name: "Manage Preferences" }).click();
    await page.getByRole("dialog", { name: "Cookie preferences" }).waitFor({ state: "visible" });
    await page.getByLabel("Analytics").check();
    await page.getByRole("button", { name: "Save Choices" }).click();
    await page.getByText("Cookie Notice").waitFor({ state: "hidden" });
    const managed = await page.evaluate(() => JSON.parse(localStorage.getItem("data-goblin-cookie-consent")));
    assert(managed.preferences === true && managed.analytics === true, "Managed cookie choices did not persist.");
  } finally {
    await context.close();
  }

  for (const [buttonName, expected] of [
    ["Only Essential", { preferences: false, analytics: false }],
    ["Accept All", { preferences: true, analytics: true }],
  ]) {
    const buttonContext = await browser.newContext({ viewport: { width: 1200, height: 820 } });
    const buttonPage = await buttonContext.newPage();
    try {
      await buttonPage.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
      await buttonPage.getByText("Cookie Notice").waitFor({ state: "visible" });
      await buttonPage.getByRole("button", { name: buttonName }).click();
      await buttonPage.getByText("Cookie Notice").waitFor({ state: "hidden" });
      const consent = await buttonPage.evaluate(() => JSON.parse(localStorage.getItem("data-goblin-cookie-consent")));
      assert(consent.preferences === expected.preferences && consent.analytics === expected.analytics, `${buttonName} did not persist expected consent.`);
    } finally {
      await buttonContext.close();
    }
  }
  console.log("PASS cookies");
}

async function runInteractionSmoke(browser, baseUrl) {
  await withAppPage(browser, baseUrl, VIEWPORTS[0], async (page) => {
    await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: /Open the guide/i }).click();
    await page.waitForURL(/\/guide/);

    // waitForURL only proves the URL changed, not that the reader route has
    // mounted. Typing into the search box before React is listening loses the
    // input event, and the next render resets the controlled input to "" — the
    // search silently never happens and the assertion below times out. Waiting
    // for the reader's own page indicator proves the route rendered and the app
    // is interactive.
    await page.getByText(/PAGE\s*1\s*OF/i).first().waitFor({ state: "visible" });

    await page.getByPlaceholder("Search the guide…").fill("privacy");
    await page.getByText(/result.*privacy|results.*privacy/i).waitFor({ state: "visible" });
    await page.keyboard.press("Escape").catch(() => {});
  });

  await withAppPage(browser, baseUrl, VIEWPORTS[0], async (page) => {
    await page.goto(`${baseUrl}/map`, { waitUntil: "networkidle" });
    const mapImage = page.getByAltText("Fantasy map of Canada for Data Goblin, with the goblin standing in front");
    await mapImage.waitFor({ state: "visible" });
    const naturalWidth = await mapImage.evaluate((img) => img.naturalWidth);
    assert(naturalWidth > 0, "Map image did not load.");
  });

  await withAppPage(browser, baseUrl, VIEWPORTS[0], async (page) => {
    // The /api/contribute serverless function isn't available to this static
    // smoke server, so mock a success response and assert the form handles it.
    await page.route("**/api/contribute", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) })
    );
    await page.goto(`${baseUrl}/contribute`, { waitUntil: "networkidle" });
    await page.getByPlaceholder(/Chapter 8/i).fill("Chapter 8");
    await page.locator("textarea[required]").fill("Browser smoke test contribution with a source link.");
    await page.getByRole("button", { name: /Submit Report/i }).click();
    await page.getByText(/Thank you, goblin/i).waitFor({ state: "visible" });
  });
  console.log("PASS interactions");
}

async function runGuideNavigationSmoke(browser, baseUrl) {
  const editions = [
    { prefix: "", title: /Data as Raw Material/i },
    { prefix: "/fr", title: /matière première/i },
  ];
  for (const viewport of VIEWPORTS.filter(({ name }) => name !== "tablet")) {
    for (const { prefix, title } of editions) {
      const target = `${prefix}/chapter/3`;
      for (const javaScriptEnabled of [true, false]) {
        const scenario = `${prefix || "English"} · ${viewport.name} · JavaScript ${javaScriptEnabled ? "on" : "off"}`;
        await withAppPage(browser, baseUrl, viewport, async (page) => {
          await page.goto(`${baseUrl}${prefix}/guide`);
          if (javaScriptEnabled && viewport.name === "mobile") {
            await page.getByRole("button", { name: "Open menu", exact: true }).click();
          }
          const link = page.getByRole("link", { name: title });
          assert(await link.getAttribute("href") === target, `${scenario}: Chapter 3 points to the wrong URL.`);
          await link.click();
          await page.waitForURL(`${baseUrl}${target}`);
          await page.getByRole("heading", { level: 1, name: title }).waitFor({ state: "visible" });
          if (!javaScriptEnabled) {
            const article = page.getByRole("article");
            await article.waitFor({ state: "visible" });
            assert((await article.innerText()).trim().length > 1000, `${scenario}: Chapter text is missing.`);
          }
        }, { javaScriptEnabled });
        console.log(`PASS guide navigation: ${scenario}`);
      }
    }
  }
}

async function runChapterDiscoverySmoke(browser, baseUrl) {
  for (const prefix of ["", "/fr"]) {
    const target = `${prefix}/chapter/5`;
    const title = prefix ? /histoire.*IA.*Canada/i : /Canada.*AI Story/i;
    await withAppPage(browser, baseUrl, VIEWPORTS[2], async (page) => {
      await page.goto(`${baseUrl}${prefix}/map`);
      const link = page.getByRole("link", { name: title });
      assert(await link.getAttribute("href") === target, "The static Map points to the wrong Chapter 5.");
      await link.click();
      await page.waitForURL(`${baseUrl}${target}`);
      await page.getByRole("heading", { level: 1, name: title }).waitFor({ state: "visible" });
      await page.getByRole("article").waitFor({ state: "visible" });
    }, { javaScriptEnabled: false });

    await withAppPage(browser, baseUrl, VIEWPORTS[0], async (page) => {
      const response = await page.goto(`${baseUrl}${prefix}/topic/governance`);
      assert(response?.ok() && (await response.text()).includes(`href="${target}"`),
        "The governance HTML is missing its localized Chapter 5 link.");
      const link = page.getByRole("link", { name: title });
      assert(await link.getAttribute("href") === target, "The rendered governance link points to the wrong Chapter 5.");
      await link.click();
      await page.waitForURL(`${baseUrl}${target}`);
      await page.getByRole("heading", { level: 1, name: title }).waitFor({ state: "visible" });
    });
    console.log(`PASS Chapter 5 discovery: ${prefix || "English"} Map and governance`);
  }
}

async function runLanguageSwitchSmoke(browser, baseUrl) {
  const routes = [
    { path: "/chapter/3", en: /Data as Raw Material/i, fr: /matière première/i },
    { path: "/chapter/5", en: /Canada.*AI Story/i, fr: /histoire.*IA.*Canada/i },
    { path: "/topic/governance", en: /How AI Is Governed in Canada/i, fr: /gouvernée au Canada/i },
    { path: "/topic/privacy", en: /AI, Privacy & Surveillance/i, fr: /vie privée et surveillance/i },
  ];
  const buttons = {
    en: "Read in English",
    fr: "Lire en français (traduction automatique)",
  };
  for (const viewport of VIEWPORTS.filter(({ name }) => name !== "tablet")) {
    const mobile = viewport.name === "mobile";
    for (const route of routes) {
      await withAppPage(browser, baseUrl, viewport, async (page) => {
        await page.goto(`${baseUrl}${route.path}`);
        await page.getByRole("heading", { level: 1, name: route.en }).waitFor();
        for (const language of ["fr", "en"]) {
          const previousLanguage = language === "fr" ? "en" : "fr";
          const previousPath = previousLanguage === "fr" ? `/fr${route.path}` : route.path;
          const target = language === "fr" ? `/fr${route.path}` : route.path;
          if (mobile) await page.getByRole("button", { name: "Open menu", exact: true }).click();
          const controls = mobile ? page.getByRole("dialog", { name: "Menu" }) : page.getByRole("group", { name: "Language", exact: true });
          const current = controls.getByRole("button", { name: buttons[previousLanguage], pressed: true });
          await current.waitFor({ timeout: 8000 });
          if (mobile && route.path.startsWith("/chapter/")) {
            await controls.locator(`a[href="${previousPath}"][aria-current="page"]`).waitFor({ timeout: 8000 });
          }
          await controls.getByRole("button", { name: buttons[language] }).click();
          await page.waitForURL(`${baseUrl}${target}`, { timeout: 8000 });
          if (mobile) await controls.waitFor({ state: "hidden", timeout: 8000 });
          await page.getByRole("heading", { level: 1, name: route[language] }).waitFor({ timeout: 8000 });
          await page.locator(`html[lang="${language}-CA"]`).waitFor({ state: "attached", timeout: 8000 });
        }
      });
      console.log(`PASS language switch: ${viewport.name} ${route.path} (English ↔ French)`);
    }
  }
}

async function runTimingSmoke(browser, baseUrl) {
  await withAppPage(browser, baseUrl, VIEWPORTS[0], async (page) => {
    for (const route of TIMED_ROUTES) {
      await page.evaluate(() => {
        performance.clearResourceTimings();
        performance.clearMarks();
        performance.clearMeasures();
      });
      const started = Date.now();
      await assertLoadedPage(page, baseUrl, route, route.text);
      await assertImagesLoaded(page, `timing ${route.path}`);
      const elapsed = Date.now() - started;
      const metrics = await page.evaluate(() => {
        const resources = performance.getEntriesByType("resource");
        const jsBytes = resources
          .filter((entry) => entry.name.includes("/assets/") && entry.name.endsWith(".js"))
          .reduce((sum, entry) => sum + (entry.transferSize || entry.encodedBodySize || 0), 0);
        const imageBytes = resources
          .filter((entry) => /\.(webp|png|jpg|jpeg|ico)(\?|$)/i.test(entry.name))
          .reduce((sum, entry) => sum + (entry.transferSize || entry.encodedBodySize || 0), 0);
        const paints = Object.fromEntries(
          performance.getEntriesByType("paint").map((entry) => [entry.name, Math.round(entry.startTime)])
        );
        return { jsBytes, imageBytes, paints };
      });
      assert(elapsed <= route.maxMs, `${route.name} took ${elapsed}ms, above timing budget ${route.maxMs}ms.`);
      console.log(`PASS timing: ${route.name} ${elapsed}ms · JS ${Math.round(metrics.jsBytes / 1024)} kB · images ${Math.round(metrics.imageBytes / 1024)} kB · FCP ${metrics.paints["first-contentful-paint"] ?? "n/a"}ms`);
    }
  });
}

async function main() {
  assert(fs.existsSync(path.join(distDir, "index.html")), "dist/index.html not found. Run npm run build first.");
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const browser = await chromium.launch();

  try {
    await runLanguageSwitchSmoke(browser, baseUrl);
    await runGuideNavigationSmoke(browser, baseUrl);
    await runChapterDiscoverySmoke(browser, baseUrl);
    await runRouteSmoke(browser, baseUrl);
    await runCookieSmoke(browser, baseUrl);
    await runInteractionSmoke(browser, baseUrl);
    await runTimingSmoke(browser, baseUrl);
    console.log("Browser smoke checks passed.");
  } finally {
    await browser.close().catch(() => {});
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
