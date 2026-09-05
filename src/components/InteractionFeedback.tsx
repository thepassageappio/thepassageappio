"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const FEEDBACK_TIMEOUT_MS = 10_000;

function isInternalNavigation(anchor: HTMLAnchorElement) {
  if (anchor.hasAttribute("download") || anchor.target === "_blank") return false;

  const destination = new URL(anchor.href, window.location.href);
  if (destination.origin !== window.location.origin) return false;

  const current = new URL(window.location.href);
  return destination.pathname !== current.pathname || destination.search !== current.search;
}

export function InteractionFeedback() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const currentRoute = query ? `${pathname}?${query}` : pathname;
  const currentRouteRef = useRef(currentRoute);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = pendingRoute === currentRoute;

  useEffect(() => {
    currentRouteRef.current = currentRoute;
  }, [currentRoute]);

  useEffect(() => {
    function showFeedback() {
      setPendingRoute(currentRouteRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setPendingRoute(null), FEEDBACK_TIMEOUT_MS);
    }

    function handleClick(event: MouseEvent) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (anchor && isInternalNavigation(anchor)) showFeedback();
    }

    function handleSubmit(event: SubmitEvent) {
      if (event.defaultPrevented) return;
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || form.target === "_blank") return;
      showFeedback();
    }

    function handlePageShow() {
      setPendingRoute(null);
    }

    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit);
      window.removeEventListener("pageshow", handlePageShow);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      aria-hidden={!pending}
      aria-live="polite"
      className="interaction-feedback"
      data-visible={pending ? "true" : "false"}
      role="status"
    >
      <span className="interaction-feedback__bar" />
      <span className="interaction-feedback__label">Working…</span>
    </div>
  );
}
