import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const C = {
  bg: "#f6f3ee", bgCard: "#ffffff", bgSubtle: "#f0ece5", bgSage: "#e8eeea",
  bgDark: "#1e1e1a", ink: "#1a1916", mid: "#6a6560", soft: "#a09890",
  muted: "#c5bdb5", border: "#e4ddd4", sage: "#6b8f71", sageDark: "#4a6e50",
  sageLight: "#c8deca", sageFaint: "#f0f5f1", gold: "#b8945a", goldFaint: "#faf4eb",
  rose: "#c47a7a", roseFaint: "#fdf3f3", amber: "#b07a3a",
};

const TALLY_URL = "https://tally.so/r/q4Ev05";

const saveLead = async (data) => {
  try {
    await fetch('/api/saveLead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.error('Lead save failed:', err);
  }
};

const saveProfile = async (userId, data) => {
  if (!userId) return;
  try {
    // Update user record
    await supabase.from('users').update({
      updated_at: new Date().toISOString(),
    }).eq('id', userId);

    // Upsert profile
    await supabase.from('profiles').upsert({
      user_id: userId,
      disposition: data.disposition || null,
      service_type: data.service_type || null,
      special_requests: data.special_requests || null,
      attorney_name: data.executor_name || null,
      attorney_email: data.executor_email || null,
      wishes_complete: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    // Upsert executor as a person
    if (data.executor_name && data.executor_email) {
      await supabase.from('people').upsert({
        owner_id: userId,
        first_name: data.executor_name.split(' ')[0] || data.executor_name,
        last_name: data.executor_name.split(' ').slice(1).join(' ') || '',
        email: data.executor_email,
        role: 'executor',
        notify_on_trigger: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'owner_id,email' });
    }
  } catch (err) {
    console.error('Profile save failed:', err);
  }
};

const signInWithGoogle = async () => {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: 'https://thepassageapp.io' }
  });
};

const signOut = async () => {
  await supabase.auth.signOut();
};

