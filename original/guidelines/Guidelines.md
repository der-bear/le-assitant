**Add your own guidelines here**

<!--

System Guidelines

Use this file to provide the AI with rules and guidelines you want it to follow.
This template outlines a few examples of things you can add. You can add your own sections and format it to suit your needs

TIP: More context isn't always better. It can confuse the LLM. Try and add the most important rules you need

# General guidelines

Any general rules you want the AI to follow.
For example:

* Only use absolute positioning when necessary. Opt for responsive and well structured layouts that use flexbox and grid by default
* Refactor code as you go to keep code clean
* Keep file sizes small and put helper functions and components in their own files.

--------------

# Design system guidelines
Rules for how the AI should make generations look like your company's design system

Additionally, if you select a design system to use in the prompt box, you can reference
your design system's components, tokens, variables and components.
For example:

* Use a base font-size of 14px
* Date formats should always be in the format “Jun 10”
* The bottom toolbar should only ever have a maximum of 4 items
* Never use the floating action button with the bottom toolbar
* Chips should always come in sets of 3 or more
* Don't use a dropdown if there are 2 or fewer options

You can also create sub sections and add more specific details
For example:


## Button
The Button component is a fundamental interactive element in our design system, designed to trigger actions or navigate
users through the application. It provides visual feedback and clear affordances to enhance user experience.

### Usage
Buttons should be used for important actions that users need to take, such as form submissions, confirming choices,
or initiating processes. They communicate interactivity and should have clear, action-oriented labels.

### Variants
* Primary Button
  * Purpose : Used for the main action in a section or page
  * Visual Style : Bold, filled with the primary brand color
  * Usage : One primary button per section to guide users toward the most important action
* Secondary Button
  * Purpose : Used for alternative or supporting actions
  * Visual Style : Outlined with the primary color, transparent background
  * Usage : Can appear alongside a primary button for less important actions
* Tertiary Button
  * Purpose : Used for the least important actions
  * Visual Style : Text-only with no border, using primary color
  * Usage : For actions that should be available but not emphasized
-->

# LeadExec Copilot

> **Library:** shadcn/ui (defaults) + Lucide icons  
> **Style:** minimalist & functional; **semantic colors only**; **no emoji**  
> **Agents:** “Esparto”/multi-agent orchestration is **purely technical** and **never surfaced in UI**

---

## 0) Introduction & UX Overview (for UI composing agent)

### What we’re building

A centralized **Copilot** inside LeadExec that helps users perform tasks via conversation. It orchestrates **LeadExec tools exposed through MCP** and renders **universal modules** inline when structured input or output is needed.

### Entry experience (matches mock)

- Welcome message + **2–3 suggested tools** (contextual).
- **View all tools** → right-side **Quick Tools drawer** (search + categories).
- **Ask for Help** → Help Agent answers knowledge questions in-thread, then hands control back.

### Shell & layout

- Primary chat canvas with assistant turns and embedded modules.
- **Quick tiles** on the welcome screen (Create Client, Bulk Upload, Manage Clients, All Tools).
- **Quick Tools drawer** opens over the canvas; **auto-dismisses** when a flow starts.
- Composer: single line by default; grows as needed; suggestions via neutral chips (no emoji).

### Multi-agent model (explicitly **non-UI**)

- Tool Manager → recommends/launches tools.
- Tool Executor → runs tools & renders modules.
- Help Agent → knowledge answers only.  
   **UI rule:** do **not** show agent names, avatars, “switching,” or any agent branding.

### Execution UX (non-negotiables)

- Conversational **steps** with embedded modules (forms, choices, tables, uploads, charts, alerts).
- **Advance locks previous step** (read-only + visually dim) and **hides/disables tools** from that step to prevent breaking the flow.
- Inline **ProcessState** per step: *Processing… / Completed / Failed*.
- At any time: **Terminate** (confirm), **Ask for Help**, **Request docs**.
- Clear **feedback** after each step (what happened, why, what’s next).

### Visual & interaction principles

- **shadcn/ui defaults** for spacing, radius, focus rings; no custom gradients or ornamental shadows.
- **Lucide** icons only (20–24px, outline). Icons are optional.
- **Colors:** use **semantic** tokens only (fg, muted, border, bg, success, warning, destructive, info). **No decorative accents** unless they communicate state/trend.
- **Tone:** short, instructional copy; **no emoji**.
- **Density:** 1 primary action per module; at most 1 secondary.

