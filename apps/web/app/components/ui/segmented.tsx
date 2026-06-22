interface SegmentedOption<T extends string> {
  id: T;
  label: string;
}

// A small in-screen view switcher (Day / Week / Month, etc.) — a control, not a
// nav destination (RULES.md §7, §11.5).
export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentedOption<T>[];
}) {
  return (
    <div className="inline-flex rounded-button border border-hairline bg-surface p-0.5">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={option.id === value}
          onClick={() => onChange(option.id)}
          className={`rounded-sm px-3 py-1 text-xs font-medium transition-colors ${
            option.id === value ? "bg-accent text-accent-fg" : "text-muted hover:text-fg"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
