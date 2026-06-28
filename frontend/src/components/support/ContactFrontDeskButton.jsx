import { t } from "../../lib/i18n.js";

export default function ContactFrontDeskButton({ className = "" }) {
  return (
    <div className={className}>
      <p className="text-xs text-stone-500 mb-2">{t("contactHint")}</p>
      <span className="inline-flex items-center min-h-[44px] px-4 rounded-full border border-amber-300/60 bg-amber-50/80 text-amber-800 text-xs uppercase tracking-wider">
        {t("contactFrontDesk")}
      </span>
    </div>
  );
}
