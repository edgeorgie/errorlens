import assert from "node:assert/strict";
import { test } from "node:test";

// The /ingest proxy is a SERVER-side route, so no client-side gate can close
// it: registered unconditionally, the deployment forwards any body posted to
// /ingest/* to PostHog's public ingestion API whether or not a key is set and
// whatever the bundle contains. That is an open relay attributed to this
// origin.
//
// Asserting on the SOURCE of next.config.ts cannot prove a route is absent, so
// these tests import the real config and call its own rewrites() under each
// environment. The build-output checks cover the client half; a clean bundle
// says nothing about the proxy.

type Rewrite = { source: string; destination: string };
type Config = { output?: string; rewrites?: () => Promise<Rewrite[]> };

let loads = 0;

async function loadConfig(env: { key: string | undefined; target?: string }): Promise<Config> {
  const saved = { key: process.env.NEXT_PUBLIC_POSTHOG_KEY, target: process.env.DEPLOY_TARGET };
  const set = (name: string, value: string | undefined) => {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  };
  set("NEXT_PUBLIC_POSTHOG_KEY", env.key);
  set("DEPLOY_TARGET", env.target);
  try {
    // The gate is evaluated when the config module loads, so each run needs a
    // fresh module instance; a unique query string bypasses the module cache.
    const mod = await import(`../next.config.ts?load=${loads++}`);
    return mod.default as Config;
  } finally {
    set("NEXT_PUBLIC_POSTHOG_KEY", saved.key);
    set("DEPLOY_TARGET", saved.target);
  }
}

async function rewritesWith(key: string | undefined): Promise<Rewrite[]> {
  const config = await loadConfig({ key });
  assert.equal(typeof config.rewrites, "function");
  return await config.rewrites!();
}

test("registers no rewrite at all when no key is set", async () => {
  assert.deepEqual(await rewritesWith(undefined), []);
});

test('treats an empty key as unset (next.config.ts defines it as "")', async () => {
  assert.deepEqual(await rewritesWith(""), []);
});

test("proxies to PostHog only when a key is set, catch-all last", async () => {
  const rewrites = await rewritesWith("phc_test_key");
  assert.deepEqual(
    rewrites.map((r) => r.source),
    ["/ingest/static/:path*", "/ingest/array/:path*", "/ingest/:path*"],
  );
  // Every destination must stay on PostHog's own hosts: a typo'd or
  // attacker-supplied destination would make the relay worse, not better, than
  // the ungated version.
  for (const r of rewrites) {
    assert.match(new URL(r.destination).hostname, /\.i\.posthog\.com$/);
  }
  // The catch-all must be last, or /ingest/static/* would be swallowed by it
  // and the SDK assets would 404.
  assert.equal(rewrites[rewrites.length - 1].source, "/ingest/:path*");
});

test("the static export has no rewrites, with or without a key", async () => {
  for (const key of [undefined, "phc_test_key"]) {
    const config = await loadConfig({ key, target: "pages" });
    assert.equal(config.output, "export");
    assert.equal(config.rewrites, undefined);
  }
});
