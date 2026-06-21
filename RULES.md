# House Manager — Product & Architecture Rules

> Living rulebook for what we're building and the constraints it must honor.
> This is the **product/architecture** doc; `AGENTS.md` and `CLAUDE.md` stay the
> **how-we-build** (toolchain/convention) docs.
>
> Append freely. Tag every item **[Decided]**, **[Deferred]** (not now, but the
> seams must exist), or **[Open]** (needs a decision). A rule is binding once it
> says **[Decided]** here — change the rule here before changing the code.

---

## 1. What we're building

A **mobile-first app for running a household.** Two halves under one shell:

- **Operations** — the day-to-day a house manager runs: meals, pets, chores,
  kids' logistics, appointments. Organized by **cadence** (day / week / month).
- **Hiring** — a **bespoke, lightweight ATS** to hire the house manager: author
  a job post, push it to job boards, collect resumes, and move candidates through
  a simple pipeline.

It's **local-first** (the device owns the data), uses **GitHub as its only
backend** (backup / sync / share — no app server), and is shared by **sending a
link**. The look is a **dark "HUD" app shell** (see §11), and it should be
genuinely **fun to use** (§2.7).

Two audiences: the **operator(s)** who run it, and the **household members** it
serves — who connect to *get updates* (see §3).

---

## 2. Non-negotiables

### 2.1 Mobile-first — [Decided]
The primary target is a phone. It **must work on the phone first**; design
touch-first, single-column, thumb-reachable. A desktop version is a wider
rendering of the same app, never a separate experience.
- **Why:** a house manager uses this standing in the kitchen, not at a desk.

### 2.2 Local-first — [Decided]
IndexedDB on the device is the **source of truth**. Fully usable offline; the
network is an enhancement (backup/sync/share), never a requirement.
- Built on the existing primitives: Jotai `atomWithIDB`, the `idb` store in
  `apps/web/app/state/`, Zod schemas in `@house-manager/schemas`.

### 2.3 GitHub is the only backend — [Decided]
No custom server, no database service. Durable storage / sync / sharing ride on
GitHub (a repo or gist per tenant, holding a serialized snapshot). Static hosting
stays GitHub Pages. Mechanics in §10 (mostly **[Open]**).

### 2.4 Multi-tenant data, single-tenant runtime — [Decided] — load-bearing
The data model is **multi-tenant from day one**. Exactly one tenant is **active**
at runtime now, but schema, storage keys, and APIs are all namespaced by a tenant
id so "many" is a UI/runtime change later, never a data migration. See §4.

### 2.5 No login — [Decided]
**No auth and no accounts.** The active tenant is simply "the one on this device."
We do not build sign-in/passwords/sessions now. This is a *runtime/identity*
simplification, **not** a data-model one — §2.4 still holds.

### 2.6 Sharing is link-based — [Decided]
The only sharing mechanism is **a link** (§9). Receiving a link imports another
tenant into your local store.

### 2.7 Fun & habit-forming — [Decided]
The app should be **fun**, even a little **addictive** — running a household is a
grind, so the app's job is to make the grind satisfying (streaks, completion
feedback, momentum, delight). This is a real requirement, not polish. Pair it with
the dark HUD aesthetic (§11) so it feels like a tool you *want* to open.
- Guardrail: engagement serves the chore, never the other way around. No dark
  patterns, no manufactured anxiety.

---

## 3. People & roles

Roles are **people**, distinct from the **tenant** (the account/namespace, §4).

1. **Operator** — whoever runs the app on this device. With §2.5 there's exactly
   one, implicit, no login. — [Decided]
