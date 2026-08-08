"use client";

import { useState } from "react";
import { Menu, Zap } from "lucide-react";
import { Sidebar } from "@/components/sidebar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col lg:flex-row">
      {/* Mobile-only top bar: the sidebar is a drawer below lg, so
          something has to carry the logo and open it. */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-amber-dim text-accent-amber">
            <Zap size={40} strokeWidth={2.5} />
          </div>
          <span className="font-[family-name:var(--font-display)] text-[14px] font-medium tracking-tight">
            WorkflowStudio
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>
      </div>

      <div className="relative flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <div
            className="absolute inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div className="absolute inset-y-0 left-0 z-40 lg:static lg:z-auto">
          <Sidebar open={sidebarOpen} />
        </div>

        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
