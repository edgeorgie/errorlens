/**
 * The only module that imports the PostHog SDK. lib/analytics.ts loads it on
 * demand, so it is bundled apart from the page and never downloaded without a key.
 */
import posthog from "posthog-js";
import type { PostHog, PostHogConfig } from "posthog-js";

/** The `app` super property; one PostHog project holds every app of the owner. */
export const APP = "errorlens";

/**
 * Privacy posture, pinned by tests/analytics.test.ts.
 *
 * - Cookieless with no person profiles: no cookies, no storage, no consent
 *   banner. PostHog derives a daily anonymous id server-side, which the
 *   project must have enabled ("cookieless mode") or the events are dropped.
 *   Discarding client IPs is likewise a project setting ("Discard client IP
 *   data"); the SDK's own `ip` option is deprecated and has no effect.
 * - Explicit events only: autocapture scrapes element text, so it is off, as
 *   is session recording. Pageviews are sent by components/Analytics.tsx.
 * - Do Not Track is honoured.
 * - `api_host` is the same-origin /ingest proxy from next.config.ts. The static
 *   export has no proxy, so its deploy sets NEXT_PUBLIC_POSTHOG_HOST instead.
 */
export const OPTIONS: Partial<PostHogConfig> = {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "/ingest",
  ui_host: "https://us.posthog.com",
  defaults: "2026-08-30",
  cookieless_mode: "always",
  person_profiles: "never",
  autocapture: false,
  capture_pageview: false,
  disable_session_recording: true,
  respect_dnt: true,
};

export function start(key: string): PostHog {
  posthog.init(key, OPTIONS);
  posthog.register({ app: APP, surface: "web" });
  return posthog;
}
