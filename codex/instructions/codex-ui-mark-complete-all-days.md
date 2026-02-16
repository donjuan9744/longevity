You are working in the Longevity monorepo. Implement "Mark Complete" for EVERY workout card (Today + Week), including recovery/mobility/zone2, with minimal changes and a clean UI.

Goal
- Today view: always show a "Mark Complete" button for the day’s card.
- Week view: every day card shows "Mark Complete" (including recovery/mobility/zone2).
- Strength days: call backend completion endpoint.
- Non-strength days: mark complete locally (localStorage) since there is no sessionId.
- Completed state should persist across refresh (localStorage).
- Keep it mobile-friendly and visually simple.

Constraints
- Do NOT change backend APIs.
- Use the existing API token flow in the web app (VITE_API_TOKEN).
- Keep changes contained to apps/web.
- Ensure TypeScript passes.

Implementation details
1) Add a small completion storage helper:
   - Create `apps/web/src/utils/completion.ts` with:
     - `isDayComplete(date: string): boolean`
     - `setDayComplete(date: string, value: boolean): void`
   - Use key: `longevity:dayComplete:${date}`

2) Add/extend API client function for strength completion:
   - In `apps/web/src/api/` (where current fetch helpers live), add:
     - `completeSession(sessionId: string, exercises: { exerciseId: string; sets: number; reps: number }[]): Promise<void>`
   - Implement POST to `/sessions/${sessionId}/complete`
   - Body format (match swagger):
     {
       "results": exercises.map(e => ({
         exerciseId: e.exerciseId,
         plannedSets: e.sets,
         plannedReps: e.reps,
         completedSets: e.sets,
         completedReps: e.reps,
         rpe: 7
       }))
     }
   - Include Authorization: Bearer ${token}
   - If server errors, surface a readable message in the UI.

3) Update UI components
   - Identify the components used by Today view and Week view cards.
   - For each card:
     - Determine `date` (string YYYY-MM-DD).
     - Determine if the day is already completed via `isDayComplete(date)`.
     - Render a primary action button:
       - Label: "Mark Complete" when not completed
       - Label: "Completed ✓" (disabled) when completed
   - On click:
     - If day has `sessionId` (strength):
       - Call `completeSession(sessionId, day.session.exercises mapped to exerciseId/sets/reps)`
       - Then `setDayComplete(date, true)`
     - Else (recovery/mobility/zone2):
       - Just `setDayComplete(date, true)` (no API call)
   - After marking complete, update state so the card immediately re-renders as completed.

4) “Today” page behavior
   - Today page should not be stale:
     - If it already fetches the week plan and selects “today”, keep that.
     - Ensure local completion state is read on render so it updates immediately after click.

5) UI polish
   - Add a small badge/status line on the card like: “Status: Planned” vs “Status: Completed”
   - Keep styles consistent with existing app. Minimal clean button.

6) Verification
   - Run: `npm --workspace apps/web run build`
   - Fix any TS/lint errors found.

Output
- Commit-ready changes only in `apps/web` (and any new files under apps/web).
- Provide a brief summary of files changed and how to test manually in the browser.
