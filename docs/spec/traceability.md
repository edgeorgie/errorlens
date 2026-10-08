# Traceability: errorlens

Every requirement maps to implementation files and to tests or manual evidence. `npm run spec:check` enforces that each requirement has an implementation, that files exist, and that there is a test or a manual note.

| Requirement | Implementation | Tests | Evidence | Status |
|---|---|---|---|---|
| FR-1 | `lib/image.ts`, `app/page.tsx` | `tests/lens.test.ts` | PR 1: sizing and data URL tests. | Verified |
| FR-2 | `lib/vision.ts` | `tests/lens.test.ts` | PR 1: request body tests; in Chrome a mocked Anthropic call received a JPEG image block. Not run against a real provider. | Implemented, not verified end to end |
| FR-3 | `lib/report.ts` | `tests/lens.test.ts` | PR 1: parser tests. | Verified |
| FR-4 | `lib/report.ts`, `app/page.tsx` | `tests/lens.test.ts` | PR 2: region tests; in Chrome the outline matched the error line in the sample. | Verified |
| FR-5 | `lib/history.ts`, `app/page.tsx` | `tests/lens.test.ts` | PR 2: history tests; reopening verified in Chrome. | Verified |
| FR-6 | `lib/demo.ts` | manual | manual: PR 1, full flow in Chrome. | Verified |
| FR-7 | `app/page.tsx`, `lib/keystore.ts` | `tests/keystore.test.ts` | manual: a reload lost the stored settings because the save ran before the load; fixed by saving only after loading, then verified in Chrome that mode persists, that the key stays in sessionStorage unless "Remember" is ticked (SEC-002) and that real calls to both providers with an invalid key return a handled 401. | Verified |
| FR-8 | `app/page.tsx` | manual | manual: in Chrome, discarding the screenshot during a demo analysis leaves the landing page with no tiles and no history entry (QA BUG-001). | Verified |
| FR-9 | `scripts/csp.mjs`, `scripts/deploy-pages.mjs` | `tests/csp.test.ts` | Hash and policy tests; published site checked in Chrome after deploy (SEC-001). | Verified |

"Verified" means the behavior was exercised. "Implemented, not verified end to end" means the code exists and its parts are tested, but a real external service or credential was not available.
