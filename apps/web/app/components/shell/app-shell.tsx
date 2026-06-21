import type { ReactNode } from "react";

import { MobileDrawer } from "./mobile-drawer";
import { MobileTabBar } from "./mobile-tab-bar";
import { MobileTopBar } from "./mobile-top-bar";
import { Sidebar } from "./sidebar";

// The windowed-canvas HUD shell. Desktop (≥ md): a dark substrate framing two
// inset cards — the rail and the main content. Phone: edge-to-edge with a top
// bar, a fixed bottom tab bar, and the off-canvas drawer. One IA, two
// breakpoints (RULES.md §11.3, §11.5).
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas text-fg md:flex md:h-dvh md:gap-3 md:overflow-hidden md:p-3">
      <Sidebar />
      <div className="flex min-h-dvh flex-col bg-surface md:min-h-0 md:flex-1 md:overflow-hidden md:rounded-card md:border md:border-hairline">
        <MobileTopBar />
        <main className="flex-1 px-4 py-5 pb-24 md:overflow-y-auto md:px-6 md:pb-6">
          {children}
        </main>
        <MobileTabBar />
      </div>
      <MobileDrawer />
    </div>
  );
}
