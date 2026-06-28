import { houseRules, t } from "../../lib/i18n.js";

export default function HouseRulesPanel({ locale }) {
  const rules = houseRules[locale] || houseRules.en;
  return (
    <section className="card p-4 md:p-5 border-amber-800/30 mb-4" aria-labelledby="house-rules-title">
      <h2 id="house-rules-title" className="text-xs uppercase tracking-[0.2em] text-amber-400/90 mb-3">
        ⚠ {t(locale, "houseRulesTitle")}
      </h2>
      <ul className="space-y-3 text-sm text-amber-100/85">
        {rules.map((r) => (
          <li key={r.title}>
            <div className="font-medium text-amber-200">{r.title}</div>
            <div className="text-ink-500 mt-0.5">{r.body}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
