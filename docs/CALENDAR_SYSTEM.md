# Calendar

The calendar displays Thai public holidays, the signed-in user's leave, and the user's work-mode days. It has a desktop route at `/calendar` and a mobile-oriented route at `/calendar/mobile`.

## Data loading and changes

`GET /api/calendar?year=YYYY&month=M` requires a signed-in session and returns:

- Public holidays for the requested year
- Leave entries for the current user and requested month
- Work-mode entries (such as WFH or on-site) for the current user and month

The route validates `year` from 1970 to 2100 and `month` from 1 to 12. The combined endpoint is read-only. Creating or changing leave, work modes, or holidays uses the feature's existing API endpoints.

## Source map

- [`src/features/calendar/`](../src/features/calendar/) — desktop/mobile pages, calendar components, hooks, and helpers
- [`src/routes/api/calendar.ts`](../src/routes/api/calendar.ts) — combined read endpoint
- [`src/routes/calendar.tsx`](../src/routes/calendar.tsx) — authenticated desktop route
- [`src/routes/calendar.mobile.tsx`](../src/routes/calendar.mobile.tsx) — mobile-oriented route
- [`src/routes/api/leave.ts`](../src/routes/api/leave.ts), [`src/routes/api/holidays.ts`](../src/routes/api/holidays.ts), [`src/routes/api/work-modes.ts`](../src/routes/api/work-modes.ts) — write and feature endpoints
