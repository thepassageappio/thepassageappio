import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { signOut } from '@/app/auth/actions';
import { loadFamilyPeople } from '@/lib/continuity/participants';
import { participantCategoryLabels } from '@/lib/presentation/participant-labels';
import { createFamilySpace } from './actions';
import { InviteParticipantForm } from './InviteParticipantForm';
import styles from './People.module.css';

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

export default async function FamilyPeoplePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const projection = await loadFamilyPeople();
  const query = await searchParams;
  if (projection.state === 'signed-out') {
    return <Closed title="Your family people are private." body="Sign in before creating or reviewing family access." href="/login?next=%2Ffamily%2Fpeople" action="Sign in to continue" />;
  }
  if (projection.state === 'unavailable') {
    return <Closed title="We couldn’t load family access." body="Nothing changed. Try loading People again." href="/family/people" action="Reload People" />;
  }

  const active = projection.participants.filter((participant) => participant.status === 'active');
  const waiting = projection.invitations.filter((invitation) => invitation.lifecycle_state === 'available');
  const history = projection.invitations.filter((invitation) => invitation.lifecycle_state !== 'available');
  const notice = query.notice === 'family-created'
    ? 'Your private family space is ready. No one else has access yet.'
    : null;
  const error = typeof query.error === 'string'
    ? 'Passage could not create the family space. Nothing changed; check the name and try again.'
    : null;

  return (
    <main className={styles.shell} id="main-content">
      <header className={styles.topBar}>
        <Link className={styles.brand} href="/">Passage</Link>
        <nav aria-label="Family navigation"><Link href="/family">Family home</Link><Link aria-current="page" href="/family/people">People</Link></nav>
        <form action={signOut}><button type="submit">Sign out</button></form>
      </header>
      <div className={styles.page}>
        <header className={styles.hero}>
          <p>FAMILY / PEOPLE</p>
          <h1>Choose who can help.</h1>
          <span>You decide who can join and what they can see. Passage saves the invitation and access receipt for you.</span>
        </header>
        {notice && <div className={styles.success} role="status"><strong>Saved.</strong><p>{notice}</p></div>}
        {error && <div className={styles.error} role="alert"><strong>Nothing changed.</strong><p>{error}</p></div>}

        {!projection.ownedSpace ? (
          <section className={styles.section} aria-labelledby="space-title">
            <p className={styles.kicker}>START HERE</p>
            <h2 id="space-title">Name your private family space.</h2>
            <p>This creates the boundary you control. It does not invite anyone or share anything yet.</p>
            <form action={createFamilySpace} className={styles.setupForm}>
              <input name="requestId" type="hidden" value={randomUUID()} />
              <label>Family space name<input maxLength={120} name="displayName" placeholder="For example, Rivera family" required /></label>
              <button className={styles.primary} type="submit">Create family space</button>
            </form>
          </section>
        ) : (
          <>
            <section className={styles.spaceSummary} aria-label="Family access summary">
              <div><strong>{projection.ownedSpace.display_name}</strong><span>Your private family space</span></div>
              <dl><div><dt>People with access</dt><dd>{active.length}</dd></div><div><dt>Waiting for a response</dt><dd>{waiting.length}</dd></div></dl>
            </section>
            <section className={styles.section} aria-labelledby="invite-title">
              <div className={styles.sectionHeading}><div><p>INVITE SOMEONE</p><h2 id="invite-title">Give one person one clear purpose.</h2></div><span>Not sent by Passage</span></div>
              <InviteParticipantForm continuitySpaceId={projection.ownedSpace.id} requestId={randomUUID()} />
            </section>
            <PeopleSection count={active.length} eyebrow="PEOPLE WITH ACCESS" title="People who can open shared information now.">
              {active.length ? active.map((person) => (
                <article className={styles.personCard} key={person.id}>
                  <header><div><strong>{person.display_name}</strong><span>{person.relationship}</span></div><b>Access active</b></header>
                  <dl className={styles.facts}><div><dt>Purpose</dt><dd>{person.purpose}</dd></div><div><dt>Can see</dt><dd>{participantCategoryLabels(person.category_scope).join(', ')}</dd></div><div><dt>Access began</dt><dd><time dateTime={person.accepted_at}>{dateTime(person.accepted_at)}</time></dd></div><div><dt>Who controls access</dt><dd>The family coordinator</dd></div></dl>
                </article>
              )) : <Empty title="No one else has access." body="Create an invitation when you are ready to ask someone for help." />}
            </PeopleSection>
            <PeopleSection count={waiting.length} eyebrow="WAITING FOR A RESPONSE" title="Invitations that can still be accepted.">
              {waiting.length ? waiting.map((invitation) => (
                <article className={styles.personCard} key={invitation.id}>
                  <header><div><strong>{invitation.display_name}</strong><span>{invitation.relationship}</span></div><b>Not sent by Passage</b></header>
                  <dl className={styles.facts}><div><dt>Email named for this invitation</dt><dd>{invitation.invited_email}</dd></div><div><dt>Purpose</dt><dd>{invitation.purpose}</dd></div><div><dt>Can see</dt><dd>{participantCategoryLabels(invitation.category_scope).join(', ')}</dd></div><div><dt>Expires</dt><dd><time dateTime={invitation.expires_at}>{dateTime(invitation.expires_at)}</time></dd></div><div><dt>Next</dt><dd>Share the secure link you copied when the invitation was created</dd></div></dl>
                </article>
              )) : <Empty title="No one is waiting." body="Accepted and ended invitations never appear here." />}
            </PeopleSection>
            <PeopleSection count={history.length} eyebrow="INVITATION HISTORY" title="Earlier invitation outcomes saved here.">
              {history.length ? history.map((invitation) => (
                <article className={styles.historyRow} key={invitation.id}>
                  <div><strong>{invitation.display_name}</strong><span>{invitation.relationship}</span></div>
                  <p>{invitation.lifecycle_state === 'accepted' ? 'Invitation accepted' : invitation.lifecycle_state === 'expired' ? 'Invitation expired' : 'Invitation no longer available'}</p>
                </article>
              )) : <Empty title="No earlier invitation outcomes." body="Accepted, expired, or ended invitations will stay here as history." />}
            </PeopleSection>
          </>
        )}
      </div>
    </main>
  );
}

function PeopleSection({ count, eyebrow, title, children }: { count: number; eyebrow: string; title: string; children: React.ReactNode }) {
  return <section className={styles.section}><div className={styles.sectionHeading}><div><p>{eyebrow}</p><h2>{title}</h2></div><span>{count}</span></div><div className={styles.list}>{children}</div></section>;
}

function Empty({ title, body }: { title: string; body: string }) {
  return <div className={styles.empty} role="status"><strong>{title}</strong><p>{body}</p></div>;
}

function Closed({ title, body, href, action }: { title: string; body: string; href: string; action: string }) {
  return <main className={styles.closed} id="main-content"><p>FAMILY / PEOPLE</p><h1>{title}</h1><span>{body}</span><Link href={href}>{action}</Link></main>;
}
