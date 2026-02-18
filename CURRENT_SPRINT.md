# CURRENT SPRINT

## Goal (this sprint)
By end of Day 2, the demo flow (Generate Week → Swap Exercise → Mark Complete) feels clean, fast, and trustworthy on first screen-share, with zero confusion, zero UI hesitation, and no state break/reset.

## Definition of done
- [ ] **Week View:** sets/reps always visible, clear Completed/Pending badges, clean collapse/expand, no confusing grey states.
- [ ] **Today View:** clear session header, cardio minutes obvious, strength layout clean, high-confidence "Mark Complete" action with satisfying feedback.
- [ ] **Swap Flow:** one-click swap updates immediately in UI, no page refresh, and completion state never resets.
- [ ] **Demo Path:** full flow can be run in one take (Generate Week → Swap Exercise → Mark Complete) with no hesitation or “where do I click?” moments.

## Constraints
- Keep existing UI style
- No rewrites unless blocking
- Demo clarity > perfect code
- No new features outside this demo flow

## Current blocker
Need to tighten UI confidence and interaction polish across Week View, Today View, and Swap Flow so the live demo feels intentional and reliable.

## Files likely involved
- apps/web/src/pages/WeekPage.tsx
- apps/web/src/pages/TodayPage.tsx
- apps/web/src/components/MarkCompleteButton.tsx
- apps/web/src/components/Badge.tsx
- apps/web/src/components/Card.tsx
- apps/web/src/components/Toast.tsx
- apps/web/src/components/useToast.ts
- apps/web/src/utils/localCompletion.ts
- apps/web/src/api/plans.ts
- apps/web/src/api/sessions.ts
- apps/web/src/types/api.ts
- apps/backend/src/routes/plans.ts
- apps/backend/src/routes/sessions.ts
- apps/backend/src/services/sessionService.ts
- apps/backend/src/services/progressionService.ts
