import { useState, useEffect } from "react";
import { supabase as sb } from "../lib/supabaseBrowser";
import Link from "next/link";
import { SiteFooter } from "../components/SiteChrome";

function Field({ label, value, onChange, placeholder, type }) {
  return (
    <div className="th-field">
      <div className="th-field-label">{label}</div>
      <input
        type={type || "text"}
        value={value}
        onChange={function(e) { onChange(e.target.value); }}
        placeholder={placeholder}
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
      body: JSON.stringify({ workflowId: workflow.id, triggerToken: token, confirmerName: cName, confirmerEmail: cEmail, confirmerRelationship: cRel }),
    }).then(function(r) { return r.json(); }).then(function(d) {
      setResult(d); setStep("done"); setBusy(false);
    }).catch(function() { setBusy(false); });
  }

  var dname = workflow ? (workflow.deceased_name || "your loved one") : "your loved one";
  var confirms = workflow ? (workflow.confirmed_by || []).length : 0;
  var required = workflow ? (workflow.confirmation_count || 2) : 2;

  function shell(content) {
    return (
      <main className="th-shell">
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,440;9..144,520&family=Inter:wght@400;500;600;700&display=swap');
          :root{
            --pine-950:#0A1F1A; --pine-900:#0F2A24; --pine-800:#153A31; --pine-700:#1C4A3E; --pine-600:#245A4B;
            --pine-100:#E7EFEA; --pine-50:#F2F6F3;
            --clay-700:#9A4F26; --clay-600:#B5622F; --clay-200:#EBC6A4; --clay-100:#F5E4D6; --clay-50:#FBF0E7;
            --bone-50:#FEFDFB; --bone-100:#FBF8F3; --bone-200:#F5F0E7; --bone-300:#EBE3D3; --bone-400:#DDD2BB;
            --ink-900:#1C1917; --ink-700:#3D372F; --ink-600:#5A5348; --ink-500:#79705F; --ink-400:#9A9081; --ink-300:#BEB6A8;
            --line:#E6DDCB; --line-soft:#EFE8DA;
            --r-xs:8px; --r-sm:12px; --r-md:18px; --r-lg:26px; --r-full:999px;
            --e1:0 1px 1px rgba(20,30,25,.03), 0 2px 4px rgba(20,30,25,.03);
            --e2:0 2px 6px rgba(20,30,25,.05), 0 10px 24px -8px rgba(20,30,25,.10);
            --ease:cubic-bezier(.22,1,.36,1);
          }
        `}</style>
        <style jsx global>{`
          .th-shell {
            min-height: 100vh;
            background: var(--bone-100);
            color: var(--ink-900);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            letter-spacing: -.005em;
          }
          .outer {
            min-height: calc(100vh - 94px);
            display: flex; align-items: center; justify-content: center;
            padding: 20px 16px;
          }
          .box {
            background: var(--bone-50);
            border: 1px solid var(--line-soft);
            border-radius: var(--r-lg);
            padding: 36px 28px;
            width: 100%;
            max-width: 480px;
            box-shadow: var(--e2);
          }
          .box.center { text-align: center; }
          .kicker { font-size: 11px; color: var(--clay-600); letter-spacing: .15em; text-transform: uppercase; margin-bottom: 12px; font-weight: 700; }
          .kicker.neutral { color: var(--ink-400); }
          .headline { font-family: 'Fraunces', serif; font-weight: 460; font-size: 22px; color: var(--pine-950); margin-bottom: 12px; letter-spacing: -.015em; }
          .body-text { font-size: 14px; color: var(--ink-600); line-height: 1.65; }
          .loading-text { text-align: center; color: var(--ink-400); }
          .action-stack { display: grid; gap: 9px; margin-top: 18px; }
          .th-btn {
            min-height: 44px; border-radius: var(--r-sm); display: flex; align-items: center; justify-content: center;
            text-decoration: none; font-weight: 700; font-family: 'Inter', sans-serif; font-size: 13.5px;
            border: 1px solid transparent;
          }
          .th-btn-primary { background: linear-gradient(155deg, var(--pine-600), var(--pine-800)); color: #fff; }
          .th-btn-secondary { background: var(--bone-50); color: var(--pine-700); border-color: var(--line); }
          .footnote { margin-top: 16px; font-size: 13px; color: var(--ink-400); }
          .headline-lg { font-family: 'Fraunces', serif; font-weight: 460; font-size: 22px; color: var(--ink-900); margin-bottom: 16px; letter-spacing: -.015em; }
        `}</style>
        <div className="outer">{content}</div>
        <SiteFooter />
      </main>
    );
  }

  if (step === "loading") return shell(<div className="box center loading-text">Loading...</div>);

  if (step === "error") return (
    shell(
      <div className="box center">
        <div className="kicker">Passage</div>
        <div className="headline">Link not found</div>
        <div className="body-text">This confirmation link is invalid or has expired. Open your assigned tasks, or ask the family coordinator to resend the confirmation request.</div>
        <div className="action-stack">
          <Link href="/participating" className="th-btn th-btn-primary">
            Open my assigned tasks
          </Link>
          <Link href="/contact?category=urgent" className="th-btn th-btn-secondary">
            Contact Passage
          </Link>
        </div>
      </div>
    )
  );

  if (step === "already") return (
    shell(
      <div className="box center">
        <div className="kicker">Confirmed</div>
        <div className="headline">Plan already activated</div>
        <div className="body-text">The estate plan for {dname} was activated. All assigned contacts have been notified.</div>
      </div>
    )
  );

  if (step === "done") return (
    shell(
      <div className="box center">
        <div className="kicker">Passage</div>
        <div className="headline-lg">{result && result.triggered ? "The plan has been activated." : "Confirmation received."}</div>
        <div className="body-text" style={{ lineHeight: 1.75 }}>
          {result && result.triggered
            ? "Both confirmations received. All assigned family and vendors have been notified with their tasks."
            : "Waiting for one more confirmation. Passage will notify everyone automatically when both confirmations arrive."}
        </div>
        <div className="footnote">We are so sorry for your loss.</div>
      </div>
    )
  );

  return (
    shell(
      <div className="box">
        <style jsx global>{`
          .lede-box { text-align: center; margin-bottom: 28px; }
          .lede-kicker { font-size: 11px; color: var(--ink-400); letter-spacing: .15em; text-transform: uppercase; margin-bottom: 8px; font-weight: 700; }
          .lede-title { font-family: 'Fraunces', serif; font-weight: 460; font-size: 22px; color: var(--pine-950); line-height: 1.32; margin-bottom: 14px; letter-spacing: -.015em; }
          .lede-note { background: var(--pine-50); border: 1px solid #D5E4DC; border-radius: var(--r-sm); padding: 12px 16px; font-size: 13px; color: var(--ink-600); line-height: 1.65; }
          .lede-note strong { color: var(--ink-900); }
          .progress-row { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
          .progress-bar { flex: 1; height: 6px; border-radius: 3px; background: var(--line-soft); }
          .progress-bar.filled { background: linear-gradient(155deg, var(--pine-600), var(--pine-800)); }
          .progress-count { font-size: 12px; color: var(--ink-500); white-space: nowrap; }
          .th-field { margin-bottom: 14px; }
          .th-field-label { font-size: 11px; font-weight: 700; color: var(--ink-400); text-transform: uppercase; letter-spacing: .1em; margin-bottom: 6px; }
          .th-field input {
            width: 100%; padding: 12px 14px; border-radius: var(--r-sm); border: 1.5px solid var(--line);
            font-family: 'Inter', sans-serif; font-size: 14px; color: var(--ink-900); outline: none;
            background: var(--bone-100); box-sizing: border-box;
          }
          .submit-btn {
            width: 100%; padding: 16px; border: none; border-radius: var(--r-md);
            font-size: 15px; font-weight: 700; font-family: 'Inter', sans-serif; margin-bottom: 14px;
            color: #fff; cursor: pointer;
            background: linear-gradient(155deg, var(--pine-600), var(--pine-800));
            box-shadow: 0 1px 2px rgba(15,42,36,.15), 0 8px 16px -6px rgba(15,42,36,.35);
          }
          .submit-btn:disabled { cursor: not-allowed; background: var(--ink-300); box-shadow: none; }
          .disclaimer { font-size: 11.5px; color: var(--ink-400); text-align: center; line-height: 1.65; }
          .divider-footer { border-top: 1px solid var(--line-soft); margin-top: 24px; padding-top: 16px; text-align: center; font-size: 11px; color: var(--ink-300); }
        `}</style>
        <div className="lede-box">
          <div className="lede-kicker">Passage</div>
          <div className="lede-title">Confirming the passing of {dname}</div>
          <div className="lede-note">
            Once <strong>{required} people</strong> confirm, the estate plan activates and all assigned contacts are notified automatically.
          </div>
        </div>

        <div className="progress-row">
          {Array.from({ length: required }).map(function(_, i) {
            return <div key={i} className={i < confirms ? "progress-bar filled" : "progress-bar"} />;
          })}
          <div className="progress-count">{confirms}/{required}</div>
        </div>

        <Field label="Your name *" value={cName} onChange={setCName} placeholder="Your full name" />
        <Field label="Your email" value={cEmail} onChange={setCEmail} placeholder="your@email.com" type="email" />
        <Field label={"Relationship to " + dname} value={cRel} onChange={setCRel} placeholder="e.g. daughter, executor, spouse" />

        <button onClick={submit} disabled={!cName || busy} className="submit-btn">
          {busy ? "Confirming..." : "I confirm that " + dname + " has passed away"}
        </button>

        <div className="disclaimer">
          By confirming, you authorize Passage to activate the estate coordination plan on behalf of the family.
        </div>
        <div className="divider-footer">
          Passage &middot; thepassageapp.io
        </div>
      </div>
    )
  );
}
