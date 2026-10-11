/**
 * Thin analytics facade (PostHog), the shape shared across the owner's apps.
 *
 * - No key: `track()` is a no-op. next.config.ts pins the unset key to "" at
 *   build time, which makes the dynamic import below dead code, so the build
 *   contains no SDK and nothing is downloaded. The /ingest proxy in
 *   next.config.ts is registered only with a key as well, so without one
 *   that route does not exist.
 * - With a key: `lib/posthog.ts`, the only module that imports the SDK, is
 *   loaded on idle by instrumentation-client.ts, off the critical path. Events
 *   tracked before then are queued and flushed once it is ready.
 * - Events are an allowlist (`Events`) of enums, numbers and booleans. Never
 *   the screenshot, the context text, the report or the key.
 *
 * See docs/adr/0002-cookieless-analytics.md.
 */
import type { PostHog } from "posthog-js";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
export const analyticsEnabled = Boolean(KEY);

/** Every event this app may send and the only properties each may carry. */
export type Events = {
  /** Sent by components/Analytics.tsx on load and on route changes; the SDK's own pageview capture is off. */
  $pageview: { $current_url: string };
  /** One analysis request that reached a model (or the demo), whether or not it produced a report. */
  error_explained: {
    /** The provider's model id, or "demo". */
    model: string;
    latency_ms: number;
    /** Shared with the other apps; "text" is reserved for a pasted-text intake this app does not have yet. */
    input_kind: "screenshot" | "text";
    ok: boolean;
  };
};

let client: PostHog | null = null;
let loading: Promise<PostHog | null> | null = null;
// Switched off if the SDK fails to load, so events stop queueing with nowhere to go.
let active = analyticsEnabled;
const queue: { event: string; props: Record<string, unknown> }[] = [];

/** Fire-and-forget. Safe to call anywhere; queues until the SDK has loaded. */
export function track<E extends keyof Events>(event: E, props: Events[E]): void {
  if (!active) return;
  if (client) client.capture(event, props);
  else queue.push({ event, props });
}

/** Loads and starts the SDK once and flushes the queue. Resolves null without a key or outside a browser. */
export function loadAnalytics(): Promise<PostHog | null> {
  if (!KEY || !active || typeof window === "undefined") return Promise.resolve(null);
  loading ??= import("./posthog.ts")
    .then(({ start }) => {
      client = start(KEY);
      for (const q of queue.splice(0)) client.capture(q.event, q.props);
      return client;
    })
    .catch(() => {
      active = false;
      queue.length = 0;
      return null;
    });
  return loading;
}

/**
 * Starts the clock for one `error_explained` and returns the builder of its
 * properties, so call sites only report the outcome. The properties are built
 * here, in one place, so a test can pin the allowlist.
 */
export function timeExplanation(model: string, clock: () => number = () => performance.now()): (ok: boolean) => Events["error_explained"] {
  const startedAt = clock();
  return (ok) => ({ model, latency_ms: Math.max(0, Math.round(clock() - startedAt)), input_kind: "screenshot", ok });
}
