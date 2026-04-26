"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

function isInternalNavigation(anchor: HTMLAnchorElement) {
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;

  const nextUrl = new URL(anchor.href, window.location.href);
  const currentUrl = new URL(window.location.href);

  if (nextUrl.origin !== currentUrl.origin) return false;
  if (nextUrl.pathname === currentUrl.pathname && nextUrl.search === currentUrl.search) {
    return nextUrl.hash !== currentUrl.hash ? false : false;
  }

  return true;
}

export function NavigationFeedback() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!isNavigating) return;

    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setIsNavigating(false), 250);

    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [pathname, isNavigating]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as Element | null)?.closest("a[href]");
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) return;
      if (!isInternalNavigation(anchor)) return;

      setIsNavigating(true);
    };

    const handlePopState = () => setIsNavigating(true);
    const handlePageShow = () => setIsNavigating(false);

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  useEffect(() => {
    if (!isNavigating) return;

    const fallbackTimer = window.setTimeout(() => setIsNavigating(false), 7000);
    return () => window.clearTimeout(fallbackTimer);
  }, [isNavigating]);

  return (
    <div
      aria-hidden={!isNavigating}
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[100] transition-opacity duration-200",
        isNavigating ? "opacity-100" : "opacity-0"
      )}
    >
      <div className="h-1 overflow-hidden bg-transparent">
        <div className="route-loader-bar h-full w-2/3 rounded-r-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 shadow-lg shadow-cyan-500/30" />
      </div>
      <div className="mx-auto mt-3 flex w-fit items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-2 text-xs font-medium text-foreground shadow-xl shadow-indigo-500/10 backdrop-blur">
        <span className="page-loader-ring h-3.5 w-3.5 rounded-full border-2 border-indigo-400 border-t-transparent" />
        Loading
      </div>
    </div>
  );
}
