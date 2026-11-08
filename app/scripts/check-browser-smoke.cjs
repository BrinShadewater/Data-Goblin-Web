const fs = require("fs");
const http = require("http");
const path = require("path");
const { chromium } = require("playwright");
const searchQuestions = require("./search-questions.json");
const searchHoldoutQuestions = require("./search-holdout-questions.json");

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

async function withAppPage(browser, baseUrl, viewport, fn, { javaScriptEnabled = true, hasTouch = false } = {}) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    colorScheme: "light",
    reducedMotion: "reduce",
    javaScriptEnabled,
    hasTouch,
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
    await page.getByRole("link", { name: /AI, Privacy & Surveillance/ }).click();
    await page.waitForURL(`${baseUrl}/topic/privacy`);
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
            await page.getByRole("button", { name: prefix ? "Ouvrir le menu" : "Open menu", exact: true }).click();
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
          if (mobile) await page.getByRole("button", { name: previousLanguage === "fr" ? "Ouvrir le menu" : "Open menu", exact: true }).click();
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

async function runMapToReaderKeyboardSmoke(browser, baseUrl) {
  const cases = [
    ...VIEWPORTS.filter(({ name }) => name !== "tablet"),
    { name: "mobile-no-receipts", width: 390, height: 1800, noReceipts: true },
    { name: "mobile-delayed-receipts", width: 390, height: 844, delayedReceipts: true },
  ];
  for (const viewport of cases) {
    for (const prefix of ["", "/fr"]) {
      await withAppPage(browser, baseUrl, viewport, async (page) => {
        let releaseReceipts;
        const receiptsGate = new Promise((resolve) => { releaseReceipts = resolve; });
        if (viewport.noReceipts || viewport.delayedReceipts) {
          await page.route("**/claim-anchors.json", async (route) => {
            if (viewport.noReceipts) return route.fulfill({ json: {} });
            await receiptsGate;
            await route.continue();
          });
        }
        await page.goto(`${baseUrl}${prefix}/map`);
        const target = `${prefix}/chapter/5`;
        const link = page.locator(`#dg-main a[href="${target}"]`);
        await link.waitFor({ state: "visible" });
        const focused = () => link.evaluate((el) => el === document.activeElement);
        for (let step = 0; step < 35 && !(await focused()); step++) {
          await page.keyboard.press("Tab");
        }
        assert(await focused(), "Chapter 5 on the Map is unreachable by Tab.");
        await page.keyboard.press("Enter");
        await page.waitForURL(`${baseUrl}${target}`);
        await page.waitForFunction(() => document.activeElement?.matches("main#dg-main"),
          null, { timeout: 5000 });
        const reader = page.locator("main#dg-main");
        assert(await reader.getByRole("heading", {
          level: 1,
          name: prefix ? /histoire.*IA.*Canada/i : /Canada.*AI Story/i,
        }).isVisible(), "Focus reached the reader before its chapter content appeared.");
        await page.keyboard.press("Tab");
        assert(await reader.evaluate((el) => el.contains(document.activeElement)),
          "Tab after arrival should continue inside the chapter.");
        if (viewport.noReceipts || viewport.delayedReceipts) {
          const scroller = reader.locator('[data-reader-scroll]');
          assert(await scroller.evaluate((el) => el === document.activeElement),
            "Tab must reach the stable reader scroll area, including when it does not overflow.");
          if (viewport.delayedReceipts) {
            releaseReceipts();
            await reader.locator('button[aria-haspopup="dialog"]').first().waitFor();
            assert(await scroller.evaluate((el) => el === document.activeElement),
              "Loading inline receipt links must not remove focus from the reader scroll area.");
          }
        }
      });
      console.log(`PASS Map-to-reader keyboard focus: ${viewport.name} ${prefix || "English"}`);
    }
  }
}

