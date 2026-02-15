# Task: Fix Engine Coverage Threshold

## Goal
Adjust Vitest coverage configuration so that branch coverage threshold does not fail CI during early development.

## File to Modify
packages/engine/vitest.config.ts

## Change
Lower branch coverage threshold from 80% to 30%.

Keep statement and function thresholds unchanged.

## Acceptance Criteria
- Tests run successfully.
- Coverage report still generates.
- No coverage threshold errors.
