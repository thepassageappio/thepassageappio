import { useState, useEffect } from "react";
import { supabase as sb } from "../lib/supabaseBrowser";
import { SiteFooter } from "../components/SiteChrome";

var NL = String.fromCharCode(10);

var INK = "#1a1916";
var MID = "#6a6560";
var SOFT = "#a09890";
var BORDER = "#e4ddd4";
var BG = "#f6f3ee";
var CARD = "#ffffff";
var SUBTLE = "#f0ece5";
var SAGE = "#6b8f71";
var SAGE_FAINT = "#f0f5f1";
var SAGE_LIGHT = "#c8deca";
var ROSE = "#c47a7a";
var GOLD = "#c49a3a";
var GOLD_FAINT = "#fdf8ee";
var BLUE = "#1877F2";
var BLUE_FAINT = "#f0f4ff";
var LI_BLUE = "#0A66C2";
var TWITTER = "#000000";
var IG = "#E1306C";

var PLATFORMS = [
  { id: "email", label: "Email", color: SAGE, bgColor: SAGE_FAINT, limit: 5000 },
  { id: "facebook", label: "Facebook", color: BLUE, bgColor: BLUE_FAINT, limit: 63206 },
  { id: "linkedin", label: "LinkedIn", color: LI_BLUE, bgColor: "#f0f4ff", limit: 3000 },
  { id: "twitter", label: "X / Twitter", color: TWITTER, bgColor: "#f0f0f0", limit: 280 },
  { id: "instagram", label: "Instagram", color: IG, bgColor: "#fff0f5", limit: 2200 },
  { id: "sms", label: "Text message", color: SAGE, bgColor: SAGE_FAINT, limit: 300 },
];

function cleanCell(value) {
  var text = String(value || "").replace(/\r/g, " ").replace(/\n/g, " ").trim();
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  return text;
}