const Btn = ({ children, onClick, variant = "primary", disabled, style = {} }) => {
  const base = {
    border: "none", borderRadius: 14, padding: "15px 28px", fontSize: 15,
    fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit", transition: "all 0.2s", display: "inline-flex",
    alignItems: "center", justifyContent: "center", gap: 8,
    opacity: disabled ? 0.5 : 1, boxSizing: "border-box",
  };
  const variants = {
    primary: { background: C.sage, color: "#fff", boxShadow: `0 4px 20px ${C.sage}35` },
    secondary: { background: C.bgCard, color: C.ink, border: `1.5px solid ${C.border}` },
    ghost: { background: "transparent", color: C.mid, padding: "12px 20px" },
    rose: { background: C.rose, color: "#fff", boxShadow: `0 4px 20px ${C.rose}35` },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
};

const Input = ({ label, placeholder, value, onChange, type = "text", hint }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.mid,
      letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>
      {label}
    </label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width: "100%", padding: "14px 16px", borderRadius: 12, fontSize: 15,
        border: `1.5px solid ${C.border}`, background: C.bgCard, color: C.ink,
        fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
    {hint && <div style={{ fontSize: 11.5, color: C.soft, marginTop: 6 }}>{hint}</div>}
  </div>
);

const OptionCard = ({ icon, title, desc, selected, onClick }) => (
  <div onClick={onClick} style={{
    border: `2px solid ${selected ? C.sage : C.border}`,
    borderRadius: 16, padding: "18px 20px", cursor: "pointer",
    background: selected ? C.sage + "0a" : C.bgCard,
    transition: "all 0.18s", marginBottom: 10,
    display: "flex", alignItems: "flex-start", gap: 16,
  }}>
    <div style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: C.mid, lineHeight: 1.6 }}>{desc}</div>
    </div>
    <div style={{ width: 20, height: 20, borderRadius: "50%",
      border: `2px solid ${selected ? C.sage : C.muted}`,
      background: selected ? C.sage : "transparent",
      flexShrink: 0, marginTop: 2,
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      {selected && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
    </div>
  </div>
);

const ProgressBar = ({ current, total, color }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
      <div style={{ fontSize: 11, color: C.soft, fontWeight: 600,
        letterSpacing: "0.1em", textTransform: "uppercase" }}>
        Step {current} of {total}
      </div>
      <div style={{ fontSize: 11, color: color || C.sage, fontWeight: 700 }}>
        {Math.round((current / total) * 100)}% complete
      </div>
    </div>
    <div style={{ height: 4, background: C.border, borderRadius: 2 }}>
      <div style={{ height: "100%", borderRadius: 2, transition: "width 0.4s ease",
        width: `${(current / total) * 100}%`, background: color || C.sage }} />
    </div>
  </div>
);

const StepCard = ({ children, maxWidth = 520 }) => (
  <div style={{ background: C.bgCard, borderRadius: 24, padding: "36px 32px",
    maxWidth, width: "100%", margin: "0 auto",
    boxShadow: "0 2px 40px rgba(0,0,0,0.07)" }}>
    {children}
  </div>
);

const StepTitle = ({ eyebrow, title, sub }) => (
  <div style={{ marginBottom: 26 }}>
    {eyebrow && (
      <div style={{ fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase",
        color: C.sage, fontWeight: 700, marginBottom: 8 }}>{eyebrow}</div>
    )}
    <div style={{ fontFamily: "Georgia, serif", fontSize: 24, color: C.ink,
      lineHeight: 1.25, marginBottom: sub ? 10 : 0 }}>{title}</div>
    {sub && <div style={{ fontSize: 14, color: C.mid, lineHeight: 1.65 }}>{sub}</div>}
  </div>
);

const NavHeader = ({ onBack, label, user, onDashboard }) => (
  <div style={{ background: C.bgCard, borderBottom: `1px solid ${C.border}`,
    padding: "16px 24px", display: "flex", alignItems: "center",
    justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%",
        background: `radial-gradient(circle, ${C.sageLight}, ${C.sage}70)` }} />
      <span style={{ fontFamily: "Georgia, serif", fontSize: 18, color: C.ink }}>Passage</span>
    </div>
    {label && <div style={{ fontSize: 12, color: C.soft, fontWeight: 500 }}>{label}</div>}
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {user && onDashboard && (
        <button onClick={onDashboard} style={{ background: "none", border: "none",
          fontSize: 12, color: C.sage, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
          My file
        </button>
      )}
      <button onClick={onBack} style={{ background: "none", border: "none",
        fontSize: 13, color: C.soft, cursor: "pointer", fontFamily: "inherit" }}>
        ← Back
      </button>
    </div>
  </div>
);

const GoogleBtn = ({ label = "Continue with Google" }) => (
  <button onClick={signInWithGoogle} style={{
    width: "100%", padding: "13px 20px", borderRadius: 12, fontSize: 14,
    fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
    background: C.bgCard, border: `1.5px solid ${C.border}`,
    color: C.ink, display: "flex", alignItems: "center",
    justifyContent: "center", gap: 10, marginBottom: 12,
  }}>
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
    {label}
  </button>
);

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ user, onBack, onStartPlan }) {
  const [profile, setProfile] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const [{ data: u }, { data: p }] = await Promise.all([
          supabase.from('users').select('*').eq('id', user.id).single(),
          supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        ]);
        setUserData(u);
        setProfile(p);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const plan = userData?.plan || 'free';
  const planStatus = userData?.plan_status || 'active';
  const completionPct = userData?.file_completion_pct || 0;

  const planDetails = {
    free: { label: "Free Plan", color: C.soft, price: "$0", interval: "forever", next_charge: "None", renewal: "N/A" },
    monthly: { label: "Monthly Plan", color: C.sage, price: "$12", interval: "/month", next_charge: "Next month", renewal: "Monthly" },
    annual: { label: "Annual Plan", color: C.sage, price: "$79", interval: "/year", next_charge: "Next year", renewal: "Annual" },
    lifetime: { label: "Lifetime Plan", color: C.gold, price: "$249", interval: "one time", next_charge: "Never", renewal: "Never" },
  };

  const pd = planDetails[plan] || planDetails.free;

  const sections = [
    { label: "Wishes", complete: profile?.wishes_complete, icon: "📝", desc: profile?.disposition ? `${profile.disposition} · ${profile.service_type || ''}` : "Not started" },
    { label: "Accounts", complete: profile?.accounts_complete, icon: "🗂️", desc: "Map your financial accounts" },
    { label: "People", complete: profile?.people_complete, icon: "👥", desc: profile?.attorney_name ? `Executor: ${profile.attorney_name}` : "Designate your people" },
    { label: "Documents", complete: profile?.documents_complete, icon: "📄", desc: "Upload important documents" },
    { label: "Memories", complete: profile?.vault_complete, icon: "🎙️", desc: "Record voice notes & letters" },
  ];

  const completeSections = sections.filter(s => s.complete).length;
  const pct = Math.round((completeSections / sections.length) * 100);

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      {/* Nav */}
      <div style={{ background: C.bgCard, borderBottom: `1px solid ${C.border}`,
        padding: "16px 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%",
            background: `radial-gradient(circle, ${C.sageLight}, ${C.sage}70)` }} />
          <span style={{ fontFamily: "Georgia, serif", fontSize: 18, color: C.ink }}>Passage</span>
        </div>
        <div style={{ fontSize: 12, color: C.soft }}>{user?.email}</div>
        <button onClick={signOut} style={{ background: "none", border: `1px solid ${C.border}`,
          borderRadius: 8, padding: "6px 14px", fontSize: 12, color: C.mid,
          cursor: "pointer", fontFamily: "inherit" }}>
          Sign out
        </button>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 20px 80px" }}>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: C.soft }}>Loading your file...</div>
        ) : (
          <>
            {/* Welcome */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 26, color: C.ink, marginBottom: 6 }}>
                Welcome back{userData?.first_name ? `, ${userData.first_name}` : ""}.
              </div>
              <div style={{ fontSize: 14, color: C.mid }}>
                Your family is{plan === 'free' ? ' not yet protected — activate your plan to change that.' : ' protected. Your plan is active.'}
              </div>
            </div>

            {/* Subscription Card */}
            <div style={{ background: C.bgCard, borderRadius: 20, padding: "24px",
              border: `1px solid ${C.border}`, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase",
                    color: C.soft, fontWeight: 600, marginBottom: 4 }}>Current Plan</div>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 22, color: pd.color, fontWeight: 400 }}>
                    {pd.label}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: pd.color }}>{pd.price}</div>
                  <div style={{ fontSize: 11, color: C.soft }}>{pd.interval}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Status", value: planStatus === 'active' ? '✓ Active' : planStatus, color: planStatus === 'active' ? C.green : C.rose },
                  { label: "Next Charge", value: pd.next_charge },
                  { label: "Renewal", value: pd.renewal },
                ].map(item => (
                  <div key={item.label} style={{ background: C.bgSubtle, borderRadius: 12, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: C.soft, textTransform: "uppercase",
                      letterSpacing: "0.1em", fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: item.color || C.ink }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {plan === 'free' && (
                <div style={{ background: `linear-gradient(135deg, ${C.sage}15, ${C.gold}10)`,
                  border: `1px solid ${C.sageLight}`, borderRadius: 14, padding: "16px 18px" }}>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 16, color: C.ink, marginBottom: 6 }}>
                    Activate your plan
                  </div>
                  <div style={{ fontSize: 12.5, color: C.mid, marginBottom: 14, lineHeight: 1.6 }}>
                    Right now nothing will execute. Upgrade to protect your family for real.
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[
                      { id: "monthly", label: "Monthly", price: "$12/mo" },
                      { id: "annual", label: "Annual", price: "$79/yr", badge: "Best value" },
                      { id: "lifetime", label: "Lifetime", price: "$249" },
                    ].map(p => (
                      <div key={p.id} style={{ flex: 1, minWidth: 100, background: C.bgCard,
                        border: `1.5px solid ${p.id === 'annual' ? C.sage : C.border}`,
                        borderRadius: 12, padding: "10px 12px", cursor: "pointer",
                        textAlign: "center" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.ink }}>{p.label}</div>
                        {p.badge && <div style={{ fontSize: 9, color: C.sage, fontWeight: 700 }}>{p.badge}</div>}
                        <div style={{ fontSize: 13, fontWeight: 800, color: p.id === 'annual' ? C.sage : C.ink, marginTop: 2 }}>{p.price}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: C.soft, textAlign: "center", marginTop: 10 }}>
                    If your subscription lapses, the trigger freezes until you reactivate.
                  </div>
                </div>
              )}
            </div>

            {/* File Progress */}
            <div style={{ background: C.bgCard, borderRadius: 20, padding: "24px",
              border: `1px solid ${C.border}`, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: C.ink }}>Your file</div>
                <div style={{ fontSize: 13, color: C.sage, fontWeight: 700 }}>{completeSections}/{sections.length} sections complete</div>
              </div>
              <div style={{ height: 6, background: C.border, borderRadius: 3, marginBottom: 20 }}>
                <div style={{ height: "100%", borderRadius: 3, background: C.sage, width: `${pct}%`, transition: "width 0.4s ease" }} />
              </div>
              {sections.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14,
                  padding: "11px 0", borderBottom: i < sections.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%",
                    background: s.complete ? C.sageFaint : C.bgSubtle,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 16 }}>{s.complete ? "✓" : s.icon}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: s.complete ? C.sage : C.ink }}>{s.label}</div>
                    <div style={{ fontSize: 11.5, color: C.soft, marginTop: 2 }}>{s.desc}</div>
                  </div>
                  {!s.complete && (
                    <button onClick={onStartPlan} style={{ fontSize: 11, color: C.sage,
                      fontWeight: 700, background: C.sageFaint, border: "none",
                      borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit" }}>
                      Add →
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Account Info */}
            <div style={{ background: C.bgCard, borderRadius: 20, padding: "24px",
              border: `1px solid ${C.border}`, marginBottom: 16 }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: C.ink, marginBottom: 16 }}>Account</div>
              {[
                { label: "Email", value: user?.email },
                { label: "Member since", value: userData?.created_at ? new Date(userData.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "—" },
                { label: "Plan status", value: planStatus },
                { label: "File completion", value: `${pct}%` },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between",
                  padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 12, color: C.soft, fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: 13, color: C.ink, fontWeight: 500 }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Sign out */}
            <button onClick={signOut} style={{ width: "100%", padding: "13px",
              background: "none", border: `1px solid ${C.border}`, borderRadius: 12,
              fontSize: 13, color: C.mid, cursor: "pointer", fontFamily: "inherit" }}>
              Sign out of Passage
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── LANDING ──────────────────────────────────────────────────────────────────
function Landing({ onPlan, onEmergency, user, onDashboard }) {
  const [visible, setVisible] = useState(false);
  const [breathe, setBreathe] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
    setTimeout(() => setBreathe(true), 600);
    const t = setInterval(() => setBreathe(b => !b), 3800);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: system-ui, sans-serif; }`}</style>

      <nav style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%",
            background: `radial-gradient(circle at 40% 40%, ${C.sageLight}, ${C.sage}80)`,
            boxShadow: breathe ? `0 0 24px ${C.sage}50` : `0 0 8px ${C.sage}20`,
            transition: "box-shadow 3.8s ease-in-out" }} />
          <span style={{ fontFamily: "Georgia, serif", fontSize: 22, color: C.ink }}>Passage</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={() => window.open(TALLY_URL, '_blank')}
            style={{ background: "none", border: "none", fontSize: 13,
              color: C.mid, cursor: "pointer", fontFamily: "inherit" }}>
            Join beta
          </button>
          {user ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={onDashboard}
                style={{ background: C.sage, border: "none", borderRadius: 10,
                  padding: "9px 20px", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", color: "#fff", fontFamily: "inherit" }}>
                My file →
              </button>
              <button onClick={signOut}
                style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 10,
                  padding: "8px 14px", fontSize: 12, cursor: "pointer",
                  color: C.mid, fontFamily: "inherit" }}>
                Sign out
              </button>
            </div>
          ) : (
            <button onClick={signInWithGoogle}
              style={{ background: C.bgCard, border: `1.5px solid ${C.border}`,
                borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 700,
                cursor: "pointer", color: C.ink, fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "56px 28px 36px",
        textAlign: "center", opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
        transition: "all 0.75s ease" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8,
          background: C.sageFaint, border: `1px solid ${C.sageLight}`,
          borderRadius: 20, padding: "6px 16px", fontSize: 12, color: C.sage,
          fontWeight: 700, marginBottom: 30 }}>
          🕊️ The family operating system for the end of life
        </div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(32px, 5.5vw, 58px)",
          lineHeight: 1.12, color: C.ink, marginBottom: 22, fontWeight: 400 }}>
          Your family shouldn't have to{" "}
          <em style={{ color: C.sage }}>figure it out</em>
          <br />while they're grieving.
        </h1>
        <p style={{ fontSize: "clamp(15px, 2vw, 17px)", color: C.mid, lineHeight: 1.8,
          maxWidth: 580, margin: "0 auto 14px" }}>
          Passage lets you capture everything your family would otherwise have to guess —
          your wishes, your accounts, your people — so when the time comes,
          your plan executes itself.
        </p>
        <p style={{ fontSize: 14, color: C.soft, marginBottom: 36, fontStyle: "italic" }}>
          Set it up while there's time. Let it take over when there isn't.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
          <Btn onClick={onPlan} style={{ padding: "17px 34px", fontSize: 16 }}>Start planning now →</Btn>
          <Btn variant="rose" onClick={onEmergency} style={{ padding: "17px 28px", fontSize: 15 }}>Someone just passed ↗</Btn>
        </div>
        <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
          {["Free to start", "No credit card required", "Your data, always yours"].map(t => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.soft }}>
              <span style={{ color: C.sage, fontWeight: 700 }}>✓</span>{t}
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 100, maxWidth: 600, margin: "0 auto 50px",
        background: `radial-gradient(ellipse at 50% 100%, ${C.sageLight}55, transparent 70%)`,
        borderRadius: "50% 50% 0 0 / 100% 100% 0 0" }} />

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "20px 28px 60px" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 32, color: C.ink, marginBottom: 10 }}>How it works</div>
          <div style={{ fontSize: 15, color: C.mid }}>Set it up while there's time. Let it take over when there isn't.</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          {[
            { n: "01", icon: "📝", title: "Capture everything that matters", body: "So your family isn't left guessing. Your wishes, accounts, documents, and the people responsible for each decision." },
            { n: "02", icon: "👨‍👩‍👧‍👦", title: "Assign the right people ahead of time", body: "Everyone knows their role before the moment arrives. Tasks pre-assigned. Letters pre-written. Responsibility clear." },
            { n: "03", icon: "⚡", title: "One confirmation activates everything", body: "Your sister gets instructions. Your attorney gets documents. The funeral home is contacted. Everything happens — so your family doesn't have to." },
          ].map(item => (
            <div key={item.n} style={{ background: C.bgCard, borderRadius: 20, padding: "28px", border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 26 }}>{item.icon}</span>
                <span style={{ fontSize: 10, color: C.sage, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>{item.n}</span>
              </div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: C.ink, marginBottom: 10, lineHeight: 1.3 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.75 }}>{item.body}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: C.bgSage, padding: "56px 28px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 28, color: C.ink, marginBottom: 10 }}>When the trigger fires, your plan comes to life</div>
          <div style={{ fontSize: 14, color: C.mid, lineHeight: 1.75, marginBottom: 32 }}>
            You're not just notifying people.<br />You're orchestrating the most important moment your family will ever face.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, maxWidth: 480, margin: "0 auto 24px" }}>
            {[["👨‍👩‍👧‍👦","Family"],["⚖️","Attorney"],["🏛️","Funeral home"],["🌸","Florist"],["🍽️","Caterer"],["⛪","Cemetery"],["📰","Obituaries"],["📱","Socials"]].map(([icon, label]) => (
              <div key={label} style={{ background: C.bgCard, borderRadius: 12, padding: "14px 8px", textAlign: "center", border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 20, marginBottom: 5 }}>{icon}</div>
                <div style={{ fontSize: 10.5, color: C.mid, fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: C.soft, lineHeight: 1.6 }}>
            Social posts are always family-approved before going live.<br />Two people must confirm before anything triggers.
          </div>
        </div>
      </div>

      <div style={{ background: C.bgDark, padding: "56px 28px" }}>
        <div style={{ maxWidth: 940, margin: "0 auto" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: C.soft, fontWeight: 600, textAlign: "center", marginBottom: 36 }}>
            What families say about the experience
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {[
              { q: "I had no idea I needed to notify the DMV, the passport office, AND three credit bureaus. Nobody tells you this.", a: "Adult daughter, 54" },
              { q: "Two months after losing my mom I realized I'd missed the Social Security survivor benefit window. That was thousands of dollars.", a: "Son, 31" },
              { q: "We sat with the funeral director for two hours and left more confused than when we walked in. I wish we'd had this.", a: "Family navigating Medicaid pre-planning" },
            ].map((v, i) => (
              <div key={i} style={{ background: "#252520", borderRadius: 16, padding: "24px", border: "1px solid #333" }}>
                <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14.5, color: "#e8e4dc", lineHeight: 1.75, marginBottom: 14 }}>"{v.q}"</div>
                <div style={{ fontSize: 11, color: C.soft }}>— {v.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "60px 28px", textAlign: "center" }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 30, color: C.ink, marginBottom: 12 }}>Start your family's plan today</div>
        <div style={{ fontSize: 14.5, color: C.mid, marginBottom: 10, lineHeight: 1.75 }}>Free to set up. Activate when you're ready.</div>
        <div style={{ fontSize: 13, color: C.gold, fontWeight: 700, marginBottom: 32 }}>Less than the cost of a single hour with an estate attorney.</div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
          <Btn onClick={onPlan} style={{ padding: "17px 36px", fontSize: 16 }}>Start planning — it's free →</Btn>
          <Btn variant="rose" onClick={onEmergency} style={{ padding: "17px 24px", fontSize: 14 }}>Someone just passed</Btn>
        </div>
        <div style={{ fontSize: 12, color: C.muted }}>No credit card required to start</div>
      </div>
    </div>
  );
}

// ─── PLANNED ONBOARDING ───────────────────────────────────────────────────────
function PlannedOnboarding({ onComplete, onBack, user }) {
  const [step, setStep] = useState(0);
  const [forWhom, setForWhom] = useState("");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [disposition, setDisposition] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [executorName, setExecutorName] = useState("");
  const [executorEmail, setExecutorEmail] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("annual");

  const handleActivate = async (mode) => {
    // Save lead for analytics
    await saveLead({
      flow_type: "planning",
      mode,
      executor_name: executorName,
      executor_email: executorEmail,
      person_name: name,
      disposition,
      service_type: serviceType,
      timestamp: new Date().toISOString(),
    });
    // Save profile to Supabase if logged in
    if (user) {
      await saveProfile(user.id, {
        disposition,
        service_type: serviceType,
        executor_name: executorName,
        executor_email: executorEmail,
      });
    }
    onComplete(mode);
  };

  const steps = [
    <StepCard key={0}>
      <StepTitle eyebrow="Let's build your plan" title="Who are you protecting?"
        sub="Passage works whether you're planning for yourself or helping someone you love get organized." />
      {[
        { value: "self", icon: "🙋", title: "Myself", desc: "I want to set up my own plan so my family has everything they need." },
        { value: "parent", icon: "👴👵", title: "A parent or grandparent", desc: "I'm helping someone I love get their wishes organized before it's urgent." },
        { value: "spouse", icon: "💑", title: "My spouse or partner", desc: "We're planning together so neither of us is left guessing." },
      ].map(o => (
        <OptionCard key={o.value} icon={o.icon} title={o.title} desc={o.desc}
          selected={forWhom === o.value} onClick={() => setForWhom(o.value)} />
      ))}
      {!user && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, color: C.soft, textAlign: "center", marginBottom: 10 }}>
            Sign in to save your plan and come back anytime.
          </div>
          <GoogleBtn label="Continue with Google" />
          <div style={{ fontSize: 11, color: C.muted, textAlign: "center", marginBottom: 8 }}>or continue without signing in</div>
        </div>
      )}
      <Btn onClick={() => setStep(1)} disabled={!forWhom} style={{ width: "100%", marginTop: 4 }}>Let's start →</Btn>
    </StepCard>,

    <StepCard key={1}>
      <ProgressBar current={1} total={5} />
      <StepTitle eyebrow={forWhom === "self" ? "About you" : "About them"}
        title={forWhom === "self" ? "Let's personalize your plan" : "Tell us about the person this plan protects"}
        sub="This pre-fills notifications, letters, and documents so your family never has to look anything up." />
      <Input label="Full legal name" placeholder="e.g. Patricia Anne Collins" value={name} onChange={setName} hint="Appears on all official notifications and letters." />
      <Input label="Date of birth" type="date" value={dob} onChange={setDob} />
      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <Btn variant="ghost" onClick={() => setStep(0)}>← Back</Btn>
        <Btn onClick={() => setStep(2)} disabled={!name || !dob} style={{ flex: 1 }}>Continue →</Btn>
      </div>
    </StepCard>,

    <StepCard key={2}>
      <ProgressBar current={2} total={5} />
      <StepTitle eyebrow="Final wishes" title="The decisions your family would otherwise have to make without you"
        sub="Being specific here is the greatest gift you can give." />
      {[
        { label: "Burial or cremation?", value: disposition, onChange: setDisposition,
          options: [["","Choose one..."],["cremation","Cremation"],["burial","Traditional burial"],["green","Green / natural burial"],["donation","Body donation to science"],["unsure","Not decided yet"]] },
        { label: "Type of service?", value: serviceType, onChange: setServiceType,
          options: [["","Choose one..."],["funeral","Traditional funeral service"],["celebration","Celebration of life"],["graveside","Graveside only"],["private","Private — close family only"],["none","No formal service"]] },
      ].map(({ label, value, onChange, options }) => (
        <div key={label} style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.mid, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>{label}</label>
          <select value={value} onChange={e => onChange(e.target.value)}
            style={{ width: "100%", padding: "14px 16px", borderRadius: 12, fontSize: 15, border: `1.5px solid ${C.border}`, background: C.bgCard, color: value ? C.ink : C.soft, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}>
            {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      ))}
      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <Btn variant="ghost" onClick={() => setStep(1)}>← Back</Btn>
        <Btn onClick={() => setStep(3)} disabled={!disposition || !serviceType} style={{ flex: 1 }}>Continue →</Btn>
      </div>
    </StepCard>,

    <StepCard key={3}>
      <ProgressBar current={3} total={5} />
      <StepTitle eyebrow="Your people" title="Who do you trust to carry this out?"
        sub="They'll know exactly what to do when the time comes — because you already told them." />
      <div style={{ background: C.bgSubtle, borderRadius: 14, padding: "18px 20px", marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.sage, marginBottom: 4 }}>⚖️ Executor</div>
        <div style={{ fontSize: 12, color: C.mid, marginBottom: 14, lineHeight: 1.5 }}>
          The person who manages the estate. They receive their full task list the moment the trigger fires.
        </div>
        <Input label="Full name" placeholder="e.g. Sarah Collins" value={executorName} onChange={setExecutorName} />
        <Input label="Email" type="email" placeholder="sarah@email.com" value={executorEmail} onChange={setExecutorEmail} />
      </div>
      <div style={{ background: C.goldFaint, border: `1px solid ${C.gold}30`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: C.gold, marginBottom: 18 }}>
        💡 Upgrade to add a Witness who co-confirms the trigger, and Recipients who get personal messages from you.
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <Btn variant="ghost" onClick={() => setStep(2)}>← Back</Btn>
        <Btn onClick={() => setStep(4)} disabled={!executorName || !executorEmail} style={{ flex: 1 }}>Continue →</Btn>
      </div>
    </StepCard>,

    <StepCard key={4}>
      <ProgressBar current={4} total={5} />
      <StepTitle eyebrow="Account map" title="Where are the important accounts?"
        sub="Your family won't have to hunt. Pre-filled into notification letters automatically." />
      <div style={{ background: C.bgSubtle, borderRadius: 14, padding: "16px 18px", marginBottom: 16 }}>
        {[
          { icon: "🏦", label: "Primary bank account", locked: false },
          { icon: "🏛️", label: "Social Security", locked: false },
          { icon: "🛡️", label: "Life insurance policy", locked: false },
          { icon: "📱", label: "Recurring subscriptions", locked: true },
          { icon: "₿", label: "Digital assets / crypto", locked: true },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <div style={{ flex: 1, fontSize: 13, color: item.locked ? C.muted : C.ink }}>{item.label}</div>
            {item.locked
              ? <span style={{ fontSize: 10, color: C.gold, fontWeight: 700, background: C.goldFaint, padding: "2px 8px", borderRadius: 6 }}>Upgrade</span>
              : <span style={{ fontSize: 10, color: C.sage, fontWeight: 700 }}>+ Add</span>}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: C.soft, marginBottom: 20, lineHeight: 1.6 }}>Free plan includes up to 5 accounts. Upgrade for unlimited.</div>
      <div style={{ display: "flex", gap: 12 }}>
        <Btn variant="ghost" onClick={() => setStep(3)}>← Back</Btn>
        <Btn onClick={() => setStep(5)} style={{ flex: 1 }}>Continue →</Btn>
      </div>
    </StepCard>,

    <StepCard key={5} maxWidth={540}>
      <ProgressBar current={5} total={5} />
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 36, marginBottom: 14 }}>🕊️</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 24, color: C.ink, marginBottom: 10, lineHeight: 1.25 }}>
          Your plan is built.<br />Now make it real.
        </div>
        <div style={{ background: C.bgSubtle, borderRadius: 12, padding: "14px 18px", fontSize: 13.5, color: C.mid, lineHeight: 1.7, marginBottom: 8 }}>
          Right now, this is just a draft.{" "}
          <strong style={{ color: C.ink }}>Without activation, your family won't see any of this.</strong>{" "}
          Activate so your plan executes when they need it most.
        </div>
        <div style={{ fontSize: 12.5, color: C.gold, fontWeight: 700, marginTop: 10 }}>
          Less than the cost of a single hour with an estate attorney.
        </div>
      </div>
      {[
        { id: "annual", label: "Annual", price: "$79", per: "/year", badge: "Best value — save 45%", popular: true },
        { id: "monthly", label: "Monthly", price: "$12", per: "/month", badge: "Start anytime, cancel anytime" },
        { id: "lifetime", label: "Lifetime", price: "$249", per: "one time", badge: "Pay once. Active forever." },
      ].map(plan => (
        <div key={plan.id} onClick={() => setSelectedPlan(plan.id)} style={{
          border: `2px solid ${selectedPlan === plan.id ? C.sage : C.border}`,
          borderRadius: 14, padding: "14px 18px", cursor: "pointer",
          background: selectedPlan === plan.id ? C.sageFaint : C.bgCard,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          transition: "all 0.15s", marginBottom: 8, position: "relative",
        }}>
          {plan.popular && (
            <div style={{ position: "absolute", top: -10, left: 16, background: C.sage, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 10 }}>RECOMMENDED</div>
          )}
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{plan.label}</div>
            <div style={{ fontSize: 11, color: C.soft, marginTop: 3 }}>{plan.badge}</div>
          </div>
          <div>
            <span style={{ fontSize: 22, fontWeight: 800, color: selectedPlan === plan.id ? C.sage : C.ink }}>{plan.price}</span>
            <span style={{ fontSize: 12, color: C.soft }}> {plan.per}</span>
          </div>
        </div>
      ))}
      <div style={{ background: C.bgSubtle, borderRadius: 12, padding: "14px 16px", marginBottom: 20, marginTop: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Everything that activates immediately:</div>
        {[
          `Death trigger — ${executorName || "your executor"} and family receive their task lists`,
          "All vendor notifications — funeral home, attorney, florist, caterer, cemetery",
          "Social posts drafted and family-approved before sending",
          "Unlimited wishes, accounts, and documents",
          "Memory vault — voice notes and letters delivered after death",
          "Financial assistance finder — benefits, survivor payments, deadlines",
        ].map((f, i) => (
          <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 12, color: C.mid, padding: "4px 0" }}>
            <span style={{ color: C.sage, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>{f}
          </div>
        ))}
      </div>
      <Btn onClick={() => handleActivate("paid")} style={{ width: "100%", padding: "17px", fontSize: 16, marginBottom: 10 }}>
        Activate my plan →
      </Btn>
      <div style={{ textAlign: "center" }}>
        <button onClick={() => handleActivate("draft")}
          style={{ background: "none", border: "none", fontSize: 12.5, color: C.soft, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline", padding: "8px" }}>
          Save as draft — I understand nothing will activate until I upgrade
        </button>
      </div>
      <div style={{ fontSize: 11, color: C.muted, textAlign: "center", marginTop: 10 }}>
        Secure checkout · If subscription lapses, trigger freezes until reactivated.
      </div>
    </StepCard>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <NavHeader onBack={onBack} label="Setting up your plan" user={user} onDashboard={() => {}} />
      <div style={{ padding: "32px 20px 80px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%" }}>{steps[step]}</div>
      </div>
    </div>
  );
}

// ─── EMERGENCY ONBOARDING ─────────────────────────────────────────────────────
function EmergencyOnboarding({ onComplete, onBack }) {
  const [step, setStep] = useState(0);
  const [deceasedName, setDeceasedName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [yourName, setYourName] = useState("");
  const [yourEmail, setYourEmail] = useState("");

  const handleComplete = async (mode) => {
    await saveLead({
      flow_type: "immediate", mode,
      your_name: yourName, your_email: yourEmail,
      deceased_name: deceasedName, relationship,
      timestamp: new Date().toISOString(),
    });
    onComplete(mode);
  };

  const urgentTasks = [
    { icon: "📋", task: "Order death certificates — get 15 copies", deadline: "This week", urgent: true },
    { icon: "🏛️", task: "Notify Social Security Administration", deadline: "Within 10 days", urgent: true },
    { icon: "🏦", task: "Notify primary bank — pause automatic payments", deadline: "This week", urgent: true },
    { icon: "👨‍👩‍👧‍👦", task: "Notify extended family and close friends", deadline: "Immediately", urgent: true },
    { icon: "⚖️", task: "Contact estate attorney", deadline: "Within 1 week", urgent: false },
    { icon: "📰", task: "Draft and place obituary", deadline: "Before service", urgent: false },
    { icon: "💰", task: "Check Social Security survivor benefits — time-sensitive", deadline: "Within 60 days", urgent: false },
    { icon: "🛡️", task: "Locate and file life insurance claims", deadline: "Within 30 days", urgent: false },
  ];

  const steps = [
    <StepCard key={0}>
      <div style={{ background: C.roseFaint, border: `1px solid ${C.rose}30`, borderRadius: 16, padding: "24px 20px", marginBottom: 24, textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🕊️</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 22, color: C.ink, marginBottom: 10 }}>We're so sorry for your loss.</div>
        <div style={{ fontSize: 13.5, color: C.mid, lineHeight: 1.75 }}>
          We'll guide you step by step. Nothing will be missed.<br />Answer two quick questions and we'll build your plan.
        </div>
      </div>
      <Input label="Name of the person who passed" placeholder="e.g. Robert James Collins" value={deceasedName} onChange={setDeceasedName} />
      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.mid, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>Your relationship</label>
        <select value={relationship} onChange={e => setRelationship(e.target.value)}
          style={{ width: "100%", padding: "14px 16px", borderRadius: 12, fontSize: 15, border: `1.5px solid ${C.border}`, background: C.bgCard, color: relationship ? C.ink : C.soft, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}>
          {[["","Select..."],["child","Son or daughter"],["spouse","Spouse or partner"],["sibling","Brother or sister"],["grandchild","Grandchild"],["other","Other"]].map(([v,l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>
      <Btn onClick={() => setStep(1)} disabled={!deceasedName || !relationship}
        style={{ width: "100%", background: C.rose, boxShadow: `0 4px 20px ${C.rose}35` }}>
        Continue →
      </Btn>
    </StepCard>,

    <StepCard key={1}>
      <ProgressBar current={1} total={3} color={C.rose} />
      <StepTitle eyebrow="Almost there" title="Who's handling things right now?" sub="We'll send your task list here so you always have it." />
      <Input label="Your name" placeholder="Your full name" value={yourName} onChange={setYourName} />
      <Input label="Your email" type="email" placeholder="your@email.com" value={yourEmail} onChange={setYourEmail} hint="We'll email your task list so you don't lose it." />
      <div style={{ display: "flex", gap: 12 }}>
        <Btn variant="ghost" onClick={() => setStep(0)}>← Back</Btn>
        <Btn onClick={() => setStep(2)} disabled={!yourName || !yourEmail}
          style={{ flex: 1, background: C.rose, boxShadow: `0 4px 20px ${C.rose}35` }}>
          Build my plan →
        </Btn>
      </div>
    </StepCard>,

    <StepCard key={2} maxWidth={580}>
      <ProgressBar current={2} total={3} color={C.rose} />
      <StepTitle eyebrow={`For ${deceasedName.split(" ")[0] || "your loved one"}`}
        title="Everything that needs to happen now"
        sub={`${yourName} — here's your prioritized plan. Nothing gets missed.`} />
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
        {urgentTasks.map((t, i) => (
          <div key={i} style={{ background: t.urgent ? C.roseFaint : C.bgCard, border: `1px solid ${t.urgent ? C.rose + "40" : C.border}`, borderRadius: 12, padding: "13px 16px", display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{t.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.ink }}>{t.task}</div>
              <div style={{ fontSize: 11, color: t.urgent ? C.rose : C.amber, marginTop: 3, fontWeight: 600 }}>{t.urgent ? "⚡ " : "● "}{t.deadline}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: C.bgSubtle, borderRadius: 16, padding: "20px", marginBottom: 16 }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: C.ink, marginBottom: 8 }}>Don't navigate this alone.</div>
        <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.7, marginBottom: 14 }}>
          With Passage, you can assign each task to a specific family member, track progress, store documents in one place, and make sure nothing slips through the cracks.
        </div>
        {["Assign each task to a specific family member","Pre-filled notification letters — Social Security, banks, employer","Document vault — everything in one secure place","Reminders so critical deadlines aren't missed","Everyone you invite gets their first year free"].map((f, i) => (
          <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 12.5, color: C.mid, padding: "4px 0" }}>
            <span style={{ color: C.rose, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>{f}
          </div>
        ))}
      </div>
      <div style={{ background: C.roseFaint, border: `1px solid ${C.rose}20`, borderRadius: 12, padding: "12px 16px", fontSize: 12, color: C.rose, marginBottom: 16, lineHeight: 1.6 }}>
        🎁 <strong>Everyone you invite to help</strong> — executor, florist, officiant — gets their first year of Passage free.
      </div>
      <Btn onClick={() => handleComplete("emergency_paid")}
        style={{ width: "100%", padding: "17px", fontSize: 16, marginBottom: 10, background: C.rose, boxShadow: `0 4px 20px ${C.rose}35` }}>
        Continue with support — from $12/mo →
      </Btn>
      <button onClick={() => handleComplete("emergency_free")}
        style={{ width: "100%", padding: "11px", background: "none", border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 13, color: C.mid, cursor: "pointer", fontFamily: "inherit", marginBottom: 8 }}>
        Download this list only (free)
      </button>
      <div style={{ fontSize: 11, color: C.muted, textAlign: "center" }}>
        Free plan saves your list but doesn't assign, track, or remind.
      </div>
    </StepCard>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <NavHeader onBack={onBack} label="Emergency setup" />
      <div style={{ padding: "28px 20px 80px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%" }}>{steps[step]}</div>
      </div>
    </div>
  );
}

