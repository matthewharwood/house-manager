import { Link } from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import { MoreHorizontal } from "lucide-react";

import { PRIMARY_TABS } from "./nav";
import { drawerOpenAtom } from "./shell-state";

// Persistent bottom tab bar — the primary mobile nav (NN/g: never a hamburger as
// primary). 4 thumb-reachable areas + a 5th "More" that opens the drawer.
export function MobileTabBar() {
  const setDrawerOpen = useSetAtom(drawerOpenAtom);
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-hairline bg-surface/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {PRIMARY_TABS.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.id}
            to={item.href}
            activeOptions={{ exact: item.href === "/" }}
            className="flex flex-col items-center justify-center gap-1 py-2 text-2xs text-muted transition-colors data-[status=active]:text-accent"
          >
            <Icon className="size-5" strokeWidth={1.75} aria-hidden />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="flex flex-col items-center justify-center gap-1 py-2 text-2xs text-muted transition-colors hover:text-fg"
      >
        <MoreHorizontal className="size-5" aria-hidden />
        <span>More</span>
      </button>
    </nav>
  );
}
