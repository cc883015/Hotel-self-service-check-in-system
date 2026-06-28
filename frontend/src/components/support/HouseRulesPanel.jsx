import { houseRules, t } from "../../lib/i18n.js";

export default function HouseRulesPanel() {
  return (
    <section className="glass p-4 md:p-5 border-amber-200/50" aria-labelledby="house-rules-title">
      <h2 id="house-rules-title" className="text-label mb-3">
        ⚠ {t("houseRulesTitle")}
      </h2>
      <ul className="space-y-3 text-sm text-stone-600">
        {houseRules.map((r) => (
          <li key={r.title}>
            <div className="font-medium text-stone-800">{r.title}</div>
            <div className="text-stone-500 mt-0.5">{r.body}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
