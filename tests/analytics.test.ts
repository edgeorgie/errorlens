import assert from "node:assert/strict";
import { test } from "node:test";
import { analyticsEnabled, loadAnalytics, timeExplanation, track } from "../lib/analytics.ts";
import { OPTIONS } from "../lib/posthog.ts";

const keyInShell = Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY) && "NEXT_PUBLIC_POSTHOG_KEY is set in this shell";

test("without a key, tracking is a no-op and the SDK is never loaded", { skip: keyInShell }, async () => {
  assert.equal(analyticsEnabled, false);
  assert.equal(track("error_explained", { model: "demo", latency_ms: 1, input_kind: "screenshot", ok: true }), undefined);
  assert.equal(await loadAnalytics(), null);
});

test("error_explained carries only the allowlisted properties, with a rounded, non-negative latency", () => {
  const ticks = [100, 2350.6];
  const props = timeExplanation("demo", () => ticks.shift() ?? 0)(true);
  assert.deepEqual(props, { model: "demo", latency_ms: 2251, input_kind: "screenshot", ok: true });
  assert.deepEqual(Object.keys(props).sort(), ["input_kind", "latency_ms", "model", "ok"]);
  const backwards = [10, 5];
  assert.equal(timeExplanation("demo", () => backwards.shift() ?? 0)(false).latency_ms, 0);
});

test("the SDK is cookieless, without autocapture, recording or person profiles, and talks to the proxy", () => {
  assert.equal(OPTIONS.cookieless_mode, "always");
  assert.equal(OPTIONS.person_profiles, "never");
  assert.equal(OPTIONS.autocapture, false);
  assert.equal(OPTIONS.capture_pageview, false);
  assert.equal(OPTIONS.disable_session_recording, true);
  assert.equal(OPTIONS.respect_dnt, true);
  assert.equal(OPTIONS.api_host, process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "/ingest");
});
