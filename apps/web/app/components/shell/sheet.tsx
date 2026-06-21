import { Check } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";

export interface SheetOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  options: SheetOption[];
  activeId: string;
  onSelect: (id: string) => void;
  footer?: ReactNode;
}

// A modal list picker on the native <dialog> — free focus-trap + Esc + scrim
// (WAI-ARIA APG dialog). Bottom sheet on phones (thumb zone), centered card at
// ≥ sm. RULES.md §11.5.
export function Sheet({ open, onClose, title, options, activeId, onSelect, footer }: SheetProps) {
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
      onClose={onClose}
      onClick={(event) => {
        // A click whose target is the dialog element itself landed on the
        // backdrop (children are the content) — dismiss.
        if (event.target === ref.current) onClose();
      }}
      aria-label={title}
      className="m-auto w-full max-w-sm rounded-card border border-hairline bg-overlay p-0 text-fg max-sm:mt-auto max-sm:mb-0 max-sm:max-w-none max-sm:rounded-b-none [&::backdrop]:bg-black/60 [&::backdrop]:backdrop-blur-sm"
    >
      <div className="flex max-h-[80dvh] flex-col">
        <div className="flex items-center gap-3 border-b border-hairline px-4 py-3">
          <h2 className="font-display text-sm text-fg">{title}</h2>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto p-2">
          {options.map((option) => {
            const active = option.id === activeId;
            return (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(option.id);
                    onClose();
                  }}
                  className={`flex w-full items-center gap-3 rounded-button px-3 py-2.5 text-left transition-colors ${
                    active ? "bg-raised text-fg" : "text-muted hover:bg-raised hover:text-fg"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`grid size-8 shrink-0 place-items-center rounded-[8px] font-display text-xs ${
                      active ? "bg-accent text-accent-fg" : "bg-raised text-muted"
                    }`}
                  >
                    {option.label.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-fg">{option.label}</span>
                    {option.sublabel ? (
                      <span className="block truncate text-xs text-muted">{option.sublabel}</span>
                    ) : null}
                  </span>
                  {active ? <Check className="size-4 shrink-0 text-accent" aria-hidden /> : null}
                </button>
              </li>
            );
          })}
        </ul>
        {footer ? <div className="border-t border-hairline p-2">{footer}</div> : null}
      </div>
    </dialog>
  );
}
