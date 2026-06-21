import { useAtomValue, useSetAtom } from "jotai";
import { Check, Copy, Pencil, Plus, RotateCcw, X } from "lucide-react";
import { type ReactNode, useState } from "react";

import { SelectField, TextArea, TextField } from "~/components/ui/field";
import { Modal } from "~/components/ui/modal";

import {
  CANDIDATE_SOURCES,
  type Candidate,
  candidates,
  type JobPosting,
  jobPostingAtom,
  jobPostings,
  POSTING_STATUSES,
  renderPostingText,
} from "./data";
import { PhaseSlider } from "./phase-slider";

const primaryBtn =
  "inline-flex items-center gap-1.5 rounded-button bg-accent px-3 py-2 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90";
const ghostBtn =
  "inline-flex items-center gap-1.5 rounded-button border border-hairline px-3 py-1.5 text-xs text-muted transition-colors hover:bg-raised hover:text-fg";
const iconBtn =
  "grid size-8 shrink-0 place-items-center rounded-button text-muted transition-colors hover:bg-raised hover:text-fg";

function statusBadgeClass(status: string): string {
  const tones: Record<string, string> = { open: "text-success", closed: "text-danger" };
  const tone = tones[status] ?? "text-faint";
  return `rounded-pill border border-hairline px-2.5 py-1 text-xs uppercase ${tone}`;
}

export function HiringPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl text-fg">Hiring</h1>
        <p className="heading-body text-sm text-muted">
          A bespoke, lightweight ATS — post the job, collect candidates, slide them through phases.
        </p>
      </header>
      <JobPostingSection />
      <CandidatesSection />
    </div>
  );
}

function JobPostingSection() {
  const posting = useAtomValue(jobPostingAtom);
  const upsert = useSetAtom(jobPostings.upsertAtom);
  const [editing, setEditing] = useState(false);

  if (!posting) {
    return (
      <section className="flex flex-col items-center gap-3 rounded-card border border-dashed border-hairline p-6 text-center">
        <p className="text-sm text-muted">No job posting yet.</p>
        <button type="button" onClick={() => setEditing(true)} className={primaryBtn}>
          <Plus className="size-4" aria-hidden /> Create job posting
        </button>
        {editing ? <JobPostingModal posting={null} onClose={() => setEditing(false)} /> : null}
      </section>
    );
  }

  const meta = [posting.location, posting.schedule, posting.pay].filter(Boolean).join("  ·  ");
  const cycleStatus = () => {
    const index = POSTING_STATUSES.indexOf(posting.status);
    const next = POSTING_STATUSES[(index + 1) % POSTING_STATUSES.length] ?? "draft";
    upsert({ id: posting.id, status: next });
  };

  return (
    <section className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg text-fg">{posting.title}</h2>
          {meta ? <p className="mt-1 text-xs text-muted">{meta}</p> : null}
        </div>
        <button type="button" onClick={cycleStatus} className={statusBadgeClass(posting.status)}>
          {posting.status}
        </button>
      </div>
      {posting.summary ? (
        <p className="whitespace-pre-wrap text-sm text-muted">{posting.summary}</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setEditing(true)} className={ghostBtn}>
          <Pencil className="size-3.5" aria-hidden /> Edit
        </button>
        {(["LinkedIn", "Indeed", "ZipRecruiter"] as const).map((board) => (
          <CopyButton key={board} label={board} text={renderPostingText(posting)} />
        ))}
      </div>
      {editing ? <JobPostingModal posting={posting} onClose={() => setEditing(false)} /> : null}
    </section>
  );
}

function CopyButton({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={ghostBtn}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard unavailable */
        }
      }}
    >
      {copied ? (
        <Check className="size-3.5 text-success" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
      {copied ? "Copied" : `Copy for ${label}`}
    </button>
  );
}

function JobPostingModal({
  posting,
  onClose,
}: {
  posting: JobPosting | null;
  onClose: () => void;
}) {
  const upsert = useSetAtom(jobPostings.upsertAtom);
  const [draft, setDraft] = useState(() => ({
    title: posting?.title ?? "House Manager",
    location: posting?.location ?? "",
    schedule: posting?.schedule ?? "",
    pay: posting?.pay ?? "",
    summary: posting?.summary ?? "",
    responsibilities: posting?.responsibilities ?? "",
    requirements: posting?.requirements ?? "",
  }));
  const set = (key: keyof typeof draft) => (value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));

  return (
    <Modal
      open
      onClose={onClose}
      title={posting ? "Edit posting" : "Create job posting"}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={ghostBtn}>
            Cancel
          </button>
          <button
            type="button"
            className={primaryBtn}
            onClick={() => {
              upsert(posting ? { id: posting.id, ...draft } : draft);
              onClose();
            }}
          >
            Save
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <TextField label="Title" value={draft.title} onChange={set("title")} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <TextField label="Location" value={draft.location} onChange={set("location")} />
          <TextField label="Schedule" value={draft.schedule} onChange={set("schedule")} />
          <TextField label="Pay" value={draft.pay} onChange={set("pay")} />
        </div>
        <TextArea label="Summary" value={draft.summary} onChange={set("summary")} />
        <TextArea
          label="Responsibilities"
          value={draft.responsibilities}
          onChange={set("responsibilities")}
        />
        <TextArea label="Requirements" value={draft.requirements} onChange={set("requirements")} />
      </div>
    </Modal>
  );
}

