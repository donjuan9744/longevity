# codex-polish-ui-v1.md
Goal: Polish the existing UI (apps/web) for a cleaner, more “real product” feel. Do NOT change backend/engine. Do NOT add new API endpoints. Do NOT break existing working commands.

## Scope (apps/web only)
- Improve layout hierarchy + mobile-first spacing
- Better Today + Week card UI
- Add emphasis/type badges, status badges
- Add toast on “Refresh week”
- Add loading + empty states
- Remove any “dev-looking” info from UI (IDs, engineVersion, raw JSON)

## Hard constraints
- Keep the existing API integration logic intact (same routes/headers/params).
- Avoid new heavy UI frameworks. Prefer simple CSS + small React components.
- No new auth flows. If token missing, keep existing “Missing API token” UX but make it nicer.

## Deliverables
### 1) Global layout polish
- Update `apps/web/src/styles/global.css`:
  - Mobile-first: center container, max-width ~520px, padding 16–20px
  - Clean typography defaults (system font), comfortable line-height
  - Card styles: rounded corners (16px), subtle border + shadow
  - Buttons: height >= 44px, full-width primary for key actions
  - Simple badge styles (pill)
  - Left accent strip for card emphasis (via border-left or pseudo-element)

### 2) Add small reusable UI components (no deps)
Create in `apps/web/src/components/`:
- `Card.tsx` (wrapper for consistent card style)
- `Badge.tsx` (variant: neutral / success / warning / info)
- `Toast.tsx` + `useToast.ts` (very small, local state, auto-dismiss ~2.5s)
- `SectionTitle.tsx` (page headers)
Keep these tiny and readable.

### 3) Today view polish
Wherever “Today” is rendered (likely `HomePage.tsx` or a Today page component):
- Header:
  - Title: “Longevity Coach”
  - Subtitle: “Today’s training”
- Today card should show:
  - Day type + emphasis badge (Strength: Push/Pull/Lower | Mobility | Recovery | Zone 2)
  - If strength: list exercises with “Sets x Reps” and intensity
  - If non-strength: list movements and reps/time
- Add a prominent “Mark Complete” button on Today card **if the API supports it for that day**.
  - If the day has `sessionId`, show button.
  - If the day does NOT have a `sessionId`, show button disabled with small helper text:
    - “Completion for this session type is coming in v2.”
  - IMPORTANT: We are NOT changing backend; don’t fake a completion API call when no sessionId exists.

### 4) Week view polish
In the Week list:
- Each day card:
  - Left accent strip color by type/emphasis:
    - lower = #2563eb (blue)
    - push = #16a34a (green)
    - pull = #7c3aed (purple)
    - mobility = #f97316 (orange)
    - recovery = #64748b (slate)
    - zone2 = #0ea5e9 (sky)
  - Show date + day name (e.g., Mon, Feb 16)
  - Badge for type + badge for status (PLANNED / COMPLETED)
  - List first 3 exercises, then “+ N more” if longer (for compactness)
- Refresh week button:
  - Keep existing behavior
  - On success, show toast “Week regenerated.”
- Loading state:
  - “Loading week…” skeleton-ish (just text + muted placeholders is fine)
- Empty state:
  - “No plan yet — generate your first week.”

### 5) Remove dev output
- Do not display:
  - `sessionId`
  - `engineVersion`
  - raw JSON dumps
- If debugging exists, remove or gate behind a constant like `const DEBUG = false`.

### 6) Acceptance criteria
- `npm --workspace apps/web run dev` works.
- UI looks good on mobile width (375px).
- No IDs/JSON shown in UI.
- Refresh week shows toast on success.
- Today card has a prominent “Mark Complete” button when sessionId exists; otherwise disabled with helper text.
- Week cards have accent strip + badges.
- No backend files changed.

## Implementation notes
- Keep CSS minimal, in `global.css`. Components should just apply classNames.
- Don’t introduce Tailwind or component libraries.
- If you need icons, use simple unicode or inline SVG only (avoid deps).

## What to run
- `npm --workspace apps/web run build`
- `npm --workspace apps/web run dev`

Proceed to implement now.