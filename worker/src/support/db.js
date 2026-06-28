/** D1 queries for Customer Service module. */

export async function getQuickFaqs(db, locale) {
  const loc = locale === "zh" ? "zh" : "en";
  const { results } = await db.prepare(
    "SELECT id, intent, question, answer, sort_order FROM faq_entries " +
    "WHERE is_quick = 1 AND locale = ? ORDER BY sort_order ASC"
  ).bind(loc).all();
  if (results?.length) return results;
  const fallback = await db.prepare(
    "SELECT id, intent, question, answer, sort_order FROM faq_entries " +
    "WHERE is_quick = 1 AND locale = 'en' ORDER BY sort_order ASC"
  ).all();
  return fallback.results || [];
}

export async function getFaqByIntent(db, intent, locale) {
  const loc = locale === "zh" ? "zh" : "en";
  let row = await db.prepare(
    "SELECT id, intent, question, answer FROM faq_entries WHERE intent = ? AND locale = ?"
  ).bind(intent, loc).first();
  if (!row) {
    row = await db.prepare(
      "SELECT id, intent, question, answer FROM faq_entries WHERE intent = ? AND locale = 'en'"
    ).bind(intent).first();
  }
  return row;
}

export async function getAllFaqKeywords(db) {
  const { results } = await db.prepare(
    "SELECT DISTINCT intent, keywords FROM faq_entries WHERE keywords IS NOT NULL"
  ).all();
  return results || [];
}

export async function getPlacesByCategory(db, category) {
  const { results } = await db.prepare(
    "SELECT name, address, place_id, note FROM nearby_places WHERE category = ? ORDER BY sort_order ASC"
  ).bind(category).all();
  return results || [];
}

export async function getHotelSettings(db) {
  const { results } = await db.prepare("SELECT key, value FROM hotel_settings").all();
  /** @type {Record<string, string>} */
  const out = {};
  for (const r of results || []) out[r.key] = r.value;
  return out;
}

export async function getKnowledgeBase(db, locale) {
  const loc = locale === "zh" ? "zh" : "en";
  const { results } = await db.prepare(
    "SELECT title, content FROM knowledge_base WHERE locale = ? OR locale = 'en'"
  ).bind(loc).all();
  return results || [];
}

export async function insertChatLog(db, row) {
  await db.prepare(
    "INSERT INTO chat_logs (id, session_id, role, content, matched_intent, provider, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    row.id, row.session_id, row.role, row.content,
    row.matched_intent || null, row.provider || null, row.created_at
  ).run();
}

export async function checkRateLimit(db, key, limit, windowSec) {
  const t = Math.floor(Date.now() / 1000);
  const row = await db.prepare(
    "SELECT window_start, count FROM support_rate_limits WHERE key = ?"
  ).bind(key).first();

  if (!row || t - row.window_start >= windowSec) {
    await db.prepare(
      "INSERT INTO support_rate_limits (key, window_start, count) VALUES (?, ?, 1) " +
      "ON CONFLICT(key) DO UPDATE SET window_start = ?, count = 1"
    ).bind(key, t, t).run();
    return { ok: true };
  }

  if (row.count >= limit) {
    return { ok: false, retryAfter: windowSec - (t - row.window_start) };
  }

  await db.prepare(
    "UPDATE support_rate_limits SET count = count + 1 WHERE key = ?"
  ).bind(key).run();
  return { ok: true };
}
