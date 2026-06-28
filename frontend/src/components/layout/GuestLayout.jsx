import { NavLink, Outlet, Link } from "react-router-dom";
import { t } from "../../lib/i18n.js";
import CliffInnLogo from "../icons/CliffInnLogo.jsx";

export default function GuestLayout() {
  const navClass = ({ isActive }) =>
    `nav-pill whitespace-nowrap ${isActive ? "nav-pill-active" : "nav-pill-idle"}`;

  return (
    <div className="relative z-10 min-h-screen flex flex-col safe-top safe-bottom">
      <header className="glass-nav sticky top-0 z-40 px-3 py-3 md:px-6 md:py-3.5">
        <div
          className="flex items-center gap-2 sm:gap-3 md:gap-4 min-h-[52px] md:min-h-[56px]"
          aria-label="Site header"
        >
          <div className="flex items-center gap-2.5 shrink-0 min-w-0">
            <CliffInnLogo />
            <div className="leading-tight min-w-0">
              <div className="font-display text-base sm:text-lg md:text-xl font-bold text-stone-800 truncate max-w-[88px] sm:max-w-none">
                Cliff Inn
              </div>
              <div className="text-[10px] md:text-xs uppercase tracking-[0.16em] text-stone-500 font-semibold truncate hidden lg:block">
                Cliff House Motel
              </div>
            </div>
          </div>

          <nav
            className="flex flex-1 items-center justify-center gap-2 md:gap-3 overflow-x-auto scrollbar-none px-1"
            aria-label="Guest navigation"
          >
            <NavLink to="/" end className={navClass}>
              {t("navCheckIn")}
            </NavLink>
            <NavLink to="/support" className={navClass}>
              {t("navSupport")}
            </NavLink>
          </nav>

          <Link
            to="/login"
            className="nav-staff shrink-0"
          >
            {t("staff")}
          </Link>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
