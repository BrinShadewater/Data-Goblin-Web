const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

test("receipt data that arrives between render and the loading effect reaches the reader", async () => {
  const sourcePath = process.argv[2] ?? path.join(__dirname, "../src/useContent.ts");
  const source = fs.readFileSync(sourcePath, "utf8").replaceAll("import.meta.env.BASE_URL", "'/'");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const loader = { exports: {} };
  const effects = [];
  let state = null;
  let resolveResponse;
  let requests = 0;
  const pendingResponse = new Promise((resolve) => { resolveResponse = resolve; });
  const fakeFetch = () => {
    requests++;
    return pendingResponse;
  };
  const imports = {
    react: {
      useEffect: (effect) => effects.push(effect),
      useState: () => [state, (next) => { state = next; }],
    },
    "./LanguageContext": { useLanguage: () => ({ lang: "en" }) },
    "./imageRegistry": { RESPONSIVE_ART: {} },
  };
  const requireStub = (name) => {
    assert(Object.hasOwn(imports, name), `Unexpected import: ${name}`);
    return imports[name];
  };
  new Function("require", "module", "exports", "fetch", outputText)(requireStub, loader, loader.exports, fakeFetch);
  const { fetchJson, useReceipts } = loader.exports;

  const receipts = [{ id: 32 }];
  const earlierRequest = fetchJson("receipts.json");
  assert.deepEqual(useReceipts(), { data: null, error: null });

  // Resolve the request before the reader's first effect. A fresh render
  // would already see the cache, so check that the effect requests a state update.
  resolveResponse({ ok: true, json: async () => receipts });
  await earlierRequest;
  effects.shift()();
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(requests, 1, "The loading effect should reuse the cached response.");
  assert.deepEqual(state?.data, receipts, "The loading effect did not deliver receipt #32 to the reader.");
});
