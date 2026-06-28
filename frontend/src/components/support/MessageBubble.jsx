import { renderSimpleMarkdown, extractWifiPassword } from "./markdownLite.jsx";
import { t } from "../../lib/i18n.js";
import { useState } from "react";
import ContactFrontDeskButton from "./ContactFrontDeskButton.jsx";

export default function MessageBubble({ role, content, actions }) {
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const pw = extractWifiPassword(content) || content;
    try {
      await navigator.clipboard.writeText(pw);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[92%] md:max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed backdrop-blur-sm ${
          isUser
            ? "bg-amber-500/15 text-stone-800 border border-amber-300/40 rounded-br-md shadow-sm"
            : "bg-white/70 text-stone-700 border border-white/90 rounded-bl-md shadow-[0_4px_16px_rgba(15,23,42,0.05)]"
        }`}
      >
        <div className="break-words">{renderSimpleMarkdown(content)}</div>
        {!isUser && actions?.includes("copy_wifi") && (
          <button type="button" onClick={handleCopy} className="btn-ghost mt-3 text-xs min-h-[44px]">
            {copied ? t("copied") : t("copy")}
          </button>
        )}
        {!isUser && actions?.includes("contact_front_desk") && (
          <ContactFrontDeskButton className="mt-3" />
        )}
      </div>
    </div>
  );
}
