import { useState, useEffect } from "react";

const C = {
  bg: "#f6f3ee", bgCard: "#ffffff", bgSubtle: "#f0ece5", bgSage: "#e8eeea",
  bgDark: "#1e1e1a", ink: "#1a1916", mid: "#6a6560", soft: "#a09890",
  muted: "#c5bdb5", border: "#e4ddd4", sage: "#6b8f71", sageDark: "#4a6e50",
  sageLight: "#c8deca", sageFaint: "#f0f5f1", gold: "#b8945a", goldFaint: "#faf4eb",
  rose: "#c47a7a", roseFaint: "#fdf3f3", amber: "#b07a3a",
};

const Btn = ({ children, onClick, variant = "primary", disabled, style = {} }) => {
  const base = {
    border: "none", borderRadius: 14, padding: "15px 28px", fontSize: 15,
    fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit", transition: "all 0.2s", display: "inline-flex",
    alignItems: "center", justifyContent: "center", gap: 8, opacity: disabled ? 0.5 : 1,
  };
  const variants = {
    primary: { background: C.sage, color: "#fff", boxShadow: `0 4px 20px ${C.sage}35` },
    secondary: { background: C.bgCard, color: C.ink, border: `1.5px solid ${C.border}` },
    ghost: { background: "transparent", color: C.mid, padding: "12px 20px" },
    rose: { background: C.rose, color: "#fff", boxShadow: `0 4px 20px ${C.rose}35` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
};

const Input = ({ label, placeholder, value, onChange, type = "text", hint }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.mid,
      letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width: "100%", padding: "14px 16px", borderRadius: 12, fontSize: 15,
        border: `1.5px solid ${C.border}`, background: C.bgCard, color: C.ink,
        fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
    {hint && <div style={{ fontSize: 11.5, color: C.soft, marginTop: 6 }}>{hint}</div>}
  </div>
);

const OptionCard = ({ icon, title, desc, selected, onClick, accent }) => (
  <div onClick={onClick} style={{
    border: `2px solid ${selected ? (accent || C.sage) : C.border}`,
    borderRadius: 16, padding: "18px 20px", cursor: "pointer",
    background: selected ? (accent || C.sage) + "0a" : C.bgCard,
    transition: "all 0.18s", marginBottom: 10,
    display: "flex", alignItems: "flex-start", gap: 16,
  }}>
    <div style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: C.mid, lineHeight: 1.6 }}>{desc}</div>
    </div>
    <div style={{ width: 20, height: 20, borderRadius: "50%",
      border: `2px solid ${selected ? (accent || C.sage) : C.muted}`,
      background: selected ? (accent || C.sage) : "transparent", flexShrink: 0, marginTop: 2,
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      {selected && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
    </div>
  </div>
);

const ProgressBar = ({ current, total, color }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
      <div style={{ fontSize: 11, color: C.soft, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
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
    {eyebrow && <div style={{ fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase",
      color: C.sage, fontWeight: 700, marginBottom: 8 }}>{eyebrow}</div>}
    <div style={{ fontFamily: "Georgia, serif", fontSize: 24, color: C.ink,
      lineHeight: 1.25, marginBottom: sub ? 10 : 0 }}>{title}</div>
    {sub && <div style={{ fontSize: 14, color: C.mid, lineHeight: 1.65 }}>{sub}</div>}
  </div>
);

function Landing({ onPlan, onEmergency }) {
  const [visible, setVisible] = useState(false);
  const [breathe, setBreathe] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
    setTimeout(() => setBreathe(true), 500);
    const t = setInterval(() => setBreathe(b => !b), 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>

      {/* NAV */}
      <nav style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%",
            background: `radial-gradient(circle at 40% 40%, ${C.sageLight}, ${C.sage}80)`,
            transition: "all 3.5s ease-in-out",
            boxShadow: breathe ? `0 0 20px ${C.sage}40` : "none" }} />
          <span style={{ fontFamily: "Georgia, serif", fontSize: 22, color: C.ink }}>Passage</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: C.mid, cursor: "pointer" }}>Sign in</span>
          <button onClick={onPlan} style={{ background: C.bgCard, border: `1.5px solid ${C.border}`,
            borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 600,
            cursor: "pointer", color: C.ink, fontFamily: "inherit" }}>Get started</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 28px 40px", textAlign: "center",
        opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "all 0.7s ease" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8,
          background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 20,
          padding: "6px 14px", fontSize: 12, color: C.sage, fontWeight: 600, marginBottom: 28 }}>
          🕊️ The family operating system for the end of life
        </div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(32px, 5vw, 58px)",
          lineHeight: 1.15, color: C.ink, marginBottom: 22, fontWeight: 400, margin: "0 0 22px" }}>
          Your family shouldn't have to{" "}
          <span style={{ color: C.sage, fontStyle: "italic" }}>figure it out</span>
          <br />while they're grieving.
        </h1>
        <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: C.mid, lineHeight: 1.75,
          maxWidth: 600, margin: "0 auto 40px" }}>
          Passage lets you document your wishes, organize every account and document,
          and assign tasks to the right people — so when the time comes,
          everything your family needs is already waiting for them.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 18 }}>
          <Btn onClick={onPlan} style={{ padding: "17px 32px", fontSize: 16 }}>
            Start planning now →
          </Btn>
          <Btn variant="rose" onClick={onEmergency} style={{ padding: "17px 32px", fontSize: 16 }}>
            Someone just passed ↗
          </Btn>
        </div>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
          {["Free to start", "No credit card required", "Your data, always yours"].map(t => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.soft }}>
              <span style={{ color: C.sage }}>✓</span>{t}
            </div>
          ))}
        </div>
      </div>

      {/* AMBIENT */}
      <div style={{ position: "relative", height: 120, maxWidth: 600, margin: "20px auto 60px",
        background: `radial-gradient(ellipse at 50% 100%, ${C.sageLight}50, transparent 70%)`,
        borderRadius: "50% 50% 0 0 / 100% 100% 0 0" }} />

      {/* HOW IT WORKS */}
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "40px 28px 60px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 30, color: C.ink, marginBottom: 10 }}>
            How it works
          </div>
          <div style={{ fontSize: 15, color: C.mid }}>Set it up while there's time. Let it work when there isn't.</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          {[
            { n: "01", icon: "📝", title: "Build the file", body: "Document wishes, map accounts, designate people. Takes an hour. Lives forever." },
            { n: "02", icon: "👨‍👩‍👧‍👦", title: "Connect your family", body: "Each person sees exactly what they need. Tasks pre-assigned. Letters pre-written." },
            { n: "03", icon: "⚡", title: "Everything fires automatically", body: "One confirmation triggers the plan. Family, attorney, funeral home — all notified." },
          ].map(item => (
            <div key={item.n} style={{ background: C.bgCard, borderRadius: 20, padding: "28px",
              border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 28 }}>{item.icon}</span>
                <span style={{ fontSize: 11, color: C.sage, fontWeight: 700, letterSpacing: "0.15em" }}>{item.n}</span>
              </div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: C.ink, marginBottom: 8 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.7 }}>{item.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* NOTIFICATION GRID */}
      <div style={{ background: C.bgSage, padding: "50px 28px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 26, color: C.ink, marginBottom: 10 }}>
            When the trigger fires, everyone is notified
          </div>
          <div style={{ fontSize: 13.5, color: C.mid, marginBottom: 30, lineHeight: 1.7 }}>
            Family, attorney, funeral home, florist, caterer, cemetery, obituaries, and social media — all coordinated automatically.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, maxWidth: 480, margin: "0 auto 20px" }}>
            {[["👨‍👩‍👧‍👦","Family"],["⚖️","Attorney"],["🏛️","Funeral home"],["🌸","Florist"],
              ["🍽️","Caterer"],["⛪","Cemetery"],["📰","Obituaries"],["📱","Socials"]].map(([icon, label]) => (
              <div key={label} style={{ background: C.bgCard, borderRadius: 12, padding: "14px 8px",
                textAlign: "center", border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 20, marginBottom: 5 }}>{icon}</div>
                <div style={{ fontSize: 10.5, color: C.mid, fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: C.soft }}>
            Social posts are always family-approved. Two people must confirm before anything triggers.
          </div>
        </div>
      </div>

      {/* FINAL CTA */}
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "60px 28px", textAlign: "center" }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 30, color: C.ink, marginBottom: 12 }}>
          Start your family's plan today
        </div>
        <div style={{ fontSize: 14, color: C.mid, marginBottom: 32, lineHeight: 1.7 }}>
          Free to set up. Your family is protected the moment you upgrade.
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Btn onClick={onPlan} style={{ padding: "17px 36px", fontSize: 16 }}>
            Start planning — it's free →
          </Btn>
          <Btn variant="rose" onClick={onEmergency} style={{ padding: "17px 28px", fontSize: 15 }}>
            Someone just passed
          </Btn>
        </div>
      </div>
    </div>
  );
}

