import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  MapPinned,
  Receipt,
  Search,
  Settings,
  UserRound,
} from "lucide-react";

const items = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    iconClass: "bg-sky-100 text-sky-700",
  },
  {
    to: "/trips",
    label: "Trips",
    icon: MapPinned,
    iconClass: "bg-emerald-100 text-emerald-700",
  },
  {
    to: "/expenses",
    label: "Expenses",
    icon: Receipt,
    iconClass: "bg-amber-100 text-amber-700",
  },
  {
    to: "/search",
    label: "Search",
    icon: Search,
    iconClass: "bg-teal-100 text-teal-800",
  },
  {
    to: "/profile",
    label: "Profile",
    icon: UserRound,
    iconClass: "bg-amber-100 text-amber-700",
  },
  {
    to: "/settings",
    label: "Settings",
    icon: Settings,
    iconClass: "bg-slate-200 text-slate-700",
  },
];

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-4 lg:block">
      <nav aria-label="Main">
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-brand/10 text-brand-dark"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`
                  }
                >
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${item.iconClass}`}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
