'use client';

import { useFormStatus } from 'react-dom';
import styles from '../../login/Auth.module.css';

export function AcceptInvitationButton({ label = 'Accept invitation' }: { label?: string }) {
  const { pending } = useFormStatus();

  return (
    <>
      <button aria-busy={pending} className={styles.primary} disabled={pending} type="submit">
        {pending ? 'Accepting invitation…' : label}
      </button>
      <span aria-live="polite" className={styles.srOnly} role="status">
        {pending ? 'Accepting invitation. No access is shown until Passage verifies the saved receipt.' : ''}
      </span>
    </>
  );
}
