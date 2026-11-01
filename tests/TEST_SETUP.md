# Test setup

Run tests with `bun test`; see [the test overview](./README.md) for examples.
The root `bunfig.toml` preloads `tests/bun.test.config.ts`, which exports a
Jest-style object but does not automatically load `tests/setup.ts`.

`tests/setup.ts` provides Happy DOM globals and custom matchers when imported
by a test. Check the test's imports and mocks before assuming a browser, a
database, or a running API is available. The repository also contains tests
that depend on external services or environment configuration; examine their
setup before running them.

Use `bun check` for application type checking. The root `tsconfig.json`
excludes `*.test.ts` and `*.test.tsx`, so a successful application type check
does not mean all test files were type-checked.
