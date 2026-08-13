import type { Metadata } from 'next';
import Link from 'next/link';
import { ContinuityRail, TopShell } from '@/components/core';
import { continuity, demoCase, personas } from '@/lib/demo';
import { startPreviewDemo } from './actions';
import DemoReset from './DemoReset';
import { hasConfiguredOperatorDemoSessions } from '@/lib/presentation/operator-demo-availability';
import { PassageZeroProvider } from '@/components/PassageZeroProvider';

export const metadata: Metadata = {
  title: 'Demo',
  description: 'Explore Passage with example information. No family record, message, purchase, or payment is created.',
};

export default async function DemoGateway({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const { demo } = await searchParams;
  const operatorSessionsConfigured = hasConfiguredOperatorDemoSessions();
  const demoError = {
    configuration: 'The shared team demo is not configured here. No team session opened and no record changed. Try the family demo or return later.',
    credentials: 'The shared team demo sign-in is unavailable. No team session opened and no record changed. Try the family demo or return later.',
    signout: 'Passage could not safely close the earlier demo session, so no new team session opened. Try again or use the family demo.',
    signin: 'The shared team demo could not sign in. No team session opened and no record changed. Try again or use the family demo.',
    identity: 'Passage could not verify the shared team demo account. The session was closed and no record changed. Try again or use the family demo.',
  }[demo ?? ''];
  return (
    <TopShell context="Example workspace" mode="gateway" operatorSessionsConfigured={operatorSessionsConfigured}>
      <main id="main-content" className="gateway">
        <section className="gateway__intro" aria-labelledby="gateway-title">
          <div className="gateway__status">
            <span className="gateway__edition">PASSAGE DEMO</span>
            <span className="gateway__sync"><i aria-hidden="true" />Example information only</span>
          </div>
          <div className="gateway__heading">
            <p>See how each person knows what to do.</p>
            <h1 id="gateway-title">Everyone knows<br />what happens next.</h1>
            <div className="gateway__promise">
              <span className="promise-line" aria-hidden="true" />
              <p>Families ask for help once. Funeral homes, staff, and vendors each see the work that belongs to them.</p>
            </div>
          </div>
          <div className="gateway__case" aria-label="Example story">
            <span>WHAT YOU CAN TRY</span>
            <strong>{demoCase.person}</strong>
            <small>{demoCase.location} · {demoCase.lastSync}</small>
          </div>
        </section>

        <section className="journey" aria-labelledby="journey-title">
          <header className="journey__header">
            <span id="journey-title">CHOOSE A POINT OF VIEW</span>
            <p>This demo uses example information. It does not create family records, send messages, make purchases, or process payments.</p>
          </header>
          {demoError && <p className="gateway__notice" role="alert">{demoError}</p>}
          <div className="journey__line" aria-hidden="true"><span /><i /><i /><i /><i /><span /></div>
          <div className="journey__public-exit" aria-label="Family browser example">
            <span>SEPARATE FAMILY EXAMPLE</span>
            <Link href="/demo/family"><PersonaContents persona={personas[0]} actionLabel="START" /></Link>
          </div>
          <h2 className="journey__operator-title">Guided operator examples</h2>
          <ol className="persona-flow persona-flow--operators">
            {personas.slice(1).map((persona) => (
              <li className={`persona persona--${persona.state}`} key={persona.id}>
                <form action={startPreviewDemo}>
                  <input name="persona" type="hidden" value={persona.demoPersona} />
                  <button type="submit"><PersonaContents persona={persona} actionLabel="OPEN DEMO" /></button>
                </form>
              </li>
            ))}
          </ol>
        </section>
        <section className="gateway__help" aria-labelledby="real-help-title">
          <div><p>NEED REAL HELP?</p><h2 id="real-help-title">Tell us what is happening now.</h2></div>
          <p>The real help path is separate from this example. It explains when sign-in is required before anything is saved or sent.</p>
          <Link href="/start">Get help now</Link>
        </section>
        <PassageZeroProvider><DemoReset operatorSessionsConfigured={operatorSessionsConfigured} /></PassageZeroProvider>
        <section className="gateway__continuity">
          <div className="continuity-context">
            <span>THE FAMILY CHOOSES WHAT MOVES.</span>
            <div><strong>04</strong><p>clear handoffs<small>One approved set of details, not four repeated intakes.</small></p></div>
          </div>
          <ContinuityRail steps={continuity} label="How help moves" />
        </section>
        <footer className="gateway__footer">
          <span>PASSAGE DEMO</span>
          <p>Example information only. Nothing here creates records, sends messages, makes purchases, or processes payments.</p>
          <Link href="/">RETURN TO PASSAGE</Link>
        </footer>
      </main>
    </TopShell>
  );
}

function PersonaContents({ actionLabel, persona }: { actionLabel: string; persona: (typeof personas)[number] }) {
  return (
    <>
      <span className="persona__number">{persona.order}</span>
      <span className="persona__identity"><strong>{persona.name}</strong><small>{persona.role}</small></span>
      <span className="persona__action"><b>{persona.action}</b><small>{persona.detail}</small></span>
      <span className="persona__enter">{actionLabel} <i aria-hidden="true">→</i></span>
    </>
  );
}
