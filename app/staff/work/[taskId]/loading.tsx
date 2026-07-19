import styles from '../../../proof-loop.module.css';

export default function StaffWorkLoading() {
  return <main aria-busy="true" aria-live="polite" className={styles.closed} id="main-content"><p>MY WORK</p><h1>Opening your task…</h1><span>Passage is checking your current assignment before showing any details.</span></main>;
}
