import { House } from "lucide-react";

// HUD logo mark — an accent tile + house glyph, with an optional UPPERCASE
// Monument Extended wordmark that drops away when the rail is collapsed.
export function Logo({ withWordmark = true }: { withWordmark?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden
        className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-accent text-accent-fg"
      >
        <House className="size-[18px]" strokeWidth={2.5} />
      </span>
      {withWordmark ? (
        <span className="font-display text-[13px] uppercase leading-none tracking-[0.06em] text-fg">
          House&nbsp;Mgr
        </span>
      ) : null}
    </span>
  );
}
