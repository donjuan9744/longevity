# Goal
Implement a functional "Mark Complete" button in the UI that works for ANY strength day (Today view and Week view).

## Context
- Web app lives in `apps/web`.
- Backend requires bearer token (VITE_API_TOKEN already supported).
- A "complete workout" request body looks like:
  {
    "results": [
      {
        "exerciseId": "string",
        "plannedSets": 10,
        "plannedReps": 30,
        "completedSets": 10,
        "completedReps": 30,
        "rpe": 10
      }
    ]
  }

## Requirements
1) Add a "Mark Complete" button anywhere a day card shows a `sessionId` + `session.exercises`.
   - Must work for any day, not just today.
2) On click:
   - Build a request body from the session's exercises.
   - plannedSets = sets
   - plannedReps = reps
   - completedSets = sets
   - completedReps = reps
   - rpe: default to 7 (constant for now)
3) Call the existing backend endpoint for completing a session (use the Swagger docs to confirm exact route/method).
   - It will be something like POST `/sessions/:sessionId/complete` (or similar).
   - Use Authorization: Bearer <token>.
4) After success:
   - Refetch the week plan data and update UI so the completed status is reflected.
5) UI states:
   - While request in-flight: disable button and show "Completing..."
   - On error: show a small inline error message on the card.
6) Do NOT add a full "results editing" form yet. This is a v1 auto-complete action.

## Implementation notes
- Put the API call in `apps/web/src/api/` (new file if needed), keep fetch logic centralized.
- If the API returns an updated session or plan, use it; otherwise, refetch `/plans/week` after completion.
- Keep changes minimal and ensure `npm --workspace apps/web run build` passes.

## Deliverables
- Button visible on Today card and on Week cards (where applicable).
- Completion API call works and UI updates after.
- Build passes.