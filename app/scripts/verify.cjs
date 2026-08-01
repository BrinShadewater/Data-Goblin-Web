const { spawnSync } = require("child_process");
const path = require("path");

const appDir = path.resolve(__dirname, "..");
const siteDir = path.resolve(appDir, "..");

function run(label, command, args, options = {}) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(command, args, {
    cwd: options.cwd || appDir,
    stdio: "inherit",
    shell: options.shell || false,
  });
  if (result.error) {
    console.error(result.error.message);
  }
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function runPythonSyncCheck() {
  const args = [
    path.join(siteDir, "pipeline", "check_content_sync.py"),
    path.join(siteDir, "content"),
    path.join(appDir, "public", "content"),
  ];
  const first = spawnSync("python", args, { cwd: siteDir, stdio: "inherit", shell: false });
  if (first.status === 0) return;

  const fallback = spawnSync("py", ["-3", ...args], { cwd: siteDir, stdio: "inherit", shell: false });
  if (fallback.status !== 0) {
    process.exit(fallback.status || first.status || 1);
  }
}

console.log("=== Generated content sync ===");
runPythonSyncCheck();
run("Pagination sanity", process.execPath, [path.join(appDir, "scripts", "run-pagination-sanity.cjs")]);
run("Contribution mailto sanity", process.execPath, [path.join(appDir, "scripts", "check-contribute-mailto.cjs")]);
run("Claim anchors", process.execPath, [path.join(appDir, "scripts", "check-claim-anchors.cjs")]);
if (process.platform === "win32") {
  run("Production build", process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "npm run build"]);
} else {
  run("Production build", "npm", ["run", "build"]);
}
run("Image audit", process.execPath, [path.join(appDir, "scripts", "audit-images.cjs")]);
run("Performance budgets", process.execPath, [path.join(appDir, "scripts", "check-performance-budgets.cjs")]);
run("Built site smoke", process.execPath, [path.join(appDir, "scripts", "check-built-site-smoke.cjs")]);
run("Browser smoke", process.execPath, [path.join(appDir, "scripts", "check-browser-smoke.cjs")]);
