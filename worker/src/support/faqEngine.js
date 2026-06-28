/** Deterministic FAQ matching — runs before any LLM call. */

const INTENT_CATEGORIES = {
  laundry: "laundry",
  dining: "dining",
  supermarket: "supermarket",
};

/** @type {Record<string, string[]>} */
const SYNONYMS = {
  wifi_ssid: ["wifi", "wi-fi", "wireless", "ssid", "network", "internet", "无线", "网络", "账号", "名称"],
  wifi_password: ["wifi password", "wi-fi password", "passcode", "password", "密码", "无线密码", "连不上", "上不了网"],
  parking: ["parking", "park", "car", "vehicle", "车位", "停车", "停哪"],
  checkin_time: ["check in", "check-in", "checkin", "arrival", "入住", "几点入住", "什么时候入住"],
  checkout_time: ["check out", "check-out", "checkout", "departure", "退房", "几点退房", "什么时候退房"],
  extend_stay: ["extend", "extension", "stay longer", "late checkout", "延住", "续住", "多住"],
  laundry: ["laundry", "laundromat", "wash", "dry", "洗衣", "洗衣店", "洗衣服"],
  dining: ["food", "restaurant", "eat", "dining", "mcdonald", "kfc", "吃饭", "餐饮", "餐厅", "麦当劳"],
  supermarket: ["supermarket", "grocery", "convenience", "7-eleven", "coles", "超市", "便利店", "买东西"],
  damage_report: ["damage", "broken", "complaint", "urgent", "emergency", "fault", "损坏", "报修", "投诉", "紧急", "坏了"],
  things_to_do: ["things to do", "sightseeing", "attraction", "tourism", "trip", "游玩", "景点", "旅游"],
};

export function normalizeMessage(raw) {
  return String(raw || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
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
      if (norm.includes(term) && term.length >= 3) {
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
