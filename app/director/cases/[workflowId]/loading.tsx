import styles from '../../../proof-loop.module.css';

export default function DirectorCaseLoading() {
  return <main aria-busy="true" aria-live="polite" className={styles.closed} id="main-content"><p>CASE REVIEW</p><h1>Opening this case…</h1><span>Passage is checking your access before showing any case or proof details.</span></main>;
}
