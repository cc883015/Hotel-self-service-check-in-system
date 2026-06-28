/** English-only UI copy. */

export const copy = {
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
};

export const houseRules = [
  { title: "No smoking or drugs", body: "Smoking and drug use are strictly prohibited in rooms." },
  { title: "No damage or theft", body: "Damaging hotel property or theft is prohibited." },
  { title: "Conduct may be reported", body: "The hotel reserves the right to report guest misconduct to online platforms for record." },
  { title: "Late check-out & belongings", body: "If not extended by 10:00 AM and the guest has left, the hotel may move belongings to allow a new guest to check in." },
];

export const LOCALE = "en";

/** @param {keyof typeof copy | string} key */
export function t(key) {
  return copy[key] ?? key;
}
