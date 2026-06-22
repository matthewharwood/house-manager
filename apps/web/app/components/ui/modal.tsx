import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

// Generic modal form on the native <dialog> (focus-trap + Esc + scrim for free).
// Bottom sheet on phones, centered card at ≥ sm.
export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: native <dialog> closes on Esc (keyboard) and via the explicit Close button; onClick only adds backdrop dismiss.
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      aria-label={title}
      className="m-auto w-full max-w-md rounded-card border border-hairline bg-overlay p-0 text-fg max-sm:mt-auto max-sm:mb-0 max-sm:max-w-none max-sm:rounded-b-none [&::backdrop]:bg-scrim [&::backdrop]:backdrop-blur-sm"
    >
      <div className="flex max-h-[85dvh] flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
          <h2 className="font-display text-sm text-fg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 shrink-0 place-items-center rounded-button text-muted transition-colors hover:bg-raised hover:text-fg"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
        {footer ? <div className="border-t border-hairline p-3">{footer}</div> : null}
      </div>
    </dialog>
  );
}
