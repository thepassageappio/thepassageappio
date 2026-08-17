import Link from 'next/link';
import { ContinuityRail, TopShell } from '@/components/core';
import { continuity, demoCase } from '@/lib/demo';

export const metadata = { title: 'How Passage works' };

// This page is deliberately illustrative only -- it used to link each
// persona card straight into the real, authenticated /director, /staff,
// /family, /receive routes, which meant an anonymous visitor clicking
// "OPEN" just landed on a login wall. Removed rather than left as a
// broken promise. A real interactive/no-login demo environment is
// tracked separately (see docs/product/operational-readiness-roadmap.md,
// Phase K) rather than faked here.
export default function DemoWalkthroughPage() {
  return (
    <TopShell context="How Passage works" mode="gateway">
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
              <p>This example case, Sofia Rivera&apos;s family at Northstar Funeral Home, shows how one handoff moves cleanly between the family, the accountable director, the assigned staff member, and a receiving director, instead of the family repeating the same details four times.</p>
            </div>
          </div>
          <div className="gateway__case" aria-label="Example case">
            <span>EXAMPLE CASE</span>
            <strong>{demoCase.person}</strong>
            <small>{demoCase.id} · Last aligned {demoCase.lastSync}</small>
          </div>
        </section>

        <section className="gateway__continuity">
          <div className="continuity-context">
            <span>THE FAMILY CHOOSES WHAT MOVES.</span>
            <div><strong>04</strong><p>clear handoffs<small>One approved set of details, not four repeated intakes.</small></p></div>
          </div>
          <ContinuityRail steps={continuity} label={`${demoCase.person} · ${demoCase.id}`} />
        </section>

        <section className="gateway__continuity" style={{ paddingTop: 0 }}>
          <div className="continuity-context">
            <span>SEE IT LIVE</span>
            <div><p>Want to see the real product, not a mockup?<small>Talk to us for a live walkthrough, or set up your funeral home directly.</small></p></div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link className="top-shell__navPrimary" href="/contact?category=demo" style={{ textDecoration: 'none' }}>Book a live walkthrough</Link>
            <Link className="top-shell__navSignIn" href="/organization/start" style={{ textDecoration: 'none' }}>Set up your funeral home</Link>
          </div>
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
