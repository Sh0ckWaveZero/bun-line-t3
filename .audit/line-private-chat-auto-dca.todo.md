# LINE private-chat automatic DCA

- [x] 1. `how` over the affected subsystem.
- [x] 2. `architect` for parallel design exploration.
- [x] 3. Write the throughput checkpoint as four todo items.
  - Blocking first steps. Inspect identity, parser, database uniqueness, and preserve unrelated WIP before implementation.
  - Independent workstreams. Read-only designs parallelize; one implementation owner integrates webhook, service, schema, and tests.
  - Shared mutable state. Exclusive feature branch for implementation; no parent writes during delegation.
  - Smallest safe decomposition. One worker owns the coupled event-to-order transaction to avoid incompatible contracts.
- [x] 4. Delegate code-writing to a subagent using your configured feature model.
- [x] 5. Verify on the matching surface.
- [x] 6. Rebase into small, ordered commits. Stack follow-ups.
  - skip: user requests a local feature branch; keep implementation reviewable without rebasing unrelated work.
- [x] 7. If the design is contested, `interrogate` before shipping.
  - skip: evaluate independent designs; no shipping requested.
- [x] 8. Run **Opening a PR**.
  - skip: user requests branch and implementation only; do not publish a PR.

## Architecture phases

- [x] Ground
- [x] Sketch
- [x] Agree
- [x] Implement
- [x] Scrap
  - skip: only if repeated contract deviations require redesign.

## Design rubric

- Only valid private-chat receipts trigger automatic DCA; ordinary messages perform no database or AI work.
- Event identity, approval, and reply token stay scoped to each event.
- Committed orders and replay receipts are atomic and durable; concurrent duplicates cannot create extra orders.
- Existing explicit commands remain supported; duplicate responses are clear in Thai.
- Parser and webhook/service behavior are verified without contacting live services.

Design candidates use the inherited model; model diversity is reduced.

## Synthesis

Use a pure strict Bitkub parser and shared parsed-add writer in the DCA command module. The auto route does not synthesize command text. Graft the second candidate's discriminated ingestion result and atomic durable receipt transaction. Reuse existing user/coin/time uniqueness, which also protects edited copies, instead of adding a redundant content hash.

Receipt and order commit together. Repeat event is silent. A new event with existing order returns a Thai duplicate response. Failed transaction remains retryable. Per-event requests precede approval and dispatch.

Baseline type-check already fails in unrelated scripts, attendance, expenses, subscriptions, and other routes. Do not widen scope to repair these failures.

## Implementation verification

- [x] Pure strict receipt parser preserves sample fields and deterministic Bangkok, Z and negative offsets.
- [x] Per-event typed dispatch keeps batch identity and reply token scoped before approval.
- [x] Atomic LINE ingestion returns created, duplicate or replayed; receipts survive deletion.
- [x] Serializable transaction and bounded P2034 or adapter TransactionWriteConflict retry protect rounds for concurrent distinct receipts. P2002 handling checks exact receipt/order conflicts.
- [x] Admin permission canAutoRecordDca defaults false. Automatic receipts require APPROVED, unexpired record and permission; denied receipts are silent. Existing commands keep approval behavior.
- [x] Existing admin permissions API and page expose validated permission toggle with disabled pending state and accessible name.
- [x] Prisma v7 generate and schema validate pass without database migration.
- [x] Targeted mocked public parser/service/webhook/API tests pass, 17 tests and 78 assertions. Existing DCA security tests pass, 7 tests. These mocks do not prove live LINE behavior.
- [x] Relevant ESLint and Prettier pass.
- [x] Production build passes.
- [x] Type-check still has unrelated baseline failures; no new changed-file diagnostics after explicit transaction client typing.
- [x] React Doctor scan reports 91/100 with one large-component warning on existing permissions page. No baseline score captured; no claim of score nonregression.
- [x] Independent reviewer approved feature and adapter-retry delta without actionable findings. No new comment/suppression findings.
- [x] All 9 migrations applied to disposable PostgreSQL 18. Actual integration passed 6 scenarios: permission default/expiry, 5 concurrent same-event requests, 5 concurrent copies, 4 distinct concurrent orders with rounds 1..4, trigger-induced rollback then successful retry, and replay after deletion. Probe lives at /tmp/line-auto-dca-pg.m66gEO/probe.ts.
- [x] Browser rendered actual LinePermissionsPage with mock admin/API. Default off, toggle on/off, and pending-user disabled state observed. Screenshot saved in this chat's visualization directory. This does not verify a live authenticated admin session.
- [x] User explicitly authorized migration against configured linebot database after reported Unknown argument canAutoRecordDca. Applied new migration, generated client, read the new field successfully, and restarted local dev server.
- [x] Full lint fails on 495 errors outside feature scope; changed-file lint has zero errors and one existing unused-disable warning. Full type-check remains blocked by unrelated diagnostics.

Model the Domain shaped the EventAction and CreateLineDcaOrderResult discriminated unions and shared parsed-add writer. Prisma client and CLI skills informed interactive serializable transaction and local schema generation. UI Skills fixing-accessibility informed named native checkbox, helper description and alert feedback.

Make Operations Idempotent shaped durable receipt storage independent of order deletion and atomic receipt/order commit. Test Behavior, Not Implementation shaped assertions on order counts, reply ownership, no-work denials, rollback and replay. Prove It Works required actual PostgreSQL probes and browser toggles beyond mock tests.

Feature committed as 204f479 on msl/line-private-chat-auto-dca. Unrelated weather and cron WIP remains untouched and uncommitted. No PR or push. Temporary PostgreSQL and UI fixture servers stopped. Local dev server on localhost:4325 remains running for the user.
