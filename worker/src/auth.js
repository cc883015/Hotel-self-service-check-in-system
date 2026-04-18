// Auth utilities — all built on Web Crypto, no npm deps.
//
// - Password hashing: PBKDF2-SHA256 (100k iters — Cloudflare Workers Web Crypto max is 100_000).
// - JWT: HS256, self-signed, verified in constant time.

const enc = new TextEncoder();
const dec = new TextDecoder();

// ---------- base64url helpers ----------
function b64uEncode(bytes) {
  if (bytes instanceof ArrayBuffer) bytes = new Uint8Array(bytes);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64uEncodeString(str) {
  return b64uEncode(enc.encode(str));
}
function b64uDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// ---------- password hashing ----------
const PBKDF2_ITERS = 100_000;
const PBKDF2_KEYLEN = 32;

async function pbkdf2(password, salt, iterations = PBKDF2_ITERS) {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    key,
    PBKDF2_KEYLEN * 8
  );
  return new Uint8Array(bits);
}

// Format: pbkdf2$<iters>$<salt>$<hash>
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt);
  return `pbkdf2$${PBKDF2_ITERS}$${b64uEncode(salt)}$${b64uEncode(hash)}`;
}

export async function verifyPassword(password, stored) {
  try {
    const [algo, iterStr, saltB64, hashB64] = stored.split("$");
    if (algo !== "pbkdf2") return false;
    const iters = parseInt(iterStr, 10);
    const salt = b64uDecode(saltB64);
    const expected = b64uDecode(hashB64);
    const actual = await pbkdf2(password, salt, iters);
    if (actual.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
    return diff === 0;
  } catch {
    return false;
  }
}

// ---------- JWT (HS256) ----------
async function hmacSign(data, secret) {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return b64uEncode(sig);
}

export async function signJWT(payload, secret, expiresInSec = 60 * 60 * 12) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const full = { ...payload, iat: now, exp: now + expiresInSec };
  const headerB64 = b64uEncodeString(JSON.stringify(header));
  const payloadB64 = b64uEncodeString(JSON.stringify(full));
  const sig = await hmacSign(`${headerB64}.${payloadB64}`, secret);
  return `${headerB64}.${payloadB64}.${sig}`;
}

export async function verifyJWT(token, secret) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sig] = parts;
  const expectedSig = await hmacSign(`${headerB64}.${payloadB64}`, secret);
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(dec.decode(b64uDecode(payloadB64)));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---------- cookies ----------
export function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(/;\s*/)) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    out[part.slice(0, eq).trim()] = decodeURIComponent(part.slice(eq + 1));
  }
  return out;
}

export function buildAuthCookie(token, maxAgeSec = 60 * 60 * 12) {
  return [
    `cliff_auth=${encodeURIComponent(token)}`,
    "HttpOnly",
    "Secure",
    // Lax: cookie is sent on same-site navigations and top-level GET from external links; Strict can drop session on some flows.
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${maxAgeSec}`,
  ].join("; ");
}

export function clearAuthCookie() {
  return "cliff_auth=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0";
}
