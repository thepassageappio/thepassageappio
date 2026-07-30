import { ContinuityRail } from '@/components/core/ContinuityRail';
import { GatewayPersonaFlow } from '@/components/core/GatewayPersonaFlow';
import { TopShell } from '@/components/core/TopShell';
import { continuity, demoCase, personas } from '@/lib/demo';

export default function DemoGateway() {
  return (
    <TopShell context="Unified case network" mode="gateway">
      <main id="main-content" className="gateway">
        <section className="gateway__intro" aria-labelledby="gateway-title">
          <div className="gateway__status">
            <span className="gateway__edition">PASSAGE PREVIEW</span>
            <span className="gateway__sync"><i aria-hidden="true" />No real case is shown here</span>
          </div>
          <div className="gateway__heading">
            <p>Keep the next step clear</p>
            <h1 id="gateway-title">Keep your family and care team<br />on the same page.</h1>
            <div className="gateway__promise">
              <span className="promise-line" aria-hidden="true" />
              <p>Passage carries approved details and next steps between the people helping, so families repeat less.</p>
            </div>
          </div>
          <div className="gateway__case" aria-label="Fictional family example">
            <span>FICTIONAL FAMILY EXAMPLE</span>
            <strong>{demoCase.person}</strong>
            <small>Sample journey · no real case created</small>
          </div>
        </section>

        <section className="journey" aria-labelledby="journey-title">
          <header className="journey__header">
            <span id="journey-title">CHOOSE A SAMPLE OR SECURE WORKSPACE</span>
            <p>Family and receiving-director samples use fictional information; their actions may save only in this browser and contact nobody. Director and staff options open secure sign-in for authorized team members. If access fails, use your invitation or ask your funeral-home administrator.</p>
          </header>

          <div className="journey__line" aria-hidden="true">
            <span /><i /><i /><i /><i /><span />
          </div>

          <GatewayPersonaFlow personas={personas} />
        </section>

        <section className="gateway__continuity">
          <div className="continuity-context">
            <span>ONE FICTIONAL JOURNEY</span>
            <div><strong>04</strong><p>clear handoffs<small>One approved set of details, not four repeated intakes.</small></p></div>
          </div>
          <ContinuityRail steps={continuity} label={`${demoCase.person} · sample journey`} status="SAMPLE" />
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
