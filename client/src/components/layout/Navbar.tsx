import { useLocation } from "react-router-dom";
import { Wallet } from "lucide-react";
import { NotificationMenu } from "../notifications/NotificationMenu";
import { UserMenu } from "./UserMenu";

function sectionLabel(pathname: string): string {
  if (pathname.startsWith("/trips/new")) return "New trip";
  if (pathname.includes("/edit")) return "Edit trip";
  if (pathname.startsWith("/trips")) return "Trips";
  if (pathname.startsWith("/profile")) return "Profile";
  if (pathname.startsWith("/search")) return "Search";
  if (pathname.startsWith("/settings")) return "Settings";
  return "Dashboard";
}

export function Navbar() {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#062a33] to-[#14b8a6] text-white shadow-sm">
            <Wallet className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-slate-900 sm:text-base">
              Tourism Digital Wallet
            </p>
            <p className="truncate text-xs text-slate-500">{sectionLabel(pathname)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <NotificationMenu />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
