import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-teal-50 text-teal-800"
      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
  }`;

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 p-4 md:block">
      <nav aria-label="Main">
        <ul className="space-y-1">
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
          <li>
            <NavLink to="/documents" className={linkClass}>
              Documents
            </NavLink>
          </li>
          <li>
            <NavLink to="/bookings" className={linkClass}>
              Bookings
            </NavLink>
          </li>
          <li>
            <NavLink to="/itinerary" className={linkClass}>
              Itinerary
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
