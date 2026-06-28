const STORAGE_KEY = "cliff_locale";

export const locales = ["en", "zh"];

/** @typedef {"en"|"zh"} Locale */

/** @type {Record<Locale, Record<string, string>>} */
export const copy = {
  en: {
    navCheckIn: "Self Check-in",
    navSupport: "Customer Service",
    staff: "Staff",
    moduleName: "Customer Service",
    commonQuestions: "Common questions",
    welcome:
      "Hi! I'm the Cliff Inn **Customer Service** assistant. Ask me about WiFi, parking, check-in/out, extending your stay, laundry, nearby food, and more.",
    placeholder: "Type any question — WiFi, parking, extend stay, and more…",
    footerHint: "Have a question? Just ask our Customer Service assistant anytime.",
    disclaimer:
      "Responses are AI-generated and may draw on web sources and large language models. Information may be inaccurate or out of date — please confirm important details with reception. Cliff Inn accepts no liability for any reliance on these responses.",
    houseRulesTitle: "Please note",
    send: "Send",
    thinking: "Thinking…",
    copy: "Copy",
    copied: "Copied!",
    contactFrontDesk: "Contact reception in person",
    contactHint: "Please visit the front desk to speak with reception.",
    rateLimited: "Too many requests. Please wait a moment.",
    aiUnavailable: "AI assistant is temporarily unavailable.",
    tryQuick: "Try the common questions above.",
    langEn: "EN",
    langZh: "中文",
  },
  zh: {
    navCheckIn: "Self Check-in",
    navSupport: "Customer Service",
    staff: "Staff",
    moduleName: "Customer Service",
    commonQuestions: "常见问题",
    welcome:
      "你好！我是 Cliff Inn 的客服助手 **Customer Service**。WiFi、停车、入住/退房、延住、洗衣、周边吃饭等问题都可以问我。",
    placeholder: "输入任何问题——酒店 WiFi、停车、延住等…",
    footerHint: "有任何问题，随时问我们的客服助手 **Customer Service**。",
    disclaimer:
      "本助手的回答由 AI 生成，可能引用网络及各类大模型的信息，内容可能不准确或过时，重要信息请以前台确认为准。Cliff Inn 不对因使用这些回答而产生的任何后果承担责任。",
    houseRulesTitle: "必须注意事项",
    send: "发送",
    thinking: "思考中…",
    copy: "复制",
    copied: "已复制！",
    contactFrontDesk: "到前台联系 reception",
    contactHint: "请前往前台当面联系 reception。",
    rateLimited: "请求过于频繁，请稍后再试。",
    aiUnavailable: "AI 助手暂时不可用。",
    tryQuick: "您可以点击上方常见问题。",
    langEn: "EN",
    langZh: "中文",
  },
};

export const houseRules = {
  en: [
    { title: "No smoking or drugs", body: "Smoking and drug use are strictly prohibited in rooms." },
    { title: "No damage or theft", body: "Damaging hotel property or theft is prohibited." },
    { title: "Conduct may be reported", body: "The hotel reserves the right to report guest misconduct to online platforms for record." },
    { title: "Late check-out & belongings", body: "If not extended by 10:00 AM and the guest has left, the hotel may move belongings to allow a new guest to check in." },
  ],
  zh: [
    { title: "禁止吸烟与毒品", body: "房间内禁止吸烟及使用任何毒品。" },
    { title: "禁止损坏与盗窃", body: "禁止损坏酒店设施或盗窃物品。" },
    { title: "行为上报声明", body: "酒店有权将客人的不当行为上报至网络平台进行记录。" },
    { title: "延住与物品声明", body: "若超过上午 10:00 未办理延住且已离开，酒店有权移走物品以便新客人入住。" },
  ],
};

/** @returns {Locale} */
export function getStoredLocale() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "zh" || v === "en") return v;
  } catch {
    /* ignore */
  }
  return "en";
}

/** @param {Locale} locale */
export function setStoredLocale(locale) {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}

/** @param {Locale} locale */
export function t(locale, key) {
  return copy[locale]?.[key] ?? copy.en[key] ?? key;
}
