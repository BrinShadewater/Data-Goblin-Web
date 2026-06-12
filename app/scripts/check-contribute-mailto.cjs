const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const appDir = path.resolve(__dirname, "..");
const buildDir = path.join(__dirname, ".build", "contribute-check");
const tscBin = path.join(appDir, "node_modules", "typescript", "bin", "tsc");
const compiledJs = path.join(buildDir, "contribute.js");
const compiledCjs = path.join(buildDir, "contribute.cjs");

function run(label, command, args) {
  console.log(`\n${label}`);
  const result = spawnSync(command, args, { cwd: appDir, stdio: "inherit", shell: false });
  if (result.error) {
    console.error(result.error.message);
  }
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

fs.rmSync(buildDir, { recursive: true, force: true });
fs.mkdirSync(buildDir, { recursive: true });

run("Compiling contribution mailto helper", process.execPath, [
  tscBin,
  "src/contribute.ts",
  "--outDir",
  "scripts/.build/contribute-check",
  "--module",
  "commonjs",
  "--target",
  "es2020",
  "--skipLibCheck",
]);

fs.renameSync(compiledJs, compiledCjs);
const { buildContributionMailto, CONTRIBUTION_EMAIL } = require(compiledCjs);
const mailto = buildContributionMailto({
  type: "source",
  chapter: "Chapter 8",
  message: "Please check this source.",
});

const required = [
  `mailto:${CONTRIBUTION_EMAIL}`,
  "subject=Data%20Goblin%20contribution%3A%20Missing%20Source",
  "Chapter%20%2F%20Section%3A%20Chapter%208",
  "Please%20check%20this%20source.",
];

for (const part of required) {
  if (!mailto.includes(part)) {
    console.error(`Contribution mailto check failed: missing ${part}`);
    console.error(mailto);
    process.exit(1);
  }
}

console.log("Contribution mailto check passed.");
