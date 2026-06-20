import { useEffect, useState } from 'react';
import { DS, TYPE, SANS } from '../lib/designSystem';
import { supabase } from '../lib/supabaseBrowser';
import { Banner, Button, Card, Field, Input } from './calm/CalmControls';
import FamilyTodayApp from './family/FamilyTodayApp';
import LegacyApp from './App';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');

function useSession() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data?.session || null);
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setSession(null);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
      setLoading(false);
    });
    return () => {
      active = false;
      data?.subscription?.unsubscribe?.();
    };
  }, []);

  return { loading, session };
}

function EmailLinkForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const sendLink = async () => {
    const clean = email.trim();
    if (!clean || !clean.includes('@')) {
      setError('Enter an email address first.');
      return;
    }
    setSending(true);
    setError('');
    setSent(false);
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: clean,
      options: { emailRedirectTo: `${SITE_URL}/` },
    });
    setSending(false);
    if (authError) {
      setError(authError.message || 'Passage could not send that link.');
      return;
    }
    setSent(true);
  };

  return (
    <div style={{ display: 'grid', gap: 9 }}>
      <Field label="Secure email link">
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 8 }}>
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
          <Button disabled={sending} onClick={sendLink}>{sending ? 'Sending' : 'Send link'}</Button>
        </div>
      </Field>
      {sent && <Banner tone="success">Check {email.trim()} to continue.</Banner>}
      {error && <Banner tone="danger">{error}</Banner>}
    </div>
  );
}

function Landing({ loading }) {
  const startGoogle = () => {
    window.location.assign('/auth/google?next=' + encodeURIComponent('/'));
  };

  return (
    <main style={{ minHeight: '100vh', background: DS.color.page, color: DS.color.ink, fontFamily: SANS }}>
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '22px 18px 44px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, marginBottom: 42 }}>
          <a href="/" style={{ color: DS.color.sageDeep, textDecoration: 'none', fontWeight: 700, letterSpacing: '.01em' }}>Passage</a>
          <nav aria-label="Primary" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <a href="/funeral-home" style={{ color: DS.color.mid, textDecoration: 'none', fontSize: 13 }}>For funeral homes</a>
            <a href="/urgent" style={{ color: DS.color.mid, textDecoration: 'none', fontSize: 13 }}>Urgent help</a>
            <Button variant="secondary" onClick={startGoogle}>Sign in</Button>
          </nav>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(280px, .95fr)', gap: 24, alignItems: 'start' }}>
          <div style={{ paddingTop: 16 }}>
            <p style={{ ...TYPE.label, color: DS.color.sageDeep, margin: '0 0 12px' }}>Family coordination, without the scramble</p>
            <h1 style={{ fontSize: 42, lineHeight: 1.05, letterSpacing: 0, fontWeight: 650, margin: '0 0 16px', maxWidth: 720 }}>The operating system for life&apos;s hardest logistics.</h1>
            <p style={{ ...TYPE.body, fontSize: 17, color: DS.color.mid, maxWidth: 650, margin: '0 0 22px' }}>
              Passage keeps the next step, the owner, what is waiting, and what has been saved in one calm family record.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              <Button onClick={startGoogle}>Open your family record</Button>
              <Button variant="secondary" onClick={() => window.location.assign('/urgent')}>Get first-hour help</Button>
            </div>
            {loading && <p style={{ ...TYPE.small, color: DS.color.soft, margin: 0 }}>Checking your secure session...</p>}
          </div>

          <Card pad={18} style={{ borderRadius: DS.radius.lg }}>
            <p style={{ ...TYPE.label, color: DS.color.soft, margin: '0 0 10px' }}>Today in Passage</p>
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                ['Needs you', 'Confirm the funeral home contact', 'Passage prepared the call notes.'],
                ['Waiting on Maria', 'Photos for the service program', 'Nothing else for you to do yet.'],
                ['Done', 'Death certificate path saved', 'Saved to your family record.'],
              ].map(([status, title, body]) => (
                <div key={title} style={{ border: `1px solid ${DS.color.hair}`, borderRadius: DS.radius.md, padding: 12, background: DS.color.cream }}>
                  <p style={{ ...TYPE.micro, color: status === 'Needs you' ? '#7a4f10' : status === 'Done' ? DS.color.sageDeep : DS.color.mid, margin: '0 0 5px', fontWeight: 600 }}>{status}</p>
                  <p style={{ ...TYPE.body, color: DS.color.ink, margin: 0, fontWeight: 600 }}>{title}</p>
                  <p style={{ ...TYPE.micro, color: DS.color.mid, margin: '4px 0 0' }}>{body}</p>
                </div>
              ))}
            </div>
            <div style={{ height: 16 }} />
            <EmailLinkForm />
          </Card>
        </div>
      </section>

      <section style={{ borderTop: `1px solid ${DS.color.hair}`, background: DS.color.cream }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
          {[
            ['One next action', 'The first screen shows what needs you now, not a giant checklist.'],
            ['Prepared before sending', 'Messages and requests stay in review until a person approves them.'],
            ['Proof stays attached', 'Confirmations, notes, and waiting points stay with the family record.'],
          ].map(([title, body]) => (
            <div key={title}>
              <h2 style={{ ...TYPE.h2, color: DS.color.ink, margin: '0 0 6px' }}>{title}</h2>
              <p style={{ ...TYPE.small, color: DS.color.mid, margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default function AppCalm() {
  const { loading, session } = useSession();
  const [legacy, setLegacy] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setLegacy(new URLSearchParams(window.location.search).get('legacy') === '1');
  }, []);

  if (legacy) return <LegacyApp />;

  if (session?.user) {
    return <FamilyTodayApp user={session.user} session={session} onSignOut={async () => { await supabase.auth.signOut(); }} />;
  }

  return <Landing loading={loading} />;
}
