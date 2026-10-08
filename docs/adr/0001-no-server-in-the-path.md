# ADR 0001: No server in the path

Status: accepted

## Context

Screenshots can contain secrets.

## Decision

Calls go from the browser to the provider; nothing is stored remotely.

## Consequences

Strong privacy; users supply a key and the browser must allow cross-origin calls to the provider.
