# Task: Prevent duplicate exercises in swap/apply

## Goal
When applying a swap, prevent the replacement exercise from already existing elsewhere in the same session snapshot.

## Context
`POST /sessions/:id/swap/apply` currently allows duplicates (e.g., swapping an exercise to one that already exists in the session).

## Requirements
- In the swap/apply handler (service or route), before updating:
  - Load the session snapshot exercises list.
  - If any exercise in the snapshot already has `exerciseId === toExerciseId`
    AND that exercise is not the one being replaced (`fromExerciseId`),
    then reject.
- Return HTTP 400 with a clear error message:
  - `{ "error": "Exercise already in session. Choose another candidate." }`
- Keep other behavior unchanged.

## Files Likely To Modify
- apps/backend/src/services/sessionService.ts (applySwap logic)
- apps/backend/src/routes/sessions.ts (schema/response if needed)
- apps/backend/src/server.ts error handler should preserve 400 status codes (ensure validation errors aren’t turned into 500).

## Tests
Update apps/backend/tests/server.test.ts:
- Create a session with two known exercises.
- Attempt to swap one exercise to an exerciseId already in the session.
- Expect 400 and the error message.

## Acceptance Criteria
- swap/apply rejects duplicates with 400 and message.
- `npm test` passes.
