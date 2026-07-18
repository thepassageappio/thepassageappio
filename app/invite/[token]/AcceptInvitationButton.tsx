'use client';

import { useFormStatus } from 'react-dom';
import styles from '../../login/Auth.module.css';

export function AcceptInvitationButton() {
  const { pending } = useFormStatus();

  return (
    <button aria-live="polite" className={styles.primary} disabled={pending} type="submit">
      {pending ? 'Accepting…' : 'Accept invitation'}
    </button>
  );
}
