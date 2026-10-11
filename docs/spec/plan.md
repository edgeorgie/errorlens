# Plan: errorlens

## Overview

An image is prepared in the browser and sent with the report prompt. The reply is parsed into a report, rendered as tiles, saved to history and its region is drawn on the screenshot.

Usage analytics is optional and off by default: without `NEXT_PUBLIC_POSTHOG_KEY` nothing analytics-related is loaded. With it, a tiny facade queues two allowlisted events and loads the PostHog SDK on idle through a same-origin `/ingest` proxy (Node hosts) or directly to `NEXT_PUBLIC_POSTHOG_HOST` (the Pages export, which has no server).

## Modules

| Path | Responsibility |
|---|---|
| `lib/image.ts` | Downscaling and encoding |
| `lib/vision.ts` | Provider requests |
| `lib/report.ts` | Prompt, parsing and region validation |
| `lib/history.ts` | Local history |
| `lib/demo.ts` | Sample screenshot and report |
| `components/Tiles.tsx` | Result tiles |
| `lib/analytics.ts` | Analytics facade: typed event allowlist, queue, no-op without a key |
| `lib/posthog.ts` | The only import of the PostHog SDK and its privacy options; loaded on demand |
| `components/Analytics.tsx` | Manual `$pageview` on load and route changes; renders nothing without a key |
| `instrumentation-client.ts` | Loads the SDK on idle when a key exists |

## Decisions

- [ADR 0001: No server in the path](../adr/0001-no-server-in-the-path.md)
- [ADR 0002: Cookieless, content-free product analytics](../adr/0002-cookieless-analytics.md)

## Quality gates

`npm run verify`: typecheck, lint, spec check, tests and production build.