function csvEscape(value) {
  var text = cleanCell(value);
  return '"' + text.replace(/"/g, '""') + '"';
}

function parseRecipients(raw) {
  var seen = {};
  return String(raw || "")
    .split(/\n+/)
    .map(function(line) {
      var text = line.trim();
      if (!text) return null;
      var emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
      var phoneMatch = text.match(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/);
      var email = emailMatch ? emailMatch[0].toLowerCase() : "";
      var phone = phoneMatch ? phoneMatch[0].replace(/[^\d+]/g, "") : "";
      var name = text
        .replace(emailMatch ? emailMatch[0] : "", "")
        .replace(phoneMatch ? phoneMatch[0] : "", "")
        .replace(/[<>,;|]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (!name) name = email || phone || "Recipient";
      var key = email || phone || name.toLowerCase();
      if (seen[key]) return null;
      seen[key] = true;
      return { name: name, email: email, phone: phone, raw: text };
    })
    .filter(Boolean);
}

function downloadText(filename, text) {
  var blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildTexts(dn, cn, events) {
  var dn2 = dn || "your loved one";
  var cn2 = cn || "the family";

  function fmtDate(d, t) {
    if (!d) return "";
    var dt = new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    return t ? dt + " at " + t : dt;
  }

  function labelFor(e) {
    var type = String(e.event_type || e.type || "").toLowerCase();
    if (type === "pronouncement") return "Official pronouncement";
    if (type === "release") return "Release / pickup";
    if (type === "arrangement") return "Arrangement meeting";
    if (type === "visitation" || type === "wake") return "Wake / visitation";
    if (type === "funeral" || type === "service") return "Funeral / memorial service";
    if (type === "burial" || type === "committal") return "Burial / committal";
    if (type === "cremation" || type === "crematorium") return "Cremation / crematorium";
    if (type === "shiva") return "Shiva / mourning period";
    if (type === "reception") return "Reception / gathering";
    if (type === "obituary_deadline") return "Obituary deadline";
    return e.name || e.title || "Service detail";
  }

  var lines = [];
  if (events) {
    events.forEach(function(e) {
      var label = labelFor(e);
      if (e.date) {
        lines.push(label + ": " + fmtDate(e.date, e.time) + (e.location_name ? " at " + e.location_name : "") + (e.location_address ? " — " + e.location_address : ""));
      }
    });
  }

  var serviceBlock = lines.length > 0 ? NL + NL + lines.join(NL) : "";

  var onePager = buildEventOnePager(dn2, cn2, events);

  var email = onePager;

  var facebook = [
    "It is with deep sadness that we share the passing of " + dn2 + ". " + dn2 + " was deeply loved and will be forever in our hearts." + serviceBlock,
    "In lieu of flowers, the family welcomes your thoughts, memories, and prayers.",
    "With love," + NL + cn2,
  ].join(NL + NL);

  var linkedin = [
    "We share with heavy hearts the passing of " + dn2 + "." + serviceBlock,
    "We are grateful for your kindness and support during this time.",
    "— " + cn2,
  ].join(NL + NL);

  var base = dn2 + " passed away peacefully. We are sharing the news with all who knew and loved " + dn2 + ".";
  var twitter = base.length > 260 ? "We are heartbroken to share the passing of " + dn2 + ". Service details to follow." : base;

  var instagram = ["Forever in our hearts.", dn2 + " — loved beyond measure, missed beyond words." + serviceBlock, "#InMemory #ForeverLoved"].join(NL + NL);

  var funeral = events && events.find(function(e) { return e.event_type === "funeral" || e.event_type === "service"; });
  var smsService = funeral && funeral.date ? " The service is " + fmtDate(funeral.date, funeral.time) + (funeral.location_name ? " at " + funeral.location_name : "") + "." : "";
  var sms = "Hi, this is " + cn2 + ". We wanted to let you know that " + dn2 + " has passed away." + smsService + " Our family is grateful for your love and support.";

  return { email: email, facebook: facebook, linkedin: linkedin, twitter: twitter, instagram: instagram, sms: sms, onePager: onePager };
}

function formatEventDate(d, t) {
  if (!d) return "";
  var dt = new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  return t ? dt + " at " + t : dt;
}

function readableEventLabel(e) {
  var type = String(e.event_type || e.type || "").toLowerCase();
  if (type === "pronouncement") return "Official pronouncement";
  if (type === "release") return "Release / pickup";
  if (type === "arrangement") return "Arrangement meeting";
  if (type === "visitation" || type === "wake") return "Wake / visitation";
  if (type === "funeral" || type === "service") return "Funeral / memorial service";
  if (type === "burial" || type === "committal") return "Burial / committal";
  if (type === "cremation" || type === "crematorium") return "Cremation / crematorium";
  if (type === "shiva") return "Shiva / mourning period";
  if (type === "reception") return "Reception / gathering";
  if (type === "obituary_deadline") return "Obituary deadline";
  return e.name || e.title || "Service detail";
}

function buildEventOnePager(dn, cn, events) {
  var dname = dn || "your loved one";
  var family = cn || "the family";
  var eventLines = (events || []).filter(function(e) { return e.date || e.time || e.location_name || e.location_address || e.notes || e.description; }).map(function(e) {
    var when = [formatEventDate(e.date, e.time), e.location_name, e.location_address].filter(Boolean).join(" - ");
    var detail = e.notes || e.description || "";
    return readableEventLabel(e) + (when ? ": " + when : "") + (detail ? NL + "  " + detail : "");
  });
  var intro = [
    "We are sharing the current service and gathering details for " + dname + ".",
    "These details may be updated as the family and funeral home confirm final arrangements.",
    "Thank you for supporting " + family + " with patience, care, and love.",
  ].join(" ");
  return [
    "Service and gathering details for " + dname,
    "",
    intro,
    "",
    eventLines.length ? eventLines.join(NL + NL) : "Service dates, locations, and times are still being confirmed.",
    "",
    "With love,",
    family,
  ].join(NL);
}

function Inp(props) {
  return (
    <div style={{ marginBottom: 14 }}>
      {props.label && <div style={{ fontSize: 11, fontWeight: 500, color: SOFT, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>{props.label}</div>}
      <textarea
        value={props.value}
        onChange={function(e) { props.onChange(e.target.value); }}
        rows={props.rows || 5}
        style={{ width: "100%", padding: "12px", borderRadius: 11, border: "1.5px solid " + (props.overLimit ? ROSE : BORDER), fontFamily: "Georgia, serif", fontSize: 13, color: INK, lineHeight: 1.65, resize: "vertical", boxSizing: "border-box", background: SUBTLE }}
      />
      {props.limit && <div style={{ fontSize: 11, color: props.value && props.value.length > props.limit ? ROSE : SOFT, textAlign: "right", marginTop: 3 }}>{props.value ? props.value.length : 0}/{props.limit}</div>}
    </div>
  );
}

export default function SharePage() {
  var s1 = useState(null); var wf = s1[0]; var setWf = s1[1];
  var s2 = useState([]); var events = s2[0]; var setEvents = s2[1];
  var s3 = useState("facebook"); var tab = s3[0]; var setTab = s3[1];
  var s4 = useState(null); var texts = s4[0]; var setTexts = s4[1];
  var s5 = useState(""); var master = s5[0]; var setMaster = s5[1];
  var s6 = useState("compose"); var step = s6[0]; var setStep = s6[1];
  var s7 = useState(false); var saving = s7[0]; var setSaving = s7[1];
  var s8 = useState(null); var copied = s8[0]; var setCopied = s8[1];
  var s9 = useState(false); var loaded = s9[0]; var setLoaded = s9[1];
  var s10 = useState(""); var toastMsg = s10[0]; var setToastMsg = s10[1];
  var s11 = useState(""); var recipientsText = s11[0]; var setRecipientsText = s11[1];

  useEffect(function() {
    var params = new URLSearchParams(window.location.search);
    var wid = params.get("wid");
    var dn = params.get("dn");
    var cn = params.get("cn");

    if (wid && wid.length > 5) {
      sb.from("workflows").select("*").eq("id", wid).single().then(function(r) {
        var data = r.data || { deceased_name: dn, coordinator_name: cn, id: wid };
        setWf(data);
        Promise.all([
          sb.from("workflow_events").select("*").eq("workflow_id", wid).order("date"),
          sb.from("estate_events").select("*").eq("estate_id", wid).not("date", "is", null).order("date"),
        ]).then(function(results) {
          var workflowEvents = results[0].data || [];
          var estateEvents = results[1].data || [];
          var seen = {};
          var evts = workflowEvents.concat(estateEvents).filter(function(event) {
            var key = [event.event_type || event.type || event.name || event.title, event.date || "", event.time || "", event.location_name || ""].join("|");
            if (seen[key]) return false;
            seen[key] = true;
            return true;
          }).sort(function(a, b) { return String(a.date || "").localeCompare(String(b.date || "")); });
          setEvents(evts);
          var dname = data.deceased_name || dn || "your loved one";
          var cname = data.coordinator_name || cn || "the family";
          var dflt = buildTexts(dname, cname, evts);
          setTexts(dflt);
          var mstr = "It is with deep sadness that we share the passing of " + dname + ". " + dname + " was deeply loved and will be forever in our hearts. Our family is grateful for your love, support, and prayers during this time.";
          setMaster(mstr);
          setLoaded(true);
        });
      });
    } else {
      var dname = dn || "your loved one";
      var cname = cn || "the family";
      var dflt = buildTexts(dname, cname, []);
      setTexts(dflt);
      setMaster("It is with deep sadness that we share the passing of " + dname + ".");
      setWf({ deceased_name: dname, coordinator_name: cname });
      setLoaded(true);
    }
  }, []);

  function reformat() {
    if (!master.trim()) return;
    var evts = events;
    var dn2 = wf ? (wf.deceased_name || "") : "";
    var short = master.length > 260 ? master.slice(0, 240) + "..." : master;
    var dflt = buildTexts(dn2, wf ? (wf.coordinator_name || "") : "", evts);
    var svcAppend = dflt.facebook.indexOf("Service") > -1 ? NL + NL + dflt.facebook.split(NL + NL).slice(1).join(NL + NL) : "";
    setTexts({
      email: dflt.email,
      facebook: master + svcAppend,
      linkedin: master,
      twitter: short,
      instagram: master.slice(0, 200) + (master.length > 200 ? "..." : "") + NL + NL + "#InMemory #ForeverLoved",
      sms: master.slice(0, 280),
      onePager: dflt.onePager,
    });
    setToastMsg("All platforms updated from your text.");
    setTimeout(function() { setToastMsg(""); }, 3000);
  }

  function updateText(platformId, val) {
    var updated = Object.assign({}, texts);
    updated[platformId] = val;
    setTexts(updated);
  }

  function save() {
    setSaving(true);
    var wid = wf ? wf.id : null;
    if (wid) {
      fetch("/api/handleEvent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "share_triggered",
          payload: {
            workflowId: wid,
            masterText: master,
            emailText: texts.email,
            facebookText: texts.facebook,
            linkedinText: texts.linkedin,
            twitterText: texts.twitter,
            instagramText: texts.instagram,
            smsText: texts.sms,
            onePagerText: texts.onePager,
          },
        }),
      }).then(function() {
        setSaving(false);
        setStep("share");
      }).catch(function() {
        setSaving(false);
        setStep("share");
      });
    } else {
      setSaving(false);
      setStep("share");
    }
  }

  function share(platformId) {
    var txt = texts ? (texts[platformId] || "") : "";
    var url = typeof window !== "undefined" ? window.location.origin : "https://www.thepassageapp.io";
    if (platformId === "email") {
      window.location.href = "mailto:?subject=" + encodeURIComponent("Service details for " + (wf && wf.deceased_name ? wf.deceased_name : "our loved one")) + "&body=" + encodeURIComponent(txt);
    } else if (platformId === "facebook") {
      window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url) + "&quote=" + encodeURIComponent(txt.slice(0, 500)), "_blank", "width=600,height=500");
    } else if (platformId === "linkedin") {
      window.open("https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(url) + "&summary=" + encodeURIComponent(txt.slice(0, 700)), "_blank", "width=600,height=500");
    } else if (platformId === "twitter") {
      window.open("https://twitter.com/intent/tweet?text=" + encodeURIComponent(txt.slice(0, 270)), "_blank", "width=600,height=400");
    } else {
      navigator.clipboard.writeText(txt).then(function() {
        setCopied(platformId);
        setTimeout(function() { setCopied(null); }, 2500);
      });
    }
  }

  var outer = { background: BG, minHeight: "100vh", fontFamily: "Georgia, serif" };
  var nav = { background: CARD, borderBottom: "1px solid " + BORDER, padding: "13px 20px", display: "flex", alignItems: "center", gap: 10 };

  if (!loaded) {
    return <div style={outer}><div style={nav}><div style={{ width: 22, height: 22, borderRadius: "50%", background: "radial-gradient(circle, " + SAGE_LIGHT + ", " + SAGE + "70)" }} /><span style={{ fontSize: 16, color: INK }}>Passage</span></div><div style={{ padding: 40, color: SOFT, textAlign: "center" }}>Loading...</div><SiteFooter /></div>;
  }

  function recipientRows() {
    return parseRecipients(recipientsText);
  }

  function copyText(value, label) {
    navigator.clipboard.writeText(value || "").then(function() {
      setCopied(label);
      setToastMsg(label + " copied.");
      setTimeout(function() { setCopied(null); setToastMsg(""); }, 2400);
    }).catch(function() {
      setToastMsg("Copy failed. Select the text and copy it manually.");
      setTimeout(function() { setToastMsg(""); }, 3000);
    });
  }

  function exportRecipientCsv() {
    var rows = recipientRows();
    var csv = [
      ["name", "email", "phone", "channel", "announcement_subject", "email_body", "sms_body"].map(csvEscape).join(",")
    ].concat(rows.map(function(r) {
      var channel = r.email ? "email" : r.phone ? "sms" : "manual";
      return [
        r.name,
        r.email,
        r.phone,
        channel,
        "Service details for " + (wf && wf.deceased_name ? wf.deceased_name : "our loved one"),
        texts && texts.email ? texts.email : "",
        texts && texts.sms ? texts.sms : "",
      ].map(csvEscape).join(",");
    })).join(NL);
    downloadText("passage-announcement-recipients.csv", csv);
    setToastMsg("Recipient CSV prepared. Nothing was sent.");
    setTimeout(function() { setToastMsg(""); }, 3000);
  }

  var dn = wf ? (wf.deceased_name || "your loved one") : "your loved one";
  var parsedRecipients = recipientRows();
  var recipientEmails = parsedRecipients.filter(function(r) { return r.email; }).map(function(r) { return r.email; });
  var recipientPhones = parsedRecipients.filter(function(r) { return r.phone; }).map(function(r) { return r.phone; });

  return (
    <div style={outer}>
      <div style={nav}>
        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "radial-gradient(circle, " + SAGE_LIGHT + ", " + SAGE + "70)" }} />
        <span style={{ fontSize: 16, color: INK }}>Passage</span>
        <span style={{ fontSize: 12, color: SOFT, marginLeft: 8 }}>Share the news</span>
      </div>

      {toastMsg && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: SAGE, color: "#fff", borderRadius: 12, padding: "11px 20px", fontSize: 13, fontWeight: 600, zIndex: 999, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
          {toastMsg}
        </div>
      )}

      <div style={{ maxWidth: 580, margin: "0 auto", padding: "24px 16px 60px" }}>

        {step === "compose" && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 22, color: INK, marginBottom: 6 }}>Share the news about {dn}</div>
              <div style={{ fontSize: 13, color: MID, lineHeight: 1.6 }}>Write your announcement once. Passage formats it for every platform.</div>
            </div>

            {events.length === 0 && (
              <div style={{ background: GOLD_FAINT, border: "1px solid " + GOLD + "40", borderRadius: 11, padding: "11px 14px", fontSize: 12, color: GOLD, marginBottom: 16, lineHeight: 1.55 }}>
                Add service details (date, time, location) from the task list and they will appear in your announcements automatically.
              </div>
            )}

            {texts && texts.onePager && (
              <div style={{ background: CARD, border: "1px solid " + BORDER, borderRadius: 14, padding: 14, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: SAGE, textTransform: "uppercase", letterSpacing: "0.12em" }}>Passage prepared one-pager</div>
                    <div style={{ fontSize: 16, color: INK, fontWeight: 700, marginTop: 2 }}>Service details to send once.</div>
                  </div>
                  <button onClick={function() { navigator.clipboard.writeText(texts.onePager); setCopied("onePager"); setTimeout(function() { setCopied(null); }, 2200); }} style={{ border: "1px solid " + SAGE_LIGHT, background: SAGE_FAINT, color: SAGE, borderRadius: 10, padding: "8px 10px", fontFamily: "inherit", fontWeight: 700, cursor: "pointer" }}>
                    {copied === "onePager" ? "Copied" : "Copy"}
                  </button>
                </div>
                <div style={{ whiteSpace: "pre-wrap", background: SUBTLE, borderRadius: 11, padding: 12, color: MID, fontSize: 12.5, lineHeight: 1.55, maxHeight: 240, overflow: "auto" }}>{texts.onePager}</div>
              </div>
            )}

            <div style={{ background: CARD, border: "1px solid " + BORDER, borderRadius: 14, padding: 14, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: SAGE, textTransform: "uppercase", letterSpacing: "0.12em" }}>Announcement list</div>
                  <div style={{ fontSize: 16, color: INK, fontWeight: 700, marginTop: 2 }}>One message for many people.</div>
                  <div style={{ fontSize: 12.5, color: MID, lineHeight: 1.55, marginTop: 5 }}>Paste names with emails or phone numbers. Passage prepares the batch, recipient CSV, and copy blocks. This page does not send real email or SMS.</div>
                </div>
                <div style={{ flexShrink: 0, background: SAGE_FAINT, border: "1px solid " + SAGE_LIGHT, borderRadius: 11, padding: "8px 10px", color: SAGE, fontSize: 12, fontWeight: 800, textAlign: "center", whiteSpace: "nowrap" }}>
                  {parsedRecipients.length} people
                </div>
              </div>
              <textarea
                value={recipientsText}
                onChange={function(e) { setRecipientsText(e.target.value); }}
                rows={4}
                placeholder={"Jane Doe jane@example.com\nMichael Smith 555-555-1212\nAunt Linda linda@example.com"}
                style={{ width: "100%", padding: "12px", borderRadius: 11, border: "1.5px solid " + BORDER, fontFamily: "Georgia, serif", fontSize: 13, color: INK, lineHeight: 1.55, resize: "vertical", boxSizing: "border-box", background: SUBTLE }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginTop: 10 }}>
                <div style={{ background: SAGE_FAINT, border: "1px solid " + SAGE_LIGHT, borderRadius: 10, padding: "8px 10px", fontSize: 12, color: SAGE, fontWeight: 800 }}>{recipientEmails.length} email</div>
                <div style={{ background: GOLD_FAINT, border: "1px solid " + GOLD + "35", borderRadius: 10, padding: "8px 10px", fontSize: 12, color: GOLD, fontWeight: 800 }}>{recipientPhones.length} text</div>
                <div style={{ background: SUBTLE, border: "1px solid " + BORDER, borderRadius: 10, padding: "8px 10px", fontSize: 12, color: MID, fontWeight: 800 }}>{parsedRecipients.length - recipientEmails.length - recipientPhones.length} manual</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                <button disabled={!parsedRecipients.length} onClick={exportRecipientCsv} style={{ border: "1px solid " + SAGE_LIGHT, background: SAGE_FAINT, color: SAGE, borderRadius: 10, padding: "8px 10px", fontFamily: "inherit", fontWeight: 800, cursor: parsedRecipients.length ? "pointer" : "not-allowed", opacity: parsedRecipients.length ? 1 : 0.5 }}>Export recipient CSV</button>
                <button disabled={!recipientEmails.length} onClick={function() { copyText(recipientEmails.join(", "), "Email list"); }} style={{ border: "1px solid " + BORDER, background: CARD, color: MID, borderRadius: 10, padding: "8px 10px", fontFamily: "inherit", fontWeight: 800, cursor: recipientEmails.length ? "pointer" : "not-allowed", opacity: recipientEmails.length ? 1 : 0.5 }}>Copy email list</button>
                <button disabled={!recipientPhones.length} onClick={function() { copyText(recipientPhones.join(", "), "Text list"); }} style={{ border: "1px solid " + BORDER, background: CARD, color: MID, borderRadius: 10, padding: "8px 10px", fontFamily: "inherit", fontWeight: 800, cursor: recipientPhones.length ? "pointer" : "not-allowed", opacity: recipientPhones.length ? 1 : 0.5 }}>Copy text list</button>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: SOFT, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>Your announcement</div>
              <textarea
                value={master}
                onChange={function(e) { setMaster(e.target.value); }}
                rows={5}
                style={{ width: "100%", padding: "12px", borderRadius: 11, border: "1.5px solid " + BORDER, fontFamily: "Georgia, serif", fontSize: 13.5, color: INK, lineHeight: 1.7, resize: "vertical", boxSizing: "border-box", background: SUBTLE }}
              />
              <button onClick={reformat} style={{ fontSize: 12, color: SAGE, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", marginTop: 4, padding: 0 }}>
                Reformat all platforms from this text
              </button>
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: SOFT, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Preview and edit by platform</div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
                {PLATFORMS.map(function(p) {
                  var isActive = tab === p.id;
                  var txt = texts ? (texts[p.id] || "") : "";
                  var over = txt.length > p.limit;
                  return (
                    <button key={p.id} onClick={function() { setTab(p.id); }}
                      style={{ padding: "6px 12px", borderRadius: 18, border: "1.5px solid " + (isActive ? p.color : BORDER), background: isActive ? p.bgColor : CARD, fontSize: 12, fontWeight: 600, color: isActive ? p.color : MID, cursor: "pointer", fontFamily: "inherit" }}>
                      {p.label}{over ? " !" : ""}
                    </button>
                  );
                })}
              </div>

              {PLATFORMS.map(function(p) {
                if (p.id !== tab) return null;
                var txt = texts ? (texts[p.id] || "") : "";
                var over = txt.length > p.limit;
                return (
                  <div key={p.id}>
                    {p.id === "instagram" && <div style={{ fontSize: 11, color: SOFT, marginBottom: 6 }}>Instagram does not support direct web sharing. This will be copied to your clipboard — paste it into Instagram.</div>}
                    {p.id === "sms" && <div style={{ fontSize: 11, color: SOFT, marginBottom: 6 }}>This will be copied to your clipboard — paste it into your messages app.</div>}
                    <Inp value={txt} onChange={function(v) { updateText(p.id, v); }} rows={p.id === "twitter" || p.id === "sms" ? 4 : 8} limit={p.limit} overLimit={over} />
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={function() { window.history.back(); }} style={{ padding: "11px 18px", borderRadius: 12, border: "1.5px solid " + BORDER, background: CARD, fontSize: 13, color: MID, cursor: "pointer", fontFamily: "inherit" }}>
                Cancel
              </button>
              <button onClick={save} disabled={saving || !master.trim()} style={{ flex: 1, padding: "11px", borderRadius: 12, border: "none", background: saving ? SOFT : SAGE, color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                {saving ? "Saving..." : "Save and share"}
              </button>
            </div>
          </>
        )}

        {step === "share" && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 22, color: INK, marginBottom: 6 }}>Share on each platform</div>
              <div style={{ fontSize: 13, color: MID }}>Your announcement is saved. Tap each platform to share.</div>
            </div>

            {parsedRecipients.length > 0 && (
              <div style={{ background: CARD, border: "1px solid " + BORDER, borderRadius: 14, padding: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: SAGE, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 5 }}>Recipient batch</div>
                <div style={{ fontSize: 15, color: INK, fontWeight: 700, marginBottom: 6 }}>{parsedRecipients.length} people prepared. Nothing was sent.</div>
                <div style={{ fontSize: 12.5, color: MID, lineHeight: 1.55, marginBottom: 10 }}>Use this for the practical "tell 300 people once" use case: copy the email list, copy the text list, or export the CSV for review before any real delivery system is enabled.</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={exportRecipientCsv} style={{ border: "1px solid " + SAGE_LIGHT, background: SAGE_FAINT, color: SAGE, borderRadius: 10, padding: "8px 10px", fontFamily: "inherit", fontWeight: 800, cursor: "pointer" }}>Export CSV</button>
                  <button disabled={!recipientEmails.length} onClick={function() { copyText(recipientEmails.join(", "), "Email list"); }} style={{ border: "1px solid " + BORDER, background: CARD, color: MID, borderRadius: 10, padding: "8px 10px", fontFamily: "inherit", fontWeight: 800, cursor: recipientEmails.length ? "pointer" : "not-allowed", opacity: recipientEmails.length ? 1 : 0.5 }}>Copy {recipientEmails.length} emails</button>
                  <button disabled={!recipientPhones.length} onClick={function() { copyText(recipientPhones.join(", "), "Text list"); }} style={{ border: "1px solid " + BORDER, background: CARD, color: MID, borderRadius: 10, padding: "8px 10px", fontFamily: "inherit", fontWeight: 800, cursor: recipientPhones.length ? "pointer" : "not-allowed", opacity: recipientPhones.length ? 1 : 0.5 }}>Copy {recipientPhones.length} texts</button>
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {PLATFORMS.map(function(p) {
                var isCopied = copied === p.id;
                var needsCopy = p.id === "instagram" || p.id === "sms";
                var lbl = isCopied ? "Copied!" : needsCopy ? "Copy for " + p.label : "Share on " + p.label;
                var txt = texts ? (texts[p.id] || "") : "";
                return (
                  <button key={p.id} onClick={function() { share(p.id); }}
                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 13, border: "1.5px solid " + (isCopied ? SAGE_LIGHT : BORDER), background: isCopied ? SAGE_FAINT : CARD, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: p.bgColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, fontWeight: 900, color: p.color, fontFamily: "sans-serif" }}>
                      {p.id === "email" ? "Email" : p.id === "facebook" ? "f" : p.id === "linkedin" ? "in" : p.id === "twitter" ? "X" : p.id === "instagram" ? "Ig" : "SMS"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: INK }}>{lbl}</div>
                      <div style={{ fontSize: 11, color: SOFT, marginTop: 2 }}>{txt.slice(0, 65)}{txt.length > 65 ? "..." : ""}</div>
                    </div>
                    <span style={{ fontSize: 16, color: MID }}>{isCopied ? "✓" : needsCopy ? "⎘" : "→"}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ background: SAGE_FAINT, border: "1px solid " + SAGE_LIGHT, borderRadius: 11, padding: "12px 14px", fontSize: 12, color: MID, marginBottom: 18, lineHeight: 1.55 }}>
              Your announcement is saved. You can return here anytime to share again or update the text.
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={function() { setStep("compose"); }} style={{ padding: "11px 18px", borderRadius: 12, border: "1.5px solid " + BORDER, background: CARD, fontSize: 13, color: MID, cursor: "pointer", fontFamily: "inherit" }}>
                Edit text
              </button>
              <button onClick={function() { window.location.href = "/"; }} style={{ flex: 1, padding: "11px", borderRadius: 12, border: "none", background: SAGE, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Done
              </button>
            </div>
          </>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
