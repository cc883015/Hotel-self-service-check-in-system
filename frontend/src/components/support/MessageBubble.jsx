import { renderSimpleMarkdown, extractWifiPassword } from "./markdownLite.jsx";
import { t } from "../../lib/i18n.js";
import { useState } from "react";
import ContactFrontDeskButton from "./ContactFrontDeskButton.jsx";

export default function MessageBubble({ role, content, actions, locale, onCopyDone }) {
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const pw = extractWifiPassword(content) || content;
    try {
      await navigator.clipboard.writeText(pw);
      setCopied(true);
      onCopyDone?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[92%] md:max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-amber-400/20 text-amber-50 border border-amber-400/25 rounded-br-md"
            : "bg-ink-900/80 text-amber-100/90 border border-ink-700 rounded-bl-md"
        }`}
      >
        <div className="break-words">{renderSimpleMarkdown(content)}</div>
        {!isUser && actions?.includes("copy_wifi") && (
          <button type="button" onClick={handleCopy} className="btn-ghost mt-3 text-xs min-h-[44px]">
            {copied ? t(locale, "copied") : t(locale, "copy")}
          </button>
        )}
        {!isUser && actions?.includes("contact_front_desk") && (
          <ContactFrontDeskButton locale={locale} className="mt-3" />
        )}
      </div>
    </div>
  );
}
