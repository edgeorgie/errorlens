# Evaluation

A self-assessment against a reviewer's rubric. It states gaps plainly so a reviewer, a person or an agent, can verify or challenge each line.

| Criterion | Status | Notes |
|---|---|---|
| Onboarding | Pass | README has a one-command run, usage steps and configuration. |
| Reproducible build | Pass | Lockfile, Node 22 engine field, and one gate: `npm run verify`. |
| Automated tests | Partial | Unit tests cover the pure logic (5 of 6 requirements have tests). No browser end-to-end tests; UI behavior was verified manually and recorded in the traceability matrix. |
| Continuous integration | Gap | A workflow runs `npm run verify` but is not active until the repository token has the workflow permission. The gate runs locally. |
| Specification and traceability | Pass | Spec, plan, tasks, ADRs and a matrix enforced by `npm run spec:check`. |
| Documentation structure | Pass | Index, architecture with diagrams, glossary and design system. |
| Agent readiness | Pass | AGENTS.md, llms.txt, machine-readable requirements and a deterministic gate. There is no MCP server or OpenAPI document because the app is client-side. |
| LLM integration safety | Partial | Screenshots can contain adversarial text, which is untrusted input to the model. The model has no tools, the reply is schema-validated, links are built only as encoded search URLs, and all text is rendered as text. |
| Privacy and data flow | Pass | Every data path and its storage is tabulated in the README. |
| Accessibility | Partial | The screenshot has alt text and the outline is described; reports are real text. Not audited with automated tooling. |
| Performance | Partial | Images are downscaled before upload. Not measured with Lighthouse. |
| Security | Partial | The key lives in sessionStorage by default and in localStorage only if the user opts in. Screenshots may contain secrets and are sent to the provider by design. Baseline security headers are set on a Node host. The Pages export carries a CSP meta tag (headers and frame-ancestors are not possible on Pages). |
| Deployment | Pass | Live on Vercel at https://errorlens-one.vercel.app, with security headers served by the host. The main flow was exercised on the deployed site. |
| Licensing | Pass | MIT. |

## Verify it yourself

```bash
npm install
npm run verify
```

Requirements marked "Implemented, not verified end to end" in [spec.md](spec/spec.md) depend on a real external service or credential that was not exercised.
