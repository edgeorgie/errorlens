# Architecture

## Data flow

```mermaid
flowchart LR
  I[Screenshot] --> D[Downscale to 1568 px JPEG]
  D --> V[Vision model]
  V --> J[JSON reply]
  J --> P[Parse and validate]
  P --> T[Result tiles]
  P --> R[Region outline]
  P --> H[(Local history)]
```

## Main sequence

```mermaid
sequenceDiagram
  participant U as User
  participant B as Browser
  participant M as Vision model
  U->>B: paste screenshot
  B->>B: downscale and encode
  B->>M: image and report prompt
  M-->>B: JSON report
  B->>B: validate and clamp region
  B-->>U: tiles and outline
```

## Modules

| Path | Responsibility |
|---|---|
| `lib/image.ts` | Downscaling and encoding |
| `lib/vision.ts` | Provider requests |
| `lib/report.ts` | Prompt, parsing and region validation |
| `lib/history.ts` | Local history |
| `lib/demo.ts` | Sample screenshot and report |
| `components/Tiles.tsx` | Result tiles |

## Principles

- Pure logic lives in `lib/` and is tested without a browser; components stay thin.
- Network, storage and model replies are validated at the boundary.
- Secrets and user content stay in the browser.

## Decisions

- [No server in the path](adr/0001-no-server-in-the-path.md)
