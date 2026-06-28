/** Deterministic FAQ matching — runs before any LLM call. */

const INTENT_CATEGORIES = {
  laundry: "laundry",
  dining: "dining",
  supermarket: "supermarket",
};

/** @type {Record<string, string[]>} */
const SYNONYMS = {
  wifi_ssid: ["wifi", "wi-fi", "wireless", "ssid", "network", "internet"],
  wifi_password: ["wifi password", "wi-fi password", "passcode", "password", "cannot connect"],
  parking: ["parking", "park", "car", "vehicle"],
  checkin_time: ["check in", "check-in", "checkin", "arrival"],
  checkout_time: ["check out", "check-out", "checkout", "departure"],
  extend_stay: ["extend", "extension", "stay longer", "late checkout"],
  laundry: ["laundry", "laundromat", "wash", "dry"],
  dining: ["food", "restaurant", "eat", "dining", "mcdonald", "kfc", "nearby restaurant"],
  supermarket: ["supermarket", "grocery", "convenience", "7-eleven", "coles"],
  damage_report: ["damage", "broken", "complaint", "urgent", "emergency", "fault"],
  things_to_do: ["things to do", "sightseeing", "attraction", "tourism", "trip"],
};

export function normalizeMessage(raw) {
  return String(raw || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function minTermLen() {
  return 3;
}

/**
 * @param {string} message
 * @param {{ intent: string, keywords?: string | null }[]} entries
 */
export function matchFaqIntent(message, entries) {
  const norm = normalizeMessage(message);
  if (!norm) return null;

  let best = null;
  let bestScore = 0;

  for (const row of entries) {
    const intent = row.intent;
    const terms = new Set();
    if (row.keywords) {
      for (const k of row.keywords.split(",")) {
        const t = normalizeMessage(k);
        if (t) terms.add(t);
      }
    }
    const syns = SYNONYMS[intent] || [];
    for (const s of syns) terms.add(normalizeMessage(s));

    for (const term of terms) {
      if (!term) continue;
      if (norm === term) return intent;
      if (norm.includes(term) && term.length >= minTermLen()) {
        const score = term.length;
        if (score > bestScore) {
          bestScore = score;
          best = intent;
        }
      }
    }
  }

  return best;
}

export function intentCategory(intent) {
  return INTENT_CATEGORIES[intent] || null;
}

/** @param {string} intent */
export function faqActions(intent) {
  const actions = [];
  if (intent === "wifi_password") actions.push("copy_wifi");
  if (intent === "damage_report") actions.push("contact_front_desk");
  return actions;
}
