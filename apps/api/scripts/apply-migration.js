const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const p = new PrismaClient();

const sql = fs.readFileSync(
  path.join(__dirname, "..", "prisma", "migrations", "20260607063724_add_bill_and_bank_transaction", "migration.sql"),
  "utf8"
);

function splitStatements(raw) {
  const lines = raw.split("\n");
  const stmts = [];
  let current = "";
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("--")) continue;
    current += (current ? " " : "") + trimmed;
    if (trimmed.endsWith(";")) {
      stmts.push(current.slice(0, -1));
      current = "";
    }
  }
  if (current.trim()) stmts.push(current.trim());
  return stmts;
}

async function run() {
  console.log("Applying migration...");
  const stmts = splitStatements(sql);
  for (let i = 0; i < stmts.length; i++) {
    const s = stmts[i];
    try {
      await p.$executeRawUnsafe(s);
      if (s.length > 50) {
        console.log(`  [${i + 1}/${stmts.length}] ${s.substring(0, 50)}... OK`);
      } else {
        console.log(`  [${i + 1}/${stmts.length}] ${s} OK`);
      }
    } catch (e) {
      if (e.message.includes("already exists")) {
        console.log(`  [${i + 1}/${stmts.length}] ${s.substring(0, 50)}... SKIP (exists)`);
      } else {
        console.log(`  [${i + 1}/${stmts.length}] ${s.substring(0, 50)}... ERROR: ${e.message}`);
      }
    }
  }
  console.log("Done.");
  await p.$disconnect();
}

run();
