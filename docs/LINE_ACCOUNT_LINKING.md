# LINE Login, LINE Bot, and account identity

LINE Login and the LINE Messaging API identify users in different channel contexts. The app must not assume the identifiers are interchangeable.

## Current identity records

- Better Auth stores the LINE Login identity in `Account.accountId` with `providerId = "line"`; this ID is used for the web session.
- The LINE webhook receives the Messaging API user ID from the event source and uses it for bot replies, approval, and permission checks.
- `LineApprovalRequest.lineUserId` stores the bot-side identity and its approval status and feature permissions. `loginLineUserId` exists in the schema, but the current LINE profile sync upserts the Login ID directly as `lineUserId`; it does not automatically pair a different Messaging API ID with it.
- `Account.lineMessagingApiUserId` exists as an optional schema field. Current source search did not show an active writer for this field.

Better Auth account linking is disabled (`accountLinking.enabled = false` and `disableImplicitLinking = true`). Do not enable implicit linking or infer a match from display name, email-like profile data, or other user attributes.

## Approval flow

When the bot sees a Messaging API user for the first time, it creates a pending approval request. An administrator can approve the user and grant feature permissions from the LINE approval page. LINE permissions are denied unless the request is approved and the relevant permission is enabled. Environment-whitelisted admins can be auto-approved.

On LINE Login, the auth database hook syncs the Login profile into the approval table using the LINE Login ID itself. This is separate from linking a Bot-channel ID. Review [`line-profile-sync.ts`](../src/lib/auth/line-profile-sync.ts), [`auth.ts`](../src/lib/auth/auth.ts), and [`approval.service.server.ts`](../src/features/line/services/approval.service.server.ts) before changing this behavior.

## Authorization behavior

`getLineUserIds()` resolves the signed-in user's LINE OAuth account IDs from Better Auth records. `getAuthorizedLineUserId()` accepts a client-requested LINE ID only if it matches an ID associated with that session. It does not currently merge or infer another channel's ID from an approval record.

The helper [`findAndMergeDuplicateLineAccounts()`](../src/lib/auth/account-linking.ts) exists for explicit duplicate-account cleanup based on `lineMessagingApiUserId`; it is not an automatic account-linking flow. Treat its mutations carefully and review all related user data before running it.

## Database source

The app uses PostgreSQL through Prisma. Current models are defined in [`prisma/schema.prisma`](../prisma/schema.prisma). Do not use MongoDB collections or MongoDB shell examples from older notes for current debugging.