async function runMobileDrawerKeyboardSmoke(browser, baseUrl) {
  const viewport = VIEWPORTS.find(({ name }) => name === "mobile");
  for (const prefix of ["", "/fr"]) {
    await withAppPage(browser, baseUrl, viewport, async (page) => {
      await page.goto(`${baseUrl}${prefix}/chapter/5`);
      const menu = page.getByRole("button", { name: prefix ? "Ouvrir le menu" : "Open menu", exact: true });
      const drawer = page.getByRole("dialog", { name: "Menu", exact: true });
      const closeName = prefix ? "Fermer le menu" : "Close menu";
      const close = drawer.getByRole("button", { name: closeName, exact: true });
      const focused = (locator) => locator.evaluate((el) => el === document.activeElement);
      await menu.waitFor({ state: "visible" });
      for (let step = 0; step < 12 && !(await focused(menu)); step++) {
        await page.keyboard.press("Tab");
      }
      assert(await focused(menu), "The menu button is unreachable by Tab.");

      await page.keyboard.press("Space");
      await close.waitFor({ state: "visible" });
      await page.waitForFunction((name) => document.activeElement?.matches(
        `[role="dialog"] button[aria-label="${name}"]`
      ), closeName, { timeout: 3000 });
      await page.keyboard.press("Tab");
      assert(await drawer.evaluate((el) => el.contains(document.activeElement)),
        "Tab reached the page behind the open drawer.");
      await page.keyboard.press("Shift+Tab");
      assert(await focused(close), "Shift+Tab did not return to the close button.");
      await page.keyboard.press("Shift+Tab");
      assert(await drawer.evaluate((el) => el.contains(document.activeElement)) && !(await focused(close)),
        "Shift+Tab did not wrap to the end of the drawer.");
      await page.keyboard.press("Tab");
      assert(await focused(close), "Tab did not wrap to the close button.");
      await page.keyboard.press("Escape");
      await drawer.waitFor({ state: "hidden" });
      assert(await focused(menu), "Escape must return focus to the menu button.");

      await menu.press("Enter");
      await close.click();
      await drawer.waitFor({ state: "hidden" });
      assert(await focused(menu), "The close button must return focus to the menu button.");

      await menu.press("Enter");
      const map = drawer.getByRole("link", { name: prefix ? "Carte" : "Map", exact: true });
      assert(await map.getAttribute("href") === `${prefix}/map`, "The Map link must use the current language.");
      await map.press("Enter");
      await page.waitForURL(`${baseUrl}${prefix}/map`);
      await drawer.waitFor({ state: "hidden" });
    });
    console.log(`PASS mobile drawer keyboard focus: ${prefix || "English"}`);
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

async function runFrenchReaderCopySmoke(browser, baseUrl) {
  const mobile = VIEWPORTS.find(({ name }) => name === "mobile");
  const intro = "Data Goblin est un guide interactif gratuit sur l’IA, les centres de données et la souveraineté numérique au Canada. Consultez les sources qui étayent les affirmations du guide.";
  for (const javaScriptEnabled of [true, false]) {
    await withAppPage(browser, baseUrl, mobile, async (page) => {
      await page.goto(baseUrl + "/fr");
      await page.getByText(intro, { exact: true }).waitFor();
      assert(await page.locator('meta[name="description"]').getAttribute("content") === intro,
        "French homepage description differs from the visible intro.");

      await page.goto(baseUrl + "/fr/map");
      await page.getByRole("link", { name: "Hypertrucages et désinformation", exact: true }).waitFor();
      assert(await page.locator('a[href^="/fr/chapter/"]').evaluateAll((links) => {
        const paths = new Set(links.map((link) => link.getAttribute("href")));
        return Array.from({ length: 21 }, (_, i) => paths.has("/fr/chapter/" + (i + 1))).every(Boolean);
      }), "French Map must link to all 21 chapters.");
      if (!javaScriptEnabled) return;
      await page.getByText(/^Les 21 chapitres du guide/).waitFor();

      await page.goto(baseUrl + "/fr/chapter/2");
      // The compact controls mount before chapter data and pagination are ready.
      await page.getByText(/^Page 1 sur (?:[2-9]|[1-9]\d+)$/).waitFor();
      await page.getByRole("button", { name: "Page précédente", exact: true }).last().waitFor();
      await page.getByRole("button", { name: "Page suivante", exact: true }).last().click();
      await page.getByText(/^Page 2 sur \d+$/).waitFor();
      await page.getByRole("button", { name: "Ajouter un signet à cette page", exact: true }).click();
      const bookmarked = page.getByRole("button", { name: "Supprimer le signet", exact: true });
      await bookmarked.waitFor();
      assert(await bookmarked.getAttribute("aria-pressed") === "true", "The French bookmark did not toggle.");
      await bookmarked.click();
      await page.getByRole("button", { name: "Ajouter un signet à cette page", exact: true }).waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        "French reader overflows the mobile viewport.");
    }, { javaScriptEnabled });
    console.log(`PASS French copy and reader controls: JavaScript ${javaScriptEnabled ? "on" : "off"}`);
  }
}

async function runGovernanceSummarySmoke(browser, baseUrl) {
  for (const { prefix, heading } of [
    { prefix: "", heading: "Start here" },
    { prefix: "/fr", heading: "Commencez ici." },
  ]) {
    const url = `${baseUrl}${prefix}/topic/governance`;
    const readSummary = async (summary) => {
      await summary.locator("p").first().waitFor({ state: "visible" });
      const paragraphs = await summary.locator("p").allTextContents();
      return paragraphs.map((text) => text.replace(/\s+/g, " ").trim());
    };
    let rendered;
    await withAppPage(browser, baseUrl, VIEWPORTS[0], async (page) => {
      await page.goto(url);
      const card = page.locator(`#dg-main a[href="${prefix}/chapter/17"]`).locator("..");
      await card.getByText(heading, { exact: true }).waitFor({ state: "visible" });
      const markdown = card.locator(":scope > div").filter({ has: page.locator("p") });
      rendered = await readSummary(markdown);
    });
    await withAppPage(browser, baseUrl, VIEWPORTS[0], async (page) => {
      await page.goto(url);
      const summary = page.locator("[data-prerender-topic-summary]");
      await summary.getByRole("heading", { name: heading, exact: true }).waitFor({ state: "visible" });
      const fallback = await readSummary(summary);
      assert(JSON.stringify(fallback) === JSON.stringify(rendered),
        `${prefix || "English"} Governance summary differs between static and rendered pages.`);
    }, { javaScriptEnabled: false });
    console.log(`PASS Governance summary parity: ${prefix || "English"}`);
  }
}

async function runMobileDrawerImageSmoke(browser, baseUrl) {
  for (const viewport of VIEWPORTS.filter(({ name }) => name !== "desktop")) {
    for (const prefix of ["", "/fr"]) {
      await withAppPage(browser, baseUrl, viewport, async (page) => {
        const requests = [];
        page.on("request", (request) => {
          if (request.resourceType() === "image") requests.push(new URL(request.url()).pathname);
        });
        await page.goto(`${baseUrl}${prefix}/chapter/5`, { waitUntil: "networkidle" });
        const menu = page.getByRole("button", { name: prefix ? "Ouvrir le menu" : "Open menu", exact: true });
        const panel = page.locator('[role="dialog"][aria-label="Menu"]');
        await menu.waitFor({ state: "visible" });
        assert(!requests.some((url) => url.endsWith("/forge-nav.webp")), "Closed mobile menu downloaded its Updates icon.");
        assert(await panel.locator("img").count() === 0, "Closed mobile menu mounted image content.");
        await menu.click();
        const updates = panel.locator('img[src$="/forge-nav.webp"]');
        await updates.scrollIntoViewIfNeeded();
        await page.waitForFunction(() => {
          const img = document.querySelector('[role="dialog"] img[src$="/forge-nav.webp"]');
          return img?.complete && img.naturalWidth > 0;
        });
        assert(requests.some((url) => url.endsWith("/forge-nav.webp")), "Opening the menu did not load its icon.");
        await panel.getByRole("button", { name: prefix ? "Fermer le menu" : "Close menu", exact: true }).scrollIntoViewIfNeeded();
        if (process.env.MENU_IMAGE_SCREENSHOTS) {
          fs.mkdirSync(process.env.MENU_IMAGE_SCREENSHOTS, { recursive: true });
          await page.screenshot({ path: path.join(process.env.MENU_IMAGE_SCREENSHOTS, `${viewport.name}-${prefix ? "fr" : "en"}-open.png`) });
        }
        await page.keyboard.press("Escape");
        await panel.waitFor({ state: "hidden" });
        assert(await panel.locator("img").count() === 0, "Closed menu retained image content after its animation.");
        assert(await menu.evaluate((el) => el === document.activeElement), "Menu close lost focus return.");
        await menu.click();
        // Reopening before the closing timer expires must cancel that timer.
        await page.keyboard.press("Escape");
        await menu.click();
        await page.waitForTimeout(350);
        assert(await panel.isVisible() && await panel.locator("img").count() > 0, "Rapid reopen lost menu content.");
        const map = panel.getByRole("link", { name: prefix ? "Carte" : "Map", exact: true });
        await map.click();
        await page.waitForURL(`${baseUrl}${prefix}/map`);
        await panel.waitFor({ state: "hidden" });
      });
      console.log(`PASS mobile drawer images: ${viewport.name} ${prefix || "English"}`);
    }
  }
}

async function runChapterCoverImageSmoke(browser, baseUrl) {
  const cases = [
    { name: "desktop", width: 1440, height: 900, dpr: 1, css: 250, candidate: "-250w" },
    { name: "mobile", width: 390, height: 844, dpr: 3, css: 170, candidate: "-510w" },
    { name: "tablet", width: 900, height: 1100, dpr: 2, css: 220, candidate: "-510w" },
    { name: "desktop-high-dpr", width: 1440, height: 900, dpr: 4, css: 250, candidate: "" },
  ];
  for (const chapter of [2, 5, 6, 8, 12]) {
    const stem = `ch${chapter}-cover-medium`;
    for (const fixture of cases) for (const prefix of ["", "/fr"]) {
      const context = await browser.newContext({ viewport: { width: fixture.width, height: fixture.height }, deviceScaleFactor: fixture.dpr });
      try {
        await context.addInitScript((consent) => localStorage.setItem("data-goblin-cookie-consent", JSON.stringify(consent)), CONSENT);
        const page = await context.newPage();
        const requests = [], errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        page.on("request", (r) => { if (r.resourceType() === "image" && new URL(r.url()).pathname.includes(`/${stem}`)) requests.push(r.url()); });
        await page.goto(`${baseUrl}${prefix}/chapter/${chapter}`, { waitUntil: "networkidle" });
        const cover = page.locator(`img[src$="/${stem}.webp"]`);
        await cover.waitFor({ state: "visible" });
        const info = await cover.evaluate((img) => ({ src: img.currentSrc, set: img.srcset, sizes: img.sizes, alt: img.getAttribute("alt"), hidden: img.getAttribute("aria-hidden"), loaded: img.complete && img.naturalWidth > 0, width: img.getBoundingClientRect().width, height: img.getBoundingClientRect().height }));
        assert(info.loaded, "Chapter cover failed to load.");
        assert(info.src.endsWith(`/${stem}${fixture.candidate}.webp`), `Wrong cover candidate: ${info.src}`);
        assert(info.set.includes(`/${stem}.webp 880w`) && !info.set.includes("-880w.webp"), "Cover original-width fallback is invalid.");
        assert(info.sizes === `${fixture.css}px` && Math.abs(info.width - fixture.css) < 1 && Math.abs(info.height - fixture.css) < 1, "Cover sizes or rendered dimensions changed.");
        assert(info.alt === "" && info.hidden === "true", "Decorative cover accessibility changed.");
        assert(requests.length === 1 && requests[0] === info.src, "Cover downloaded duplicate or unused candidates.");
        assert(errors.length === 0, `Page errors: ${errors.join("; ")}`);
        if (process.env.COVER_IMAGE_SCREENSHOTS && ["desktop", "mobile"].includes(fixture.name)) {
          fs.mkdirSync(process.env.COVER_IMAGE_SCREENSHOTS, { recursive: true });
          await page.screenshot({ path: path.join(process.env.COVER_IMAGE_SCREENSHOTS, `ch${chapter}-${fixture.name}-${prefix ? "fr" : "en"}.png`) });
        }
        console.log(`PASS chapter cover: ch${chapter} ${fixture.name} ${prefix || "English"}`);
      } finally { await context.close(); }
    }
  }
}

async function runHeroImageRequestsSmoke(browser, baseUrl) {
  for (const viewport of VIEWPORTS.filter(({ name }) => name !== "tablet")) {
    for (const prefix of ["", "/fr"]) {
      for (const route of ["", "/about", "/chapter/5"]) {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          deviceScaleFactor: viewport.name === "mobile" ? 3 : 1,
          reducedMotion: "reduce",
        });
        try {
          const page = await context.newPage();
          const images = [];
          page.on("request", (request) => {
            if (request.resourceType() === "image" && /\/hero-panel(?:-\d+w)?\.webp/.test(request.url())) images.push(request.url());
          });
          await page.goto(`${baseUrl}${prefix}${route || "/"}`, { waitUntil: "networkidle" });
          if (route === "/chapter/5") {
            assert(images.length === 0, `Reader downloaded unused hero: ${images.join(", ")}`);
          } else {
            const hero = page.locator('img[src$="/hero-panel.webp"]');
            await hero.waitFor({ state: "visible" });
            const markup = await hero.evaluate((img) => ({ src: img.currentSrc, set: img.srcset, sizes: img.sizes }));
            const preloads = page.locator('link[rel="preload"][as="image"][href*="hero-panel"]');
            assert(await preloads.count() === 1, "Expected exactly one route-specific hero preload.");
            assert(await preloads.getAttribute("imagesrcset") === markup.set, "Hero preload candidates differ from rendered image.");
            assert(await preloads.getAttribute("imagesizes") === markup.sizes, "Hero preload sizes differ from rendered image.");
            assert(images.length === 1 && images[0] === markup.src, `Hero must download one matching candidate: ${images.join(", ")}`);
          }
          console.log(`PASS hero requests: ${viewport.name} ${prefix}${route || "/"}`);
        } finally { await context.close(); }
      }
    }
  }
}

