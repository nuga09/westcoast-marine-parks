import * as fs from "node:fs";
import * as path from "node:path";
import { randomBytes } from "node:crypto";
 
const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, ".env");
 
type EnvMap = Map<string, string>;
 
function parseEnv(raw: string): { map: EnvMap; lines: string[] } {
  const lines = raw.split(/\r?\n/);
  const map: EnvMap = new Map();
 
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key) map.set(key, value);
  }
 
  return { map, lines };
}
 
function ensureLineEndingNewline(s: string) {
  return s.endsWith("\n") ? s : s + "\n";
}
 
function generateJwtSecret() {
  // 32 bytes -> base64url (no padding). Good enough for dev.
  return randomBytes(32).toString("base64url");
}
 
function main() {
  const existingRaw = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf8") : "";
  const { map } = parseEnv(existingRaw);
 
  const additions: string[] = [];
 
  if (!map.has("DATABASE_URL")) {
    additions.push('DATABASE_URL="file:./dev.db"');
  }
 
  if (!map.has("JWT_SECRET")) {
    additions.push(`JWT_SECRET="${generateJwtSecret()}"`);
  }
 
  if (additions.length === 0) {
    // Nothing to do.
    return;
  }
 
  const out =
    (existingRaw.trim().length ? ensureLineEndingNewline(existingRaw) + "\n" : "") +
    "# Added by scripts/setup-env.ts\n" +
    additions.join("\n") +
    "\n";
 
  fs.writeFileSync(ENV_PATH, out, "utf8");
  console.log(`Wrote ${path.relative(ROOT, ENV_PATH)} (${additions.length} keys).`);
}
 
main();

