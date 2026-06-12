const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const appDir = path.resolve(__dirname, "..");
const buildDir = path.join(__dirname, ".build");
const tscBin = path.join(appDir, "node_modules", "typescript", "bin", "tsc");
const compiledJs = path.join(buildDir, "pagination.js");
const compiledCjs = path.join(buildDir, "pagination.cjs");

function run(label, command, args, options = {}) {
  console.log(`\n${label}`);
  const result = spawnSync(command, args, {
    cwd: appDir,
    stdio: "inherit",
    shell: false,
    ...options,
  });
  if (result.error) {
    console.error(result.error.message);
  }
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

fs.rmSync(buildDir, { recursive: true, force: true });
fs.mkdirSync(buildDir, { recursive: true });

run("Compiling pagination.ts for sanity checks", process.execPath, [
  tscBin,
  "src/pagination.ts",
  "--outDir",
  "scripts/.build",
  "--module",
  "commonjs",
  "--target",
  "es2020",
  "--skipLibCheck",
]);

if (!fs.existsSync(compiledJs)) {
  console.error(`Expected compiled pagination file missing: ${compiledJs}`);
  process.exit(1);
}
fs.renameSync(compiledJs, compiledCjs);

run("Running pagination sanity checks", process.execPath, [path.join(__dirname, "sanity-pagination.cjs")]);
