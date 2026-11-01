# Planning Poker

Planning Poker provides temporary rooms for teams to estimate stories together. It is public and does not require sign-in. The room creator chooses a deck, enters an optional story, and joins as a voter or spectator. Votes remain hidden until a participant with control reveals them; the result includes the average, median, distribution, and consensus when numeric votes are available.

## Using a room

1. Open `/planning-poker` and create a room.
2. Share the six-character room code or room link with participants.
3. Participants join with a name and choose voter or spectator.
4. Voters select a card. A controller reveals the round; start a new round to vote again.

Built-in decks are Fibonacci, modified Fibonacci, powers of two, and T-shirt sizing. The creator can also define a custom deck. Participants can update their display name and role; observers can control reveal/reset only when the room setting permits it.

## Room state and limits

Room state is stored in process memory. A server restart, redeploy, or request routed to a different application process can make a room unavailable; this implementation does not persist rooms to PostgreSQL or synchronize them between instances. Do not use this feature where durable or multi-instance room state is required.

The service limits rooms to 1,000, participants to 50 per room, and history to 50 rounds. Inactive rooms expire after 12 hours; inactive participants are removed after 10 minutes. API input is schema-validated and the public endpoints use rate limits.

## Routes

- `/planning-poker` — room lobby
- `/planning-poker/:code` — join or view a room
- `POST /api/poker/rooms` — create a room
- `GET`, `POST /api/poker/rooms/:code` — read state, join, vote, reveal, reset, set story, rename, change role, or leave
- `GET /api/poker/stats` — public lobby statistics

Participant actions use the `x-poker-token` header. The server hides other participants' votes before reveal and returns only the caller's own vote during that period.

## Reveal effects

The room page includes the rarity-based reveal animation. Its calculation and visual rules are documented separately in [Planning Poker Reveal FX](./PLANNING_POKER_FX.md).

## Source map

- [`src/features/planning-poker/`](../src/features/planning-poker/) — room UI, client hooks, validation, and room service
- [`src/routes/api/poker/`](../src/routes/api/poker/) — public room and statistics APIs

