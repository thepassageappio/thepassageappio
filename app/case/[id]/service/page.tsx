import { redirect } from 'next/navigation';
import Link from 'next/link';
import { loadFamilyCaseView, type FamilyCaseViewResult } from '@/lib/family/case-view';
import { loginPath } from '@/lib/auth/redirects';
import { ComingSoonCaseSection } from '@/components/family/ComingSoonCaseSection';
import styles from '../../../proof-loop.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function FamilyCaseServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result: FamilyCaseViewResult = await loadFamilyCaseView(id);
  if (!result.ok) {
    if (result.reason === 'signed-out') redirect(loginPath(`/case/${id}/service`));
    return <Closed reason={result.reason} />;
  }
  return <ComingSoonCaseSection caseId={id} label="Service" personName={result.data.workflow.personName} segment="service" />;
}

function Closed({ reason }: { reason: 'not-found' | 'not-authorized' | 'unavailable' }) {
  const message = reason === 'not-authorized'
    ? 'This case is not available to your account.'
    : reason === 'not-found'
      ? 'This case could not be found.'
      : 'Passage could not open this case right now.';
  return (
    <main className={styles.closed} id="main-content">
      <h1>{message}</h1>
      <p>Nothing changed, and no case details were shown. Ask the funeral home for a new link, or try again.</p>
      <Link href="/">Return home</Link>
    </main>
  );
}
