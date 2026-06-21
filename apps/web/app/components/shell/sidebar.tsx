import { useAtom } from "jotai";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { sidebarCollapsedAtom } from "./shell-state";
import { SidebarContent } from "./sidebar-content";

// Desktop left rail — a rounded "inset card" of the windowed-canvas HUD, hidden
// on phones (the drawer takes over). Collapses to an icon-only rail.
export function Sidebar() {
  const [collapsed, setCollapsed] = useAtom(sidebarCollapsedAtom);
  return (
    <aside
      className={`hidden shrink-0 flex-col overflow-hidden rounded-card border border-hairline bg-surface transition-[width] duration-200 md:flex ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <SidebarContent collapsed={collapsed} className="flex-1" />
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="flex items-center justify-center gap-2 border-t border-hairline px-3 py-2.5 text-xs text-muted transition-colors hover:bg-raised hover:text-fg"
      >
        {collapsed ? (
          <PanelLeftOpen className="size-4" aria-hidden />
        ) : (
          <>
            <PanelLeftClose className="size-4" aria-hidden />
            <span>Collapse</span>
          </>
        )}
      </button>
    </aside>
  );
}
