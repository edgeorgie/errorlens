# Plan: errorlens

## Overview

An image is prepared in the browser and sent with the report prompt. The reply is parsed into a report, rendered as tiles, saved to history and its region is drawn on the screenshot.

## Modules

| Path | Responsibility |
|---|---|
| `lib/image.ts` | Downscaling and encoding |
| `lib/vision.ts` | Provider requests |
| `lib/report.ts` | Prompt, parsing and region validation |
| `lib/history.ts` | Local history |
| `lib/demo.ts` | Sample screenshot and report |
| `components/Tiles.tsx` | Result tiles |

## Decisions

- [ADR 0001: No server in the path](../adr/0001-no-server-in-the-path.md)

## Quality gates

`npm run verify`: typecheck, lint, spec check, tests and production build.
