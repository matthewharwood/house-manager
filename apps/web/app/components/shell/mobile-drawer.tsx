import { useAtom } from "jotai";
import { useEffect, useRef } from "react";

import { drawerOpenAtom } from "./shell-state";
import { SidebarContent } from "./sidebar-content";

// The "More" drawer — the desktop sidebar re-housed for phones: an off-canvas
// modal <dialog> (focus-trap + Esc + scrim for free) holding the SAME IA
// (namespace top → nav → org bottom). RULES.md §11.5.
export function MobileDrawer() {
  const [open, setOpen] = useAtom(drawerOpenAtom);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: native <dialog> closes on Esc (the keyboard equivalent); onClick only adds backdrop click-to-dismiss.
    <dialog
      ref={ref}
      onClose={() => setOpen(false)}
      onClick={(event) => {
        if (event.target === ref.current) setOpen(false);
      }}
      aria-label="Navigation"
      className="m-0 mr-auto h-dvh max-h-dvh w-[86vw] max-w-80 border-r border-hairline bg-surface p-0 text-fg md:hidden [&::backdrop]:bg-scrim [&::backdrop]:backdrop-blur-sm"
    >
      <SidebarContent onNavigate={() => setOpen(false)} className="h-dvh" />
    </dialog>
  );
}