---

## 1) Global Conventions

```ts
type Action = {
  id: string;
  label: string;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
};

type ModuleBase = {
  id?: string;
  title?: string;
  description?: string;
  helpUrl?: string;

  loading?: boolean; // disables inputs + actions; preserve layout
  error?: string; // one concise line under header
  empty?: string; // short hint for “no data”

  actions?: Action[]; // emits action:<id>
};

// Exports (only Table, Metrics, Chart may expose)
type ExportFormat =
  | "csv"
  | "json"
  | "xlsx"
  | "png"
  | "svg"
  | "pdf";
type ExportConfig = {
  formats: ExportFormat[];
  filename?: string;
  scope?: "current" | "all";
};
```

**Events (all modules):** `change`, `submit`, `cancel`, `action:<id>`  
**Export event:** `action:export → { format, scope? }`  
**A11y:** tab order, arrow-key lists, ARIA labels, visible focus; high-contrast theme via tokens.

---

## 2) Modules (APIs + UX)

### M1 — Form (**Progressive Expansion** + **Derive**)

Use for any input step, from simple to grouped sections.

```ts
type Textish =
  | "text"
  | "email"
  | "password"
  | "number"
  | "tel"
  | "url";

type Field =
  | {
      id: string;
      label: string;
      type: Textish;
      required?: boolean;
      placeholder?: string;
      value?: string | number;
      min?: number;
      max?: number;
      mask?: string;
    }
  | {
      id: string;
      label: string;
      type: "textarea";
      required?: boolean;
      placeholder?: string;
      value?: string;
      rows?: number;
    }
  | {
      id: string;
      label: string;
      type: "select";
      required?: boolean;
      value?: string;
      options: { value: string; label: string }[];
      searchable?: boolean;
    }
  | {
      id: string;
      label: string;
      type: "checkbox";
      value?: boolean;
    }
  | {
      id: string;
      label: string;
      type: "radio";
      value?: string;
      options: {
        value: string;
        label: string;
        hint?: string;
      }[];
    }
  | { id: string; label: string; type: "date"; value?: string } // ISO
  | {
      id: string;
      label: string;
      type: "file";
      accept?: string;
      multiple?: boolean;
    };

type Validation = {
  fieldId: string;
  rule: "required" | "regex" | "min" | "max";
  message: string;
  pattern?: string;
  value?: number;
};

type RevealRule =
  | { kind: "afterValid"; fields: string[] } // reveal when all valid
  | { kind: "when"; equals: Record<string, unknown> } // reveal on value match
  | { kind: "afterSubmit" }; // reveal after submit

type Section = {
  id: string;
  title?: string;
  description?: string;
  fields: Field[];
  reveal?: RevealRule; // hidden until rule met
};

type DeriveTarget = {
  fieldId: string;
  from: string[]; // source field ids
  strategy?:
    | "usernameFromEmail"
    | "strongPassword"
    | "slug"
    | "custom";
  editable?: boolean; // default true
};

type FormModule = ModuleBase & {
  kind: "form";
  fields?: Field[]; // simple form
  sections?: Section[]; // grouped with reveal
  validations?: Validation[];
  derive?: DeriveTarget[]; // request computed values
  submitLabel?: string; // default "Submit"
  cancelLabel?: string; // default "Cancel"
};
```

**UX rules**

- Labels always visible; required “\*”; inline errors.
- First invalid field focuses on submit.
- Select auto-searchable if `options.length > 8`.
- Progressive expansion uses a simple collapse/expand (no nested steppers).
- **Derive flow:** when source fields are valid, module emits `request:derive { targets }`; host computes values and re-renders.
  - **Example:** After `company` + `email` are valid, reveal **Credentials** section with editable `username` (from email) and `tempPassword` (generated).

**Emits**  
`change { fieldId, value }`, `submit { data, dirtyFields[] }`, `cancel`, `request:derive { targets: DeriveTarget[] }`.

---

### M2 — ChoiceList (cards / list / grid)

Single/multi-select options with optional icon or badge.

