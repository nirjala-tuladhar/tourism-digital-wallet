import { Link } from "react-router-dom";
import { Wallet } from "lucide-react";
import { NotificationMenu } from "../notifications/NotificationMenu";
import { UserMenu } from "./UserMenu";

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          to="/dashboard"
          className="flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          aria-label="Tourism Digital Wallet, go to dashboard"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#062a33] to-[#14b8a6] text-white shadow-sm">
            <Wallet className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="truncate text-sm font-semibold tracking-tight text-slate-900 sm:text-base">
            Tourism Digital Wallet
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <NotificationMenu />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
