// Passage — public homepage preview (Cycle 5). Uses BrandHero + CalmControls.
// Self-contained; safe to deploy at /preview/home.
import Head from 'next/head';
import { DS, SANS } from '../../lib/designSystem';
import { Button, Card } from '../../components/calm/CalmControls';
import BrandHero from '../../components/calm/BrandHero';

export default function HomePreview() {
  return (
    <>
      <Head><title>Passage</title><meta name="robots" content="noindex" /></Head>
      <div style={{ minHeight: '100vh', background: DS.color.page, fontFamily: SANS }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 22px', borderBottom: `1px solid ${DS.color.hair}`, background: DS.color.cream }}>
          <span style={{ fontWeight: 500, color: DS.color.sageDeep, fontSize: 16 }}>passage</span>
        </div>
        <div style={{ padding: '48px 20px 30px' }}>
          <BrandHero>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button variant="primary">Someone just died — start here</Button>
              <Button variant="secondary">For funeral homes</Button>
            </div>
          </BrandHero>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, maxWidth: 620, margin: '34px auto 0' }}>
            <Card><div style={{ fontWeight: 500, marginBottom: 3 }}>One next step</div><div style={{ fontSize: 13, color: DS.color.mid, lineHeight: 1.45 }}>Never a wall of tasks. Just what needs you now.</div></Card>
            <Card><div style={{ fontWeight: 500, marginBottom: 3 }}>We prepare it</div><div style={{ fontSize: 13, color: DS.color.mid, lineHeight: 1.45 }}>Calls, forms, messages — drafted for you.</div></Card>
            <Card><div style={{ fontWeight: 500, marginBottom: 3 }}>Everyone in sync</div><div style={{ fontSize: 13, color: DS.color.mid, lineHeight: 1.45 }}>Family and funeral home, one shared record.</div></Card>
          </div>
        </div>
      </div>
    </>
  );
}
