# ADR 0002: Cookieless, content-free product analytics

Status: accepted

## Context

The owner's apps share one PostHog project so their usage can be compared in one place (the portfolio repository's `docs/POSTHOG_PLAN.md`). errorlens keeps secrets and user content in the browser (ADR 0001), so analytics must not weaken that: nothing a visitor pastes, uploads or receives may leave the browser for any destination other than the chosen model provider. A Node host such as Vercel can proxy requests; the GitHub Pages export cannot. Forks and local builds should carry no analytics at all.

## Decision

- posthog-js is the one new dependency. It is loaded on idle, and only when `NEXT_PUBLIC_POSTHOG_KEY` is set at build time. Without the key no script the page loads contains the SDK, nothing runs, `track()` is a no-op and the `/ingest` proxy route is not registered. `next.config.ts` pins the unset key to `""` at build time, because Turbopack otherwise leaves it a runtime lookup that keeps the lazy import, and its ~315 KB chunk, in every build.
- Cookieless mode with no person profiles and no `identify()`: no cookies, no storage, no consent banner. PostHog derives a daily anonymous id on its servers, which the project must have enabled. Autocapture (it scrapes element text) and session recording are off; Do Not Track is honoured. The PostHog project must also turn on "Discard client IP data" in its settings: the SDK's `ip` option is deprecated and has no effect, so the SDK is not given it.
- An allowlist of two events, typed in `lib/analytics.ts`: `$pageview` and `error_explained` (`model`, `latency_ms`, `input_kind`, `ok`), each with the `app` and `surface` super properties. Values are enums, numbers and booleans. Adding an event means extending that type and this record.
- Same-origin transport: on Node hosts, when a key is set, `/ingest/*` is rewritten to PostHog, so tracking blockers that filter by domain do not drop events and the page keeps talking to its own origin. The export has no server, so its deploy sets `NEXT_PUBLIC_POSTHOG_HOST`, and the exported Content-Security-Policy is widened to that host and the PostHog assets host only then.

## Consequences

Usage can be measured without a privacy notice beyond the README's data-flow table. The default stays a no-op, so forks and previews report nothing. The cost is no cross-day identity, which this app does not need, and two extra chunks for deployments that opt in. Events are lost silently if the PostHog project has cookieless mode disabled or if the Pages deploy sets a key without a host.

The proxy exists only with a key. A rewrite is a server-side route that exists whether or not any client calls it, so registering it unconditionally would make every Node deployment an open relay: any body posted to `/ingest/*` would be forwarded to PostHog's public ingestion API from this origin, at this deployment's cost and attributed to it, even with analytics off and the SDK out of the build. `rewrites()` therefore returns `[]` unless `NEXT_PUBLIC_POSTHOG_KEY` is non-empty, and `/ingest/*` is a 404; `tests/ingest-proxy.test.ts` calls the real `rewrites()` under an unset, an empty and a set key. With a key the route is public by necessity, as with any analytics proxy, and anyone who reads the public project token from the bundle can post events through it.
