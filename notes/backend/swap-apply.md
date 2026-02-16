# Task: Add Swap Apply Endpoint

## Goal
Allow users to swap an exercise in a planned session and persist the change in the stored session snapshot.

## Context
We already have:
- `POST /sessions/:id/swap` which returns swap candidates based on matching `movementPattern` and `muscleGroup`.

But we do not persist the swap into the `workoutSession.snapshot`.

## Requirements

### New Route
Add a new endpoint:

- `POST /sessions/:id/swap/apply`

### Request Body
```json
{
  "fromExerciseId": "string",
  "toExerciseId": "string"
}
