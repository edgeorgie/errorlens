import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// Static export for GitHub Pages is opt-in; the default build targets a Node host such as Vercel.
const pages = process.env.DEPLOY_TARGET === "pages";

// Gates the /ingest proxy below. Analytics is opt-in by configuration, so the proxy must not exist
// as a route when it is off.
const posthogEnabled = Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);

// Same-origin proxy for analytics (lib/posthog.ts sends to /ingest): tracking blockers filter by
// domain, and the page keeps talking only to its own origin. The static export has no server to
// rewrite, so its deploy points the SDK at the PostHog host directly instead.
//
// Gated on the key, not merely dormant without one. A rewrite is a server-side route that exists
// whether or not any client calls it, so an unconditional one would forward ANY body posted to
// /ingest/* to PostHog's public ingestion API: an open relay on this domain, costing bandwidth and
// attributing the traffic to this origin. Without a key the route does not exist and /ingest/* is a
// plain 404.
const analyticsRewrites = async () => {
  if (!posthogEnabled) return [];
  // Order matters: static and array before the catch-all.
  return [
    { source: "/ingest/static/:path*", destination: "https://us-assets.i.posthog.com/static/:path*" },
    { source: "/ingest/array/:path*", destination: "https://us-assets.i.posthog.com/array/:path*" },
    { source: "/ingest/:path*", destination: "https://us.i.posthog.com/:path*" },
  ];
};

const nextConfig: NextConfig = {
  // Turbopack leaves an unset NEXT_PUBLIC_ variable as a runtime lookup, which keeps the lazy import
  // of the analytics SDK alive and ships its chunk to every deployment. Pinning "" at build time
  // makes the import dead code, so a build without a key emits no analytics code at all.
  env: { NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "" },
  ...(pages
    ? { output: "export", trailingSlash: true, images: { unoptimized: true }, basePath: process.env.PAGES_BASE_PATH ?? "" }
    : {
        async headers() { return [{ source: "/:path*", headers: securityHeaders }]; },
        rewrites: analyticsRewrites,
        // PostHog endpoints end in "/" (such as /e/); the trailing-slash redirect would drop events.
        skipTrailingSlashRedirect: true,
      }),
};

export default nextConfig;
