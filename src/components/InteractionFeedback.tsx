"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const FEEDBACK_TIMEOUT_MS = 10_000;
const VALIDATION_TIMEOUT_MS = 8_000;
const VALIDATION_MESSAGE = "Complete the highlighted required field before continuing.";

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
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const validationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = pendingRoute === currentRoute;
  const visible = pending || Boolean(validationMessage);

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
      setValidationMessage(null);
      showFeedback();
    }

    function handleInvalid(event: Event) {
      const field = event.target;
      if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return;
      field.dataset.validationError = "true";
      setPendingRoute(null);
      setValidationMessage(VALIDATION_MESSAGE);
      if (validationTimeoutRef.current) clearTimeout(validationTimeoutRef.current);
      validationTimeoutRef.current = setTimeout(() => setValidationMessage(null), VALIDATION_TIMEOUT_MS);
    }

    function handleInput(event: Event) {
      const field = event.target;
      if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return;
      delete field.dataset.validationError;
      if (field.checkValidity()) setValidationMessage(null);
    }

    function handlePageShow() {
      setPendingRoute(null);
    }

    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit);
    document.addEventListener("invalid", handleInvalid, true);
    document.addEventListener("input", handleInput);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit);
      document.removeEventListener("invalid", handleInvalid, true);
      document.removeEventListener("input", handleInput);
      window.removeEventListener("pageshow", handlePageShow);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (validationTimeoutRef.current) clearTimeout(validationTimeoutRef.current);
    };
  }, []);

  return (
    <div
      aria-hidden={!visible}
      aria-live={validationMessage ? "assertive" : "polite"}
      className="interaction-feedback"
      data-tone={validationMessage ? "error" : "progress"}
      data-visible={visible ? "true" : "false"}
      role={validationMessage ? "alert" : "status"}
    >
      <span className="interaction-feedback__bar" />
      <span className="interaction-feedback__label">{validationMessage ?? "Working…"}</span>
    </div>
  );
}
