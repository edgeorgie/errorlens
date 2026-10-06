# Design system

## Principles

- Bento tiles map one question to one tile: what, why, how, where to look.
- The error tile is the darkest element on the page.

## Typography

| Role | Typeface |
|---|---|
| Display and text | Plus Jakarta Sans, weight 800 for headlines |
| Code | DM Mono |

Fonts are loaded with `next/font` and exposed as CSS variables in `app/layout.tsx`.

## Color tokens

Defined as CSS variables in `app/globals.css` and mapped into Tailwind's theme.

| Token | Value | Use |
|---|---|---|
| `bg` | `#fbfaf8` | Page background |
| `ink` | `#0d0d12` | Text and the error tile |
| `pink` | `#ff2e88` | Primary accent and the region outline |
| `pink-soft` | `#ffdcec` | Soft accent |
| `lemon` | `#fff2a8` | Causes tile |
| `mint` | `#c8f7dc` | Fix tile |

## Motion

- A scanner sweeps the screenshot while it is read.
- Result tiles spring in with a stagger.
- The region outline pulses.

All animation respects `prefers-reduced-motion`.

## Components

| Component | Purpose |
|---|---|
| Tiles | Bento result tiles |

## Rules

- Color carries meaning; it is never the only signal.
- Interactive elements have visible focus and accessible names.
- New tokens are added to `globals.css` and this document together.
