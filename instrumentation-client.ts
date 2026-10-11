// Client-side instrumentation (Next.js `instrumentation-client` convention).
//
// Loads the analytics SDK on idle, and only when a public key is configured, so
// visitors of a deployment without analytics never download it and visitors of
// one with analytics do not pay for it during hydration. Events tracked before
// then are queued (see lib/analytics.ts).
import { analyticsEnabled, loadAnalytics } from "@/lib/analytics";

if (analyticsEnabled) {
  const start = () => void loadAnalytics();
  if ("requestIdleCallback" in window) window.requestIdleCallback(start, { timeout: 3000 });
  else setTimeout(start, 1500);
}