function PlannedOnboarding({ onComplete, onBack }) {
  const [step, setStep] = useState(0);
  const [forWhom, setForWhom] = useState("");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [disposition, setDisposition] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [executorName, setExecutorName] = useState("");
  const [executorEmail, setExecutorEmail] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("annual");

  const Header = () => (
    <div style={{ background: C.bgCard, borderBottom: `1px solid ${C.border}`, padding: "16px 24px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%",
          background: `radial-gradient(circle, ${C.sageLight}, ${C.sage}70)` }} />
        <span style={{ fontFamily: "Georgia, serif", fontSize: 18, color: C.ink }}>Passage</span>
      </div>
      <button onClick={onBack} style={{ background: "none", border: "none",
        fontSize: 13, color: C.soft, cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
    </div>
  );

  const steps = [
    <StepCard key={0}>
      <StepTitle eyebrow="Let's get started" title="Who is this plan for?" />
      {[
        { value: "self", icon: "🙋", title: "For me", desc: "I want to set up my own plan and protect my family." },
        { value: "parent", icon: "👴👵", title: "For a parent or grandparent", desc: "I'm helping an aging parent get organized." },
        { value: "spouse", icon: "💑", title: "For my spouse or partner", desc: "We're planning together as a couple." },
      ].map(o => (
        <OptionCard key={o.value} icon={o.icon} title={o.title} desc={o.desc}
          selected={forWhom === o.value} onClick={() => setForWhom(o.value)} />
      ))}
      <Btn onClick={() => setStep(1)} disabled={!forWhom} style={{ width: "100%", marginTop: 8 }}>
        Continue →
      </Btn>
    </StepCard>,

    <StepCard key={1}>
      <ProgressBar current={1} total={5} />
      <StepTitle eyebrow="About the person" title={forWhom === "self" ? "Tell us about you" : "Tell us about them"} />
      <Input label="Full legal name" placeholder="e.g. Patricia Anne Collins" value={name} onChange={setName} />
      <Input label="Date of birth" type="date" value={dob} onChange={setDob} />
      <div style={{ display: "flex", gap: 12 }}>
        <Btn variant="ghost" onClick={() => setStep(0)}>← Back</Btn>
        <Btn onClick={() => setStep(2)} disabled={!name || !dob} style={{ flex: 1 }}>Continue →</Btn>
      </div>
    </StepCard>,

    <StepCard key={2}>
      <ProgressBar current={2} total={5} />
      <StepTitle eyebrow="Final wishes" title="What are the wishes?" sub="Being specific is a gift to your family." />
      {[
        { label: "Burial or cremation?", value: disposition, onChange: setDisposition,
          options: [["","Choose one..."],["cremation","Cremation"],["burial","Traditional burial"],["green","Green burial"],["donation","Body donation"]] },
        { label: "Type of service?", value: serviceType, onChange: setServiceType,
          options: [["","Choose one..."],["funeral","Traditional funeral"],["celebration","Celebration of life"],["graveside","Graveside only"],["private","Private — family only"]] },
      ].map(({ label, value, onChange, options }) => (
        <div key={label} style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.mid,
            letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>{label}</label>
          <select value={value} onChange={e => onChange(e.target.value)}
            style={{ width: "100%", padding: "14px 16px", borderRadius: 12, fontSize: 15,
              border: `1.5px solid ${C.border}`, background: C.bgCard, color: value ? C.ink : C.soft,
              fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}>
            {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      ))}
      <div style={{ display: "flex", gap: 12 }}>
        <Btn variant="ghost" onClick={() => setStep(1)}>← Back</Btn>
        <Btn onClick={() => setStep(3)} disabled={!disposition || !serviceType} style={{ flex: 1 }}>Continue →</Btn>
      </div>
    </StepCard>,

    <StepCard key={3}>
      <ProgressBar current={3} total={5} />
      <StepTitle eyebrow="Your people" title="Who will carry this plan?" sub="They receive their task list the moment the trigger fires." />
      <div style={{ background: C.bgSubtle, borderRadius: 14, padding: "16px 18px", marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.sage, marginBottom: 12 }}>⚖️ Executor — manages the estate</div>
        <Input label="Full name" placeholder="e.g. Sarah Collins" value={executorName} onChange={setExecutorName} />
        <Input label="Email" type="email" placeholder="sarah@email.com" value={executorEmail} onChange={setExecutorEmail} />
      </div>
      <div style={{ background: C.goldFaint, border: `1px solid ${C.gold}30`, borderRadius: 10,
        padding: "11px 14px", fontSize: 12, color: C.gold, marginBottom: 18 }}>
        💡 Upgrade to add more family members, a Witness, and Recipients who get personal messages.
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <Btn variant="ghost" onClick={() => setStep(2)}>← Back</Btn>
        <Btn onClick={() => setStep(4)} disabled={!executorName || !executorEmail} style={{ flex: 1 }}>Continue →</Btn>
      </div>
    </StepCard>,

    <StepCard key={4} maxWidth={540}>
      <ProgressBar current={4} total={5} />
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>🕊️</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 24, color: C.ink, marginBottom: 8 }}>Your file is ready</div>
        <div style={{ fontSize: 13.5, color: C.mid, lineHeight: 1.7 }}>
          Upgrade to activate the trigger, task routing, and protect your family for real.
        </div>
      </div>
      {[
        { id: "annual", label: "Annual", price: "$79", per: "/year", badge: "Best value — save 45%", popular: true },
        { id: "monthly", label: "Monthly", price: "$12", per: "/month", badge: "Most flexible" },
        { id: "lifetime", label: "Lifetime", price: "$249", per: "one time", badge: "Pay once, active forever" },
      ].map(plan => (
        <div key={plan.id} onClick={() => setSelectedPlan(plan.id)} style={{
          border: `2px solid ${selectedPlan === plan.id ? C.sage : C.border}`,
          borderRadius: 14, padding: "14px 18px", cursor: "pointer",
          background: selectedPlan === plan.id ? C.sageFaint : C.bgCard,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          transition: "all 0.15s", marginBottom: 8, position: "relative",
        }}>
          {plan.popular && (
            <div style={{ position: "absolute", top: -10, left: 16, background: C.sage, color: "#fff",
              fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 10 }}>RECOMMENDED</div>
          )}
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{plan.label}</div>
            <div style={{ fontSize: 11, color: C.soft, marginTop: 2 }}>{plan.badge}</div>
          </div>
          <div>
            <span style={{ fontSize: 22, fontWeight: 800, color: selectedPlan === plan.id ? C.sage : C.ink }}>{plan.price}</span>
            <span style={{ fontSize: 12, color: C.soft }}> {plan.per}</span>
          </div>
        </div>
      ))}
      <Btn onClick={onComplete} style={{ width: "100%", padding: "17px", fontSize: 16, marginTop: 8, marginBottom: 10 }}>
        Activate →
      </Btn>
      <button onClick={onComplete} style={{ width: "100%", padding: "12px", background: "none",
        border: "none", fontSize: 13, color: C.soft, cursor: "pointer", fontFamily: "inherit" }}>
        Save as draft — upgrade later
      </button>
    </StepCard>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <Header />
      <div style={{ padding: "32px 20px 80px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%" }}>{steps[step]}</div>
      </div>
    </div>
  );
}

function EmergencyOnboarding({ onComplete, onBack }) {
  const [step, setStep] = useState(0);
  const [deceasedName, setDeceasedName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [yourName, setYourName] = useState("");
  const [yourEmail, setYourEmail] = useState("");

  const Header = () => (
    <div style={{ background: C.bgCard, borderBottom: `1px solid ${C.border}`, padding: "16px 24px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%",
          background: `radial-gradient(circle, ${C.sageLight}, ${C.sage}70)` }} />
        <span style={{ fontFamily: "Georgia, serif", fontSize: 18, color: C.ink }}>Passage</span>
      </div>
      <button onClick={onBack} style={{ background: "none", border: "none",
        fontSize: 13, color: C.soft, cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
    </div>
  );

  const urgentTasks = [
    { icon: "📋", task: "Order death certificates (15 copies)", deadline: "This week", urgent: true },
    { icon: "🏛️", task: "Notify Social Security Administration", deadline: "Within 10 days", urgent: true },
    { icon: "🏦", task: "Notify primary bank", deadline: "This week", urgent: true },
    { icon: "⚖️", task: "Contact estate attorney", deadline: "Within 1 week", urgent: false },
    { icon: "📰", task: "Draft and place obituary", deadline: "Before service", urgent: false },
    { icon: "💰", task: "Check survivor benefits eligibility", deadline: "Within 60 days", urgent: false },
    { icon: "👨‍👩‍👧‍👦", task: "Notify extended family and friends", deadline: "Immediately", urgent: true },
    { icon: "🛡️", task: "Locate and file life insurance claims", deadline: "Within 30 days", urgent: false },
  ];

  const steps = [
    <StepCard key={0}>
      <div style={{ background: C.roseFaint, border: `1px solid ${C.rose}30`, borderRadius: 14,
        padding: "20px", marginBottom: 24, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>🕊️</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: C.ink, marginBottom: 8 }}>
          We're so sorry for your loss.
        </div>
        <div style={{ fontSize: 13.5, color: C.mid, lineHeight: 1.7 }}>
          Let's get you organized as quickly as possible.
        </div>
      </div>
      <Input label="Name of the person who passed" placeholder="e.g. Robert James Collins"
        value={deceasedName} onChange={setDeceasedName} />
      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.mid,
          letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>Your relationship</label>
        <select value={relationship} onChange={e => setRelationship(e.target.value)}
          style={{ width: "100%", padding: "14px 16px", borderRadius: 12, fontSize: 15,
            border: `1.5px solid ${C.border}`, background: C.bgCard, fontFamily: "inherit",
            color: relationship ? C.ink : C.soft, outline: "none", boxSizing: "border-box" }}>
          {[["","Select..."],["child","Son or daughter"],["spouse","Spouse or partner"],
            ["sibling","Brother or sister"],["grandchild","Grandchild"],["other","Other"]].map(([v,l]) => (
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
      <StepTitle eyebrow="Right now" title="Who's handling things?" />
      <Input label="Your name" placeholder="Your full name" value={yourName} onChange={setYourName} />
      <Input label="Your email" type="email" placeholder="your@email.com" value={yourEmail} onChange={setYourEmail} />
      <div style={{ display: "flex", gap: 12 }}>
        <Btn variant="ghost" onClick={() => setStep(0)}>← Back</Btn>
        <Btn onClick={() => setStep(2)} disabled={!yourName || !yourEmail}
          style={{ flex: 1, background: C.rose, boxShadow: `0 4px 20px ${C.rose}35` }}>
          Generate my task list →
        </Btn>
      </div>
    </StepCard>,

    <StepCard key={2} maxWidth={560}>
      <ProgressBar current={2} total={3} color={C.rose} />
      <StepTitle eyebrow={`For ${deceasedName.split(" ")[0] || "your loved one"}`}
        title="Your immediate task list"
        sub={`${yourName} — here's what needs to happen in the next 30 days.`} />
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
        {urgentTasks.map((t, i) => (
          <div key={i} style={{ background: t.urgent ? C.roseFaint : C.bgCard,
            border: `1px solid ${t.urgent ? C.rose + "40" : C.border}`,
            borderRadius: 12, padding: "13px 16px", display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{t.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.ink }}>{t.task}</div>
              <div style={{ fontSize: 11, color: t.urgent ? C.rose : C.amber, marginTop: 3, fontWeight: 600 }}>
                {t.urgent ? "⚡ " : "● "}{t.deadline}
              </div>
            </div>
          </div>
        ))}
      </div>
      <Btn onClick={onComplete} style={{ width: "100%", background: C.rose,
        boxShadow: `0 4px 20px ${C.rose}35`, padding: "17px", fontSize: 16 }}>
        Save this plan & activate →
      </Btn>
      <button onClick={onComplete} style={{ width: "100%", padding: "12px", background: "none",
        border: "none", fontSize: 13, color: C.soft, cursor: "pointer", fontFamily: "inherit", marginTop: 8 }}>
        Continue with free plan
      </button>
    </StepCard>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <Header />
      <div style={{ padding: "28px 20px 80px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%" }}>{steps[step]}</div>
      </div>
    </div>
  );
}

function Success({ emergency }) {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: C.bgCard, borderRadius: 24, padding: "48px 36px",
        maxWidth: 440, width: "100%", textAlign: "center",
        boxShadow: "0 2px 40px rgba(0,0,0,0.08)" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%",
          background: emergency ? C.roseFaint : C.sageFaint,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 32, margin: "0 auto 24px" }}>
          🕊️
        </div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 26, color: C.ink, marginBottom: 12 }}>
          {emergency ? "Your plan is live." : "Your file is ready."}
        </div>
        <div style={{ fontSize: 14, color: C.mid, lineHeight: 1.75, marginBottom: 28 }}>
          {emergency
            ? "Your task list is active. Your family has what they need. Take a breath."
            : "Your family will never have to guess. When the time comes, everything is waiting for them."}
        </div>
        <div style={{ fontSize: 13, color: C.sage, fontWeight: 600 }}>
          Welcome to Passage. 🕊️
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("landing");
  return (
    <>
      {view === "landing" && <Landing onPlan={() => setView("plan")} onEmergency={() => setView("emergency")} />}
      {view === "plan" && <PlannedOnboarding onComplete={() => setView("success")} onBack={() => setView("landing")} />}
      {view === "emergency" && <EmergencyOnboarding onComplete={() => setView("success_e")} onBack={() => setView("landing")} />}
      {view === "success" && <Success emergency={false} />}
      {view === "success_e" && <Success emergency={true} />}
    </>
  );
}
