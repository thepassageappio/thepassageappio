import Link from 'next/link';
import { ContinuityRail, TopShell } from '@/components/core';
import { continuity, demoCase, personas } from '@/lib/demo';

export default function DemoGateway() {
  return (
    <TopShell context="Unified case network" mode="gateway">
      <main id="main-content" className="gateway">
        <section className="gateway__intro" aria-labelledby="gateway-title">
          <div className="gateway__status">
            <span className="gateway__edition">PASSAGE PREVIEW</span>
            <span className="gateway__sync"><i aria-hidden="true" />Sample information only</span>
          </div>
          <div className="gateway__heading">
            <p>Keep the next step clear</p>
            <h1 id="gateway-title">Keep your family and care team<br />on the same page.</h1>
            <div className="gateway__promise">
              <span className="promise-line" aria-hidden="true" />
              <p>Passage carries approved details and next steps between the people helping, so families repeat less.</p>
            </div>
          </div>
          <div className="gateway__case" aria-label="Demo case">
            <span>PREVIEW EXAMPLE</span>
            <strong>{demoCase.person}</strong>
            <small>{demoCase.id} · Last aligned {demoCase.lastSync}</small>
          </div>
        </section>

        <section className="journey" aria-labelledby="journey-title">
          <header className="journey__header">
            <span id="journey-title">CHOOSE WHAT YOU NEED TODAY</span>
            <p>Preview one point of view. No real case is created and nobody is contacted.</p>
          </header>

          <div className="journey__line" aria-hidden="true">
            <span /><i /><i /><i /><i /><span />
          </div>

          <ol className="persona-flow">
            {personas.map((persona) => (
              <li className={`persona persona--${persona.state}`} key={persona.id}>
                <Link href={persona.href}>
                  <span className="persona__number">{persona.order}</span>
                  <span className="persona__identity"><strong>{persona.name}</strong><small>{persona.role}</small></span>
                  <span className="persona__action"><b>{persona.action}</b><small>{persona.detail}</small></span>
                  <span className="persona__enter">PREVIEW <i aria-hidden="true">↗</i></span>
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
          <span>PASSAGE PREVIEW</span>
          <p>Purpose-built for the people carrying the details.</p>
          <span>WARM PRECISION · 2026</span>
        </footer>
      </main>
    </TopShell>
  );
}
