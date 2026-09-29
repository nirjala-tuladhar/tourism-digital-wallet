import { NavLink } from "react-router-dom";

export function Sidebar() {
  return (
    <aside className="w-64 min-h-[calc(100vh-4rem)] border-r p-4">
      <nav>
        <ul className="space-y-2">
          <li>
            <NavLink to="/dashboard">Dashboard</NavLink>
          </li>

          <li>
            <NavLink to="/trips">Trips</NavLink>
          </li>

          <li>
            <NavLink to="/documents">Documents</NavLink>
          </li>

          <li>
            <NavLink to="/bookings">Bookings</NavLink>
          </li>

          <li>
            <NavLink to="/itinerary">Itinerary</NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
}