# Specification: errorlens

Paste a screenshot of an error and get a plain explanation, likely causes and the fix.

## Baseline

This specification describes the behavior verified for the 0.1.0 baseline (2026-10-06) and is the source of truth from here on. Every change starts in this document and follows the workflow in `AGENTS.md`.

## Users

Developers who hit an error and want a fast explanation.

## Goals

- Read an error from an image and explain it.
- Keep screenshots out of any server.
- Work in a demo mode without a key.

## Non-goals

- Fixing code automatically.
- Storing screenshots remotely.

## Requirements

### FR-1 Image intake and downscaling

Status: Verified.

- Given a pasted, dropped or uploaded image, then it is scaled so the longest side is at most 1568 px and encoded as JPEG.

### FR-2 Vision requests

Status: Implemented, not verified end to end.

- Given Anthropic or OpenAI, then the image is encoded in that provider's format and sent directly from the browser.

### FR-3 Structured report

Status: Verified.

- Given a model reply, then the error, stack, explanation, ranked causes, fixes and searches are parsed and clamped; unusable replies are rejected.

### FR-4 Error region highlight

Status: Verified.

- Given a region as fractions of the image, then it is validated and clamped and drawn over the screenshot.

### FR-5 Local history

Status: Verified.

- Given results, then the last six are kept on this device with thumbnails, deduplicated by error, and can be reopened, removed or cleared.

### FR-6 Demo mode

Status: Verified.

- Given demo mode, then a generated sample screenshot and a prepared report work with no key and no network.

### FR-7 Settings persistence

Status: Verified.

- Given a saved provider and key, when the page is reloaded, then the same provider and key are restored and are not overwritten by defaults.


## Open risks

- Region coordinates from a model can be wrong; they are validated but may be imprecise.
- Provider CORS behavior may change.