async function runMobileSearchSmoke(browser, baseUrl) {
  for (const fixture of [
    { lang: "en", home: "/", label: "Search the guide", query: "deepfake", specificQuery: "deepfake test", heading: "The working test",
      topicQuery: "water use", topicLabel: /Data-centre water use/, topic: "/topic/data-centres" },
    { lang: "fr", home: "/fr", label: "Rechercher dans le guide", query: "hypertrucage", specificQuery: "test hypertrucage", heading: "Le test pratique",
      topicQuery: "souverainete numerique", topicLabel: /Souveraineté numérique/, topic: "/fr/topic/sovereignty" },
  ]) {
    await withAppPage(browser, baseUrl, VIEWPORTS[2], async (page) => {
      const requests = [];
      page.on("request", (request) => requests.push(new URL(request.url()).pathname));
      await page.goto(baseUrl + fixture.home, { waitUntil: "networkidle" });
      const trigger = page.getByRole("button", { name: fixture.label, exact: true });
      const dialog = page.getByRole("dialog", { name: fixture.label, exact: true });
      const input = dialog.getByRole("searchbox");
      await trigger.click();
      await input.waitFor();
      assert(await input.evaluate((element) => element === document.activeElement), "Mobile search did not focus its input.");
      assert(!requests.some((url) => url.startsWith("/search/")), "Opening search fetched an index before typing.");
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      assert(await trigger.evaluate((element) => element === document.activeElement), "Search dismissal did not restore focus.");
      await trigger.click();
      await input.fill(fixture.query);
      const result = dialog.getByRole("link", { name: new RegExp(fixture.heading, "i") });
      await result.waitFor();
      assert(requests.filter((url) => url.startsWith("/search/")).join() === `/search/${fixture.lang}.json`,
        "Search must request one index for the current language.");
      assert(!requests.some((url) => /\/content\/(?:fr\/)?chapters\//.test(url)), "Search downloaded chapter content before selection.");
      await input.fill(fixture.specificQuery);
      assert((await dialog.getByRole("link").first().textContent()).includes(fixture.heading),
        "A search for the practical test should put its section first.");
      if (process.env.SEARCH_SCREENSHOTS) {
        fs.mkdirSync(process.env.SEARCH_SCREENSHOTS, { recursive: true });
        await page.screenshot({ path: path.join(process.env.SEARCH_SCREENSHOTS, `search-${fixture.lang}.png`) });
      }
      await page.route("**/content/art-map.json", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 600));
        await route.continue();
      });
      await result.click();
      const heading = page.getByRole("heading", { name: fixture.heading, exact: true });
      await heading.waitFor();
      await page.waitForLoadState("networkidle");
      assert(await heading.evaluate((element) => document.activeElement === element),
        "Search selection did not retain keyboard focus after the passage finished loading.");
      const url = new URL(page.url());
      assert(url.pathname === `${fixture.lang === "fr" ? "/fr" : ""}/chapter/13` &&
        url.hash === "#the-working-test", "Search did not produce the stable section URL.");
      await page.reload();
      await heading.waitFor();
      await page.waitForLoadState("networkidle");
      assert(await heading.isVisible(), "Reader lost the section after chapter artwork arrived.");
      if (process.env.SEARCH_SCREENSHOTS) {
        await page.screenshot({ path: path.join(process.env.SEARCH_SCREENSHOTS, `section-${fixture.lang}.png`) });
      }
      await trigger.click();
      const close = dialog.getByRole("button", { name: fixture.lang === "fr" ? "Fermer" : "Close", exact: true });
      await close.press("ArrowRight");
      await close.click();
      assert(await heading.isVisible(), "Arrow navigation inside mobile search turned the reader page.");
      await page.getByRole("button", { name: fixture.lang === "fr" ? "Page suivante" : "Next page", exact: true }).click();
      await heading.waitFor({ state: "hidden" });
      await trigger.click();
      await input.fill(fixture.topicQuery);
      await dialog.getByRole("link", { name: fixture.topicLabel }).click();
      await page.waitForURL(baseUrl + fixture.topic);
      console.log(`Mobile search ${fixture.lang}: topic, section, reload, page turn, focus return, and lazy index passed.`);
    });
  }
}

