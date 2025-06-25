# Gemini `tests` Directory Configuration

This file provides context for the `tests` directory.

- **Framework**: Testing is done with Vitest or Jest, configured for Bun. Run tests with `bun test`.
- **Structure**: Tests are organized to mirror the `src` directory structure.
- **Types of Tests**:
  - **Unit Tests**: Test individual functions and components.
  - **Integration Tests**: Test how multiple components or modules work together.
  - **E2E Tests**: Located in `tests/e2e`, likely using a framework like Playwright or Cypress.
- **New Tests**: When adding a new feature, create a corresponding test file in the appropriate directory.
