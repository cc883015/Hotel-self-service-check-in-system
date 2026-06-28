import { t } from "../../lib/i18n.js";

export default function ContactFrontDeskButton({ locale, className = "" }) {
  return (
    <div className={className}>
      <p className="text-xs text-ink-500 mb-2">{t(locale, "contactHint")}</p>
      <span className="inline-flex items-center min-h-[44px] px-4 rounded-full border border-amber-500/40 text-amber-200 text-xs uppercase tracking-wider">
        {t(locale, "contactFrontDesk")}
      </span>
    </div>
  );
}
