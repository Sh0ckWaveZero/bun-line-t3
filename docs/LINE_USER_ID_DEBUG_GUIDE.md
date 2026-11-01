# Debugging LINE identity and authorization

Use this checklist when a web account cannot access a LINE feature or a bot request is not associated with the expected account. Current data is stored in PostgreSQL through Prisma; the old MongoDB examples in earlier copies of this guide do not apply.

## Identify which ID the flow uses

- For browser requests, `Account.accountId` with `providerId = "line"` is the LINE Login identity associated with the Better Auth session.
- For webhook requests, `event.source.userId` is the LINE Messaging API identity used by the bot and approval flow.
- Approval and feature permissions are stored on `LineApprovalRequest`, keyed by the bot-side `lineUserId` (the current Login profile sync also upserts the Login ID directly; see [account identity notes](./LINE_ACCOUNT_LINKING.md)).

Do not infer that two IDs belong to the same person from matching names or pictures.

## Debug sequence

1. Confirm the request path: browser session, LINE webhook, or a service webhook.
2. For web access, confirm a valid Better Auth session and the LINE `Account` record associated with that user.
3. For LINE bot features, confirm the exact approval record status and the feature permission flag required by the handler.
4. For a LINE webhook, confirm the signature passed validation before inspecting command behavior.
5. Check the feature's authorization helper and route handler. For DCA, use `getAuthorizedLineUserId()`; for onsite reports, check approved LINE account and `canUseOnsiteReport`; for scale updates, validate `SCALE_WEBHOOK_SECRET`.
6. Reproduce in development using the same integration path and non-production accounts.

## Protect identifiers and credentials

LINE user IDs, emails, cookies, OAuth tokens, Bitkub credentials, webhook secrets, and complete authorization headers are sensitive. Redact them before sharing logs or screenshots. Do not paste full IDs or secrets into documentation, tickets, terminal transcripts, or chat. The current source logs some LINE IDs for diagnostics; restrict access to those logs and avoid expanding that behavior.

## Source map

- [`src/lib/auth/auth.ts`](../src/lib/auth/auth.ts) — Better Auth session and LINE Login configuration
- [`src/lib/auth/line-user-id.ts`](../src/lib/auth/line-user-id.ts) — session-scoped LINE identity resolution
- [`src/features/line/services/approval.service.server.ts`](../src/features/line/services/approval.service.server.ts) — approval state transitions
- [`src/features/line/line/permissions.ts`](../src/features/line/line/permissions.ts) — permission lookup
- [`src/routes/api/line.ts`](../src/routes/api/line.ts) — webhook signature validation
