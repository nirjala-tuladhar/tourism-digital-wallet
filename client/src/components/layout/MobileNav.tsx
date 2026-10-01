import { NavLink } from "react-router-dom";
import { LayoutDashboard, MapPinned, Search, Settings } from "lucide-react";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, color: "text-sky-600" },
  { to: "/trips", label: "Trips", icon: MapPinned, color: "text-emerald-600" },
  { to: "/search", label: "Search", icon: Search, color: "text-violet-600" },
  { to: "/settings", label: "Settings", icon: Settings, color: "text-slate-600" },
];

export function MobileNav() {
  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-2 py-1 backdrop-blur md:hidden"
    >
      <ul className="flex items-stretch">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium ${
                    isActive ? "text-brand-dark" : "text-slate-500"
                  }`
                }
              >
                <Icon className={`h-4 w-4 ${item.color}`} aria-hidden="true" />
                {item.label}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
