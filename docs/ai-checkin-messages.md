# AI check-in reminder messages

The morning attendance reminder chooses one message for the reminder run and sends it to the eligible LINE users. When `OPENAI_API_KEY` is configured, the message generator asks the model selected by `MCP_AI_MODEL` to write one Thai sentence using the Bangkok time of day, Thai weekday, and current Bangkok weather when available. It does not personalize a separate message for each user.

If the key is missing, the request fails, or the provider returns empty text, the generator selects one of the static Thai fallback messages. The reminder still uses the existing LINE template with the check-in button.

The cron sender opts into AI only when `OPENAI_API_KEY` is truthy. Weather lookup is also done only in that case. The generated message uses a constrained prompt, but no message is guaranteed to be factually accurate; the prompt only includes contextual data the sender has collected.

## Source map

- [`cron-reminder-sender.ts`](../src/lib/utils/cron-reminder-sender.ts) — collects context, generates one message, and sends reminder batches
- [`ai-message-generator.ts`](../src/lib/utils/ai-message-generator.ts) — provider call, model choice, and fallback messages
- [`checkin-reminder-messages.ts`](../src/lib/constants/checkin-reminder-messages.ts) — compatibility exports for reminder code
- [`prompts.ts`](../src/lib/ai/prompts.ts) — context formatting

The model defaults to `gpt-5.6-luna` through the current environment schema; check provider availability before relying on this default.
