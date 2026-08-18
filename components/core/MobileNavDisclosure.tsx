'use client';

import { useState, type ReactNode } from 'react';

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
      {open && (
        <div className={panelClassName} onClick={() => setOpen(false)} role="dialog" aria-label={label}>
          {children}
        </div>
      )}
    </>
  );
}
