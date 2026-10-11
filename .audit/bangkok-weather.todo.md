# Bangkok weather

- [x] `how` over the affected subsystem. Cron gets recipients, builds one AI message, then pushes the same message to each recipient. Current weather is hardcoded.
- [x] `architect` for parallel design exploration. Two candidates and independent cross-judge selected one server-only service returning optional prompt text. Retained private response schema/map; no public provider DTO.
- [x] Write the throughput checkpoint as four todo items.
  - Blocking first steps. Verify provider contract and select a bounded server-only service.
  - Independent workstreams. n/a: one small coupled service and sender change.
  - Shared mutable state. Candidate designs are read-only; one writer owns an isolated checkout.
  - Smallest safe decomposition. One worker owns weather service, integration, and tests; root verifies.
- [x] Delegate code-writing to a subagent using your configured feature model with a specific scope. Worker owns isolated /tmp/bun-line-t3-bangkok-weather-01a128ac.
- [x] Verify on the matching surface. 56 focused tests pass with CRON_SECRET=test-secret. Scoped ESLint/Prettier pass. Live service to AI succeeds (both providers HTTP 200) with Bangkok drizzle 26 degrees Celsius. No LINE sent.
- [ ] Rebase into small, ordered commits. skip: user requested local implementation, no commit or PR.
- [ ] If the design is contested, `interrogate` before shipping. skip: no contested design or shipping.
- [ ] Run **Opening a PR**. skip: user requested local implementation, no PR.

Architect phases: Ground, Sketch, Agree, Implement, Scrap.
Arena phases: Frame, Fan out, Cross-judge, Pick, Graft, Verify.
Rubric: truthful fresh weather; failure cannot block reminders; server-only ownership; minimal API; meaningful tests.
Selected candidate A on all rubric criteria. Grafted B's 60-minute freshness and explicit Bangkok location. Both candidates omit weather on failure. Cross-judge concurs.
Live provider preflight succeeded HTTP 200; weather fields conform to documented current response.
Baseline type-check before implementation fails with 70 existing errors, none in sender or weather paths.
Implementation worker reported focused tests pass; sender tests run in a subprocess to prevent existing Bun module mocks leaking across files.
Independent review found no bugs; removed one explanatory test comment, no suppressions or unresolved findings.
Final production build passes. Type-check remains at the same 70 baseline errors, with zero new or affected-path errors.
Model the Domain shaped the private WMO map/schema. Prove It Works required actual weather-service-to-AI calls rather than trusting mocked tests.
