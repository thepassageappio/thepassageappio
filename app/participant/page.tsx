import Link from 'next/link';
import { signOut } from '@/app/auth/actions';
import { loadParticipantHome } from '@/lib/continuity/participants';
import styles from './Participant.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function dateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(value));
}

export default async function ParticipantPage() {
  const projection = await loadParticipantHome();
  if (projection.state === 'signed-out') {
    return <Closed title="Your shared family information is private." body="Sign in with the account that accepted the family invitation." href="/login?next=%2Fparticipant" action="Sign in to continue" />;
  }
  if (projection.state === 'unavailable') {
    return <Closed title="We can’t check your family access right now." body="Nothing changed. Try loading this page again." href="/participant" action="Try again" />;
  }
  if (projection.state === 'closed') {
    return <Closed title="No active family access was found." body="No shared family details are visible. Ask the family coordinator if this seems wrong." href="/" action="Return to Passage" />;
  }

  return (
    <main className={styles.shell} id="main-content">
      <header className={styles.topBar}>
        <Link className={styles.brand} href="/">Passage</Link>
        <span>Shared with me</span>
        <form action={signOut}><button type="submit">Sign out</button></form>
      </header>
      <div className={styles.page}>
        <header className={styles.hero}>
          <p>SHARED WITH ME</p>
          <h1>Your shared family updates.</h1>
          <span>You can belong to more than one family space. Each space below appears because its coordinator granted the Family updates category. Passage maps eligible case progress into plain language.</span>
        </header>
        <section className={styles.account} aria-labelledby="account-title">
          <h2 id="account-title">Signed-in account</h2>
          <p>{projection.accountEmail}</p>
        </section>
        <section className={styles.spaceList} aria-labelledby="spaces-title">
          <p>FAMILY SPACES</p>
          <h2 id="spaces-title">{projection.spaces.length === 1 ? 'One family has shared updates with you.' : `${projection.spaces.length} families have shared updates with you.`}</h2>
          {projection.spaces.map((space, index) => (
            <article className={styles.access} key={`${space.space_name}-${space.accepted_at}`}>
              <header>
                <p>SHARED FAMILY SPACE</p>
                <h3>{space.space_name}</h3>
                <span>You’re here as {space.relationship}. The family coordinator controls what appears and can end access.</span>
              </header>
              <dl>
                <div><dt>Can see</dt><dd>{space.can_see.join(', ')}</dd></div>
                <div><dt>Why you’re here</dt><dd>{space.purpose}</dd></div>
                <div><dt>Access began</dt><dd><time dateTime={space.accepted_at}>{dateTime(space.accepted_at)}</time></dd></div>
                <div><dt>Who controls access</dt><dd>The family coordinator</dd></div>
                <div><dt>Proof saved to</dt><dd>Family access history</dd></div>
              </dl>
              <section className={styles.next} aria-labelledby={`next-space-${index}`}>
                <p>WHAT TO KNOW NOW</p>
                <h4 id={`next-space-${index}`}>
                  {space.current_step_title ?? 'Nothing has been shared here yet.'}
                </h4>
                <p>
                  {space.current_step_summary
                    ?? 'The family coordinator controls what appears. You do not need to do anything right now.'}
                </p>
                {space.current_step_title && <p>{space.current_step_owner} is handling this step.</p>}
                {space.latest_update_summary && (
                  <div className={styles.update}>
                    <strong>Mapped progress update</strong>
                    <p>{space.latest_update_summary}</p>
                    {space.latest_update_at && <time dateTime={space.latest_update_at}>{dateTime(space.latest_update_at)}</time>}
                  </div>
                )}
              </section>
            </article>
          ))}
        </section>
        <footer className={styles.privacy}>This access does not let you make decisions for the family. If something looks wrong, ask the family coordinator before acting.</footer>
      </div>
    </main>
  );
}

function Closed({ title, body, href, action }: { title: string; body: string; href: string; action: string }) {
  return <main className={styles.closed} id="main-content"><p>SHARED WITH ME</p><h1>{title}</h1><span>{body}</span><Link href={href}>{action}</Link></main>;
}