```ts
type Choice = {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  badge?: string;
  disabled?: boolean;
  group?: string;
};

type ChoiceListModule = ModuleBase & {
  kind: "choices";
  options: Choice[];
  mode?: "single" | "multiple"; // default 'single'
  layout?: "list" | "card" | "grid"; // default auto (card if ≤4)
  value?: string | string[];
  min?: number;
  max?: number;
};
```

**UX**  
List = compact; Card/Grid = 1–4 per row. Single uses radio/outlined card; Multi uses checkbox overlay. Show “N/M selected” when `max` is set. Keyboard: arrows + space. Emits `change`.

---

### M3 — Table (sort • opt. filter • opt. pagination • selection • single row action)

Lean data grid with sticky header and one right-aligned row action.

```ts
type Column = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "badge";
  sortable?: boolean;
  width?: string;
};
type Row = Record<string, any>;

type TableModule = ModuleBase & {
  kind: "table";
  columns: Column[];
  data: Row[];

  sort?: { key: string; dir: "asc" | "desc" };

  filterable?: boolean;
  filterPlaceholder?: string;

  pageable?: boolean; // auto true if rows > 50 when omitted
  pageSize?: number; // default 25

  selection?: "none" | "single" | "multiple"; // default 'none'
  rowAction?: { id: string; label: string }; // optional, single
  export?: ExportConfig;

  maxHeight?: string; // e.g., "420px"
};
```

**UX**  
Sort cycles Asc→Desc→None. Search filters visible columns. Sticky header; horizontal scroll on narrow screens. Radios/checkboxes for selection in first column. Export button in header. States: skeleton, empty, inline error.  
**Emits:** `change { sort?, filter?, selection? }`, `action:<rowAction.id> { row }`, `action:export { format, scope }`.

---

### M4 — Metrics (cards only) + export

Small metric tiles; optional delta; optional icon.

```ts
type Metric = {
  id: string;
  label: string;
  value: number | string;
  kind?: "number" | "currency" | "percent";
  change?: number;
  icon?: string;
};

type MetricCardsModule = ModuleBase & {
  kind: "metrics";
  metrics: Metric[];
  layout?: "stacked" | "grid"; // default 'grid'
  export?: ExportConfig;
};
```

**UX**  
Value large; label small; delta pill top-right. Export dumps a flat list.

---

### M5 — Steps (informational only; **not clickable**)

Two variants: `overview` (checklist) and `progress` (current journey).

```ts
type StepStatus =
  | "done"
  | "current"
  | "todo"
  | "incomplete"
  | "blocked";
type Step = {
  id: string;
  title: string;
  hint?: string;
  optional?: boolean;
};

type StepsModule = ModuleBase & {
  kind: "steps";
  variant: "overview" | "progress";
  steps: Step[];
  status?: Record<string, StepStatus>; // progress only
  current?: string; // progress only
  showIndex?: boolean; // default true
  maxVisible?: number; // overview only
};
```

**UX**  
`done` ✓, `current` ring, `todo` dot, `incomplete` hollow ring, `blocked` lock + dim. No progress bars. Not clickable.

---

### M6 — FileDrop (uploads with progress)

```ts
type FileDropModule = ModuleBase & {
  kind: "filedrop";
  accept?: string; // ".csv,.xlsx"
  multiple?: boolean;
  maxSizeMb?: number;
  note?: string; // e.g., "Use our template"
};
```

**UX**  
Dashed dropzone; list with per-file progress + retry. Emits `action:uploadStart`, `action:uploadProgress`, `action:uploadDone`.

---

### M7 — Chart (with optional **2–4 header metrics**) + export

One chart module; keep it read-first.

```ts
type ChartType = "line" | "bar" | "pie";
type Series = { id: string; label: string; data: number[] };

type ChartModule = ModuleBase & {
  kind: "chart";
  type: ChartType;
  series: Series[]; // pie: exactly 1 series
  categories?: string[]; // x-axis labels for line/bar
  stacked?: boolean; // bar only
  legend?: boolean; // auto true if series>1
  unit?: "number" | "currency" | "percent" | string;
  switchableTypes?: ChartType[]; // renders Line | Bar | Pie pills
  headerMetrics?: Metric[]; // 0–4 compact tiles above chart
  export?: ExportConfig;
};
```

