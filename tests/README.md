# Tests

The project uses Bun's test runner. Tests live both under `tests/` and beside
source files in `src/`; directory names indicate their focus, not a guarantee
that they reproduce the full production environment.

```bash
bun test                                      # all discovered tests
bun test tests/onsite-report.test.ts           # a single file
bun test tests/features/planning-poker         # a feature directory
bun test tests/security/dca-server-stream.test.ts
bun test --watch
bun test --coverage
```

`tests/features/` covers feature behavior; `tests/api/`, `tests/integration/`,
and `tests/security/` contain API, integration, and security tests. Some tests
use mocks or call a running service, so inspect the individual test before
interpreting its result or running it against an environment. Use synthetic
data and do not point write-capable tests at production.

`bunfig.toml` preloads `tests/bun.test.config.ts`. That file exports a
Jest-shaped configuration object; it does not itself import `tests/setup.ts`.
Tests requiring the DOM or custom matchers must arrange their own setup. Path
aliases come from the project's TypeScript configuration.

`tests/e2e/` currently contains documentation only. A passing unit or API test
does not establish browser, deployment, or live database behavior. See
[E2E tests](./e2e/README.md).
