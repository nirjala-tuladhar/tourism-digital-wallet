import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, MapPinned, Receipt, Search, Settings } from "lucide-react";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, match: (path: string) => path.startsWith("/dashboard") },
  { to: "/search", label: "Search", icon: Search, match: (path: string) => path.startsWith("/search") },
  { to: "/trips", label: "Trips", icon: MapPinned, match: (path: string) => path.startsWith("/trips"), center: true },
  { to: "/expenses", label: "Expense", icon: Receipt, match: (path: string) => path.startsWith("/expenses") },
  { to: "/settings", label: "Settings", icon: Settings, match: (path: string) => path.startsWith("/settings") },
];

export function MobileNav() {
  const { pathname } = useLocation();
  const activeIndex = items.findIndex((item) => item.match(pathname));
  const active = activeIndex >= 0 ? items[activeIndex] : null;
  const ActiveIcon = active?.icon;

  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white shadow-[0_-8px_24px_rgba(15,23,42,0.06)] lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="relative h-[4.5rem]">
        {active && ActiveIcon ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-5 items-center justify-center rounded-full bg-gradient-to-br from-[#062a33] to-[#0e7490] text-white shadow-lg shadow-[#0e7490]/30 transition-[left] duration-300 ease-out"
            style={{ left: `${(activeIndex + 0.5) * 20}%` }}
          >
            <ActiveIcon className="h-5 w-5 transition-transform duration-300" />
          </div>
        ) : null}

        <ul className="grid h-full grid-cols-5">
          {items.map((item) => {
            const Icon = item.icon;
            const selected = item.match(pathname);

            return (
              <li key={item.to} className="min-w-0">
                <NavLink
                  to={item.to}
                  end={item.to === "/dashboard"}
                  className={`flex h-full flex-col items-center justify-end gap-1 px-1 pb-2 text-[11px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand ${
                    selected ? "font-semibold text-brand-dark" : "font-medium text-slate-500"
                  }`}
                >
                  <Icon
                    className={`transition-opacity duration-200 ${
                      selected ? "h-5 w-5 opacity-0" : item.center ? "h-[1.35rem] w-[1.35rem] text-brand" : "h-5 w-5 text-slate-500"
                    }`}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
