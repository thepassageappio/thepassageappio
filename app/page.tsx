import Link from 'next/link';
import { ContinuityRail, TopShell } from '@/components/core';
import { continuity, demoCase, personas } from '@/lib/demo';
import { startPreviewDemo } from './demo/actions';

export default async function DemoGateway({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const { demo } = await searchParams;
  return (
    <TopShell context="A calmer way to coordinate" mode="gateway">
      <main id="main-content" className="gateway">
        <section className="gateway__intro" aria-labelledby="gateway-title">
          <div className="gateway__status">
            <span className="gateway__edition">PASSAGE PREVIEW WORKSPACE</span>
            <span className="gateway__sync"><i aria-hidden="true" />Synthetic information only</span>
          </div>
          <div className="gateway__heading">
            <p>Less repetition. More certainty.</p>
            <h1 id="gateway-title">Everyone knows<br />what happens next.</h1>
            <div className="gateway__promise">
              <span className="promise-line" aria-hidden="true" />
              <p>Families ask for help once. Funeral homes, staff, and vendors each see the work that belongs to them.</p>
            </div>
          </div>
          <div className="gateway__case" aria-label="Preview story">
            <span>WHAT YOU CAN TRY</span>
            <strong>{demoCase.person}</strong>
            <small>{demoCase.location} · {demoCase.lastSync}</small>
          </div>
        </section>

        <section className="journey" aria-labelledby="journey-title">
          <header className="journey__header">
            <span id="journey-title">CHOOSE A POINT OF VIEW</span>
            <p>Work demos use synthetic records. Family help requires a Preview account before saving. Use made-up details only; no messages are sent.</p>
          </header>
          {demo === 'unavailable' && <p className="gateway__notice" role="alert">That demo session is not available in this environment. Choose family help or try the Preview again later.</p>}

          <div className="journey__line" aria-hidden="true">
            <span /><i /><i /><i /><i /><span />
          </div>

          <ol className="persona-flow">
            {personas.map((persona) => (
              <li className={`persona persona--${persona.state}`} key={persona.id}>
                {persona.href ? (
                  <Link href={persona.href}>
                    <PersonaContents persona={persona} actionLabel="START" />
                  </Link>
                ) : (
                  <form action={startPreviewDemo}>
                    <input name="persona" type="hidden" value={persona.demoPersona} />
                    <button type="submit"><PersonaContents persona={persona} actionLabel="OPEN DEMO" /></button>
                  </form>
                )}
              </li>
            ))}
          </ol>
        </section>

        <section className="gateway__continuity">
          <div className="continuity-context">
            <span>THE FAMILY CHOOSES WHAT MOVES.</span>
            <div><strong>04</strong><p>clear handoffs<small>One approved set of details, not four repeated intakes.</small></p></div>
          </div>
          <ContinuityRail steps={continuity} label="How help moves" />
        </section>

        <footer className="gateway__footer">
          <span>PASSAGE PREVIEW WORKSPACE</span>
          <p>Preview only. Use made-up details. No messages are sent.</p>
          <span>PASSAGE · 2026</span>
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