**UX**  
Minimal axes; legend auto when multiple series; type pills if `switchableTypes` present. Export near pills.

**Emits**  
`change { type? }`, `action:export { format }`.

---

### M8 — Alert (success/error/info/warning)

```ts
type AlertType = "success" | "error" | "info" | "warning";

type AlertModule = ModuleBase & {
  kind: "alert";
  type: AlertType;
  message: string;
  title?: string;
  placement?: "inline" | "toast"; // default 'inline'
  dismissible?: boolean; // default true for toast
  durationMs?: number; // toast auto-hide (error persists)
  icon?: string;
  actions?: Action[]; // max 2
};
```

**UX**  
Inline = full-width, no auto-hide. Toast = floating, auto-hide (except error). Close icon appears if dismissible.

---

### M9 — EntitySelect (large lists; debounced remote search; lazy-load)

```ts
type EntityOption = {
  id: string;
  label: string;
  description?: string;
  icon?: string;
};

type EntitySelectModule = ModuleBase & {
  kind: "entity-select";
  mode?: "single" | "multiple"; // default 'single'
  value?: string | string[];
  placeholder?: string; // default "Search…"
  allowClear?: boolean; // default true (single)

  options?: EntityOption[]; // optional initial batch
  remote?: boolean; // true => lazy load via events
  pageSize?: number; // default 25
  nextCursor?: string | null;

  debounceMs?: number; // default 250
  creatable?: boolean | { label: string };
};
```

**Events for lazy load**  
`request:search { query, pageSize }`, `request:loadMore { query, cursor, pageSize }` → host appends `options` and updates `nextCursor`.

---

### M10 — SummaryCard (single/batch outcomes; deep links)

```ts
type SummaryItem = {
  id: string;
  title: string;
  subtitle?: string;
  status: "success" | "warning" | "error" | "info";
  message?: string;
  link?: { href: string; label?: string };
};

type SummaryCardModule = ModuleBase & {
  kind: "summary";
  items: SummaryItem[];
  compact?: boolean;
  actions?: Action[];
};
```

---

### M11 — ProcessState (inline status)

Tiny inline indicator for long-running steps.

```ts
type ProcessStateModule = ModuleBase & {
  kind: "process-state";
  state: "processing" | "completed" | "failed";
  detail?: string; // e.g., "3/20 processed"
  retryActionId?: string; // if present on failed → show Retry
};
```

---

## M12 — HelpSources (update)

Add support for a **card layout** (great for “Lead Sources” how-tos) and small tweaks for better chat handoff.

---

## Types

```ts
type HelpKind =
  | "article"
  | "api"
  | "howto"
  | "release"
  | "video"
  | "faq";
type HelpSource =
  | "KnowledgeBase"
  | "API Docs"
  | "Patch Notes"
  | "Support"
  | "External";

type HelpResult = {
  id: string;
  title: string;
  description?: string; // short, plain summary for CARD layout
  snippet?: string; // highlighted excerpt; LIST layout only
  url: string;
  kind: HelpKind;
  source: HelpSource;
  icon?: string; // optional icon/avatar per source
  updatedAt?: string; // ISO
  confidence?: number; // 0..1
  badges?: string[]; // e.g., ["New", "Recommended"]
  ctaLabel?: string; // default "Open"
};

type HelpFacets = {
  kinds?: HelpKind[];
  sources?: HelpSource[];
  updated?: "7d" | "30d" | "90d" | "any";
};

type HelpSection = {
  // optional grouping (e.g., “Lead Sources”)
  id: string;
  title: string;
  results: HelpResult[];
};

type HelpSourcesModule = ModuleBase & {
  kind: "help-sources";
  query?: string;
  remote?: true;
  layout?: "list" | "cards"; // NEW — default 'list'; mobile may auto 'cards'
  results?: HelpResult[]; // used when no sections
  sections?: HelpSection[]; // used for grouped cards (e.g., “Lead Sources”)
  facets?: HelpFacets;
  availableFacets?: HelpFacets;
  pageSize?: number; // default 10
  nextCursor?: string | null;

  showInlineAnswer?: boolean; // short synthesized answer above results
  relatedQuestions?: string[]; // quick chips

  // Context for ranking/answers (not rendered)
  context?: {
    activeToolId?: string;
    screen?: string;
    leadTypeUID?: number;
    clientUID?: number;
  };

  actions?: Action[]; // e.g., [{ id: 'copy-all', label: 'Copy all links' }]
};
```

