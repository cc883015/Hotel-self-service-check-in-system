/**
 * Ensures worker/.dev.vars contains a usable JWT_SECRET for local `wrangler dev`.
 * Does not overwrite an existing secret of length >= 32.
 */
import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workerRoot = path.join(__dirname, "..");
const devVarsPath = path.join(workerRoot, ".dev.vars");
const MIN_LEN = 32;

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

if (jwtVal.length >= MIN_LEN) {
  process.exit(0);
}

const secret = randomBytes(32).toString("hex");
if (jwtIdx >= 0) {
  lines[jwtIdx] = `JWT_SECRET=${secret}`;
} else {
  if (content.length && !content.endsWith("\n")) lines.push("");
  lines.push(`JWT_SECRET=${secret}`);
}

fs.writeFileSync(devVarsPath, lines.join("\n") + "\n", "utf8");
console.log("[cliff-inn] Wrote JWT_SECRET to worker/.dev.vars (local dev only).");
