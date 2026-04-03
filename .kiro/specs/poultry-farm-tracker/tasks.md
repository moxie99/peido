# Implementation Plan: Poultry Farm Tracker

## Overview

Incremental implementation of a fullstack Next.js app for tracking feed batches, egg production, and profitability. Each task builds on the previous, wiring everything together at the end.

## Tasks

- [x] 1. Database schema and PostgreSQL client
  - Create `lib/db.ts` with a `postgres.js` (or `pg`) client singleton
  - Write and apply the full SQL schema: `users`, `feed_batches`, `depletion_events`, `egg_records`, `egg_prices` tables with all constraints, generated columns, and indexes
  - _Requirements: 1.1, 1.2, 1.4, 3.1, 4.1, 7.3, 11.1, 11.3, 11.4_

- [x] 2. Session and authentication infrastructure
  - [x] 2.1 Implement `lib/session.ts` — JWT encrypt/decrypt using `jose`, `createSession`, `deleteSession`, `getSession`
    - Store session in an HttpOnly cookie
    - _Requirements: 10.1, 10.5_
  - [x] 2.2 Write unit test for session round-trip
    - Encrypt a payload then decrypt it and assert equality
    - _Requirements: 10.1_
  - [x] 2.3 Implement `proxy.ts` auth guard
    - Verify session JWT on every request matching the protected-route pattern
    - Redirect unauthenticated requests to `/login?redirect=<original-url>`
    - _Requirements: 10.1, 10.5_
  - [x] 2.4 Write property test for Property 13: unauthenticated requests are redirected
    - **Property 13: Authentication — unauthenticated requests are redirected**
    - **Validates: Requirements 10.1, 10.5**
  - [x] 2.5 Implement `actions/auth.ts` — `login` and `logout` Server Actions
    - Hash comparison with `bcrypt`, generic error message on failure, session creation on success
    - _Requirements: 10.2, 10.3, 10.4_

- [x] 3. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [x] 4. Feed batch feature
  - [x] 4.1 Implement `actions/feed.ts` — `createFeedBatch` Server Action
    - Zod schema: feed type, quantity (> 0), total cost (>= 0), purchase date required; supplier optional
    - Insert into `feed_batches` with status `'active'`; `cost_per_kg` is a generated column
    - Re-verify session inside the action; include `user_id` predicate on all queries
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 10.6_
  - [x] 4.2 Write property test for Property 1: required-field validation rejects incomplete submissions
    - **Property 1: Feed batch required-field validation rejects incomplete submissions**
    - **Validates: Requirements 1.3**
  - [x] 4.3 Write property test for Property 2: cost-per-kg consistency
    - **Property 2: Cost-per-kg is always consistent with total cost and quantity**
    - **Validates: Requirements 1.4**
  - [x] 4.4 Write property test for Property 3: new feed batches always created with status "active"
    - **Property 3: New feed batches are always created with status "active"**
    - **Validates: Requirements 1.5**
  - [x] 4.5 Implement `markFeedDepleted` in `actions/feed.ts`
    - Wrap in a PostgreSQL transaction: insert `depletion_events` row and update `feed_batches.status` to `'depleted'`
    - Reject if batch is already `'depleted'`
    - Default depletion date to today if not provided
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 11.2_
  - [x] 4.6 Write property test for Property 5: depletion transitions status active → depleted
    - **Property 5: Depletion transitions status from active to depleted**
    - **Validates: Requirements 3.1, 3.2**
  - [x] 4.7 Write property test for Property 6: depleting an already-depleted batch is rejected
    - **Property 6: Depleting an already-depleted batch is rejected**
    - **Validates: Requirements 3.3**
  - [x] 4.8 Write property test for Property 15: failed DB writes do not partially commit
    - **Property 15: Failed database writes do not partially commit**
    - **Validates: Requirements 11.2**

- [x] 5. Egg records feature
  - [x] 5.1 Implement `actions/eggs.ts` — `upsertEggRecord` Server Action
    - Zod schema: collection date required, egg count >= 0
    - Upsert on `(user_id, collection_date)` unique constraint
    - Associate with active `feed_batch_id` on that date if one exists; allow null otherwise
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [x] 5.2 Write property test for Property 7: duplicate date updates rather than inserts
    - **Property 7: Egg record upsert — duplicate date updates rather than inserts**
    - **Validates: Requirements 4.2**
  - [x] 5.3 Write property test for Property 8: negative egg counts are rejected
    - **Property 8: Negative egg counts are rejected**
    - **Validates: Requirements 4.3**

