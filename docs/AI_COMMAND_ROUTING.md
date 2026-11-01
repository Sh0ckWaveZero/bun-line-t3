# LINE AI command routing

`/ai` accepts natural-language requests in Thai or English and can route them to a registered LINE bot command. The implementation calls OpenAI directly through the AI SDK; there is no MCP server in this request path.

## Commands

```text
/ai <request>          route a request to a registered bot command
/ai chat <message>     one-off general conversation
/ai help               show usage examples
```

Chat mode receives only the current message; it does not retain conversation history. It cannot query application records or perform actions unless a request is routed to one of the registered bot command handlers.

## Routing flow

1. The LINE handler selects help, chat, or natural-language routing.
2. Natural-language input passes through the content-safety filter.
3. The command registry and its examples are sent to OpenAI with a structured output schema.
4. The returned command must be in the registry allowlist. Parameters not declared for that command are removed.
5. The router calls the corresponding command handler; the handler remains responsible for validating and executing the operation.

For expense requests, a small deterministic inference helper can infer an add/income intent and amount when the AI returned no subcommand. This does not bypass the downstream command handler.

## Configuration

Set `OPENAI_API_KEY` on the server. `MCP_AI_MODEL` selects the OpenAI model and defaults to `gpt-5.6-luna` in the current environment schema. The variable name is retained for compatibility; it does not mean the request uses an MCP service. If the key is absent or the configured model is unavailable, AI requests fail and the handler returns an error message.

Never expose either variable to client-side code or commit secret values. The model name and availability can change; check the configured server value and current provider access before relying on a specific model.

## Safety and limits

- The prompt asks the model to choose only a registered command, use only supported parameters, and return `null` for ambiguous or conflicting requests.
- The response is schema-validated and normalized against an allowlist before execution.
- A content-safety filter rejects configured abusive or injection-like patterns before routing. It is a code-level filter, not a substitute for server-side authorization or validation.
- `confidence` is returned by the routing schema but the command path uses a missing/invalid command to request clarification; a confidence score does not prove an operation succeeded.
- Chat mode sends the current message to the configured provider. Do not include secrets or sensitive personal data in prompts.

## Extending the router

Add or update a command in [`command-registry.ts`](../src/features/line/commands/command-registry.ts), add its execution mapping in [`ai-command-router.ts`](../src/features/line/commands/ai-command-router.ts), and verify that supported parameter names and validation match the target handler. Update this guide when command behavior changes.

## Source map

- [`handleAiCommand.ts`](../src/features/line/commands/handleAiCommand.ts) — entry point
- [`command-routing.ts`](../src/features/line/commands/ai/command-routing.ts) — safety check, model call, and dispatch
- [`openai-client.ts`](../src/lib/ai/openai-client.ts) — structured response and chat call
- [`command-intent.ts`](../src/lib/ai/command-intent.ts) — registry context and allowlist
- [`content-safety.ts`](../src/lib/ai/content-safety.ts) — input filter