async function runSearchQuestionsSmoke(browser, baseUrl) {
  for (const { lang, prefix, searchLabel, nextLabel } of [
    { lang: "en", prefix: "", searchLabel: "Search the guide", nextLabel: "Next page" },
    { lang: "fr", prefix: "/fr", searchLabel: "Rechercher dans le guide", nextLabel: "Page suivante" },
  ]) {
    await withAppPage(browser, baseUrl, VIEWPORTS[2], async (page) => {
      await page.context().route((url) => url.origin !== baseUrl, (route) =>
        route.fulfill({ contentType: "text/html", body: "<main>Source destination</main>" }));
      for (const fixture of [...searchQuestions, ...searchHoldoutQuestions]) {
        await page.goto(baseUrl + (prefix || "/"));
        await page.getByRole("button", { name: searchLabel, exact: true }).tap();
        const dialog = page.getByRole("dialog", { name: searchLabel, exact: true });
        const question = fixture[lang];
        await dialog.getByRole("searchbox").fill(question);
        await dialog.getByRole("status").filter({ hasText: question }).waitFor();
        const resultPath = `${prefix}/chapter/${fixture.chapter}#${fixture.section}`;
        const top = await dialog.getByRole("link").evaluateAll((links) =>
          links.slice(0, 3).map((link) => link.getAttribute("href")));
        const rank = top.indexOf(resultPath) + 1;
        assert(rank > 0, `${lang} “${question}” did not return the expected passage in its first three results: ${top.join(", ")}`);
        await dialog.locator(`a[href="${resultPath}"]`).tap();
        await page.waitForURL(baseUrl + resultPath);
        await page.locator("[data-section-heading]:focus").waitFor();
        const sourceUrl = typeof fixture.source === "string" ? fixture.source : fixture.source?.[lang];
        assert(sourceUrl, `${lang} “${question}” has no expected source URL.`);
        const source = page.locator(`a[href="${sourceUrl}"]`).first();
        for (let turn = 0; turn < 10 && !(await source.isVisible()); turn++) {
          await page.getByRole("button", { name: nextLabel, exact: true }).last().tap();
        }
        assert(await source.isVisible(), `${lang} “${question}” led to the passage but its source was not reachable.`);
        if (await source.getAttribute("target") === "_blank") {
          const [destination] = await Promise.all([page.waitForEvent("popup"), source.tap()]);
          await destination.waitForURL(sourceUrl);
          await destination.close();
        } else {
          await source.tap();
          await page.waitForURL(sourceUrl);
        }
        console.log(`PASS search question ${lang} #${rank}: ${question} → source`);
      }
    }, { hasTouch: true });
  }
}

