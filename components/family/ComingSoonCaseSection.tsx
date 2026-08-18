import Link from 'next/link';
import { CaseNav, type FamilyCaseSegment } from './CaseNav';
import { humanizePreviewLabel } from '@/lib/presentation/plain-language';
import styles from '../../app/proof-loop.module.css';

// A bookmarked or typed URL to a disabled CaseNav segment (Decisions,
// Service, Costs) previously hit Next.js's bare framework 404 instead of a
// branded page -- confusing and demo-breaking if a family member or
// director ever lands here directly, even though the nav itself never
// links to it (found in the 2026-08-17 full UX audit). This gives each
// disabled segment a real, on-brand "not built yet" page instead.
export function ComingSoonCaseSection({ caseId, segment, personName, label }: { caseId: string; segment: FamilyCaseSegment; personName: string | null; label: string }) {
  return (
    <main id="main-content">
      <CaseNav active={segment} caseId={caseId} />
      <header className={styles.hero}>
        <div>
          <p>NOT AVAILABLE YET</p>
          <h1>{label} isn&apos;t built yet.</h1>
          <span>{humanizePreviewLabel(personName ?? '', 'Your family record')} · nothing here yet, nothing lost</span>
        </div>
      </header>
      <section className={styles.panel} aria-labelledby="coming-soon-heading">
        <p className={styles.eyebrow}>What this will be</p>
        <h2 id="coming-soon-heading">Passage doesn&apos;t have {label.toLowerCase()} tracking here yet.</h2>
        <p>Nothing was lost or misconfigured — this part of the case just hasn&apos;t been built. Today, Tasks, and Messages are fully working.</p>
        <p><Link href={`/case/${caseId}/today`}>← Back to Today</Link></p>
      </section>
    </main>
  );
}
