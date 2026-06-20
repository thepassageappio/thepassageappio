import AppCalm from '../components/AppCalm'

// Calm family app (signed-in Family Today; signed-out shows calm sign-in).
// Its own authed route so the public homepage at / stays the full site.
export default function Today() {
  return <AppCalm />
}
