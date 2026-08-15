import type { ReactNode } from 'react';
import styles from './Signal.module.css';

type SignalProps = {
  children: ReactNode;
  tone?: 'signal' | 'warm' | 'success' | 'muted';
};

export function Signal({ children, tone = 'signal' }: SignalProps) {
  return <span className={`${styles.signal} ${styles[tone]}`}><i aria-hidden="true" />{children}</span>;
}
