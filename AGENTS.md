# AGENTS.md
Guidance for agentic coding tools working in this repository.
Scope: entire repo.

## 1) Project Snapshot
- Framework: Next.js 16 (App Router) + React 19 + TypeScript (strict).
- Styling: Tailwind CSS v4, tw-animate-css, shadcn/ui components.
- Data/Auth: Firebase (client + admin SDK), with Supabase helpers also present.
- Notifications/Email: Firebase Cloud Messaging + Brevo API.
- Package manager: npm (`package-lock.json` is source of truth).

## 2) Source Layout
- `src/app/` - routes, layouts, and API handlers.
- `src/app/api/*/route.ts` - server endpoints.
- `src/components/` - feature UI components.
- `src/components/ui/` - shadcn-style primitives.
- `src/hooks/` - custom hooks (`useAuth`, `useBooking`, etc.).
- `src/lib/firebase/` - Firebase config, admin SDK, Firestore functions.
- `src/lib/email/` - Brevo templates + client helpers.
- `src/lib/notifications/` - push notification client wrappers.
- `src/types/` - shared types (`database.types.ts`).
- `supabase/migrations/` - schema reference docs.

## 3) Build / Lint / Test Commands
Run from repo root: `C:\Users\silok\Downloads\barberrdv-tv\bshoprdv`.

### Install
- `npm install`

### Dev
- `npm run dev` - start local dev server.

### Build / Start
- `npm run build` - production build.
- `npm run start` - run production server.

### Lint
- `npm run lint` - lint whole repository.
- `npx eslint src/app/admin/dashboard/page.tsx` - lint one file.
- `npx eslint "src/**/*.{ts,tsx}"` - lint TS/TSX files.
- `npx eslint . --fix` - safe autofixes.

### Type Check
- `npx tsc --noEmit` - strict TS validation.

### Tests (current status)
- No `test` script exists in `package.json`.
- No test runner config detected (`vitest`, `jest`, `playwright`, `cypress`).
- No `*.test.*` or `*.spec.*` files found.

### Single Test Execution (important)
- Currently unavailable because no test framework is configured.
- If tests are added, use standard npm single-test patterns:
  - `npm run test -- path/to/file.test.ts`
  - `npm run test -- path/to/file.test.ts -t "test name"`
- Vitest-style equivalents (if adopted):
  - `npx vitest run path/to/file.test.ts`
  - `npx vitest run path/to/file.test.ts -t "test name"`

## 4) Environment and Secrets
- Copy `.env.example` to `.env.local` (or `.env`) for local setup.
- Required Firebase/Brevo/FCM variables are documented in `.env.example`.
- Never commit secrets or credentials.
- Treat `service-account.json` as sensitive.
- Avoid logging full tokens or API keys.

## 5) Code Style and Conventions
Follow file-local style; the repo is mixed on quotes/semicolons.
Do not make broad formatting-only diffs unless requested.

### Imports
- Prefer alias imports via `@/*` for internal modules.
- Group imports in this order:
  1) framework/external libs,
  2) internal modules,
  3) type-only imports.
- Use `import type` where practical.

### Formatting
- Match surrounding formatting in edited files.
- Keep diffs minimal and targeted.
- No repo-level Prettier config exists; rely on existing style + ESLint.

### TypeScript
- `strict` mode is enabled; keep code strictly typed.
- Avoid `any`; prefer explicit interfaces, unions, and narrowed return types.
- Reuse shared domain types from `src/types/database.types.ts`.
- Preserve Firestore document shapes and snake_case field names.

### Naming
- Components: PascalCase (`BookingWizard`, `ThemeToggle`).
- Hooks: `useXxx` (`useAuth`, `useBooking`).
- Variables/functions: camelCase.
- Shared constants: UPPER_SNAKE_CASE.
- Persisted keys/Firestore fields: snake_case (`created_at`, `barber_id`).

### React / Next.js
- Follow App Router conventions in `src/app/**`.
- Add `'use client'` only where client hooks/browser APIs are required.
- Prefer functional components + hooks.
- Keep render logic deterministic; side effects belong in `useEffect`.
- Use `next/link` and `next/navigation` idiomatically.

### State and Data Flow
- Keep loading/error states explicit (`loading`, `refreshing`, `error`).
- Use `Promise.all` for independent async work.
- Reset dependent state when parent selection changes (booking pattern).
- Keep request validation close to parsing in API routes.

### Error Handling
- Wrap async operations in `try/catch`.
- API routes should return `NextResponse.json` + correct status code.
- Use contextual logging (`console.error("context", error)`).
- Show user-facing failures with `toast` and keep graceful fallback UI.

### UI / Styling
- Prefer existing primitives from `src/components/ui`.
- Use `cn()` from `src/lib/utils.ts` for class merging.
- Reuse CSS variables/utilities from `src/app/globals.css`.
- Keep mobile-first behavior (admin area is mobile-oriented).

## 6) API Route Conventions
- Use `src/app/api/<feature>/route.ts`.
- Validate required input early; return `400` for bad requests.
- Return `500` for unexpected server errors.
- Keep response shape stable (`success`, `message`, `error`, etc.).

## 7) Firebase/Backend Conventions
- Use `ensureDb()` guard before Firestore operations.
- Keep collection names centralized (`COLLECTIONS`).
- Preserve timestamp keys (`created_at`, `updated_at`) with `Timestamp.now()`.
- Keep appointment statuses to: `pending | confirmed | cancelled | completed`.

## 8) Linting Reality
- ESLint config: `eslint.config.mjs` with Next core-web-vitals + TS presets.
- No dedicated repo Prettier config.
- Match local style and avoid unrelated formatting churn.

## 9) Cursor/Copilot Rules Check
- No `.cursorrules` file found.
- No `.cursor/rules/` directory found.
- No `.github/copilot-instructions.md` file found.
- No extra Cursor/Copilot overlay rules are currently active.

## 10) Agent Working Agreement
- Make minimal, focused changes.
- Do not rename/move files unless required.
- Do not add dependencies unless justified.
- After substantial TS edits, run `npm run lint` and `npx tsc --noEmit`.
- For booking/admin/API behavior changes, run `npm run build` before handoff when feasible.
