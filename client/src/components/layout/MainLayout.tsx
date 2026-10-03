import type { ReactNode } from "react";
import { MobileNav } from "./MobileNav";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { TripStatusPrompt } from "../trips/TripStatusPrompt";

type MainLayoutProps = {
  children: ReactNode;
};

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#f7f7fb] text-slate-900">
      <Navbar />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <Sidebar />

        <main className="min-h-0 w-full min-w-0 flex-1 overflow-y-auto p-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] sm:p-6 sm:pb-[calc(7.5rem+env(safe-area-inset-bottom))] lg:pb-6">
          {children}
        </main>
      </div>

      <MobileNav />
      <TripStatusPrompt />
    </div>
  );
}
