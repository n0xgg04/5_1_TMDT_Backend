const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const outputDir = path.join(__dirname, "..", ".vercel", "output");
const funcDir = path.join(outputDir, "functions", "api.func");

// Clean and create
fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(funcDir, { recursive: true });
fs.mkdirSync(path.join(outputDir, "static"), { recursive: true });

// config.json
fs.writeFileSync(
  path.join(outputDir, "config.json"),
  JSON.stringify({ version: 3, routes: [{ src: "/(.*)", dest: "/api" }] }),
);

// .vc-config.json
fs.writeFileSync(
  path.join(funcDir, ".vc-config.json"),
  JSON.stringify({
    runtime: "nodejs22.x",
    handler: "index.js",
    maxDuration: 60,
    regions: ["sin1"],
    launcherType: "Nodejs",
  }),
);

// Entry point
fs.writeFileSync(
  path.join(funcDir, "index.js"),
  `
require("reflect-metadata");
const { createNestApp } = require("./dist/src/bootstrap");
let cachedApp;
module.exports = async function handler(req, res) {
  try {
    if (!cachedApp) {
      cachedApp = await createNestApp();
      await cachedApp.init();
    }
    cachedApp.getHttpAdapter().getInstance()(req, res);
  } catch (err) {
    console.error("NestJS handler error:", err);
    res.status(500).json({ error: err.message, stack: err.stack?.split("\\n").slice(0, 10) });
  }
};
`,
);

const srcRoot = path.join(__dirname, "..");

// Copy dist
fs.cpSync(path.join(srcRoot, "dist"), path.join(funcDir, "dist"), {
  recursive: true,
});

// Copy prisma schema
fs.mkdirSync(path.join(funcDir, "prisma"), { recursive: true });
fs.copyFileSync(
  path.join(srcRoot, "prisma", "schema.prisma"),
  path.join(funcDir, "prisma", "schema.prisma"),
);

// Copy package.json and install production deps
fs.copyFileSync(
  path.join(srcRoot, "package.json"),
  path.join(funcDir, "package.json"),
);

console.log("Installing production dependencies...");
execSync("npm install --omit=dev --no-audit --no-fund 2>&1", {
  cwd: funcDir,
  stdio: "inherit",
});

// Generate prisma client inside function dir
console.log("Generating Prisma client...");
execSync("npx prisma generate 2>&1", { cwd: funcDir, stdio: "inherit" });

// Remove known heavy non-runtime items
const removeList = [
  "prisma",
  "typescript",
  "@types",
  "fast-check",
  "@microsoft",
  "jiti",
];
for (const pkg of removeList) {
  const p = path.join(funcDir, "node_modules", pkg);
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true });
    console.log(`Removed ${pkg}`);
  }
}

// Remove prisma engines dir (WASM is used at runtime, not the CLI engine)
const enginesDir = path.join(funcDir, "node_modules", "@prisma", "engines");
if (fs.existsSync(enginesDir)) {
  fs.rmSync(enginesDir, { recursive: true, force: true });
  console.log("Removed @prisma/engines");
}

// Remove swagger-ui-dist (saves ~11MB, Swagger won't have UI but API still works)
const swaggerUi = path.join(funcDir, "node_modules", "swagger-ui-dist");
if (fs.existsSync(swaggerUi)) {
  fs.rmSync(swaggerUi, { recursive: true, force: true });
  console.log("Removed swagger-ui-dist");
}

// Show final size
const totalSize = execSync("du -sh .", {
  cwd: funcDir,
  encoding: "utf-8",
}).trim();
console.log("Function size:", totalSize);
