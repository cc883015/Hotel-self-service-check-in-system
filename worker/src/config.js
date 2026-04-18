/** Min length for HS256 key material (Web Crypto rejects empty / tiny keys). */
const JWT_SECRET_MIN_LEN = 32;

/**
 * @param {{ JWT_SECRET?: string }} env
 * @returns {string | null} trimmed secret, or null if missing/too short
 */
export function getJwtSecret(env) {
  const s = env.JWT_SECRET;
  if (typeof s !== "string") return null;
  const t = s.trim();
  return t.length >= JWT_SECRET_MIN_LEN ? t : null;
}