- [x] 6. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [x] 7. Egg price settings
  - [x] 7.1 Implement `actions/settings.ts` — `updateEggPrice` Server Action
    - Zod schema: price > 0
    - Insert a new row into `egg_prices` (append-only); do not update existing rows
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [x] 7.2 Write property test for Property 11: non-positive egg price is rejected
    - **Property 11: Non-positive egg price is rejected**
    - **Validates: Requirements 7.4**
  - [x] 7.3 Write property test for Property 12: egg price history is append-only
    - **Property 12: Egg price history is append-only**
    - **Validates: Requirements 7.3**

- [x] 8. Profitability computation library
  - [x] 8.1 Create `lib/profitability.ts` with pure functions: `computeRevenue`, `computeProfit`, `classifyProfitability`
    - `classifyProfitability(profit)` returns `'profitable' | 'break-even' | 'loss'`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [x] 8.2 Write unit tests for profitability functions
    - Cover boundary value profit = 0, positive, and negative cases
    - _Requirements: 6.3, 6.4, 6.5_
  - [x] 8.3 Write property test for Property 10: profitability classification is consistent with profit value
    - **Property 10: Profitability classification is consistent with profit value**
    - **Validates: Requirements 6.3, 6.4, 6.5**
  - [x] 8.4 Create `lib/correlation.ts` — `computeFeedBatchCorrelation` function
    - Query egg records where `collection_date` is within `[purchase_date, depletion_date]` (or today for active batches)
    - Compute `totalEggs`, `eggYieldRate`, `revenue`, `profit`, `profitabilityStatus`
    - Return `FeedBatchWithCorrelation`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2_
  - [x] 8.5 Write property test for Property 9: egg-to-feed-batch correlation totals are consistent
    - **Property 9: Egg-to-feed-batch correlation totals are consistent**
    - **Validates: Requirements 5.1**

- [x] 9. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [x] 10. UI — Authentication pages
  - [x] 10.1 Create `app/(auth)/login/page.tsx` login form
    - Email + password fields, submit calls `login` Server Action via `useActionState`
    - Display generic error message on failure
    - _Requirements: 10.2, 10.3_

- [x] 11. UI — Feed batch pages
  - [x] 11.1 Create `app/(app)/feed/page.tsx` — list all feed batches for the authenticated user
    - Active batches ordered by purchase date ascending; show feed type, quantity, cost, purchase date, status
    - Show "no feed in stock" prompt when no active batches exist
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 11.2 Write property test for Property 4: active feed batches are ordered oldest-first
    - **Property 4: Active feed batches are ordered oldest-first**
    - **Validates: Requirements 2.2**
  - [x] 11.3 Create `app/(app)/feed/new/page.tsx` — form to log a new feed batch
    - Calls `createFeedBatch` Server Action; renders field-level validation errors inline
    - _Requirements: 1.1, 1.3_
  - [x] 11.4 Create `app/(app)/feed/[id]/page.tsx` — feed batch detail view
    - Display batch info, depletion date, total eggs, egg yield rate, revenue, profit, profitability status
    - Include "Mark as depleted" form calling `markFeedDepleted`
    - Prompt to set egg price if none configured
    - _Requirements: 5.3, 6.1, 6.2, 6.3, 6.4, 6.5, 6.7_

- [x] 12. UI — Egg records pages
  - [x] 12.1 Create `app/(app)/eggs/page.tsx` — list recent egg records
    - _Requirements: 4.1_
  - [x] 12.2 Create `app/(app)/eggs/new/page.tsx` — form to log daily egg count
    - Calls `upsertEggRecord`; renders validation errors inline
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 13. UI — Settings page
  - Create `app/(app)/settings/page.tsx` — egg price configuration form
  - Display current price and price history; calls `updateEggPrice`
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 14. UI — Reports page
  - Create `app/(app)/reports/page.tsx` — date range filter with aggregated results
  - Display total feed cost, total eggs, total revenue, net profit for selected range
  - Support feed type filter on feed batches
  - Show "No records found" when range is empty
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 15. UI — Dashboard
  - Create `app/(app)/dashboard/page.tsx`
  - Display: active feed batch count, total feed cost this month, total eggs this month, current month profitability status
  - Display last 7 days of egg production as a data table
  - Show zero values (not errors) when no data exists for the current month
  - Prompt to set egg price if none configured
  - _Requirements: 6.7, 8.1, 8.2, 8.3, 8.4_

- [ ] 16. Wire authenticated shell layout
  - Create `app/(app)/layout.tsx` with navigation links to dashboard, feed, eggs, reports, settings, and logout
  - _Requirements: 8.1_

- [ ] 17. Final checkpoint — Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use `fast-check` with `numRuns: 100`; tag each with `// Feature: poultry-farm-tracker, Property <N>: ...`
- All Server Actions must re-verify the session and include `WHERE user_id = <session.userId>` on every query
- Multi-table writes (depletion) must use a PostgreSQL transaction
- Read the Next.js docs in `node_modules/next/dist/docs/` before writing any Next.js-specific code — this version may differ from training data