async function runClaimReceiptSmoke(browser, baseUrl) {
  const sourceUrl = "https://arxiv.org/html/2512.13915v1#S4";
  for (const fixture of [
    { prefix: "", heading: "The working test", figure: /Canada’s Protecting Victims Act received royal assent/ },
    { prefix: "/fr", heading: "Le test pratique", figure: /la Loi visant à protéger les victimes a reçu la sanction royale/ },
  ]) {
    const french = fixture.prefix === "/fr";
    await withAppPage(browser, baseUrl, VIEWPORTS[2], async (page) => {
      const searchLabel = french ? "Rechercher dans le guide" : "Search the guide";
      await page.goto(`${baseUrl}${fixture.prefix || "/"}`);
      await page.getByRole("button", { name: searchLabel, exact: true }).tap();
      const search = page.getByRole("dialog", { name: searchLabel, exact: true });
      await search.getByRole("searchbox").fill(french ? "test hypertrucage" : "deepfake test");
      await search.getByRole("link", { name: new RegExp(fixture.heading, "i") }).tap();
      await page.waitForURL(`${baseUrl}${fixture.prefix}/chapter/13#the-working-test`);
      await page.getByRole("heading", { name: fixture.heading, exact: true }).waitFor();
      const marker = page.getByRole("button", { name: french ? /0,12\s*% des vues sur X/ : /0\.12%-of-views \(on X\)/ });
      await marker.tap();
      const popup = page.getByRole("dialog", { name: french ? /Reçu/i : /Receipt/i });
      await popup.waitFor();
      assert((await popup.innerText()).includes(french ? "six mois" : "six months"), "Receipt did not explain how views were measured.");
      const study = popup.getByRole("link", { name: french ? /Lire les résultats/ : /Read the study/ });
      assert(await study.getAttribute("href") === sourceUrl, "Receipt did not link to the paper’s results.");
      assert(await study.evaluate((element) => element === document.activeElement), "Opening the receipt did not focus the study link.");
      if (process.env.SEARCH_SCREENSHOTS) {
        fs.mkdirSync(process.env.SEARCH_SCREENSHOTS, { recursive: true });
        await page.screenshot({ path: path.join(process.env.SEARCH_SCREENSHOTS, `claim-receipt-${french ? "fr" : "en"}.png`) });
      }
      await page.keyboard.press("Escape");
      await popup.waitFor({ state: "hidden" });
      assert(await marker.evaluate((element) => element === document.activeElement), "Closing the receipt did not return focus.");
      await page.keyboard.press("Enter");
      await popup.waitFor();
      await page.context().route("https://arxiv.org/**", (route) => route.fulfill({ body: '<main id="S4">Results</main>', contentType: "text/html" }));
      const [paper] = await Promise.all([page.waitForEvent("popup"), study.tap()]);
      await paper.waitForURL(sourceUrl);
      await paper.close();
      await page.getByRole("button", { name: french ? "Page suivante" : "Next page", exact: true }).tap();
      await popup.waitFor({ state: "hidden" });
      await page.locator("figcaption").filter({ hasText: fixture.figure }).waitFor();
      console.log(`Mobile search to source ${french ? "fr" : "en"}: passage, receipt, focus, paper link and caption passed.`);
    }, { hasTouch: true });
  }
}

