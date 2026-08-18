'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

// Deliberately unstyled logic only -- open/closed state plus a hamburger
// button and a panel wrapper. Each caller (marketing TopShell, operations
// AppFrame, family case nav) supplies its own class names so this fits each
// surface's own design system instead of forcing one shared visual style
// across three different CSS setups (bare globals.css, CSS modules, inline
// styles).
export function MobileNavDisclosure({
  label,
  buttonClassName,
  panelClassName,
  children,
}: {
  label: string;
  buttonClassName?: string;
  panelClassName?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  // Without this, the page behind the fixed-position panel stays
  // scrollable -- on a phone that lets a touch-scroll gesture move the
  // background content underneath the blurred overlay, which reads as the
  // panel glitching/jumping rather than a stable open menu.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        aria-expanded={open}
        aria-label={open ? `Close ${label}` : `Open ${label}`}
        className={buttonClassName}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>
      {open && createPortal(
        // Portaled to document.body rather than rendered inline where the
        // button lives -- every caller's header uses backdrop-filter for its
        // own frosted-glass look, and per spec, backdrop-filter (like
        // transform/filter/perspective/contain) creates a new containing
        // block for position:fixed descendants. A fixed, inset:0 panel
        // nested inside a backdrop-filtered header resolves against the
        // header's own ~56px box, not the viewport -- it was rendering as a
        // tiny sliver of the intended full-screen overlay, not just missing
        // a scrollbar. Portaling out of the header sidesteps this for good,
        // regardless of what filter/transform any future header design adds.
        <div className={panelClassName} onClick={() => setOpen(false)} role="dialog" aria-label={label}>
          {children}
        </div>,
        document.body,
      )}
    </>
  );
}
