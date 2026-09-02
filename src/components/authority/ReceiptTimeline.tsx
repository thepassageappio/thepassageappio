import type { ActorRole, AuthorityEvent } from "@/lib/authority/types";
import styles from "./authority.module.css";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export function ReceiptTimeline({ events, role }: { events: AuthorityEvent[]; role: ActorRole }) {
  const visible = events.filter((event) => event.audience.includes(role));
  return <aside className={styles.timeline} aria-label="Saved proof">
    <div className={styles.timelineHeading}><div><p className={styles.eyebrow}>Saved proof</p><h2>Receipt</h2></div><span>{visible.length} {visible.length === 1 ? "event" : "events"}</span></div>
    <ol>{visible.slice().reverse().map((event, index) => <li key={event.id}><span className={styles.timelineDot} aria-hidden="true" /><div><strong>{event.summary}</strong><p>{event.detail}</p><small>{formatTime(event.createdAt)} · Saved as version {event.recordVersion}</small></div>{index === 0 ? <span className={styles.latest}>Latest</span> : null}</li>)}</ol>
  </aside>;
}
