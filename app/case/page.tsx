import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { verifiedUser } from '@/lib/auth/session';
import { loginPath } from '@/lib/auth/redirects';
import { createPassageServerClient } from '@/lib/supabase/server';
import { CreateEstateForm, InviteAcrossHouseholdForm } from './EstateActions';
import styles from '../login/Auth.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type WorkflowRow = { id: string; person_name: string | null; phase: string | null; status: string; seat_index: number | null };

// Landing point for a D2C subscriber: the redirectTo target of the invite
// email sent by provisionD2cFamilyRecordIfNeeded, and the link
// /pricing/success points to. A plain Individual subscriber (the common
// case) is sent straight to their one estate with zero extra screens -- no
// duplicative step just because multi-estate support now exists. A
// Couple/Family subscriber (more than one estate slot, whether or not
// they've used it yet) sees this list instead, so the plan they paid for
// is actually discoverable on first login rather than silently limited to
// the one estate auto-provisioned at checkout.
export default async function CaseIndexPage() {
  const client = await createPassageServerClient();
  if (!client) redirect('/');
  const user = await verifiedUser(client);
  if (!user) redirect(loginPath('/case'));

  const [{ data: workflowsData }, { data: slotsData }] = await Promise.all([
    client.from('workflows').select('id, person_name, phase, status, seat_index').eq('user_id', user.id).order('seat_index', { ascending: true, nullsFirst: true }),
    client.rpc('active_estate_slots'),
  ]);
  const workflows = (workflowsData ?? []) as WorkflowRow[];
  const slots = typeof slotsData === 'number' ? slotsData : 1;

  if (workflows.length === 0) redirect('/case/start');
  if (workflows.length === 1 && slots <= 1) redirect(`/case/${workflows[0].id}/today`);

  const canAddAnother = workflows.length < slots;

  return (
    <main className={styles.shell} id="main-content">
      <header className={styles.brandBar}>
        <Link href="/">PASSAGE</Link>
        <nav aria-label="Account" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/account/billing">Account</Link>
          <form action="/auth/signout" method="post">
            <button style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }} type="submit">Sign out</button>
          </form>
        </nav>
      </header>
      <section className={styles.panel} aria-labelledby="estates-title">
        <p className={styles.eyebrow}>YOUR ESTATES</p>
        <h1 id="estates-title">Your plan includes {slots} estate{slots === 1 ? '' : 's'}.</h1>
        <p className={styles.lede}>Each estate tracks one person&apos;s planning separately. Invite a spouse or family member to see any of them — they view, they don&apos;t need their own plan.</p>

        <ul style={{ listStyle: 'none', margin: '0 0 28px', padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {workflows.map((workflow) => (
            <li key={workflow.id} style={{ border: '1px solid var(--line, #ddd)', borderRadius: 8, padding: 16 }}>
              <strong style={{ display: 'block', marginBottom: 4 }}>{workflow.person_name || 'Untitled estate'}</strong>
              <span style={{ display: 'block', marginBottom: 12, fontSize: 13, opacity: 0.75 }}>{workflow.phase || workflow.status}</span>
              <Link className={styles.textLink} href={`/case/${workflow.id}/today`}>Open →</Link>
            </li>
          ))}
        </ul>

        {canAddAnother ? (
          <CreateEstateForm requestId={randomUUID()} />
        ) : (
          <p className={styles.notice} role="status">You&apos;re using all {slots} estate{slots === 1 ? '' : 's'} on your plan. <Link className={styles.textLink} href="/pricing">Upgrade</Link> to add another.</p>
        )}

        <div style={{ marginTop: 28 }}>
          <InviteAcrossHouseholdForm estates={workflows.map((workflow) => ({ workflowId: workflow.id, personLabel: workflow.person_name || 'this estate', requestId: randomUUID() }))} />
        </div>
      </section>
    </main>
  );
}
