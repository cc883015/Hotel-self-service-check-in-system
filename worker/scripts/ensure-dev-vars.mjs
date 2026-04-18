/**
 * Ensures worker/.dev.vars has JWT_SECRET and local CORS override for `wrangler dev`.
 * Production CORS lives in wrangler.toml; .dev.vars overrides vars locally.
 */
import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workerRoot = path.join(__dirname, "..");
const devVarsPath = path.join(workerRoot, ".dev.vars");
const MIN_LEN = 32;
const LOCAL_CORS = "CORS_ORIGIN=http://127.0.0.1:5173";

let content = "";
try {
  content = fs.readFileSync(devVarsPath, "utf8");
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}

const lines = content.split("\n");
let jwtIdx = -1;
let jwtVal = "";
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.startsWith("JWT_SECRET=")) {
    jwtIdx = i;
    jwtVal = line.slice("JWT_SECRET=".length).trim();
    break;
  }
}

let changed = false;

if (jwtVal.length < MIN_LEN) {
  const secret = randomBytes(32).toString("hex");
  if (jwtIdx >= 0) {
    lines[jwtIdx] = `JWT_SECRET=${secret}`;
  } else {
    if (content.length && !content.endsWith("\n")) lines.push("");
    lines.push(`JWT_SECRET=${secret}`);
  }
  changed = true;
  console.log("[cliff-inn] Wrote JWT_SECRET to worker/.dev.vars (local dev only).");
}

let hasCors = false;
for (const line of lines) {
  if (line.startsWith("CORS_ORIGIN=")) {
    hasCors = true;
    break;
  }
}
if (!hasCors) {
  if (lines.length && lines[lines.length - 1] !== "") lines.push("");
  lines.push(LOCAL_CORS);
  changed = true;
  console.log("[cliff-inn] Added CORS_ORIGIN to worker/.dev.vars (local Vite; overrides wrangler.toml).");
}

if (changed) {
  fs.writeFileSync(devVarsPath, lines.join("\n") + "\n", "utf8");
}