async function runChapterOutlineSmoke(browser, baseUrl) {
  for (const viewport of [VIEWPORTS[2], VIEWPORTS[0], { name: "desktop spread", width: 1920, height: 900 }]) {
    await withAppPage(browser, baseUrl, viewport, async (page) => {
      const mobile = viewport.name === "mobile";
      const id = "the-working-test";
      const headings = { en: "The working test", fr: "Le test pratique" };
      const outlineNames = { en: "In this chapter", fr: "Dans ce chapitre" };
      const chapter = (lang) => `${lang === "fr" ? "/fr" : ""}/chapter/13`;
      const link = (lang) => `${chapter(lang)}#${id}`;
      const heading = (lang) => page.getByRole("main").getByRole("heading", { name: headings[lang], exact: true });

      async function openOutline(lang) {
        await page.getByRole("button", { name: outlineNames[lang], exact: true }).click();
        return page.getByRole("dialog", { name: outlineNames[lang], exact: true });
      }

      await page.goto(baseUrl + chapter("en"));
      const outline = await openOutline("en");
      const section = outline.getByRole("link", { name: headings.en, exact: true });
      assert(await section.getAttribute("href") === link("en"), "Outline link should use the stable ID.");
      await page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: baseUrl });
      await outline.getByRole("button", { name: `Copy link · ${headings.en}`, exact: true }).click();
      await outline.getByText("Section link copied.", { exact: true }).waitFor();
      assert(await page.evaluate(() => navigator.clipboard.readText()) === baseUrl + link("en"), "Copied URL differs from the outline link.");
      if (process.env.SEARCH_SCREENSHOTS) {
        fs.mkdirSync(process.env.SEARCH_SCREENSHOTS, { recursive: true });
        await page.screenshot({ path: path.join(process.env.SEARCH_SCREENSHOTS, `chapter-outline-${viewport.width}.png`) });
      }
      await section.click();
      await page.waitForURL(baseUrl + link("en"));
      await heading("en").waitFor();
      assert(await heading("en").evaluate((element) => element === document.activeElement), "Section selection did not focus its heading.");
      assert(await heading("en").evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        const pane = element.closest("[data-reader-scroll]").getBoundingClientRect();
        return bounds.top >= pane.top - 1 && bounds.bottom <= pane.bottom + 1;
      }), "Linked heading was outside the visible reading pane.");
      await page.reload();
      await heading("en").waitFor();

      for (const lang of ["fr", "en"]) {
        if (mobile) await page.getByRole("button", { name: lang === "fr" ? "Open menu" : "Ouvrir le menu", exact: true }).click();
        const controls = mobile ? page.getByRole("dialog", { name: "Menu" }) : page.getByRole("group", { name: "Language", exact: true });
        await controls.getByRole("button", { name: lang === "fr" ? "Lire en français (traduction automatique)" : "Read in English", exact: true }).click();
        await page.waitForURL(baseUrl + link(lang));
        await heading(lang).waitFor();
        const translatedOutline = await openOutline(lang);
        const current = translatedOutline.getByRole("link", { name: headings[lang], exact: true });
        assert(await current.getAttribute("aria-current") === "location", "Outline did not mark the translated section as current.");
        assert(await current.getAttribute("href") === link(lang), "The localized outline changed the section ID.");
        await page.keyboard.press("Escape");
        await translatedOutline.waitFor({ state: "hidden" });
      }

      for (const legacy of [id, "The+working+test"]) {
        await page.goto(baseUrl + chapter("fr") + "?section=" + legacy);
        await heading("fr").waitFor();
      }
      console.log(`PASS chapter outline: ${viewport.name} · copy, reload, English ↔ French, and legacy links`);
    });
  }
}

