/** Min length (UTF-8 chars). Many users paste short strings; 16+ is enough for HS256 key material. */
const JWT_SECRET_MIN_LEN = 16;

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
