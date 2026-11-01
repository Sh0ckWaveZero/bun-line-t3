# Body Weight and Scale

The `/body-weight` page stores measurements from the Xiaomi Mi Body Composition Scale 2, displays history and charts, and lets users maintain profiles used to calculate body-composition metrics. Administrators can manage measurement ownership and select which listener is active.

## Measurements and profiles

- A measurement may include weight, impedance, timestamp, and derived body-composition metrics.
- The application calculates body-composition metrics when the selected profile has both height and birth date. Updating a profile recalculates metrics for its measurement history.
- Users can view and edit their own profiles and measurements. Administrators can view all measurements, manage profile ownership, and include unassigned measurements.
- A reading without impedance may be held temporarily while the scale sends the remaining packet; incomplete readings are not treated as complete measurements.

## Scale listener

The repository includes a Bun BLE listener for the Xiaomi Mi Body Composition Scale 2. Start it with:

```bash
bun run scale:listen
```

Set `APP_URL`, `SCALE_WEBHOOK_SECRET`, and optionally `SCALE_LISTENER_NAME` in the listener environment. The same webhook secret must be configured by the app. The listener checks in with the application and scans only when selected from `/body-weight`. Platform Bluetooth permissions and Linux HCI capabilities are required; see comments at the top of [`scale-listener.ts`](../src/features/body-weight/listener/scale-listener.ts) for platform-specific constraints.

The webhook also accepts the legacy `measurement` event format. The `analysis` event is acknowledged as ignored. For new direct BLE readings, the bundled listener sends `reading` events and the server groups the packets into one measurement.

## API routes

| Method | Path | Access |
| --- | --- | --- |
| `GET` | `/api/body-weight` | Signed-in user; returns scoped measurements and profiles |
| `PUT` | `/api/body-weight/profiles` | Signed-in user; admins may assign profile ownership |
| `PATCH`, `DELETE` | `/api/body-weight/measurements/:id` | Signed-in user; scope is enforced by profile ownership, with admin access across profiles |
| `GET`, `PUT` | `/api/body-weight/listeners` | Admin only |
| `GET` | `/api/body-weight/listener?name=...` | Listener heartbeat, requires webhook secret |
| `GET` | `/api/body-weight/live` | Signed-in user; live scale readings scoped to that user |
| `POST` | `/api/body-weight/webhook` | Requires `x-webhook-secret` |

## Data and privacy

Profiles can be unassigned. A scale reading may remain unassigned when the system cannot match it to a profile; administrators can assign it later. Regular users should only be able to see measurements belonging to their own profiles. The webhook secret is server-side only; do not expose it in a browser URL, commit it, or log its value.

## Source map

- [`src/features/body-weight/`](../src/features/body-weight/) — page, scale listener, calculations, hooks, and server services
- [`src/routes/api/body-weight/`](../src/routes/api/body-weight/) — measurement, profile, live-state, and webhook endpoints

