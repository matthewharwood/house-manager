import { useSetAtom } from "jotai";
import { Menu } from "lucide-react";

import { drawerOpenAtom } from "./shell-state";
import { WorkspaceSwitcher } from "./workspace-switcher";

// Phone top bar: a menu button (opens the full sidebar drawer) + the namespace
// chip (opens its picker as a bottom sheet). RULES.md §11.5.
export function MobileTopBar() {
  const setDrawerOpen = useSetAtom(drawerOpenAtom);
  return (
    <header
      className="sticky top-0 z-20 flex items-center gap-2 border-b border-hairline bg-surface/85 px-3 py-2.5 backdrop-blur md:hidden"
      style={{ paddingTop: "max(0.625rem, env(safe-area-inset-top))" }}
    >
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label="Open navigation"
        className="grid size-9 shrink-0 place-items-center rounded-button text-muted transition-colors hover:bg-raised hover:text-fg"
      >
        <Menu className="size-5" aria-hidden />
      </button>
      <WorkspaceSwitcher kind="namespace" variant="chip" />
    </header>
  );
}
