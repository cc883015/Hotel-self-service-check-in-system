import { NavLink, Outlet, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { getStoredLocale, setStoredLocale, t } from "../../lib/i18n.js";

export default function GuestLayout() {
  const [locale, setLocale] = useState(getStoredLocale);

  useEffect(() => {
    setStoredLocale(locale);
  }, [locale]);

  const navClass = ({ isActive }) =>
    `min-h-[44px] px-3 py-2 text-xs uppercase tracking-[0.12em] transition rounded-full whitespace-nowrap ${
      isActive
        ? "bg-amber-400/15 text-amber-200 border border-amber-400/40"
        : "text-ink-500 hover:text-amber-300 border border-transparent"
    }`;

  return (
    <div className="relative z-10 min-h-screen flex flex-col safe-top safe-bottom">
      <header className="flex flex-col gap-3 px-5 py-4 md:px-10 md:py-5 border-b border-ink-800/60">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 flex-shrink-0 rounded-full border border-amber-400/50 flex items-center justify-center">
              <span className="font-display text-amber-400 text-lg leading-none">C</span>
            </div>
            <div className="leading-tight min-w-0">
              <div className="font-display text-amber-100 text-base md:text-lg truncate">Cliff Inn</div>
              <div className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-ink-600">
                Cliff House Motel
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex rounded-full border border-ink-700 overflow-hidden text-[11px]">
              <button
                type="button"
                onClick={() => setLocale("en")}
                className={`min-h-[36px] min-w-[40px] px-2 ${locale === "en" ? "bg-amber-400/20 text-amber-200" : "text-ink-500"}`}
                aria-pressed={locale === "en"}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLocale("zh")}
                className={`min-h-[36px] min-w-[40px] px-2 ${locale === "zh" ? "bg-amber-400/20 text-amber-200" : "text-ink-500"}`}
                aria-pressed={locale === "zh"}
              >
                中文
              </button>
            </div>
            <Link
              to="/login"
              className="text-xs uppercase tracking-[0.15em] text-ink-600 hover:text-amber-300 transition min-h-[44px] flex items-center"
            >
              {t(locale, "staff")}
            </Link>
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" aria-label="Guest navigation">
          <NavLink to="/" end className={navClass}>
            {t(locale, "navCheckIn")}
          </NavLink>
          <NavLink to="/support" className={navClass}>
            {t(locale, "navSupport")}
          </NavLink>
        </nav>
      </header>
      <Outlet context={{ locale, setLocale }} />
    </div>
  );
}
