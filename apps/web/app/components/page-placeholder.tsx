// Placeholder content for a not-yet-built area, rendered inside the shell's
// <main>. Each household area (RULES.md §6) replaces this with its real views.
export function PagePlaceholder({ title, blurb }: { title: string; blurb?: string }) {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-3 text-center">
      <span className="rounded-pill border border-hairline bg-raised px-3 py-1 text-2xs uppercase tracking-wide text-muted">
        Scaffold
      </span>
      <h1 className="text-3xl text-fg">{title}</h1>
      <p className="max-w-sm text-sm text-muted">{blurb ?? "Coming soon."}</p>
    </section>
  );
}
