import Link from 'next/link';
import { ContinuityRail, TopShell } from '@/components/core';
import { continuity, demoCase, personas } from '@/lib/demo';

export const metadata = { title: 'Interactive walkthrough' };

export default function DemoWalkthroughPage() {
  return (
    <TopShell context="Interactive walkthrough" mode="gateway">
      <main id="main-content" className="gateway">
        <section className="gateway__intro" aria-labelledby="gateway-title">
          <div className="gateway__status">
            <span className="gateway__edition">WALKTHROUGH</span>
            <span className="gateway__sync"><i aria-hidden="true" />Example case shown below</span>
          </div>
          <div className="gateway__heading">
            <p>One case, four points of view</p>
            <h1 id="gateway-title">See how a handoff moves<br />through Passage.</h1>
            <div className="gateway__promise">
              <span className="promise-line" aria-hidden="true" />
              <p>These four cards are the same example case, Sofia Rivera&apos;s family at Northstar Funeral Home, seen from each person&apos;s side. Elena Torres, the case director, appears twice on purpose: once owning the case, once demonstrating what she&apos;d see receiving a separate handoff.</p>
            </div>
          </div>
          <div className="gateway__case" aria-label="Example case">
            <span>EXAMPLE CASE</span>
            <strong>{demoCase.person}</strong>
            <small>{demoCase.id} · Last aligned {demoCase.lastSync}</small>
          </div>
        </section>

        <section className="journey" aria-labelledby="journey-title">
          <header className="journey__header">
            <span id="journey-title">CHOOSE A POINT OF VIEW</span>
            <p>No real case is created and nobody is contacted.</p>
          </header>

          <div className="journey__line" aria-hidden="true">
            <span /><i /><i /><i /><i /><span />
          </div>

          <ol className="persona-flow">
            {personas.map((persona) => (
              <li className={`persona persona--${persona.state}`} key={persona.id}>
                <Link href={persona.href}>
                  <span className="persona__number">{persona.order}</span>
                  <span className="persona__identity"><strong>{persona.role}</strong><small>{persona.name}</small></span>
                  <span className="persona__action"><b>{persona.action}</b><small>{persona.detail}</small></span>
                  <span className="persona__enter">OPEN <i aria-hidden="true">↗</i></span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section className="gateway__continuity">
          <div className="continuity-context">
            <span>THE FAMILY CHOOSES WHAT MOVES.</span>
            <div><strong>04</strong><p>clear handoffs<small>One approved set of details, not four repeated intakes.</small></p></div>
          </div>
          <ContinuityRail steps={continuity} label={`${demoCase.person} · ${demoCase.id}`} />
        </section>

        <footer className="gateway__footer">
          <span>PASSAGE</span>
          <p>Purpose-built for the people carrying the details.</p>
          <span><Link href="/">Back to passage home</Link></span>
        </footer>
      </main>
    </TopShell>
  );
}
