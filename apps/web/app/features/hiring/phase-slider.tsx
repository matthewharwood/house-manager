import { Fragment } from "react";

import { HIRING_PHASES } from "./data";

interface PhaseSliderProps {
  phase: number;
  onChange: (phase: number) => void;
  disabled?: boolean;
}

// The pipeline as a slider with a dot per phase (RULES.md §8.4). Click/tap a dot
// to advance or pull back a candidate; the track fills to the current phase.
export function PhaseSlider({ phase, onChange, disabled = false }: PhaseSliderProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center">
        {HIRING_PHASES.map((label, index) => {
          const reached = index <= phase;
          const current = index === phase;
          return (
            <Fragment key={label}>
              {index > 0 ? (
                <span
                  aria-hidden
                  className={`h-0.5 flex-1 ${index <= phase ? "bg-accent" : "bg-hairline"}`}
                />
              ) : null}
              <button
                type="button"
                disabled={disabled}
                aria-label={`Move to ${label}`}
                aria-current={current ? "step" : undefined}
                onClick={() => onChange(index)}
                className={`size-4 shrink-0 rounded-pill border-2 transition-transform disabled:opacity-50 ${
                  reached ? "border-accent bg-accent" : "border-hairline bg-surface"
                } ${current ? "scale-125 ring-2 ring-accent/40" : ""}`}
              />
            </Fragment>
          );
        })}
      </div>
      <div className="flex justify-between">
        {HIRING_PHASES.map((label, index) => (
          <span
            key={label}
            className={`text-2xs ${index === phase ? "font-medium text-accent" : "text-faint"}`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
