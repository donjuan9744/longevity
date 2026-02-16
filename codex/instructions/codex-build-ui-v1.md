# codex-scaffold-ui-v1.md
## Goal
Implement **Longevity UI v1 (Today-first)** in the existing `apps/web` Vite + React + TypeScript app.

Keep it simple, functional, and mobile-first:
- Default screen shows **Today** from the generated weekly plan.
- Secondary screen shows the **Week** overview.
- Buttons: **Refresh Week**, **Cancel Workout** (if today's strength session exists), **View Week / Back to Today**.
- Use existing backend API at `http://localhost:3000`.
- Dev auth: read token from `VITE_API_TOKEN` in `apps/web/.env.local`.
- No routers, no state libs, no UI frameworks. Plain React + CSS.

Do NOT modify backend code in this task.

---

## Requirements

### 1) Environment config
Create (or update) `apps/web/.env.local.example` with:
- `VITE_API_BASE_URL=http://localhost:3000`
- `VITE_API_TOKEN=PASTE_YOUR_JWT_HERE`

Ensure app reads:
- `import.meta.env.VITE_API_BASE_URL`
- `import.meta.env.VITE_API_TOKEN`

### 2) Minimal API client
Create `apps/web/src/api/client.ts`:
- `apiFetch(path, init)` helper:
  - Base URL from env
  - Adds `Authorization: Bearer <token>` if token exists
  - Adds `Content-Type: application/json` when body is present
  - Throws human-friendly errors on non-2xx (use response json if available)

Create `apps/web/src/api/plans.ts`:
- `getWeek(weekStart: string): Promise<WeekResponse>`
- `refreshWeek(weekStart: string): Promise<WeekResponse>`
  - call `POST /plans/week/refresh` with JSON `{ weekStart }`
  - then call `GET /plans/week?weekStart=...`
Create `apps/web/src/api/sessions.ts`:
- `cancelSession(sessionId: string): Promise<void>`
  - call `PATCH /sessions/:sessionId/cancel`

### 3) Types (minimal)
Create `apps/web/src/types/api.ts` with lightweight types matching what backend returns:
- `WeekResponse` with `weekStart`, `weekEnd`, `days: Day[]`
- `Day` union with:
  - strength: `{ date, type:"strength", emphasis, sessionId?, status?, session:{exercises: SessionExercise[], notes?: string[]} }`
  - mobility/zone2/recovery similar (include `minutes?`, `notes?`, `session?`)
- `SessionExercise`: `{ exerciseId, name, sets, reps, intensity }`

Do NOT over-model. Only include fields you render.

### 4) Date helpers
Create `apps/web/src/utils/dates.ts`:
- `toIsoDate(d: Date): string` (YYYY-MM-DD)
- `getMondayIso(d: Date): string` (monday of current week in ISO)
- `formatDayLabel(iso: string): string` (e.g. "Mon • Feb 16")
- `isToday(iso: string): boolean`

### 5) UI layout
Implement a clean dark theme using `apps/web/src/styles/global.css`:
- background #0F172A
- card #1E293B
- accent #22C55E
- text primary #F8FAFC
- text secondary #94A3B8
- max width 480px centered
- big tap targets, rounded cards

### 6) App structure
Replace current app rendering to match:

#### `apps/web/src/App.tsx`
- Owns:
  - `view: "today" | "week"`
  - `weekStart` (computed from today’s Monday)
  - `weekData` state + loading + error
- `loadWeek()` calls `getWeek(weekStart)`
- `handleRefresh()` calls `refreshWeek(weekStart)` and updates state
- `handleCancel(sessionId)` calls `cancelSession(sessionId)` then reload week
- Renders:
  - header (Longevity + small subtitle)
  - top buttons: Refresh Week, toggle view
  - content:
    - TodayView (default)
    - WeekView (secondary)

#### `apps/web/src/pages/TodayPage.tsx`
Props:
- `week: WeekResponse`
- `onCancel(sessionId: string): void`

Behavior:
- find today in `week.days` by iso date (local date ok)
- if not found: show fallback message
- render a single “Today” card:
  - Type badge (Strength/Recovery/Zone2/Mobility)
  - If strength: show emphasis badge (Push/Pull/Lower/Full Body Light)
  - If session.exercises exists: list them
    - each row: Name + "sets x reps"
  - Show notes if present
  - If strength + sessionId exists and status is not cancelled:
    - show Cancel Workout button

#### `apps/web/src/pages/WeekPage.tsx`
Props:
- `week: WeekResponse`

Behavior:
- list 7 day cards with:
  - date label
  - type + emphasis if strength
  - if cancelled: show "Cancelled"
  - show 3-line preview:
    - if session exercises: show first 3 exercise names
    - else show minutes/notes

### 7) Loading and error states
- While loading: show simple spinner text "Loading week…"
- On error: show "Unable to load week." + a Retry button
- If token missing: show a helpful message:
  "Missing API token. Add VITE_API_TOKEN to apps/web/.env.local"

### 8) Fix any existing TS/React issues
- Ensure default exports are correct for pages
- Ensure `npm --workspace apps/web run build` passes

### 9) No backend changes
Do not edit anything under `apps/backend` or `packages/engine`.

---

## Manual verification steps (Codex must follow)
1. From repo root: `npm install`
2. Start backend separately (user will do).
3. Run UI:
   - `npm --workspace apps/web run dev`
4. Confirm:
   - Today view loads and shows exercises
   - Week view loads
   - Refresh updates week
   - Cancel calls endpoint and reloads week
5. Build:
   - `npm --workspace apps/web run build`

---

## Deliverables
- New files under `apps/web/src/api/*`, `apps/web/src/pages/*`, `apps/web/src/types/*`, `apps/web/src/utils/*`
- Updated `apps/web/src/App.tsx`, `apps/web/src/main.tsx` only if needed
- Updated `apps/web/src/styles/global.css`
- Added `apps/web/.env.local.example`

Keep the code simple and readable.