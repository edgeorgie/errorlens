"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { analyticsEnabled, track } from "@/lib/analytics";

/**
 * `$pageview` on first load and on every client-side route change. Manual
 * rather than the SDK's history patch, which double-fires on App Router
 * navigations. The URL comes from the browser so the Pages basePath, which
 * `usePathname` strips, is included.
 */
function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastUrl = useRef<string | null>(null);

  useEffect(() => {
    const url = window.location.href;
    if (url === lastUrl.current) return;
    lastUrl.current = url;
    track("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

/** Renders nothing; without a key the whole tree is skipped. */
export default function Analytics() {
  if (!analyticsEnabled) return null;
  return (
    <Suspense fallback={null}>
      <PageviewTracker />
    </Suspense>
  );
}
