const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Configuration guard, not an emulator of Vercel's routing or CDN.
// Confirm actual headers on a preview deployment after changing these rules.
function checkCachePolicy(config) {
  const routes = config.routes;
  const filesystem = routes.findIndex((route) => route.handle === 'filesystem');
  assert(filesystem >= 0, 'Expected filesystem handling before localized 404 fallbacks.');
  const catchAll = routes.findIndex((route) => route.src === '/(.*)');
  assert(catchAll >= 0 && catchAll < filesystem, 'Security headers must precede filesystem handling.');
  assert.equal(routes[catchAll].continue, true, 'Security headers must continue to file handling.');
  for (const key of [
    'X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy',
    'Permissions-Policy', 'Strict-Transport-Security', 'Content-Security-Policy',
  ]) {
    assert(routes[catchAll].headers?.[key], `Security header missing: ${key}`);
  }
  assert.equal(routes[catchAll].headers['X-Content-Type-Options'], 'nosniff');
  const assets = routes.findIndex((route) => route.src === '/assets/(.*)');
  assert(assets >= 0 && assets < filesystem, 'Asset cache headers must precede filesystem handling.');
  assert.equal(routes[assets].headers?.['Cache-Control'], 'public, max-age=31536000, immutable',
    'Versioned assets must retain long-lived caching.');
  assert.equal(routes[assets].continue, true, 'Asset header rule must continue to file/404 handling.');
  for (const destination of ['/404.html', '/fr/404.html']) {
    const index = routes.findIndex((route) => route.status === 404 && route.dest === destination);
    assert(index > filesystem, `Missing fallback after filesystem: ${destination}`);
    assert.equal(routes[index].headers?.['Cache-Control'], 'no-store',
      `${destination} must override inherited immutable asset caching with no-store.`);
  }
}

const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8'));
checkCachePolicy(config);
for (const destination of ['/404.html', '/fr/404.html']) {
  const broken = structuredClone(config);
  delete broken.routes.find((route) => route.dest === destination).headers['Cache-Control'];
  assert.throws(() => checkCachePolicy(broken), /override inherited immutable/);
}
const brokenAsset = structuredClone(config);
brokenAsset.routes.find((route) => route.src === '/assets/(.*)').headers['Cache-Control'] = 'no-store';
assert.throws(() => checkCachePolicy(brokenAsset), /Versioned assets/);
const brokenCsp = structuredClone(config);
delete brokenCsp.routes.find((route) => route.src === '/(.*)').headers['Content-Security-Policy'];
assert.throws(() => checkCachePolicy(brokenCsp), /Security header missing: Content-Security-Policy/);
console.log('PASS deploy policy: security headers, immutable assets, non-cacheable EN/FR 404s; four negative controls rejected.');
