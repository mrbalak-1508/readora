/**
 * READORA — Dual Database Environment Manager
 * Seamlessly isolates Local (SQLite) and Vercel (PostgreSQL) databases.
 *
 * Commands:
 *   node scripts/switch-db.js local         -> Configures active schema for local SQLite
 *   node scripts/switch-db.js vercel        -> Configures active schema for Vercel PostgreSQL
 *   node scripts/switch-db.js local push    -> Pushes schema to local SQLite (dev.db)
 *   node scripts/switch-db.js local seed    -> Seeds local SQLite (dev.db)
 *   node scripts/switch-db.js vercel push   -> Pushes schema to Vercel PostgreSQL
 *   node scripts/switch-db.js vercel seed   -> Seeds Vercel PostgreSQL
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const schemaDir = path.join(rootDir, "prisma");
const mainSchema = path.join(schemaDir, "schema.prisma");
const sqliteSchema = path.join(schemaDir, "schema.sqlite.prisma");
const postgresSchema = path.join(schemaDir, "schema.postgres.prisma");

// Parse .env file without external dependencies
function parseEnv() {
  const envPath = path.join(rootDir, ".env");
  if (!fs.existsSync(envPath)) return {};
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  const vars = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      vars[key] = val;
    }
  }
  return vars;
}

const envVars = parseEnv();
const target = (process.argv[2] || (process.env.VERCEL ? "vercel" : "local")).toLowerCase();
const action = (process.argv[3] || "").toLowerCase();

const postgresUrl =
  process.env.POSTGRES_URL ||
  envVars.POSTGRES_URL ||
  process.env.PRISMA_DATABASE_URL ||
  envVars.PRISMA_DATABASE_URL ||
  process.env.DATABASE_URL;

const sqliteUrl = "file:./dev.db";

if (target === "vercel" || target === "postgres" || target === "production") {
  console.log("⚡ [VERCEL POSTGRESQL] Target selected");
  if (fs.existsSync(postgresSchema)) {
    fs.copyFileSync(postgresSchema, mainSchema);
  } else {
    const content = fs.readFileSync(mainSchema, "utf8");
    fs.writeFileSync(mainSchema, content.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"'), "utf8");
  }
  console.log("✓ prisma/schema.prisma configured for PostgreSQL");

  if (action === "push") {
    console.log("🚀 Pushing schema to Vercel PostgreSQL database...");
    execSync("npx prisma db push --skip-generate", {
      stdio: "inherit",
      env: { ...process.env, ...envVars, DATABASE_URL: postgresUrl },
    });
  } else if (action === "seed") {
    console.log("🌱 Seeding Vercel PostgreSQL database...");
    execSync("npx tsx prisma/seed.ts", {
      stdio: "inherit",
      env: { ...process.env, ...envVars, DATABASE_URL: postgresUrl },
    });
  }
} else {
  console.log("💻 [LOCAL SQLITE] Target selected");
  if (fs.existsSync(sqliteSchema)) {
    fs.copyFileSync(sqliteSchema, mainSchema);
  } else {
    const content = fs.readFileSync(mainSchema, "utf8");
    fs.writeFileSync(mainSchema, content.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"'), "utf8");
  }
  console.log("✓ prisma/schema.prisma configured for SQLite");

  if (action === "push") {
    console.log("🚀 Pushing schema to local SQLite database (dev.db)...");
    execSync("npx prisma db push --skip-generate", {
      stdio: "inherit",
      env: { ...process.env, ...envVars, DATABASE_URL: sqliteUrl },
    });
  } else if (action === "seed") {
    console.log("🌱 Seeding local SQLite database...");
    execSync("npx tsx prisma/seed.ts", {
      stdio: "inherit",
      env: { ...process.env, ...envVars, DATABASE_URL: sqliteUrl },
    });
  }
}