function CandidatesSection() {
  const all = useAtomValue(candidates.listAtom);
  const [adding, setAdding] = useState(false);
  const active = all.filter((candidate) => !candidate.archived);
  const archived = all.filter((candidate) => candidate.archived);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg text-fg">
          Candidates <span className="text-sm text-faint">({active.length})</span>
        </h2>
        <button type="button" onClick={() => setAdding(true)} className={primaryBtn}>
          <Plus className="size-4" aria-hidden /> Add candidate
        </button>
      </div>
      {active.length === 0 ? (
        <p className="rounded-card border border-dashed border-hairline p-6 text-center text-sm text-muted">
          No candidates yet. Add the first résumé that comes in.
        </p>
      ) : null}
      <ul className="flex flex-col gap-3">
        {active.map((candidate) => (
          <li key={candidate.id}>
            <CandidateCard candidate={candidate} />
          </li>
        ))}
      </ul>
      {archived.length > 0 ? (
        <details className="mt-1">
          <summary className="cursor-pointer text-sm text-faint">
            Archived ({archived.length})
          </summary>
          <ul className="mt-2 flex flex-col gap-3">
            {archived.map((candidate) => (
              <li key={candidate.id}>
                <CandidateCard candidate={candidate} />
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      {adding ? <CandidateModal onClose={() => setAdding(false)} /> : null}
    </section>
  );
}

function CandidateCard({ candidate }: { candidate: Candidate }) {
  const upsert = useSetAtom(candidates.upsertAtom);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState(candidate.notes);

  let notesLabel = "Add notes";
  if (notesOpen) notesLabel = "Hide notes";
  else if (candidate.notes) notesLabel = "Notes";

  let notesBody: ReactNode = null;
  if (notesOpen) {
    notesBody = (
      <div className="mt-2 flex flex-col gap-2">
        <textarea
          value={notes}
          rows={3}
          placeholder="Interview notes, impressions, follow-ups…"
          onChange={(event) => setNotes(event.target.value)}
          className="w-full rounded-button border border-hairline bg-canvas px-3 py-2 text-sm text-fg placeholder:text-faint focus:border-accent focus:outline-none"
        />
        <div className="flex justify-end">
          <button
            type="button"
            className={ghostBtn}
            onClick={() => {
              upsert({ id: candidate.id, notes });
              setNotesOpen(false);
            }}
          >
            Save notes
          </button>
        </div>
      </div>
    );
  } else if (candidate.notes) {
    notesBody = <p className="mt-1 whitespace-pre-wrap text-xs text-muted">{candidate.notes}</p>;
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-card border border-hairline bg-surface p-4 ${
        candidate.archived ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-fg">{candidate.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="rounded-pill bg-raised px-2 py-0.5">{candidate.source}</span>
            {candidate.email ? <span className="truncate">{candidate.email}</span> : null}
            {candidate.phone ? <span>{candidate.phone}</span> : null}
          </div>
        </div>
        {candidate.archived ? (
          <button
            type="button"
            aria-label="Restore candidate"
            className={iconBtn}
            onClick={() => upsert({ id: candidate.id, archived: false })}
          >
            <RotateCcw className="size-4" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Reject / archive candidate"
            className={iconBtn}
            onClick={() => upsert({ id: candidate.id, archived: true })}
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>
      {candidate.archived ? null : (
        <PhaseSlider
          phase={candidate.phase}
          onChange={(phase) => upsert({ id: candidate.id, phase })}
        />
      )}
      <div>
        <button
          type="button"
          onClick={() => setNotesOpen((open) => !open)}
          className="text-xs text-faint transition-colors hover:text-muted"
        >
          {notesLabel}
        </button>
        {notesBody}
      </div>
    </div>
  );
}

function CandidateModal({ onClose }: { onClose: () => void }) {
  const upsert = useSetAtom(candidates.upsertAtom);
  const [draft, setDraft] = useState({
    name: "",
    source: "LinkedIn",
    email: "",
    phone: "",
    notes: "",
  });
  const set = (key: keyof typeof draft) => (value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const canSave = draft.name.trim().length > 0;

  return (
    <Modal
      open
      onClose={onClose}
      title="Add candidate"
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={ghostBtn}>
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave}
            className={`${primaryBtn} disabled:opacity-50`}
            onClick={() => {
              upsert({
                name: draft.name.trim(),
                source: draft.source as Candidate["source"],
                email: draft.email,
                phone: draft.phone,
                notes: draft.notes,
              });
              onClose();
            }}
          >
            Add
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <TextField label="Name" value={draft.name} onChange={set("name")} placeholder="Jane Doe" />
        <SelectField
          label="Source"
          value={draft.source}
          onChange={set("source")}
          options={CANDIDATE_SOURCES}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField label="Email" value={draft.email} onChange={set("email")} type="email" />
          <TextField label="Phone" value={draft.phone} onChange={set("phone")} type="tel" />
        </div>
        <TextArea label="Notes" value={draft.notes} onChange={set("notes")} />
      </div>
    </Modal>
  );
}
