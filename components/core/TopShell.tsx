import Link from 'next/link';
import type { ReactNode } from 'react';

type TopShellProps = {
  children: ReactNode;
  context?: string;
  operatorSessionsConfigured?: boolean;
  mode?: 'gateway' | 'workspace';
};

export function TopShell({ children, context = 'Connected care', operatorSessionsConfigured = false, mode = 'workspace' }: TopShellProps) {
  return (
    <div className={`top-shell top-shell--${mode}`}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="top-shell__bar">
        <Link className="top-shell__brand" href="/" aria-label="Passage home">
          <span className="signal-mark" aria-hidden="true"><i /><i /><i /></span>
          <strong>PASSAGE</strong>
        </Link>
        <span className="top-shell__context"><i aria-hidden="true" />{context}</span>
        <span className="top-shell__environment">{operatorSessionsConfigured
          ? 'FAMILY EXAMPLE STAYS IN THIS BROWSER · TEAM EXAMPLES USE ISOLATED SERVER SESSIONS'
          : 'FAMILY EXAMPLE STAYS IN THIS BROWSER · OPERATOR CHANGES STAY ON THE CURRENT PAGE AND RESET ON REFRESH'}</span>
      </header>
      {children}
    </div>
  );
}
