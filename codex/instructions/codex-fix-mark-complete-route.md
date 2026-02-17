# Goal
Fix the UI "Mark Complete" button so it works with the backend.

## Backend fact (do not change backend)
The backend route for completion is:
POST /sessions/:id/submit
Body: { results: ExerciseResultInput[] }

There is NO route /sessions/:id/complete.

## Tasks
1) Frontend: update API client / fetch call used by "Mark Complete" to call:
   POST `${API_BASE_URL}/sessions/${sessionId}/submit`
   with the existing body shape `{ results: [...] }`.

2) Frontend: ensure "Mark Complete" is enabled for strength sessions that are status PLANNED and have a sessionId.
   - If a strength session is PLANNED but button is disabled today, fix the disable logic.

3) For mobility/recovery cards:
   - Keep a "Mark Complete" button visible.
   - Since these days do not have sessionId yet (v2 item), implement a lightweight local completion state in the UI:
     - Clicking marks the card as completed locally (persist to localStorage keyed by date+type).
     - Show completed state visually (e.g., badge/disabled button) after click.
   - Do NOT call backend for mobility/recovery.

4) Rename UI title/header from "Longevity" to "Longevity Coach" (wherever shown on the main page).

## Verification
- `npm --workspace apps/web run dev` works.
- Clicking "Mark Complete" on a PLANNED strength day calls /sessions/:id/submit and succeeds (200).
- Mobility/recovery "Mark Complete" toggles locally and persists after refresh.
- No route-not-found errors.