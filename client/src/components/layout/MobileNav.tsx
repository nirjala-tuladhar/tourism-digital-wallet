import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium ${
    isActive ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-100"
  }`;

export function MobileNav() {
  return (
    <nav
      aria-label="Mobile"
      className="border-b border-slate-200 bg-white px-4 py-2 md:hidden"
    >
      <ul className="flex gap-1 overflow-x-auto">
        <li>
          <NavLink to="/dashboard" className={linkClass}>
            Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/trips" className={linkClass}>
            Trips
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