async function runStaticSectionLinksSmoke(browser, baseUrl) {
  for (const viewport of [VIEWPORTS[0], VIEWPORTS[2]]) {
    for (const { prefix, outline, title } of [
      { prefix: "", outline: "In this chapter", title: "The working test" },
      { prefix: "/fr", outline: "Dans ce chapitre", title: "Le test pratique" },
    ]) {
      await withAppPage(browser, baseUrl, viewport, async (page) => {
        const chapter = `${baseUrl}${prefix}/chapter/13`;
        const fragment = "#the-working-test";
        await page.goto(chapter + fragment);
        const target = page.locator("h2:target");
        assert(await target.textContent() === title, "Shared fragment did not target the localized static heading.");
        assert(await target.evaluate((element) => {
          const bounds = element.getBoundingClientRect();
          return bounds.top >= -1 && bounds.bottom <= window.innerHeight + 1;
        }), "Shared fragment did not scroll the static heading into view.");
        await page.goto(chapter);
        await page.getByRole("navigation", { name: outline, exact: true }).getByRole("link", { name: title, exact: true }).click();
        await page.waitForURL(chapter + fragment);
        assert(await target.textContent() === title, "Static outline link did not target its heading.");
      }, { javaScriptEnabled: false });
      console.log(`PASS static section links: ${viewport.name} ${prefix || "en"}`);
    }
  }
}

