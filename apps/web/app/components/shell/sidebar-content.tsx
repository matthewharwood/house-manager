import { Link } from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import { Settings } from "lucide-react";

import { Logo } from "./logo";
import { NAV_ITEMS } from "./nav";
import { drawerOpenAtom, settingsOpenAtom } from "./shell-state";
import { WorkspaceSwitcher } from "./workspace-switcher";

interface SidebarContentProps {
  collapsed?: boolean;
  onNavigate?: () => void;
  className?: string;
}

// The single source of the shell's information architecture, top → bottom:
// NAMESPACE switcher · primary nav · SETTINGS button (org switching lives in
// settings). Used verbatim by both the desktop rail and the mobile drawer so the
// two read as the same product (RULES.md §4.0, §11.5).
export function SidebarContent({
  collapsed = false,
  onNavigate,
  className = "",
}: SidebarContentProps) {
  return (
    <div className={`flex min-h-0 flex-col ${className}`}>
      {/* TOP — logo + namespace switcher */}
      <div className={`flex flex-col gap-3 p-3 ${collapsed ? "items-center" : ""}`}>
        <Logo withWordmark={!collapsed} />
        <WorkspaceSwitcher collapsed={collapsed} />
      </div>

      {/* MIDDLE — primary navigation */}
      <nav
        aria-label="Primary"
        className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-1"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={item.href}
              onClick={onNavigate}
              activeOptions={{ exact: item.href === "/" }}
              title={collapsed ? item.label : undefined}
              className={`group flex items-center gap-3 rounded-button px-2.5 py-2 text-sm text-muted transition-colors hover:bg-raised hover:text-fg data-[status=active]:bg-raised data-[status=active]:font-medium data-[status=active]:text-fg ${
                collapsed ? "justify-center" : ""
              }`}
            >
              <Icon
                className="size-[18px] shrink-0 group-data-[status=active]:text-accent"
                strokeWidth={1.75}
                aria-hidden
              />
              {collapsed ? null : <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* BOTTOM — settings (org switching lives inside) */}
      <div className="border-t border-hairline p-3">
        <SettingsButton collapsed={collapsed} />
      </div>
    </div>
  );
}

function SettingsButton({ collapsed }: { collapsed: boolean }) {
  const openSettings = useSetAtom(settingsOpenAtom);
  const setDrawerOpen = useSetAtom(drawerOpenAtom);
  return (
    <button
      type="button"
      title={collapsed ? "Settings" : undefined}
      onClick={() => {
        setDrawerOpen(false);
        openSettings(true);
      }}
      className={`flex w-full items-center gap-2.5 rounded-button text-muted transition-colors hover:bg-raised hover:text-fg ${
        collapsed ? "justify-center p-2" : "px-2.5 py-2"
      }`}
    >
      <Settings className="size-5 shrink-0" aria-hidden />
      {collapsed ? null : <span className="text-sm">Settings</span>}
    </button>
  );
}
