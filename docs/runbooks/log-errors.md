# Task: Log internal errors for debugging

## Goal
When a route throws, log the real error + stack to the console so we can debug 500s.

## Requirements
- Ensure Fastify has logger enabled.
- Add/ensure a global error handler that logs `err` with stack and still returns `{ error: "Internal server error" }`.

## Files
- apps/backend/src/server.ts (or wherever Fastify instance is created)

## Acceptance
- Triggering a 500 prints a stack trace in the terminal.
