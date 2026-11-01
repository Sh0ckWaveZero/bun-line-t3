# API route reference

API endpoints are implemented as TanStack Start file routes under [`src/routes/api/`](../src/routes/api/). The route handler is the source of truth for HTTP methods, validation, authorization, and response shape; follow a route file when building an integration because this index only summarizes the route families.

## Authentication and access

- `/api/auth/*` is the Better Auth handler.
- Most feature APIs require a signed-in session and scope records to the current user.
- Some LINE and webhook integrations use a provider signature or server-side shared secret instead of a browser session.
- Planning Poker APIs are public, use participant tokens for room actions, validate request bodies, and apply rate limits.
- Admin endpoints require the admin role. Feature access checks may add a separate permission requirement.

Do not use a user ID supplied in a query string or request body as authorization. Use the authenticated session and the checks in the route/service implementation.

## Route families

| Feature | Paths | Source |
| --- | --- | --- |
| Authentication | `/api/auth/*`, `/api/auth/check-line-approval`, `/api/logout` | [`src/routes/api/auth/`](../src/routes/api/auth/) |
| Attendance | `/api/attendance/update`, `/api/attendance-report`, `/api/attendance-push`, `/api/leave`, `/api/holidays`, `/api/work-modes` | [`src/routes/api/`](../src/routes/api/) |
| LINE | `/api/line`, `/api/line/approvals`, `/api/line/permissions` | [`src/routes/api/line/`](../src/routes/api/line/) |
| Expenses | `/api/expenses`, `/api/expenses/overview`, `/api/expenses/summary`, `/api/expenses/categories`, `/api/expenses/budgets` and item routes | [`src/routes/api/expenses/`](../src/routes/api/expenses/) |
| DCA and exchange | `/api/dca`, `/api/dca/all`, `/api/dca/summary`, `/api/dca/stream`, `/api/dca/import`, `/api/dca/export`, `/api/dca/bitkub-import`, `/api/exchanges/bitkub/*` | [`src/routes/api/dca/`](../src/routes/api/dca/), [`src/routes/api/exchanges/`](../src/routes/api/exchanges/) |
| Body Weight | `/api/body-weight`, `/api/body-weight/profiles`, `/api/body-weight/measurements/:id`, `/api/body-weight/live`, `/api/body-weight/listener`, `/api/body-weight/listeners`, `/api/body-weight/webhook` | [`src/routes/api/body-weight/`](../src/routes/api/body-weight/) |
| Onsite reports | `/api/onsite-reports` and report, company, signature, and PDF subroutes | [`src/routes/api/onsite-reports/`](../src/routes/api/onsite-reports/) |
| Calendar | `/api/calendar` | [`src/routes/api/calendar.ts`](../src/routes/api/calendar.ts) |
| Planning Poker | `/api/poker/rooms`, `/api/poker/rooms/:code`, `/api/poker/stats` | [`src/routes/api/poker/`](../src/routes/api/poker/) |
| Subscriptions | `/api/subscriptions`, `/api/subscriptions/:subscriptionId`, `/api/subscriptions/members`, `/api/subscriptions/payments` | [`src/routes/api/subscriptions/`](../src/routes/api/subscriptions/) |
| Admin and cron | `/api/admin/check`, `/api/admin/debug`, `/api/admin/cron-jobs/*`, `/api/cron/*`, `/api/checkout-reminder` | [`src/routes/api/admin/`](../src/routes/api/admin/), [`src/routes/api/cron/`](../src/routes/api/cron/) |
| Health and monitoring | `/api/health`, `/api/health/enhanced`, `/api/monitoring/dashboard` | [`src/routes/api/health.ts`](../src/routes/api/health.ts), [`src/routes/api/monitoring/`](../src/routes/api/monitoring/) |
| Thai ID and temporary charts | `/api/thai-id/*`, `/api/temp-charts/:filename` | [`src/routes/api/thai-id/`](../src/routes/api/thai-id/), [`src/routes/api/temp-charts/`](../src/routes/api/temp-charts/) |

## Feature references

- [DCA routes and Bitkub import](./DCA.md)
- [Body Weight routes and webhook](./BODY_WEIGHT.md)
- [Onsite report routes and PDF](./ONSITE_REPORTS.md)
- [Planning Poker public API](./PLANNING_POKER.md)
- [Cron jobs](./CRON-JOBS.md)

## Keeping this index current

When adding or removing a file route, update the relevant row and feature guide. Confirm HTTP methods and response details from the handler; do not infer them from the route filename alone.
