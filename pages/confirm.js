import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const INK = "#1a1916";
const MID = "#6a6560";
const SOFT = "#a09890";
const MUTED = "#c5bdb5";
const BORDER = "#e4ddd4";
const BG = "#f6f3ee";
const CARD = "#ffffff";
const SUBTLE = "#f0ece5";
const SAGE = "#6b8f71";

function Field({ label, value, onChange, placeholder, type }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: SOFT, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{label}</div>
      <input
        type={type || "text"}
        value={value}
        onChange={function(e) { onChange(e.target.value); }}
        placeholder={placeholder}
        style={{ width: "100%", padding: "12px 14px", borderRadius: 11, border: "1.5px solid " + BORDER, fontFamily: "Georgia, serif", fontSize: 14, color: INK, outline: "none", boxSizing: "border-box" }}
      />
    </div>
  );
}

export default function ConfirmPage() {
  var s = useState(null); var token = s[0]; var setToken = s[1];
  var s2 = useState(null); var workflow = s2[0]; var setWorkflow = s2[1];
  var s3 = useState("loading"); var step = s3[0]; var setStep = s3[1];
  var s4 = useState(""); var cName = s4[0]; var setCName = s4[1];
  var s5 = useState(""); var cEmail = s5[0]; var setCEmail = s5[1];
  var s6 = useState(""); var cRel = s6[0]; var setCRel = s6[1];
  var s7 = useState(false); var busy = s7[0]; var setBusy = s7[1];
  var s8 = useState(null); var result = s8[0]; var setResult = s8[1];

  useEffect(function() {
    var p = new URLSearchParams(window.location.search);
    var t = p.get("token");
    setToken(t);
    if (!t) { setStep("error"); return; }
    sb.from("workflows")
      .select("id, name, deceased_name, status, confirmed_by, confirmation_count")
      .eq("trigger_token", t)
      .single()
      .then(function(res) {
        if (res.error || !res.data) { setStep("error"); return; }
        setWorkflow(res.data);
        setStep(res.data.status === "triggered" ? "already" : "enter");
      });
  }, []);

  function submit() {
    if (!cName || busy) return;
    setBusy(true);
    fetch("/api/confirmTrigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflowId: workflow.id, confirmerName: cName, confirmerEmail: cEmail, confirmerRelationship: cRel }),
    }).then(function(r) { return r.json(); }).then(function(d) {
      setResult(d); setStep("done"); setBusy(false);
    }).catch(function() { setBusy(false); });
  }

  var dname = workflow ? (workflow.deceased_name || "your loved one") : "your loved one";
  var confirms = workflow ? (workflow.confirmed_by || []).length : 0;
  var required = workflow ? (workflow.confirmation_count || 2) : 2;

  var outer = { background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 16px", fontFamily: "Georgia, serif" };
  var box = { background: CARD, borderRadius: 20, padding: "36px 28px", width: "100%", maxWidth: 480, boxShadow: "0 4px 32px rgba(0,0,0,0.08)" };

  if (step === "loading") return <div style={outer}><div style={Object.assign({}, box, { textAlign: "center", color: SOFT })}>Loading...</div></div>;

  if (step === "error") return (
    <div style={outer}>
      <div style={Object.assign({}, box, { textAlign: "center" })}>
        <div style={{ fontSize: 34, marginBottom: 16 }}>🕊️</div>
        <div style={{ fontSize: 20, color: INK, marginBottom: 12 }}>Link not found</div>
        <div style={{ fontSize: 14, color: MID, lineHeight: 1.65 }}>This confirmation link is invalid or has expired. Please contact the family coordinator.</div>
      </div>
    </div>
  );

  if (step === "already") return (
    <div style={outer}>
      <div style={Object.assign({}, box, { textAlign: "center" })}>
        <div style={{ fontSize: 34, marginBottom: 16 }}>✅</div>
        <div style={{ fontSize: 20, color: INK, marginBottom: 12 }}>Plan already activated</div>
        <div style={{ fontSize: 14, color: MID, lineHeight: 1.65 }}>The estate plan for {dname} was activated. All assigned contacts have been notified.</div>
      </div>
    </div>
  );

  if (step === "done") return (
    <div style={outer}>
      <div style={Object.assign({}, box, { textAlign: "center" })}>
        <div style={{ fontSize: 42, marginBottom: 16 }}>🕊️</div>
        <div style={{ fontSize: 22, color: INK, marginBottom: 16 }}>{result && result.triggered ? "The plan has been activated." : "Confirmation received."}</div>
        <div style={{ fontSize: 14, color: MID, lineHeight: 1.75 }}>
          {result && result.triggered
            ? "Both confirmations received. All assigned family and vendors have been notified with their tasks."
            : "Waiting for one more confirmation. Passage will notify everyone automatically when both confirmations arrive."}
        </div>
        <div style={{ marginTop: 16, fontSize: 13, color: SOFT }}>We are so sorry for your loss.</div>
      </div>
    </div>
  );

  return (
    <div style={outer}>
      <div style={box}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🕊️</div>
          <div style={{ fontSize: 11, color: SOFT, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>Passage</div>
          <div style={{ fontSize: 22, color: INK, lineHeight: 1.35, marginBottom: 14 }}>Confirming the passing of {dname}</div>
          <div style={{ background: SUBTLE, borderRadius: 12, padding: "12px 16px", fontSize: 13, color: MID, lineHeight: 1.65 }}>
            Once <strong style={{ color: INK }}>{required} people</strong> confirm, the estate plan activates and all assigned contacts are notified automatically.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          {Array.from({ length: required }).map(function(_, i) {
            return <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i < confirms ? SAGE : BORDER }} />;
          })}
          <div style={{ fontSize: 12, color: MID, whiteSpace: "nowrap" }}>{confirms}/{required}</div>
        </div>

        <Field label="Your name *" value={cName} onChange={setCName} placeholder="Your full name" />
        <Field label="Your email" value={cEmail} onChange={setCEmail} placeholder="your@email.com" type="email" />
        <Field label={"Relationship to " + dname} value={cRel} onChange={setCRel} placeholder="e.g. daughter, executor, spouse" />

        <button onClick={submit} disabled={!cName || busy}
          style={{ width: "100%", padding: "16px", background: (!cName || busy) ? MUTED : SAGE, color: "#fff", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: !cName ? "not-allowed" : "pointer", fontFamily: "Georgia, serif", marginBottom: 14 }}>
          {busy ? "Confirming..." : "I confirm that " + dname + " has passed away"}
        </button>

        <div style={{ fontSize: 11.5, color: SOFT, textAlign: "center", lineHeight: 1.65 }}>
          By confirming, you authorize Passage to activate the estate coordination plan on behalf of the family.
        </div>
        <div style={{ borderTop: "1px solid " + BORDER, marginTop: 24, paddingTop: 16, textAlign: "center", fontSize: 11, color: MUTED }}>
          Passage · thepassageapp.io
        </div>
      </div>
    </div>
  );
}
