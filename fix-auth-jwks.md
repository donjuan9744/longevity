# Task: Fix Supabase JWT verification (ES256) using JWKS

## Goal
Update auth middleware to verify Supabase access tokens signed with ES256 using Supabase JWKS, not a shared secret.

## File to Modify
apps/backend/src/middleware/authMiddleware.ts

## Requirements
- Read `SUPABASE_URL` from env.
- Fetch JWKS from `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`
- Cache JWKS in-memory (simple cache with TTL, e.g. 10 minutes).
- Verify Bearer token using `jose` (recommended) and JWKS (kid-based).
- Extract user id from `sub` claim and attach to request (same as current behavior).
- Keep existing error responses (401 with "Invalid token" or equivalent).

## Dependencies
- Add `jose` to apps/backend dependencies if not present.

## Acceptance Criteria
- Calling protected routes with a real Supabase access token returns 200.
- Tests still pass (update mocks if needed).