// ─── SUCCESS ──────────────────────────────────────────────────────────────────
function Success({ mode, onDashboard }) {
  const isDraft = mode === "draft";
  const isEmergencyFree = mode === "emergency_free";
  const isEmergencyPaid = mode === "emergency_paid";

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ maxWidth: 480, width: "100%" }}>
        <div style={{ background: C.bgCard, borderRadius: 24, padding: "48px 36px",
          textAlign: "center", boxShadow: "0 2px 40px rgba(0,0,0,0.08)" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%",
            background: isDraft ? C.goldFaint : isEmergencyFree ? C.roseFaint : isEmergencyPaid ? C.roseFaint : C.sageFaint,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, margin: "0 auto 24px" }}>
            {isDraft ? "📄" : isEmergencyFree ? "📋" : "🕊️"}
          </div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 26, color: C.ink, marginBottom: 12 }}>
            {isDraft ? "Your draft is saved."
              : isEmergencyFree ? "Your task list is saved."
              : isEmergencyPaid ? "Your plan is live."
              : "Your file is activated."}
          </div>
          <div style={{ fontSize: 14, color: C.mid, lineHeight: 1.8, marginBottom: 24 }}>
            {isDraft
              ? "Nothing will be triggered or sent to your family until you activate your plan."
              : isEmergencyFree
              ? "Take a breath. Your task list has been saved. Upgrade when you're ready to assign, track, and make sure nothing gets missed."
              : isEmergencyPaid
              ? "Your task list is active. Family members are being notified. Take a breath — your family has what they need."
              : "Your family will never have to guess. When the time comes, everything is already waiting — tasks assigned, notifications ready, letters drafted."}
          </div>
          <div style={{ background: isDraft ? C.goldFaint : C.sageFaint, borderRadius: 12, padding: "12px 16px", fontSize: 13, color: isDraft ? C.amber : C.sage, fontWeight: 600, marginBottom: 20 }}>
            {isDraft ? "We'll send you a reminder in 7 days."
              : isEmergencyPaid ? "Everyone you've invited will receive their tasks shortly."
              : "Welcome to Passage. 🕊️"}
          </div>
          {onDashboard && (
            <button onClick={onDashboard}
              style={{ width: "100%", padding: "13px", background: C.sage, border: "none",
                borderRadius: 12, fontSize: 14, fontWeight: 700, color: "#fff",
                cursor: "pointer", fontFamily: "inherit" }}>
              View my file →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("landing");
  const [successMode, setSuccessMode] = useState("paid");
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handlePlanComplete = (mode = "paid") => {
    setSuccessMode(mode);
    setView("success");
  };

  const handleEmergencyComplete = (mode = "emergency_paid") => {
    setSuccessMode(mode);
    setView("success");
  };

  return (
    <>
      {view === "landing" && (
        <Landing
          onPlan={() => setView("plan")}
          onEmergency={() => setView("emergency")}
          user={user}
          onDashboard={() => setView("dashboard")}
        />
      )}
      {view === "plan" && (
        <PlannedOnboarding
          onComplete={handlePlanComplete}
          onBack={() => setView("landing")}
          user={user}
        />
      )}
      {view === "emergency" && (
        <EmergencyOnboarding
          onComplete={handleEmergencyComplete}
          onBack={() => setView("landing")}
        />
      )}
      {view === "success" && (
        <Success
          mode={successMode}
          onDashboard={user ? () => setView("dashboard") : null}
        />
      )}
      {view === "dashboard" && (
        <Dashboard
          user={user}
          onBack={() => setView("landing")}
          onStartPlan={() => setView("plan")}
        />
      )}
    </>
  );
}
