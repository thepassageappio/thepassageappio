import { redirect } from 'next/navigation';
import Link from 'next/link';
import { loadFamilyCaseView, type FamilyCaseView, type FamilyCaseViewResult } from '@/lib/family/case-view';
import { loginPath } from '@/lib/auth/redirects';
import { humanTaskStatus, humanWorkflowPhase, humanizePreviewLabel } from '@/lib/presentation/plain-language';
import { CaseNav } from '@/components/family/CaseNav';
import styles from '../../../proof-loop.module.css';
import overviewStyles from '../../CaseOverview.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function FamilyCaseTodayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result: FamilyCaseViewResult = await loadFamilyCaseView(id);
  if (!result.ok) {
    if (result.reason === 'signed-out') redirect(loginPath(`/case/${id}/today`));
    return <Closed reason={result.reason} />;
  }
  const { workflow, currentTask, recentUpdates } = result.data;
  if (workflow.isPlanning) return <PlanningToday caseId={id} data={result.data} />;

  return (
    <main id="main-content">
      <CaseNav active="today" caseId={id} />
      <header className={styles.hero}>
        <div>
          <p>{humanWorkflowPhase(workflow.phase)}</p>
          <h1>{humanizePreviewLabel(workflow.personName ?? '', 'Your family record')}</h1>
          <span>{humanizePreviewLabel(workflow.familyName ?? '', 'Your family')} · what's happening now</span>
        </div>
        {currentTask && <strong className={styles.status} data-state={currentTask.status}>{humanTaskStatus(currentTask.status)}</strong>}
      </header>
      <section className={styles.panel} aria-labelledby="now-heading">
        <p className={styles.eyebrow}>Now</p>
        <h2 id="now-heading">{currentTask ? humanizePreviewLabel(currentTask.title ?? '', 'Current step') : 'Nothing needs your attention right now.'}</h2>
        <p>{currentTask?.lastUpdateSummary ?? 'Passage will show the next update here as soon as there is one.'}</p>
        {currentTask && <p>{currentTask.ownerLabel} is on this.</p>}
      </section>
      <section className={styles.panel} aria-labelledby="updates-heading" style={{ marginTop: 18 }}>
        <p className={styles.eyebrow}>Recent updates</p>
        <h2 id="updates-heading">What's changed.</h2>
        {recentUpdates.length === 0 ? <p>No updates yet.</p> : (
          <ol className={styles.history}>
            {recentUpdates.map((update) => <li key={update.id}><p>{update.summary}</p></li>)}
          </ol>
        )}
      </section>
    </main>
  );
}

function PlanningToday({ caseId, data }: { caseId: string; data: FamilyCaseView }) {
  const { workflow, currentTask, recentUpdates } = data;
  const person = humanizePreviewLabel(workflow.personName ?? '', 'Your plan');

  return (
    <main className={overviewStyles.shell} id="main-content">
      <div className={overviewStyles.detailPage}>
        <CaseNav active="today" caseId={caseId} planning />
        <header className={`${overviewStyles.detailHero} ${overviewStyles.planningDetailHero}`}>
          <div>
            <p className={overviewStyles.eyebrow}>PLANNING AHEAD</p>
            <h1>{person}</h1>
            <p>Your private plan for the people who may need it later.</p>
          </div>
          <strong>PLANNING IN PROGRESS</strong>
        </header>

        <section className={overviewStyles.nextStep} aria-labelledby="planning-next-heading">
          <p className={overviewStyles.eyebrow}>YOUR NEXT STEP</p>
          <h2 id="planning-next-heading">{currentTask ? humanizePreviewLabel(currentTask.title ?? '', 'Continue your checklist') : 'Your checklist is up to date.'}</h2>
          <p>{currentTask ? 'Work through this at your own pace. Nothing is shared unless you choose to invite someone.' : 'You can review completed steps or add something else you want your family to know.'}</p>
          <Link className={overviewStyles.planningAction} href={`/case/${caseId}/tasks`}>{currentTask ? 'Open planning checklist' : 'Review your checklist'}</Link>
        </section>

        <div className={overviewStyles.detailGrid}>
          <section className={overviewStyles.detailPanel} aria-labelledby="privacy-heading">
            <p className={overviewStyles.eyebrow}>WHO CAN SEE THIS</p>
            <h2 id="privacy-heading">You control this plan.</h2>
            <p className={overviewStyles.panelCopy}>Only you and people you deliberately invite can see it. Return to Your plans when you want to invite a trusted person.</p>
            <Link className={overviewStyles.inlineAction} href="/case">Manage people and plans →</Link>
          </section>

          <section className={overviewStyles.detailPanel} aria-labelledby="planning-updates-heading">
            <p className={overviewStyles.eyebrow}>SAVED ACTIVITY</p>
            <h2 id="planning-updates-heading">What changed</h2>
            {recentUpdates.length === 0 ? <p className={overviewStyles.panelCopy}>No saved changes yet.</p> : (
              <ol className={overviewStyles.receiptList}>
                {recentUpdates.map((update) => <li key={update.id}><strong>{update.summary}</strong></li>)}
              </ol>
            )}
          </section>
        </div>
      </div>
    </main>
  );
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
