import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// Static export for GitHub Pages is opt-in; the default build targets a Node host such as Vercel.
const pages = process.env.DEPLOY_TARGET === "pages";

// Same-origin proxy for analytics (lib/posthog.ts sends to /ingest): tracking blockers filter by
// domain, and the page keeps talking only to its own origin. Order matters: static and array before
// the catch-all. Traffic-wise a no-op until a key is set. The static export has no server to
// rewrite, so its deploy points the SDK at the PostHog host directly instead.
const analyticsRewrites = async () => [
  { source: "/ingest/static/:path*", destination: "https://us-assets.i.posthog.com/static/:path*" },
  { source: "/ingest/array/:path*", destination: "https://us-assets.i.posthog.com/array/:path*" },
  { source: "/ingest/:path*", destination: "https://us.i.posthog.com/:path*" },
];

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
