import Link from 'next/link';

// Previously copy-pasted verbatim across today/tasks/messages pages -- three
// places that had to be kept in sync by hand every time a segment's
// `available` flag changed. One shared source now.
const FAMILY_NAV = [
  { segment: 'today', label: 'Today', available: true },
  { segment: 'decisions', label: 'Decisions', available: false },
  { segment: 'tasks', label: 'Tasks', available: true },
  { segment: 'messages', label: 'Messages', available: true },
  { segment: 'service', label: 'Service', available: false },
  { segment: 'costs', label: 'Costs', available: false },
] as const;

export type FamilyCaseSegment = (typeof FAMILY_NAV)[number]['segment'];

// Previously there was no way to reach account/billing or sign out from
// anywhere in the family surface once signed in -- TopShell (used by
// /account/billing itself) is unauthenticated-aware only and always shows
// "Sign in"/"Get started", and AppFrame's sign-out affordance only covers
// the director/staff/vendor personas. A signed-in family owner had to type
// a URL directly to reach billing, or clear cookies to sign out.
export function CaseNav({ caseId, active }: { caseId: string; active: FamilyCaseSegment }) {
  return (
    <nav aria-label="Your case" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginBottom: 20 }}>
      {FAMILY_NAV.map((item) => (
        item.available
          ? <Link key={item.segment} aria-current={item.segment === active ? 'page' : undefined} href={`/case/${caseId}/${item.segment}`} style={{ padding: '10px 14px', fontWeight: 780, fontSize: 13, minHeight: 40, display: 'inline-flex', alignItems: 'center' }}>{item.label}</Link>
          : <span key={item.segment} aria-disabled="true" style={{ padding: '10px 14px', fontWeight: 780, fontSize: 13, color: 'var(--muted)', minHeight: 40, display: 'inline-flex', alignItems: 'center' }} title="Not available yet">{item.label}</span>
      ))}
      <Link href="/case" style={{ padding: '10px 14px', fontWeight: 780, fontSize: 13, minHeight: 40, display: 'inline-flex', alignItems: 'center' }}>Your estates</Link>
      <Link href="/account/billing" style={{ padding: '10px 14px', fontWeight: 780, fontSize: 13, minHeight: 40, display: 'inline-flex', alignItems: 'center' }}>Plan &amp; billing</Link>
      <form action="/auth/signout" method="post" style={{ marginLeft: 'auto' }}>
        <button style={{ padding: '10px 14px', fontWeight: 780, fontSize: 13, minHeight: 40, background: 'none', border: 'none', cursor: 'pointer' }} type="submit">Sign out</button>
      </form>
    </nav>
  );
}
