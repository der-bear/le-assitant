---
applyTo: '**'
---

# LeadExec Assistant — Copilot Instructions

Authoritative references (read first):
- guidelines/Guidelines.md — Product UX rules (Copilot behavior, non-UI multi‑agent model)
- guidelines/General-Development.md — Repo conventions and workflow
- guidelines/Styling-Guidelines.md — Tokens, Tailwind, motion
- guidelines/ShadCN-Components.md — How we compose shadcn + Radix
- guidelines/React-Components.md — Props, state, patterns
- guidelines/Library-Guidelines.md — 3rd‑party usage (Radix, Lucide, Recharts)
- guidelines/Images-And-Assets.md — Assets and attribution

Architecture (big picture)
- Build: Vite + React 18 + TypeScript (vite.config.ts). Entry: index.html → src/main.tsx → App.tsx.
- UI layers:
  - Primitives: components/ui/* (shadcn-style wrappers using Radix). Use cn() from components/ui/utils.ts.
  - Universal modules: components/ui-modules/* (Form, ChoiceList, Table, Metrics, Chart, etc.). These render inside chat.
  - Feature shells: components/* (e.g., ConversationalChat, ComponentGallery, Quick Tools panel).
- Services: services/* (leadexecApi.ts, clientMentionParser.ts).
- Styling: styles/globals.css holds Tailwind directives and CSS variable tokens (oklch). Do not split these.
- The original/ folder is a reference snapshot only. Do not import from it.

Build, run, debug
- npm run dev (Vite), npm run build, npm run preview.
- Tailwind v3.4 is used via postcss; dark mode = class. Content globs include App.tsx and components/**.
- Do not remove custom utilities in styles/globals.css (bg-*/20/30/50, ring-ring/50, hover variants) — modules rely on them for message bubbles, inputs, and focus rings.

Styling and tokens (must follow)
- Semantic colors only (foreground, background, border, muted, accent, primary, destructive). Tokens live in :root and .dark in styles/globals.css and are mapped in tailwind.config.js.
- Inputs/selects/textarea pattern (example):
  file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground bg-input-background dark:bg-input/30 border-input transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40
- Use bg-muted/50 for chat message bubbles and hover:bg-accent/50 for hover states (these are custom utilities).

Components and patterns
- Prefer non-suffixed imports (lucide-react, @radix-ui/react-…); vite.config.ts aliases resolve version‑suffixed specifiers but new code should not add them.
- Compose shadcn wrappers (components/ui/*) around Radix primitives; keep data-[state] and aria-* selectors as authored for focus/invalid styles.
- Use cn() to merge classes; keep Tailwind class order meaningful (focus-visible, aria-invalid, data-[state]).
- Steps are informational (not clickable). Advancing a step locks prior content (see ConversationalChat.tsx usage with Steps and ProcessState).
- Quick Tools: desktop slides in (w-96) within a border-l panel; mobile shows fixed overlay with backdrop. Preserve this behavior in App.tsx.

Libraries
- Icons: lucide-react (outline, 20–24px). No emoji.
- Recharts: for charts in ui-modules/Chart.tsx. Type imports from recharts directly.
- Radix UI: use the specific package per primitive. Keep accessibility props and focus management.

Gotchas
- The project relies on CSS variables (oklch) and custom utilities for opacity (e.g., bg-muted/50). If a background looks missing, verify styles/globals.css and tailwind.config.js tokens exist (input-background, switch-background) and do not replace border-input with border-border unless intended.
- Avoid Next.js-only utilities (this is Vite). Do not import next-themes; dark mode is class-based on <html>.

When extending
- Add new primitives in components/ui and new modules in components/ui-modules following existing API shapes and events (see Guidelines.md module specs). Keep copy terse and instructional and expose semantic actions only.