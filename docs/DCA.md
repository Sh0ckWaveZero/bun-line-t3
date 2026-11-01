# DCA tracking

The DCA page records and summarizes investment purchases associated with the signed-in user's linked LINE identity. It includes manual order entry, history and summary views, charts, CSV/JSON import and export, and live refresh when an order changes. BTC/THB market price data is used for the displayed profit/loss estimate when available; it is an estimate based on stored purchases and the current quote.

## Web page and API

- `/dca-history` — DCA history, totals, charts, imports, exports, and Bitkub connection controls
- `/api/dca` — list and create orders
- `/api/dca/:id` — read, update, or delete one order
- `/api/dca/summary` — totals and current BTC profit/loss estimate
- `/api/dca/all` — retrieve all eligible orders for the current account
- `/api/dca/stream` — live order-change notifications
- `/api/dca/import`, `/api/dca/export` — file-based data transfer
- `/api/dca/bitkub-import` — import selected cached Bitkub BTC buys
- `/api/exchanges/bitkub/connection` — connect, inspect, or disconnect Bitkub credentials

Requests that access user data resolve the owner from the authenticated session and validate the requested LINE identity against that session. Do not use a caller-provided LINE ID as an authorization check.

## Bitkub history import

The Bitkub integration reads BTC/THB buy history; it does not create exchange orders, read wallet balances, or reconcile automatic trades. The user selects cached purchases to import into DCA records. Credentials are encrypted on the server and imports are deduplicated by their source identity.

Before enabling the integration, apply repository migrations and configure `BITKUB_CREDENTIAL_ENCRYPTION_KEY` as 32 random bytes encoded in 64 hexadecimal characters. Keep it stable and secret; rotating or losing it prevents decryption of stored credentials. Create a Bitkub API key with trading, deposit, and withdrawal permissions disabled and use IP restrictions where available.

See [Bitkub DCA import details](./bitkub-dca.md) for the data mapping, key permissions, import behavior, and known limitations.

## Source map

- [`src/features/dca/`](../src/features/dca/) — DCA pages, components, hooks, and server services
- [`src/features/exchanges/`](../src/features/exchanges/) — exchange credential handling and Bitkub history API
- [`src/routes/api/dca/`](../src/routes/api/dca/) — DCA API handlers

