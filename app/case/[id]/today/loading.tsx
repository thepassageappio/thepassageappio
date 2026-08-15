import styles from '../../../proof-loop.module.css';

export default function FamilyCaseTodayLoading() {
  return <main aria-busy="true" aria-live="polite" className={styles.closed} id="main-content"><p>YOUR CASE</p><h1>Opening this case…</h1><span>Passage is checking your access before showing any case details.</span></main>;
}
