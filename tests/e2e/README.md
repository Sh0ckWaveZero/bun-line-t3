# End-to-end tests

This directory currently has no automated test files. The project does not
configure Playwright or Puppeteer here, so commands such as
`bun test tests/e2e --browser=chromium` do not run a browser suite.

When a change needs browser verification, exercise the relevant user journey
in a suitable test environment and report what was checked. API and component
tests elsewhere in the repository do not replace browser E2E verification.