async function runChapter13LawSmoke(browser, baseUrl) {
  for (const viewport of VIEWPORTS.filter(({ name }) => name !== "tablet")) {
    for (const fixture of [
      {
        prefix: "", heading: "Bill C-16 — what it covers", next: "Next page",
        deadline: "within 48 hours after the order is made",
        report: "A report to a platform does not start that clock.",
        penalty: "14-year maximum", condition: "aggravated sexual assault",
        source: "https://laws-lois.justice.gc.ca/eng/acts/C-46/section-164.1.html",
      },
      {
        prefix: "/fr", heading: "Le projet de loi C-16 — ce qu'il couvre", next: "Page suivante",
        deadline: "dans les 48 heures suivant le prononcé de l’ordonnance",
        report: "Un signalement à une plateforme ne déclenche pas ce délai.",
        penalty: "14 ans", condition: "agression sexuelle grave",
        source: "https://laws-lois.justice.gc.ca/fra/lois/C-46/section-164.1.html",
      },
    ]) {
      const url = `${baseUrl}${fixture.prefix}/chapter/13?section=bill-c-16-what-it-covers`;
      await withAppPage(browser, baseUrl, viewport, async (page) => {
        await page.goto(url);
        await page.getByRole("heading", { name: fixture.heading, exact: true }).waitFor();
        let checkedPenalty = false;
        let checkedDeadline = false;
        let checkedSource = false;
        for (let spread = 0; spread < 12; spread++) {
          const main = page.locator("#dg-main");
          const copy = await main.innerText();
          checkedPenalty ||= copy.includes(fixture.penalty) && copy.includes(fixture.condition);
          checkedDeadline ||= copy.includes(fixture.deadline) && copy.includes(fixture.report);
          checkedSource ||= await main.locator(`a[href="${fixture.source}"]`).first().isVisible();
          if (checkedPenalty && checkedDeadline && checkedSource) break;
          await page.getByRole("button", { name: fixture.next, exact: true }).last().click();
        }
        assert(checkedPenalty && checkedDeadline && checkedSource,
          `Chapter 13 ${fixture.prefix || "en"} (${viewport.name}): penalty=${checkedPenalty}, deadline=${checkedDeadline}, source=${checkedSource}`);
      });
      console.log(`PASS Chapter 13 final law: ${viewport.name} ${fixture.prefix || "en"}`);
    }
  }
}

async function main() {
  assert(fs.existsSync(path.join(distDir, "index.html")), "dist/index.html not found. Run npm run build first.");
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const browser = await chromium.launch();

  try {
    await runChapter13LawSmoke(browser, baseUrl);
    await runStaticSectionLinksSmoke(browser, baseUrl);
    await runChapterOutlineSmoke(browser, baseUrl);
    await runClaimReceiptSmoke(browser, baseUrl);
    await runMobileSearchSmoke(browser, baseUrl);
    await runSearchQuestionsSmoke(browser, baseUrl);
    await runHeroImageRequestsSmoke(browser, baseUrl);
    await runChapterCoverImageSmoke(browser, baseUrl);
    await runMobileDrawerImageSmoke(browser, baseUrl);
    await runLanguageSwitchSmoke(browser, baseUrl);
    await runMobileDrawerKeyboardSmoke(browser, baseUrl);
    await runMapToReaderKeyboardSmoke(browser, baseUrl);
    await runGuideNavigationSmoke(browser, baseUrl);
    await runChapterDiscoverySmoke(browser, baseUrl);
    await runGovernanceSummarySmoke(browser, baseUrl);
    await runFrenchReaderCopySmoke(browser, baseUrl);
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