2. **House manager (the role)** — the person who runs the household day-to-day.
   May be the operator themselves **or a hired employee** (hired via §8's ATS).
   "House manager" is a *role a person fills*, not the same thing as the tenant
   entity that happens to share the name. — [Decided]
3. **Household members** — family/partner/kids the household serves. In the future
   **multiple people connect to the app and get updates** (read-mostly). This is
   the "this is an application for *them*" audience. — [Deferred] (build the
   data/sharing seams now, the member UI later)
4. **Candidates** — people in the hiring pipeline (§8). They exist only inside the
   ATS until/unless one is hired into the house-manager role. — [Decided]

**[Open]** Do household members get their own (scoped, read-mostly) view via a
shared link (§9), or just digest-style "updates"? What can they see vs. edit?

---

## 4. The tenant identity model — load-bearing rule

(Was the "house-manager identity model." The tenant is an **account/household
namespace**, not a specific person — see §3.)

**4.0 Two tiers: Org → Namespace — [Decided]**
The tenant splits into two levels: an **Org owns many Namespaces.**
- **Org** = the top-level account (a household/family, or a set of houses you help
  run). The **Org switcher lives at the BOTTOM of the side navigation.**
- **Namespace** = a scope inside an org (typically a house/home, or a context).
  The **Namespace switcher lives at the TOP-LEFT of the side navigation.**
- All owned data is namespaced by **`namespaceId`** (transitively its `orgId`).
  "Active org" + "active namespace" live in a persisted workspace selection;
  switching org resets the active namespace to one within that org.
- §2.5 still holds — no login, one implicit operator; we **seed** one-or-more
  orgs/namespaces. This realizes §2.4: multiple orgs/namespaces are already real
  on-device (and a shared link, §9, can import another).

1. **The tenant is a first-class, persisted entity**, shaped roughly:
   ```
   Tenant {
     id:        string   // stable, machine-generated (uuid/nanoid). NEVER reused.
     name:      string   // human-facing, editable, NOT required to be unique.
     createdAt: string
     // ...grows as the product grows
   }
   ```
2. **Every owned record is namespaced by a tenant id.** Pick one mechanism and
   keep it uniform — a `tenantId` field on every record, or a per-tenant partition
   (IndexedDB store/key prefix). **[Open]** which; namespacing itself is
   **[Decided]**.
3. **Bootstrap exactly one** on first launch: generate an `id`, set a default
   `name`, record it as the **active** tenant in settings. No prompts, no auth.
4. **All reads/writes go through the active id.** No code path may read "all data"
   unscoped — that seam is what makes multi-tenant free later.
5. **Going multi later = three additive changes**, zero migration: (a) allow
   creating more tenants, (b) a switcher for the active id, (c) *optionally* auth
   to gate switch/sync.
6. **Sharing already makes "many" real today.** Opening a shared link (§9) writes
   a *second* tenant into your local store. This is the concrete reason §2.4
   cannot be deferred even though §2.5 says no login: the moment §2.6 works, a
   device holds more than one tenant.

---

## 5. Naming & identity

- **`id` vs `name` are different.** `id` is stable and machine-owned; `name` is a
  human label, editable, **not unique**. Never key data or links on `name`. — [Decided]
- A url/repo-safe **`slug`** (from `name` + short `id`) is likely needed for GitHub
  repo names and shareable URLs. — [Open]
- **Do houses have names?** A tenant may run more than one **house** — a `House`
  entity with its own name, owned by the tenant, is likely. Not pinned down. — [Open]
- **Disambiguation:** how the UI labels multiple tenants (yours vs. a shared one)
  once they coexist. — [Open]

---

## 6. Product surface — household domains

The operations side is a set of **areas (modules)**. Each area is its own
self-contained module with its own data and views; **we grow a shared design-system
language as we build them** (don't over-abstract up front). Initial set — [Decided]
as scope, individual designs [Open]:

| Area | Covers | Typical cadence |
| --- | --- | --- |
| **Meals / meal prep** | Breakfast, lunch, dinner; recipes; prep planning | Day → week |
| **Pets** | Dog-walking schedule | Day (recurring) |
| **Dishes** | Dishwashing / kitchen reset | Day |
| **Laundry** | Wash/dry/fold cycles | Week |
| **Garbage & recycling** | Bin **rotations**, recycling, mail pickup | Week (rotation) |
| **Car** | Car cleaning / upkeep | Week → month |
| **Kids' logistics** | Event **pickup / drop-off** times | Day (calendar) |
| **Babysitting** | Sitter scheduling | Ad hoc / week |
| **Appointments** | Calling & scheduling doctors etc. | Ad hoc / month |

Rules:
- Each area owns its **entities + cadence + views**; shared primitives are
  extracted only once two areas need the same thing. — [Decided]
- **Rotations** are a first-class concept (garbage, dog walks, chore turns):
  recurring assignments that cycle, possibly across household members. — [Decided]
- The list will grow; treat it as seed, not closed. — [Decided]

**[Open]** Exact entity shapes per area; which areas ship first; how
recipes/meal-prep relate to a grocery/inventory concept (not yet specced).

---

## 7. Cadence & time views

The app is organized by **vantage points / window frames over time** — the same
underlying tasks/events viewed at different zoom levels. — [Decided]

- **Day** — today's concrete to-dos and pickup/drop-off times.
- **Week** — the planning horizon; rotations and recurring chores live here.
- **Month** — the calendar/overview; appointments and longer cycles.

Rules:
- These are **views over one shared model**, not three separate data sets. A task
  surfaces in whichever frame(s) its schedule intersects. — [Decided]
- Recurrence/rotation is modeled on the task, then *projected* into day/week/month.
  — [Decided]
- Mobile-first means **Day is the default** view on a phone; week/month are
  zoom-outs. — [Decided]

**[Open]** Calendar library vs. hand-rolled; how recurrence rules are expressed
(RRULE-like?); whether areas (§6) each get their own day/week/month or share one
unified calendar.

---

## 8. Hiring — the bespoke, lightweight ATS

A **single-purpose applicant tracker** for hiring the house manager. It is
**deliberately light** — a bespoke ATS for *one* job, not a general hiring
platform. — [Decided]

1. **Authoring** — an authoring experience to **craft the job posting**. This is
   one of the most important early pieces. — [Decided]
2. **Distribution** — the post is published to **external job boards: LinkedIn,
   Indeed, ZipRecruiter** (plus our own link). We collect inbound interest from
   there. — [Decided] (integration depth [Open] — likely manual/copy-out first,
   not API-posted)
3. **Intake** — **collect resumes**; add candidates **ad hoc**; **take notes** on
   each person. — [Decided]
4. **Pipeline = a slider, not a board.** Move a candidate through phases with a
   **slider that has dots for each phase** — explicitly **not** swim-lanes / a
   kanban board (too complicated for one job). Dragging the dot advances the
   candidate; state is **captured to memory** (persisted, §2.2). — [Decided]
5. **Light by design** — no req management, approvals, scorecards-matrix, or
   multi-role org charts. Just: post → collect → note → slide through phases. — [Decided]

**[Open]** The phase set (e.g. New → Screen → Interview → Offer → Hired/Rejected);
resume storage/parsing (file in IndexedDB? link out?); whether board distribution
is manual export or real API integrations; how a "hired" candidate becomes the
house-manager role (§3.2).

---

## 9. Sharing via links

- A link carries enough to **bootstrap a view of a tenant's data** — at minimum:
  where the snapshot lives (GitHub repo/gist) + which tenant. — [Decided in spirit]
- **Receiving = importing a new local tenant** (§4.6), not merging into yours. — [Decided]
- Link payload/format (deep link, query, fragment, signed url). — [Open]
- **Read-only vs. collaborative:** does a recipient just view a snapshot, or write
  back? Collaboration implies merge/conflict handling on GitHub. Start **read-only**
  unless decided otherwise. — [Open]
- Household-member "get updates" (§3.3) likely rides on this same mechanism. — [Open]
- Revocation / privacy of a shared link. — [Open]

---

## 10. GitHub as sync / backup / share

- **Source of truth stays local** (§2.2); GitHub holds a **serialized snapshot** of
  a tenant that can be restored or shared. — [Decided]
- Repo-per-tenant vs. gist-per-tenant. — [Open]
- How a user authorizes writes to GitHub without us running a server (device flow,
  pasted PAT, GitHub App). — [Open]
- Snapshot format + versioning (one JSON blob vs. per-entity files) and how restores
  reconcile with local state. — [Open]
- Conflict strategy if the same tenant is edited on two devices. — [Open]

---

## 11. Design system & app shell

The look is **modeled on `eng-manager-xyz/eng-manager-invoice`** (local:
`/Users/matthewharwood/Documents/GitHub/engmanager-invoice`). We **recreate it from
scratch in our stack** (TanStack Start + React 19 + Vite + Tailwind v4) — we do
**not** copy its Next.js code. We **mimic the app shell / sidebar / navigation /
HUD feel and the typographic system**, and **re-skin it to a black theme**. — [Decided]

> Note: the source app is actually a **light** (Canvas-White) theme using Monument
> Extended + **Archivo** + JetBrains Mono. We intentionally diverge: **black theme**,
> and **Inter** in place of Archivo. Monument Extended and JetBrains Mono carry over.

### 11.1 Typography — [Decided]
- **Display:** **Monument Extended** (only the **Black / 900** weight exists in the
  source), used **UPPERCASE** for headings and the wordmark. Commercial (Pangram
  Pangram) — **carry the files** from the source repo, do not re-download:
  `engmanager-invoice/apps/web/public/fonts/monumentextended-black-webfont.{woff2,woff}`.
- **Body / sans:** **Inter** (replaces Archivo). OFL — self-host fresh woff2.
- **Mono / numerics:** **JetBrains Mono** (great for a HUD's numbers/tables). OFL —
  self-host.
- Wire as Tailwind v4 `@theme` tokens: `--font-display` (Monument), `--font-sans`
  (Inter), `--font-mono` (JetBrains). Headings inside `main` use `--font-display`
  uppercase; a `.heading-body` opt-out drops back to sans.
- **Supersedes the carried-over PP Editorial fonts** (from the mind-palace scaffold):
  remove `apps/web/app/styles/fonts/PPEditorial*` and its `@font-face`/`@theme`
  block; replace with the three above. — [Decided]

### 11.2 Theme — black re-skin — [Decided structure / Open exact values]
Self-host nothing about color — it's all Tailwind v4 `@theme` tokens in
`apps/web/app/styles/index.css`. Keep the source's **token structure** (named
neutrals + status accents + `--radius-card: 12px` / `--radius-button: 8px`), but
**invert to dark**. Proposed starting palette (tune later):
```
@theme {
  --color-canvas:    #0a0a0b;  /* body substrate (was canvas-white) */
  --color-surface:   #141416;  /* the "lifted" card / rail surface  */
  --color-raised:    #1e1e21;  /* elevated panels, menus            */
  --color-hairline:  rgba(255,255,255,0.08); /* borders/dividers    */
  --color-text:      #f4f3ef;  /* primary text (was midnight-ink)   */
  --color-text-muted:#9b9a98;  /* muted (was muted-ash)             */
  --color-primary:   #fafafa;  /* primary action flips to near-white on black */
  /* status / accent — survive on black, keep from source */
  --color-accent-blue:  #328efa;  /* active-nav / focus accent */
  --color-accent-gold:  #fbc768;
  --color-accent-red:   #e16540;
  --color-accent-green: #47d096;
  --radius-card: 12px;
  --radius-button: 8px;
}
```
- **Active nav / focus accent = `#328efa`** (the source's intelligence-blue) — it
  reads well on black. — [Decided]
- Honor `prefers-reduced-motion` (the source does); keep the animated gradient logo
  mark but freeze it under reduced-motion. — [Decided]

### 11.3 App shell — the "windowed-canvas HUD" — [Decided structure]
Recreate, in our stack, the source's shell:
- **Substrate + inset card.** The app sits in a **windowed canvas**: a dark
  substrate with the main UI in a **rounded, inset card** (the source uses a 12px
  frame + `rounded-2xl` + soft shadow that the card "lifts" into). — [Decided]
- **Left rail** (tablet/desktop): **collapsible** (~64px collapsed ↔ ~256px
  expanded). **Top = logo + NAMESPACE switcher (top-left, §4.0)**; **middle =
  icon + label nav items** (active = subtle surface fill + accent icon + medium
  weight; inactive = muted + hover); **bottom = ORG switcher (§4.0)**. — [Decided]
- **Top bar** = section/breadcrumb selector + the rail **collapse toggle**. — [Decided]
- **Mobile-first inversion.** The source is desktop-first (rail primary, hidden
  below `sm`). **We are mobile-first**, so the **mobile navigation is primary** — a
  bottom tab bar and/or drawer is the canonical nav; the left rail is the
  tablet/desktop *expansion* of the same nav model. Below `sm`, edge-to-edge, no
  inset frame. — [Decided]
- **Nav model** maps 1:1 to routes; current route reflected via `aria-current`.
  Our nav targets are the **household areas (§6)** and the cadence views (§7), plus
  **Hiring (§8)** — not the source's Invoice/Clients/etc. — [Decided]
- Icons: simple 16px outline SVGs (the source inlines heroicons-style paths,
  strokeWidth ~1.75). Keep that weight/feel. — [Decided]
- **Recreate in TanStack Start:** the persistent shell lives in the root route
  (`app/routes/__root.tsx`) wrapping `<Outlet />`; rail/drawer state in a small
  store (Jotai). No need to port the source's "Ask" AI panel unless we want one
  later (§12). — [Decided]

### 11.4 Out of scope to copy
- The source's invoicing/timesheet/payments features and its "Ask" Claude panel —
  **not** carried over (different product). We take **only the shell + design
  language**. — [Decided]

### 11.5 Mobile shell — [Decided] (research-backed)
The phone shell keeps the **same IA as the desktop sidebar** (namespace top → nav →
org bottom), re-housed for thumbs. Grounded in Apple HIG, Material 3, and NN/g.
- **Primary nav = a persistent bottom tab bar** — 4 high-frequency areas + a 5th
  **More** tab. Never a hamburger as primary nav (NN/g: hidden nav ~halves
  discoverability, ~15% slower); bottom = thumb "green zone". — [Decided]
- **Day/Week/Month are NOT tabs** — an in-screen segmented control inside the
  relevant area (matches native calendar apps). — [Decided]
- **Namespace switcher = a chip in the top app bar** that opens a **modal bottom
  sheet** (picker in the thumb zone). High-frequency → stays exposed. — [Decided]
- **The More tab opens a left drawer that mirrors the desktop sidebar verbatim** —
  namespace pinned top, full nav middle, **org switcher pinned bottom**. This is
  the authenticity link to desktop. — [Decided]
- **Switchers open modal bottom sheets, not top dropdowns** (Material: sheets are
  the mobile alternative to menus — thumb-anchored, searchable, swipe-to-dismiss). — [Decided]
- **One nav component, two breakpoints:** bottom-tab + drawer on compact, expands
  into the desktop left sidebar at ≥ `md` — "a tab bar that adapts to a sidebar"
  (Apple). One IA, no divergence. — [Decided]
- **A11y:** drawer + sheets follow the WAI-ARIA modal-dialog pattern (`role=dialog`,
  `aria-modal`, focus trap, focus-return-to-trigger, Esc, scrim); prefer native
  `<dialog>`/`showModal()`; ≥44pt/48dp targets; respect safe-area insets. — [Decided]
- **Dark elevation by lightness, not shadow** — drawer/sheets are lighter tinted
  surfaces over a dimmed scrim (shadows wash out on black). — [Decided]

Sources: Apple HIG — Tab bars; Apple WWDC24 — tab bar that adapts to a sidebar;
Material 3 — Navigation bar / Navigation drawer / Dark theme; NN/g — Hamburger
Menus & Hidden Navigation Hurt UX Metrics; Notion / Slack / Linear mobile
workspace-switcher patterns; WAI-ARIA APG — Dialog (Modal).

---

## 12. Explicitly deferred — but the seams exist now

Not built yet; each must be reachable **without reshaping data**:
- Auth / login / accounts. (Seam: active-id indirection, §4.) — [Deferred]
- A tenant switcher UI. (Seam: everything scoped to active id.) — [Deferred]
- Household-member views / "get updates" UI. (Seam: sharing, §9.) — [Deferred]
- Real-time / collaborative editing. (Seam: snapshot model, §10.) — [Deferred]
- Multiple houses per tenant. (Seam: `House` as its own owned entity, §5.) — [Deferred]
- An "Ask"/AI assistant panel like the source's. (Seam: shell has room for a right
  panel.) — [Deferred]
- Re-enabling the **PWA/offline-install** layer — currently **off** (see
  `apps/web/vite.config.ts`); a mobile local-first app wants install + offline, so
  this moves up the roadmap. — [Deferred]

---

## 13. Open questions (resolve as you append)

1. **Tenant entity name** — keep `HouseManager`, or rename to `Household`/`Account`
   to disambiguate from the hired *house-manager role* (§3.2)? (§4)
2. What does a house manager actually *manage* first — which area (§6) ships #1?
3. One house per tenant, or many? (§5)
4. Namespacing mechanism: `tenantId` field vs. per-tenant partition? (§4.2)
5. Cadence: calendar lib vs. hand-rolled; recurrence-rule format; per-area vs.
   unified calendar. (§7)
6. ATS phase set, resume storage, and whether board distribution is manual or API.
   (§8)
7. Link payload format; read-only vs. collaborative sharing; member "updates". (§9)
8. GitHub authorization model without a server; snapshot format; conflict strategy.
   (§10)
9. Exact black-theme token values + whether to keep all four status accents. (§11.2)