---

## HelpSources — UX (cards)

- **Grid:** 2–4 across.  
   Card content order: **icon → title → description → pill badges → primary CTA**.
- **When to use cards:** results are “entry points” (e.g., Lead Sources, Campaigns, Delivery Methods).  
   **Use list** for deep answers with long snippets.
- **Per-card actions:** **Open**, **Preview**, **Ask follow-up**.
- **Inline synthesized answer:** stays on top when `showInlineAnswer` is true.
- **Sections:** optional; render as stacked grids (e.g., “Lead Sources”, “Campaigns”, etc.).
-

## 3) Tool Catalog UX

- Welcome screen shows **Suggested Tools (2–3)**, **Ask for Help**, **View All Tools**.
- **Quick Tools drawer**: categories (Clients, Leads, Financial, Reports, Comms, System), search + filters.
- Selecting a tool launches **Tool Executor** with **Steps (overview)**, then **Steps (progress)**.

---

## 4) Flow Controls & Safety

- **Advance locks previous step** (read-only + dim) and **hides/disables** its quick tools; prevents out-of-order edits.
- **Back** allowed only when backend state supports it; otherwise show read-only recap.
- **Terminate** any time (confirm). Preserve inputs for resume.
- Use **Alert** + **ProcessState** for feedback and retries.

---

## 5) Component Gallery (Preview / Examples)

A built-in **Component Gallery** to navigate and preview all modules.

- **Entry points:**
  - Quick tiles: “All Tools” → **Component Gallery** item in the drawer
  - Optional link at welcome footer (“View components & payloads”)
- **Contents:** live examples for every module (M1–M11) + **JSON payload viewer** with copy button and “Try events” buttons (e.g., export, submit).
- **Access:** visible in non-prod or behind a role flag.

---

## 6) API & MCP Integration (essentials)

- Use MCP tools for auth, client CRUD, lists, delivery configuration, automation, logs, reports.
- Tool definitions declare **required inputs**, **optional defaults**, and **output mapping** to **SummaryCard**.
- Retries on transient failures; surface causes with **Alert** (semantic colors only).

---

## 7) Accessibility & Quality

- Full keyboard support (Enter submits; Esc cancels when safe).
- ARIA roles/labels; i18n for dates & numbers.
- Audit logging of agent actions and user confirmations.

---

## 8) Client Creation Flow (script fidelity)

- **Step 1 — Basic Information**  
   `Form` with `company` + `email` → **derive** `username` + `tempPassword`; reveal **Credentials** section (editable).
- **Step 2 — Delivery Method**  
   `ChoiceList` (Email/Webhook/FTP/Skip). Based on choice, reveal specific `Form` (email options, webhook URL/secret, or `FileDrop` template).
- **Step 3 — Configuration & Creation**  
   Configuration `Form` → `ProcessState` → `SummaryCard`.
- **Step 4 — Review & Next Steps**  
   `SummaryCard` with deep links (“View Client”).
- **Rule:** each step locks on advance; tools from prior step disabled/hidden.

---

## 9) Must-not-misinterpret list

- Steps are **not clickable**; **no progress bars** in Steps.
- **“Incomplete”** ≠ locked; **“Blocked”** shows lock.
- **Metrics** = cards only (no progress bars/alerts inside).
- **Charts** may include **2–4 header metrics**.
- **No emoji** anywhere. **Lucide** icons only.
- **No decorative colors**; semantic colors only.
- Esparto/multi-agent model is **internal only** and **never visible** to users.

---

### Changelog v2.1

- Added **Chart** module with header metrics & export.
- Added **Progressive Expansion** + **Derive** to **Form**.
- Added **Step locking** + **tool hiding/disable** during flows.
- Added **Component Gallery** entry and behavior.
- Tightened visual rules (shadcn defaults, Lucide, no emoji, semantic colors only).

---

If you want, I can also paste this into your repo as `PROJECT-SPECS-V2.md` and generate a **minimal JSON examples pack**for the Component Gallery.