# Onsite Service Report

Onsite Service Report is a signed service visit report based on form FM-PM-01. A signed-in user can create and edit reports, preview the PDF before saving, download the saved report, and record signatures from the company and client. Administrators manage the company names and logos used in the PDF.

## Web pages

- `/onsite-report` — list the current user's reports
- `/onsite-report/new` — create a report
- `/onsite-report/:id/edit` — edit a report owned by the current user
- `/admin/onsite-report-companies` — admin-only company and logo management

The report flow requires authentication and feature access. Administrators always have access; other users need an approved LINE account and the `canUseOnsiteReport` permission granted by an administrator on `/admin/line-permissions`. The page gate improves the UI, while API handlers enforce access. Report reads and mutations are scoped to the authenticated user. Admin company management checks the admin role in the route guard and API handlers.

## Report fields

The form stores the issuing company code, document number and revision, client and project, visit date and time, phase, main contact, execution team, objective, action item, pending note, next actions, and attendees. Blank next-action and attendee rows are omitted when saving. Validation limits reports to 12 next actions and 10 attendees. The attendee section always shows a note asking users to attach a separate list when there are more than 10 attendees.

Date values use `YYYY-MM-DD`. Time choices are offered in 30-minute increments from 08:00 through 18:00. If both times are supplied, the end time must be later than the start time.

## PDF

The preview endpoint renders the current form data without saving it. The download endpoint renders the saved report. Both use the same server-side PDF renderer so the preview and final export share the same layout. The PDF includes the issuing company name and optional logo, report fields, action and attendee tables, and the two signature areas. Sarabun font files are loaded from `public/fonts` for Thai text rendering.

## API routes

| Method | Path | Purpose |
| --- | --- | --- |
| `GET`, `POST` | `/api/onsite-reports` | List the signed-in user's reports; create a report |
| `GET`, `PATCH`, `DELETE` | `/api/onsite-reports/:id` | Read, update, or delete an owned report |
| `POST` | `/api/onsite-reports/preview-pdf` | Render unsaved form data as an inline PDF preview |
| `GET` | `/api/onsite-reports/:id/pdf` | Download an owned report as PDF |
| `GET`, `POST` | `/api/onsite-reports/companies` | List active companies; create a company as admin |
| `PATCH`, `DELETE` | `/api/onsite-reports/companies/:code` | Update or delete a company as admin |
| `GET`, `PUT`, `DELETE` | `/api/onsite-reports/companies/:code/logo` | Read, replace, or remove a company logo |
| `GET`, `PUT`, `DELETE` | `/api/onsite-reports/:id/signatures/:party` | Read, save, or remove an owned report signature |
| `GET` | `/api/onsite-reports/access` | Check whether the signed-in user may use the feature |

For full route behavior, see the handlers in [`src/routes/api/onsite-reports/`](../src/routes/api/onsite-reports/) and the server-only implementation in [`src/features/onsite-report/`](../src/features/onsite-report/).

## PDF layout

The export is a single-page A4 form when the content fits. Longer content can wrap within the report fields and tables. Company and client signatures are rendered over separate signature lines. The PDF uses the registered company name and logo at render time, so changing company metadata also changes how reports reference that company.

