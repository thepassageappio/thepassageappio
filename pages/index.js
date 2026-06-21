import HomeCalm from '../components/HomeCalm'

// Public marketing homepage. The calm family app lives at /today (see
// docs/site-migration-plan.md). Do NOT repurpose this public route for an
// authed surface — that regression was reverted 2026-06-20.
export default function Home() {
  return <HomeCalm />
}
