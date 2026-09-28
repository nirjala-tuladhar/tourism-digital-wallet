import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

type MainLayoutProps = {
  children: ReactNode;
};

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}