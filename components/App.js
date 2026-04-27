import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg: "#f6f3ee", bgCard: "#ffffff", bgSubtle: "#f0ece5", bgSage: "#e8eeea",
  bgDark: "#1e1e1a", ink: "#1a1916", mid: "#6a6560", soft: "#a09890",
  muted: "#c5bdb5", border: "#e4ddd4",
  sage: "#6b8f71", sageDark: "#4a6e50", sageLight: "#c8deca", sageFaint: "#f0f5f1",
  gold: "#b8945a", goldFaint: "#faf4eb",
  rose: "#c47a7a", roseFaint: "#fdf3f3",
  amber: "#b07a3a",
  red: "#c0392b", redFaint: "#fdf0ef",
  orange: "#d4651a", orangeFaint: "#fef3eb",
  yellow: "#c8941a", yellowFaint: "#fefaeb",
};

const TALLY_URL = "https://tally.so/r/q4Ev05";
const PROJECT_ID = "qsveqfchwylsbncsfgxe";

// ─── TASK DATA — 47 research-backed post-death tasks ─────────────────────────
const POST_DEATH_TASKS = [
  {
    tier: 1, tierLabel: "First 24 Hours", tierColor: C.red, tierBg: C.redFaint, icon: "🚨",
    tasks: [
      { id: "t1_01", title: "Obtain official pronouncement of death", desc: "From physician, hospice nurse, or coroner. Required before any other steps.", category: "legal" },
      { id: "t1_02", title: "Contact the funeral home", desc: "Arrange transportation of the body. Share any pre-documented wishes.", category: "service" },
      { id: "t1_03", title: "Notify immediate family members", desc: "Spouse, children, siblings, parents. Call — don't text for immediate family.", category: "notifications" },
      { id: "t1_04", title: "Secure the home and valuables", desc: "Lock the residence. Secure jewelry, cash, firearms, and important documents.", category: "property" },
      { id: "t1_05", title: "Locate the will and advance directives", desc: "Check home safe, filing cabinet, or attorney's office.", category: "legal" },
      { id: "t1_06", title: "Make arrangements for minor children and pets", desc: "Ensure children and pets are cared for immediately.", category: "personal" },
      { id: "t1_07", title: "Notify the executor of the estate", desc: "Inform them of the death and their legal responsibilities.", category: "legal" },
      { id: "t1_08", title: "Document the date, time, and location of death", desc: "Required on death certificates and all official documents.", category: "legal" },
      { id: "t1_09", title: "Notify hospice or home care providers", desc: "They need to retrieve equipment and close out care records.", category: "medical" },
    ]
  },
  {
    tier: 2, tierLabel: "First 72 Hours", tierColor: C.orange, tierBg: C.orangeFaint, icon: "⏰",
    tasks: [
      { id: "t2_01", title: "Order death certificates — minimum 15 copies", desc: "Banks, insurance, government, employers each require originals. ~$10–25 each.", category: "legal" },
      { id: "t2_02", title: "Notify close friends and extended family", desc: "Use a phone tree or designate someone to help spread the word.", category: "notifications" },
      { id: "t2_social", title: "Share the news on social media", desc: "Post an announcement on Facebook, Instagram, LinkedIn, and X so the wider community knows. Passage pre-writes the announcement for you.", category: "notifications", isSocial: true },
      { id: "t2_03", title: "Meet with funeral director to finalize arrangements", desc: "Confirm burial vs cremation, service type, casket or urn, date/time.", category: "service" },
      { id: "t2_04", title: "Draft and submit the obituary", desc: "Contact local newspapers. Most require 24–48 hour lead time.", category: "memorial" },
      { id: "t2_05", title: "Notify the deceased's employer", desc: "Contact HR for final paycheck, benefits continuation, employer life insurance.", category: "notifications" },
      { id: "t2_06", title: "Coordinate out-of-town family travel and lodging", desc: "Arrange flights, hotels, transportation for family traveling to service.", category: "logistics" },
      { id: "t2_07", title: "Select readings, music, and pallbearers", desc: "Coordinate with officiant and funeral director on service details.", category: "memorial" },
      { id: "t2_08", title: "Gather photos and memories for the service", desc: "Collect digital and print photos for slideshow, boards, and programs.", category: "memorial" },
      { id: "t2_09", title: "Plan the reception or post-service gathering", desc: "Determine location, catering, and designate someone to organize.", category: "logistics" },
      { id: "t2_10", title: "Notify the faith community or religious leader", desc: "Contact priest, rabbi, pastor, imam, or other officiant.", category: "notifications" },
      { id: "t2_11", title: "Contact the cemetery or crematorium", desc: "Confirm plot, interment date, and any fees or requirements.", category: "service" },
      { id: "t2_12", title: "Request an itemized funeral home contract", desc: "Federal law requires itemized pricing. Review before signing.", category: "legal" },
    ]
  },
  {
    tier: 3, tierLabel: "First Week", tierColor: C.yellow, tierBg: C.yellowFaint, icon: "📋",
    tasks: [
      { id: "t3_01", title: "Notify Social Security Administration", desc: "Call 1-800-772-1213. Survivor benefits may apply. Required within 10 days.", category: "government" },
      { id: "t3_02", title: "Notify primary bank and all financial institutions", desc: "Bring death certificates. Ask about joint accounts and automatic payments.", category: "financial" },
      { id: "t3_03", title: "Contact all life insurance companies to file claims", desc: "Required: certified death certificate, policy number, beneficiary ID.", category: "financial" },
      { id: "t3_04", title: "Contact estate attorney to begin probate process", desc: "Probate requirements vary by state. May be required to transfer assets.", category: "legal" },
      { id: "t3_05", title: "Notify pension and retirement account administrators", desc: "IRA, 401(k), pension plans. Beneficiaries must file claims — deadlines apply.", category: "financial" },
      { id: "t3_06", title: "Address health insurance for surviving family members", desc: "COBRA available. Must elect within 60 days of coverage loss.", category: "financial" },
      { id: "t3_07", title: "Notify Medicare and Medicaid if applicable", desc: "Required by law. May affect surviving spouse's coverage.", category: "government" },
      { id: "t3_08", title: "Contact Veterans Affairs if veteran", desc: "VA may provide burial benefits, survivor pension. Call 1-800-827-1000.", category: "government" },
      { id: "t3_09", title: "Cancel voter registration", desc: "Contact local board of elections. Prevents fraudulent use.", category: "government" },
      { id: "t3_10", title: "Set up mail forwarding or hold with USPS", desc: "Forward to executor's address. Bills will continue to arrive.", category: "logistics" },
      { id: "t3_11", title: "Secure digital accounts and retrieve important passwords", desc: "Access email, financial accounts, and cloud storage.", category: "digital" },
      { id: "t3_12", title: "Notify all credit card companies", desc: "Close individual accounts. Clarify joint account liability. Prevents fraud.", category: "financial" },
      { id: "t3_13", title: "Contact the DMV to cancel the driver's license", desc: "Some states require the physical license to be surrendered.", category: "government" },
      { id: "t3_14", title: "Collect contact info for thank you notes", desc: "List everyone who sent flowers, food, donations, or cards.", category: "personal" },
      { id: "t3_15", title: "Notify professional licensing boards if applicable", desc: "Medical, legal, or other licenses may need to be surrendered.", category: "government" },
    ]
  },
  {
    tier: 4, tierLabel: "First 30–60 Days", tierColor: C.sage, tierBg: C.sageFaint, icon: "📅",
    tasks: [
      { id: "t4_01", title: "Apply for Social Security survivor benefits", desc: "Surviving spouse (60+) or minor children may qualify. 60-day deadline is strict.", category: "government" },
      { id: "t4_02", title: "File for pension and annuity survivor benefits", desc: "Contact all pension plan administrators. Benefits vary by plan.", category: "financial" },
      { id: "t4_03", title: "Update or create a new will for surviving spouse", desc: "Death of spouse often invalidates prior estate plans. Consult attorney.", category: "legal" },
      { id: "t4_04", title: "Update beneficiary designations on all accounts", desc: "Retirement accounts, life insurance, POD accounts. Will does NOT override.", category: "financial" },
      { id: "t4_05", title: "Transfer vehicle titles with the DMV", desc: "Bring death certificate and current title. Requirements vary by state.", category: "property" },
      { id: "t4_06", title: "Begin real property transfer or sale process", desc: "Contact a real estate attorney or title company.", category: "property" },
      { id: "t4_07", title: "Cancel all subscriptions and recurring services", desc: "Streaming, magazines, memberships, gym, clubs, professional associations.", category: "digital" },
      { id: "t4_08", title: "Memorialize or close social media accounts", desc: "Facebook, Instagram, LinkedIn, X each have different processes.", category: "digital" },
      { id: "t4_09", title: "File the final income tax return", desc: "Required for year of death. Surviving spouse may file jointly.", category: "financial" },
      { id: "t4_10", title: "File estate tax return if applicable", desc: "Federal and some state estate taxes may apply.", category: "financial" },
      { id: "t4_11", title: "Notify the three credit bureaus", desc: "Equifax, Experian, TransUnion. Prevents new credit fraud.", category: "financial" },
      { id: "t4_12", title: "Arrange estate sale or donation of belongings", desc: "Contact an estate sale company or charity.", category: "property" },
      { id: "t4_13", title: "Cancel or surrender the passport", desc: "Submit to the Department of State with death certificate.", category: "government" },
      { id: "t4_14", title: "Notify professional and alumni associations", desc: "Bar association, medical board, alumni networks, clubs.", category: "notifications" },
      { id: "t4_15", title: "Establish a memorial fund or charitable giving option", desc: "Coordinate with charity for donations in lieu of flowers.", category: "memorial" },
      { id: "t4_16", title: "Send handwritten thank you notes", desc: "Acknowledge flowers, food, donations, and those who attended.", category: "personal" },
      { id: "t4_17", title: "Review and update home and auto insurance", desc: "Policies may need to be transferred or updated.", category: "financial" },
      { id: "t4_18", title: "Contact attorney about formally closing the estate", desc: "Once debts settled and assets distributed, formally close.", category: "legal" },
    ]
  }
];

const PEOPLE_ROLES = [
  { group: "Family", roles: ["Spouse / Partner", "Adult child", "Parent", "Sibling", "Other family member"] },
  { group: "Legal & Financial", roles: ["Estate attorney", "Financial advisor", "Accountant / CPA", "Insurance agent", "Banker"] },
  { group: "Funeral Service", roles: ["Funeral home director", "Cemetery contact", "Crematorium contact", "Officiant"] },
  { group: "Religious", roles: ["Priest", "Rabbi", "Pastor", "Minister", "Imam", "Celebrant"] },
  { group: "Memorial", roles: ["Florist", "Caterer", "Reception venue", "Obituary writer", "Grief photographer"] },
  { group: "Medical", roles: ["Primary care physician", "Hospice coordinator", "Organ donation coordinator"] },
  { group: "Personal", roles: ["Best friend", "Neighbor", "Employer / HR", "Religious community contact"] },
];

// ─── PRE-CONFIGURED ROLE TEMPLATES ───────────────────────────────────────────
// The "aha" moment: 15-min full orchestration setup
const ROLE_TEMPLATES = [
  {
    id: "executor", label: "Executor / Estate Attorney", icon: "⚖️",
    tasks: ["Locate the will and advance directives", "Contact estate attorney to begin probate process", "Notify primary bank and all financial institutions", "Notify all credit card companies", "File final tax return for the deceased"],
    desc: "Handles legal and financial estate matters"
  },
  {
    id: "funeral", label: "Funeral Home / Director", icon: "🕊️",
    tasks: ["Contact the funeral home", "Meet with funeral director to finalize arrangements", "Request an itemized funeral home contract", "Contact the cemetery or crematorium"],
    desc: "Coordinates transportation, service, burial or cremation"
  },
  {
    id: "clergy", label: "Religious Leader / Clergy", icon: "🙏",
    tasks: ["Notify the faith community or religious leader", "Select readings, music, and pallbearers", "Plan the reception or post-service gathering"],
    desc: "Officiates the service and provides spiritual support"
  },
  {
    id: "family_lead", label: "Family Coordinator", icon: "👨‍👩‍👧",
    tasks: ["Notify immediate family members", "Notify close friends and extended family", "Coordinate out-of-town family travel and lodging", "Collect contact info for thank you notes"],
    desc: "Coordinates family communication and logistics"
  },
  {
    id: "obituary", label: "Obituary & Communications", icon: "📰",
    tasks: ["Draft and submit the obituary", "Gather photos and memories for the service", "Notify the deceased's employer"],
    desc: "Writes and distributes obituary, photos, and announcements"
  },
  {
    id: "home", label: "Home & Property", icon: "🏠",
    tasks: ["Secure the home and valuables", "Set up mail forwarding or hold with USPS", "Cancel voter registration", "Contact the DMV to cancel the driver's license"],
    desc: "Secures property, cancels registrations and subscriptions"
  },
];

// ─── SUPABASE HELPERS ─────────────────────────────────────────────────────────
const saveLead = async (data) => {
  try {
    await fetch('/api/saveLead', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (e) { console.warn('saveLead:', e); }
};

const createWorkflow = async (userId, deceasedName, coordinatorName, coordinatorEmail, dateOfDeath) => {
  try {
    const { data, error } = await supabase.from('workflows').insert([{
      user_id: userId || null,
      name: `Estate of ${deceasedName || "Loved One"}`,
      deceased_name: deceasedName || null,
      coordinator_name: coordinatorName || null,
      coordinator_email: coordinatorEmail || null,
      date_of_death: dateOfDeath || null,
      status: 'active',
      trigger_type: 'death_confirmed',
      is_custom: false,
    }]).select().single();
    if (error) { console.error('createWorkflow:', error); return null; }
    return data;
  } catch (e) { console.error('createWorkflow:', e); return null; }
};

const saveAllTasks = async (workflowId, userId) => {
  if (!workflowId) return [];
  try {
    const rows = POST_DEATH_TASKS.flatMap(tier =>
      tier.tasks.map(t => ({
        workflow_id: workflowId,
        user_id: userId || null,
        title: t.title,
        isSocial: t.isSocial || false,
        description: t.desc,
        category: t.category,
        priority: tier.tier === 1 ? 'urgent' : tier.tier === 2 ? 'high' : 'normal',
        due_days_after_trigger: tier.tier === 1 ? 1 : tier.tier === 2 ? 3 : tier.tier === 3 ? 7 : 45,
        status: 'pending',
      }))
    );
    const { data, error } = await supabase.from('tasks')
      .upsert(rows, { onConflict: 'workflow_id,title', ignoreDuplicates: true })
      .select();
    if (error) { console.error('saveAllTasks:', error); return []; }
    return data || [];
  } catch (e) { console.error('saveAllTasks:', e); return []; }
};

const loadTasks = async (workflowId) => {
  if (!workflowId) return [];
  const { data, error } = await supabase
    .from('tasks').select('*')
    .eq('workflow_id', workflowId)
    .order('created_at', { ascending: true });
  if (error) { console.error('loadTasks:', error); return []; }
  return data || [];
};

const updateTask = async (taskId, updates) => {
  if (!taskId) return;
  await supabase.from('tasks').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', taskId);
};

const insertCustomTask = async (workflowId, userId, title, tier) => {
  const { data, error } = await supabase.from('tasks').insert([{
    workflow_id: workflowId,
    user_id: userId || null,
    title,
    description: 'Custom task',
    category: 'other',
    priority: tier === 1 ? 'urgent' : tier === 2 ? 'high' : 'normal',
    due_days_after_trigger: tier === 1 ? 1 : tier === 2 ? 3 : tier === 3 ? 7 : 45,
    status: 'pending',
  }]).select().single();
  if (error) { console.error('insertCustomTask:', error); return null; }
  return data;
};

const savePerson = async (userId, person) => {
  const nameParts = (person.name || '').trim().split(' ');
  const { data, error } = await supabase.from('people').insert([{
    owner_id: userId || null,
    first_name: nameParts[0] || person.name,
    last_name: nameParts.slice(1).join(' ') || '',
    email: person.email || null,
    phone: person.phone || null,
    relationship: person.role || null,
    role: 'recipient',
    notify_on_trigger: true,
  }]).select().single();
  if (error) {
    // If conflict (same person already exists), fetch them instead
    if (error.code === '23505') {
      const { data: existing } = await supabase.from('people')
        .select().eq('owner_id', userId || null)
        .eq('first_name', nameParts[0] || person.name).maybeSingle();
      return existing;
    }
    console.error('savePerson:', error);
    return null;
  }
  return data;
};

const saveWorkflowAction = async (workflowId, personData, taskTitle, actionType) => {
  if (!workflowId || !personData) return;
  try {
    await supabase.from('workflow_actions').insert([{
      workflow_id: workflowId,
      action_type: actionType,
      recipient_type: 'person',
      recipient_person_id: personData.id,
      recipient_email: personData.email || null,
      recipient_phone: personData.phone || null,
      subject: `You've been assigned a task`,
      body: `${personData.first_name || personData.name} — you've been asked to help coordinate an estate task in Passage.\n\nTask: ${taskTitle}\n\nYou will receive full details and instructions when the plan is activated.`,
      status: 'pending',
      delay_hours: 0,
    }]);
  } catch (e) { console.warn('saveWorkflowAction:', e); }
};

const loadUserWorkflows = async (userId) => {
  if (!userId) return [];
  const { data } = await supabase
    .from('workflows')
    .select('id, name, deceased_name, coordinator_name, status, trigger_type, created_at')
    .eq('user_id', userId)
    .neq('status', 'archived')
    .order('created_at', { ascending: false });
  return data || [];
};

const archiveWorkflow = async (workflowId) => {
  await supabase.from('workflows').update({ status: 'archived' }).eq('id', workflowId);
};

const loadUserProfile = async (userId) => {
  if (!userId) return { user: null, profile: null };
  const [{ data: user }, { data: profile }] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).maybeSingle(),
    supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
  ]);
  return { user, profile };
};

const saveWorkflowEvent = async (workflowId, eventData) => {
  const { data, error } = await supabase.from('workflow_events').insert([{
    workflow_id: workflowId,
    event_type: eventData.type,
    name: eventData.name || null,
    date: eventData.date || null,
    time: eventData.time || null,
    location_name: eventData.locationName || null,
    location_address: eventData.locationAddress || null,
    notes: eventData.notes || null,
  }]).select().single();
  if (error) { console.error('saveWorkflowEvent:', error); return null; }
  return data;
};

const loadWorkflowEvents = async (workflowId) => {
  if (!workflowId) return [];
  const { data } = await supabase.from('workflow_events').select('*').eq('workflow_id', workflowId).order('date', { ascending: true });
  return data || [];
};

const updateWorkflowName = async (workflowId, newName) => {
  await supabase.from('workflows').update({ plan_name: newName, name: newName }).eq('id', workflowId);
};

const handleCheckout = async (planId, userId, userEmail) => {
  try {
    const res = await fetch('/api/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId, userId, userEmail }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  } catch (err) { console.error('Checkout error:', err); }
};

const handleSignInWithGoogle = async () => {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: 'https://thepassageapp.io' },
  });
};

// ─── MERGE helper — merge DB tasks back onto static task list ─────────────────
const buildTaskList = (dbTasks) => {
  const result = [];
  POST_DEATH_TASKS.forEach(tier => {
    tier.tasks.forEach(staticTask => {
      const db = dbTasks.find(d => d.title === staticTask.title);
      result.push({
        ...staticTask,
        tier: tier.tier, tierLabel: tier.tierLabel,
        tierColor: tier.tierColor, tierBg: tier.tierBg, tierIcon: tier.icon,
        completed: db ? db.status === 'completed' : false,
        assignedTo: db?.assigned_to_name || null,
        assignedEmail: db?.assigned_to_email || null,
        isCustom: false,
        dbId: db?.id || null,
      });
    });
  });
  // Append any custom tasks from DB not in static list
  const staticTitles = new Set(POST_DEATH_TASKS.flatMap(t => t.tasks.map(tt => tt.title)));
  dbTasks.filter(d => !staticTitles.has(d.title)).forEach(d => {
    const tierNum = d.priority === 'urgent' ? 1 : d.priority === 'high' ? 2 : d.due_days_after_trigger > 7 ? 4 : 3;
    const tierMeta = POST_DEATH_TASKS.find(t => t.tier === tierNum) || POST_DEATH_TASKS[0];
    result.push({
      id: `custom_${d.id}`, title: d.title, desc: d.description || '',
      category: d.category || 'other',
      tier: tierNum, tierLabel: tierMeta.tierLabel,
      tierColor: tierMeta.tierColor, tierBg: tierMeta.tierBg, tierIcon: tierMeta.icon,
      completed: d.status === 'completed',
      assignedTo: d.assigned_to_name || null,
      assignedEmail: d.assigned_to_email || null,
      isCustom: true, dbId: d.id,
    });
  });
  return result;
};

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────
const Btn = ({ children, onClick, variant = "primary", disabled, style = {} }) => {
  const base = { border: "none", borderRadius: 14, padding: "15px 28px", fontSize: 15, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all 0.18s", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: disabled ? 0.5 : 1, boxSizing: "border-box" };
  const v = { primary: { background: C.sage, color: "#fff" }, ghost: { background: "transparent", color: C.mid, padding: "12px 20px" }, rose: { background: C.rose, color: "#fff" }, secondary: { background: C.bgCard, color: C.ink, border: `1.5px solid ${C.border}` } };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...v[variant], ...style }}>{children}</button>;
};

const Field = ({ label, placeholder, value, onChange, type = "text", hint }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.mid, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{label}</label>}
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", padding: "13px 15px", borderRadius: 11, fontSize: 15, border: `1.5px solid ${C.border}`, background: C.bgCard, color: C.ink, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
    {hint && <div style={{ fontSize: 11, color: C.soft, marginTop: 5 }}>{hint}</div>}
  </div>
);

const Select = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.mid, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{label}</label>}
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: "100%", padding: "13px 15px", borderRadius: 11, fontSize: 15, border: `1.5px solid ${C.border}`, background: C.bgCard, color: value ? C.ink : C.soft, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  </div>
);

const OptionCard = ({ icon, title, desc, selected, onClick }) => (
  <div onClick={onClick} style={{ border: `2px solid ${selected ? C.sage : C.border}`, borderRadius: 14, padding: "16px 18px", cursor: "pointer", background: selected ? `${C.sage}08` : C.bgCard, transition: "all 0.15s", marginBottom: 8, display: "flex", alignItems: "flex-start", gap: 14 }}>
    <span style={{ fontSize: 24, flexShrink: 0 }}>{icon}</span>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 3 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: C.mid, lineHeight: 1.5 }}>{desc}</div>
    </div>
    <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${selected ? C.sage : C.muted}`, background: selected ? C.sage : "transparent", flexShrink: 0, marginTop: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {selected && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />}
    </div>
  </div>
);

const StepBar = ({ current, total, color = C.sage }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
      <span style={{ fontSize: 11, color: C.soft, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Step {current} of {total}</span>
      <span style={{ fontSize: 11, color, fontWeight: 700 }}>{Math.round((current / total) * 100)}%</span>
    </div>
    <div style={{ height: 4, background: C.border, borderRadius: 2 }}>
      <div style={{ height: "100%", borderRadius: 2, background: color, width: `${(current / total) * 100}%`, transition: "width 0.4s ease" }} />
    </div>
  </div>
);

const Card = ({ children, maxWidth = 520 }) => (
  <div style={{ background: C.bgCard, borderRadius: 22, padding: "32px 28px", maxWidth, width: "100%", margin: "0 auto", boxShadow: "0 2px 32px rgba(0,0,0,0.06)" }}>{children}</div>
);

const Eyebrow = ({ text, color = C.sage }) => (
  <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color, fontWeight: 700, marginBottom: 8 }}>{text}</div>
);

const Heading = ({ children, size = 24 }) => (
  <div style={{ fontFamily: "Georgia, serif", fontSize: size, color: C.ink, lineHeight: 1.25, marginBottom: 10 }}>{children}</div>
);

const Sub = ({ children }) => (
  <div style={{ fontSize: 13.5, color: C.mid, lineHeight: 1.65, marginBottom: 0 }}>{children}</div>
);

// Top navigation bar used across all inner screens
const TopNav = ({ user, onDashboard, onBack, onSignOut, label, accentColor, onHome }) => (
  <div style={{ background: C.bgCard, borderBottom: `1px solid ${C.border}`, padding: "13px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
    <div onClick={onHome || onDashboard || onBack} style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
      <div style={{ width: 24, height: 24, borderRadius: "50%", background: `radial-gradient(circle, ${C.sageLight}, ${C.sage}70)` }} />
      <span style={{ fontFamily: "Georgia, serif", fontSize: 16, color: C.ink }}>Passage</span>
    </div>
    {label && <div style={{ fontSize: 11, color: C.soft, fontWeight: 500 }}>{label}</div>}
    <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
      {user && onDashboard && (
        <button onClick={onDashboard} style={{ background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 8, padding: "5px 12px", fontSize: 11.5, color: C.sage, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>My file</button>
      )}
      {onSignOut && (
        <button onClick={onSignOut} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 12px", fontSize: 11.5, color: C.mid, cursor: "pointer", fontFamily: "inherit" }}>Sign out</button>
      )}
      {onBack && !onSignOut && (
        <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 12.5, color: C.soft, cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
      )}
    </div>
  </div>
);

const GoogleSignInBtn = ({ label = "Continue with Google" }) => (
  <button onClick={handleSignInWithGoogle} style={{ width: "100%", padding: "12px 18px", borderRadius: 11, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: C.bgCard, border: `1.5px solid ${C.border}`, color: C.ink, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
    <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
    {label}
  </button>
);

// ─── TOAST NOTIFICATION ───────────────────────────────────────────────────────
function Toast({ message, type = "success", onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, []);
  const bg = type === "success" ? C.sage : type === "error" ? C.rose : C.gold;
  return (
    <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: bg, color: "#fff", borderRadius: 14, padding: "13px 22px", fontSize: 13, fontWeight: 600, zIndex: 409, boxShadow: "0 4px 24px rgba(0,0,0,0.18)", whiteSpace: "nowrap", maxWidth: "90vw", textAlign: "center" }}>
      {message}
    </div>
  );
}

// ─── ROLE TEMPLATE MODAL ──────────────────────────────────────────────────────
function RoleTemplateModal({ workflowId, userId, deceasedName, coordinatorName, onClose, onDone }) {
  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState("pick"); // pick | details
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [assigned, setAssigned] = useState([]);

  const handleAssignTemplate = async () => {
    if (!selected || !name) return;
    setSaving(true);
    const nameParts = name.trim().split(" ");
    const { data: saved } = await supabase.from("people").insert([{
      owner_id: userId || null,
      first_name: nameParts[0],
      last_name: nameParts.slice(1).join(" ") || "",
      email: email || null,
      phone: phone || null,
      relationship: selected.label,
      role: "recipient",
      notify_on_trigger: true,
    }]).select().single();

    // Assign all tasks in this template to this person
    for (const taskTitle of selected.tasks) {
      const { data: taskRow } = await supabase.from("tasks")
        .select("id").eq("workflow_id", workflowId).eq("title", taskTitle).maybeSingle();
      if (taskRow) {
        await supabase.from("tasks").update({
          assigned_to_name: name,
          assigned_to_email: email || null,
          assigned_to_person_id: saved?.id || null,
        }).eq("id", taskRow.id);
      }
    }

    if (saved && workflowId) {
      await saveWorkflowAction(workflowId, saved, `${selected.label} role`, "email");
      if (phone) await saveWorkflowAction(workflowId, { ...saved, phone }, `${selected.label} role`, "sms");
      // Route through orchestration layer
      fetch("/api/handleEvent", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "task_assigned", payload: {
          workflowId, taskTitle: selected.label + " (" + selected.tasks.length + " tasks)",
          deceasedName, coordinatorName,
          personEmail: email || null, personPhone: phone || null,
          personName: name, notifyChannel: "both",
        }}),
      }).catch(() => {});
    }

    setAssigned(prev => [...prev, { name, role: selected.label, tasks: selected.tasks.length }]);
    setToast(email ? `✅ ${name} notified as ${selected.label}` : `✅ ${name} assigned as ${selected.label}`);
    setSaving(false);
    setStep("pick");
    setSelected(null);
    setName(""); setEmail(""); setPhone("");
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={step === "pick" ? onClose : undefined}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.bgCard, borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ width: 32, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 18px" }} />

        {toast && <Toast message={toast} onDone={() => setToast(null)} />}

        {step === "pick" && (
          <>
            <Heading size={18}>Quick setup — assign roles</Heading>
            <Sub>Pick a role, add the person's contact info, and they'll be notified automatically.</Sub>
            {assigned.length > 0 && (
              <div style={{ background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.sage, marginBottom: 6 }}>ASSIGNED SO FAR</div>
                {assigned.map((a, i) => (
                  <div key={i} style={{ fontSize: 12, color: C.mid, marginBottom: 3 }}>✓ {a.name} — {a.role} ({a.tasks} tasks)</div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 18 }}>
              {ROLE_TEMPLATES.map(t => (
                <button key={t.id} onClick={() => { setSelected(t); setStep("details"); }}
                  style={{ textAlign: "left", padding: "13px 14px", borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.bgCard, cursor: "pointer", fontFamily: "inherit" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{t.icon}</span>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>{t.label}</div>
                      <div style={{ fontSize: 11, color: C.soft, marginTop: 2 }}>{t.desc} · {t.tasks.length} tasks</div>
                    </div>
                    <span style={{ marginLeft: "auto", color: C.mid }}>→</span>
                  </div>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" onClick={onClose}>Close</Btn>
              {assigned.length > 0 && <Btn variant="sage" onClick={onDone} style={{ flex: 1 }}>Done — view task list →</Btn>}
            </div>
          </>
        )}

        {step === "details" && selected && (
          <>
            <button onClick={() => { setStep("pick"); setSelected(null); }} style={{ background: "none", border: "none", fontSize: 12, color: C.mid, cursor: "pointer", fontFamily: "inherit", marginBottom: 14 }}>← Back to roles</button>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 10, padding: "8px 14px", marginBottom: 16 }}>
              <span style={{ fontSize: 18 }}>{selected.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.sage }}>{selected.label}</div>
                <div style={{ fontSize: 11, color: C.mid }}>{selected.tasks.length} tasks will be assigned</div>
              </div>
            </div>
            <Field label="Their full name *" placeholder="e.g. Rabbi David Cohen" value={name} onChange={setName} />
            <Field label="Email — receives notification immediately" type="email" placeholder="rabbi@temple.org" value={email} onChange={setEmail} />
            <Field label="Phone — receives SMS immediately" placeholder="(845) 000-0000" value={phone} onChange={setPhone} />
            <div style={{ background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 9, padding: "9px 13px", fontSize: 11, color: C.mid, marginBottom: 16 }}>
              📧 They'll receive a notification immediately with their assigned tasks.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" onClick={() => setStep("pick")}>← Back</Btn>
              <Btn variant="rose" onClick={handleAssignTemplate} disabled={!name || saving} style={{ flex: 1 }}>
                {saving ? "Assigning..." : `Assign ${selected.tasks.length} tasks + notify →`}
              </Btn>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── SERVICE EVENTS MODAL ────────────────────────────────────────────────────
// Captures wake, funeral, burial, reception — feeds into all notifications
function EventsModal({ workflowId, deceasedName, onClose, onSaved }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(null); // null or event type being added
  const [form, setForm] = useState({ type: 'funeral', name: '', date: '', time: '', locationName: '', locationAddress: '', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadWorkflowEvents(workflowId).then(evts => { setEvents(evts); setLoading(false); });
  }, [workflowId]);

  const EVENT_TYPES = [
    { type: 'visitation', label: 'Visitation / Wake / Shiva', icon: '🕯️' },
    { type: 'funeral', label: 'Funeral / Memorial Service', icon: '🕊️' },
    { type: 'burial', label: 'Burial / Committal', icon: '⚱️' },
    { type: 'reception', label: 'Reception / Gathering', icon: '🌿' },
  ];

  const handleSave = async () => {
    if (!form.type) return;
    setSaving(true);
    const saved = await saveWorkflowEvent(workflowId, form);
    if (saved) setEvents(prev => [...prev, saved]);
    setAdding(null);
    setForm({ type: 'funeral', name: '', date: '', time: '', locationName: '', locationAddress: '', notes: '' });
    setSaving(false);
    onSaved && onSaved(events.length + 1);
  };

  const formatEventDate = (d, t) => {
    if (!d) return '';
    const date = new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    return t ? `${date} at ${t}` : date;
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={adding ? undefined : onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.bgCard, borderRadius: '20px 20px 0 0', padding: '24px 20px 48px', width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ width: 32, height: 4, borderRadius: 2, background: C.border, margin: '0 auto 18px' }} />

        {!adding ? (
          <>
            <Heading size={18}>Service details</Heading>
            <Sub>Add event details so notifications include the right place and time.</Sub>

            {loading && <div style={{ textAlign: 'center', padding: 30, color: C.soft }}>Loading...</div>}

            {!loading && events.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                {events.map((ev, i) => {
                  const evType = EVENT_TYPES.find(t => t.type === ev.event_type) || { icon: '📅', label: ev.event_type };
                  return (
                    <div key={i} style={{ background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 12, padding: '13px 14px', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
                        <span style={{ fontSize: 18 }}>{evType.icon}</span>
                        <div style={{ fontWeight: 700, fontSize: 13, color: C.ink }}>{ev.name || evType.label}</div>
                        <span style={{ marginLeft: 'auto', fontSize: 10.5, color: C.sage, fontWeight: 700 }}>✓ Saved</span>
                      </div>
                      {ev.date && <div style={{ fontSize: 12, color: C.mid, paddingLeft: 27 }}>{formatEventDate(ev.date, ev.time)}</div>}
                      {ev.location_name && <div style={{ fontSize: 12, color: C.mid, paddingLeft: 27 }}>{ev.location_name}</div>}
                      {ev.location_address && <div style={{ fontSize: 11, color: C.soft, paddingLeft: 27 }}>{ev.location_address}</div>}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginBottom: 18 }}>
              {EVENT_TYPES.map(et => {
                const exists = events.find(e => e.event_type === et.type);
                return (
                  <button key={et.type} onClick={() => { setAdding(et.type); setForm(f => ({ ...f, type: et.type })); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', borderRadius: 11, border: `1.5px solid ${exists ? C.sageLight : C.border}`, background: exists ? C.sageFaint : C.bgCard, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', marginBottom: 7 }}>
                    <span style={{ fontSize: 20 }}>{et.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: exists ? C.sage : C.ink }}>{et.label}</div>
                      {exists && <div style={{ fontSize: 11, color: C.sage }}>Added — tap to edit</div>}
                      {!exists && <div style={{ fontSize: 11, color: C.soft }}>Date, time, location</div>}
                    </div>
                    <span style={{ color: exists ? C.sage : C.mid, fontSize: 14 }}>{exists ? '✓' : '+'}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ background: C.goldFaint, border: `1px solid ${C.gold}30`, borderRadius: 11, padding: '11px 14px', fontSize: 12, color: C.amber, marginBottom: 18, lineHeight: 1.5 }}>
              📍 These details appear in every notification sent to family and vendors — so nobody has to ask where or when.
            </div>
            <Btn variant="sage" onClick={onClose} style={{ width: '100%' }}>Done</Btn>
          </>
        ) : (
          <>
            <button onClick={() => setAdding(null)} style={{ background: 'none', border: 'none', fontSize: 12, color: C.mid, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 14 }}>← Back</button>
            <Heading size={17}>{EVENT_TYPES.find(t => t.type === adding)?.label || 'Add event'}</Heading>
            <Sub>This will appear in all notifications for {deceasedName || "the estate"}.</Sub>
            <div style={{ height: 12 }} />
            <Field label="Event name (optional)" placeholder={`e.g. ${adding === 'funeral' ? "Robert Collins Funeral Service" : "Family reception"}`} value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}><Field label="Date" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} /></div>
              <div style={{ width: 120 }}><Field label="Time" type="time" value={form.time} onChange={v => setForm(f => ({ ...f, time: v }))} /></div>
            </div>
            <Field label="Venue / location name" placeholder="e.g. St. Patrick's Cathedral" value={form.locationName} onChange={v => setForm(f => ({ ...f, locationName: v }))} />
            <Field label="Full address" placeholder="5th Ave & 50th St, New York, NY" value={form.locationAddress} onChange={v => setForm(f => ({ ...f, locationAddress: v }))} />
            <Field label="Additional notes (optional)" placeholder="Parking available on West side. Dress: dark colors." value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} />
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <Btn variant="ghost" onClick={() => setAdding(null)}>Cancel</Btn>
              <Btn variant="sage" onClick={handleSave} disabled={saving || !form.date} style={{ flex: 1 }}>
                {saving ? 'Saving...' : 'Save event →'}
              </Btn>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── MESSAGE PREVIEW MODAL ────────────────────────────────────────────────────
function MessagePreviewModal({ personName, personEmail, personPhone, notifyChannel, taskTitle, deceasedName, coordinatorName, workflowId, onConfirmSend, onClose }) {
  const [editedEmail, setEditedEmail] = useState('');
  const [editedSMS, setEditedSMS] = useState('');
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState(notifyChannel === 'sms' ? 'sms' : 'email');

  useEffect(() => {
    setEditedEmail(`Hi ${personName},

${coordinatorName || 'A family member'} is coordinating the estate of ${deceasedName || 'their loved one'} and has asked you to help with the following:

"${taskTitle}"

You'll receive full details — including service dates, times, and locations — when the plan is activated. Nothing is required from you right now.

With gratitude,
Passage`);
    setEditedSMS(`Passage: ${coordinatorName || 'A family member'} has asked you to help with: "${taskTitle}" for ${deceasedName || "the estate"}. You'll receive full details when the plan activates. → thepassageapp.io`);
  }, [personName, coordinatorName, deceasedName, taskTitle]);

  const handleSend = async () => {
    setSending(true);
    await onConfirmSend({ emailBody: editedEmail, smsBody: editedSMS });
    setSending(false);
  };

  const showEmail = notifyChannel !== 'sms';
  const showSMS = notifyChannel !== 'email';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px' }}>
      <div style={{ background: C.bgCard, borderRadius: 20, padding: '24px 20px', width: '100%', maxWidth: 520, maxHeight: '88vh', overflowY: 'auto' }}>
        <div style={{ marginBottom: 16 }}>
          <Heading size={17}>Preview message to {personName}</Heading>
          <Sub>Review and edit before sending. This is exactly what they'll receive.</Sub>
        </div>

        {showEmail && showSMS && (
          <div style={{ display: 'flex', gap: 7, marginBottom: 16 }}>
            {[['email', '📧 Email'], ['sms', '📱 SMS']].map(([t, l]) => (
              <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '8px', borderRadius: 9, border: `1.5px solid ${tab === t ? C.sage : C.border}`, background: tab === t ? C.sageFaint : C.bgCard, fontSize: 12.5, fontWeight: 600, color: tab === t ? C.sage : C.mid, cursor: 'pointer', fontFamily: 'inherit' }}>{l}</button>
            ))}
          </div>
        )}

        {(tab === 'email' && showEmail) && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: C.soft, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Email to {personEmail || 'no email provided'}</div>
            <textarea value={editedEmail} onChange={e => setEditedEmail(e.target.value)}
              style={{ width: '100%', height: 200, padding: '12px', borderRadius: 11, border: `1.5px solid ${C.border}`, fontFamily: 'Georgia, serif', fontSize: 12.5, color: C.ink, lineHeight: 1.65, resize: 'vertical', boxSizing: 'border-box', background: C.bgSubtle }} />
          </div>
        )}

        {(tab === 'sms' && showSMS) && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: C.soft, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>SMS to {personPhone || 'no phone provided'}</div>
            <div style={{ background: '#e8e8e8', borderRadius: '16px 16px 4px 16px', padding: '12px 14px', maxWidth: '80%', marginLeft: 'auto', marginBottom: 8 }}>
              <div style={{ fontSize: 12.5, color: '#1a1a1a', lineHeight: 1.5 }}>{editedSMS}</div>
            </div>
            <textarea value={editedSMS} onChange={e => setEditedSMS(e.target.value)}
              style={{ width: '100%', height: 100, padding: '12px', borderRadius: 11, border: `1.5px solid ${C.border}`, fontFamily: 'inherit', fontSize: 12.5, color: C.ink, lineHeight: 1.65, resize: 'vertical', boxSizing: 'border-box', background: C.bgSubtle }} />
            <div style={{ fontSize: 11, color: C.soft, marginTop: 4 }}>{editedSMS.length}/160 characters</div>
          </div>
        )}

        <div style={{ background: C.bgSubtle, borderRadius: 10, padding: '10px 13px', fontSize: 11.5, color: C.mid, marginBottom: 18, lineHeight: 1.5 }}>
          🔒 Messages are sent securely via {showEmail && 'email'}{showEmail && showSMS && ' and '}{showSMS && 'SMS'}. Nothing sends until you confirm here.
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="ghost" onClick={onClose}>Edit later</Btn>
          <Btn variant="sage" onClick={handleSend} disabled={sending} style={{ flex: 1 }}>
            {sending ? 'Sending...' : `Send now →`}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── ASSIGN MODAL ─────────────────────────────────────────────────────────────
function AssignModal({ task, workflowId, userId, onAssign, onClose, deceasedName, coordinatorName }) {
  const [step, setStep] = useState("pick");
  const [mode, setMode] = useState("roster");
  const [selectedRole, setSelectedRole] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notifyChannel, setNotifyChannel] = useState("both");
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // When a roster role is tapped, pre-fill role and advance to details
  const handleRoleSelect = (r) => {
    setSelectedRole(r);
    setRole(r);
    setName(""); // clear name so user fills in the actual person's name
    setStep("details");
  };

  const handleSendWithPreview = async ({ emailBody, smsBody }) => {
    setSaving(true);
    const personData = { name: name || selectedRole, role: role || selectedRole, email, phone, notifyChannel };
    const saved = await savePerson(userId, { ...personData, notify_channel: notifyChannel });
    if (task.dbId) {
      await updateTask(task.dbId, { assigned_to_name: personData.name, assigned_to_email: personData.email || null, assigned_to_person_id: saved?.id || null });
    }
    if (saved && workflowId) {
      await saveWorkflowAction(workflowId, saved, task.title, 'email');
      if (personData.phone) await saveWorkflowAction(workflowId, { ...saved, phone: personData.phone }, task.title, 'sms');
      // Route through orchestration layer
      fetch('/api/handleEvent', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'task_assigned', payload: {
          workflowId, taskTitle: task.title, deceasedName, coordinatorName,
          personEmail: personData.email || null, personPhone: personData.phone || null,
          personName: personData.name, notifyChannel,
          emailBody, smsBody,
        }})}).catch(() => {
          // Fallback: call directly if orchestration fails
          if (personData.email && notifyChannel !== 'sms') {
            fetch('/api/sendEmail', { method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ to: personData.email, toName: personData.name, taskTitle: task.title, deceasedName, coordinatorName, workflowId, actionType: 'assignment' }) }).catch(() => {});
          }
          if (personData.phone && notifyChannel !== 'email') {
            fetch('/api/sendSMS', { method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ to: personData.phone, toName: personData.name, taskTitle: task.title, deceasedName, coordinatorName, workflowId, actionType: 'assignment' }) }).catch(() => {});
          }
        });
    }
    onAssign(task.id, personData.name, personData.role);
    setSaving(false);
    setShowPreview(false);
    onClose();
  };

  const handleAssign = async () => {
    setSaving(true);
    const personData = {
      name: name || selectedRole,
      role: role || selectedRole,
      email, phone, notifyChannel,
    };

    const saved = await savePerson(userId, personData);

    if (task.dbId) {
      await updateTask(task.dbId, {
        assigned_to_name: personData.name,
        assigned_to_email: personData.email || null,
        assigned_to_person_id: saved?.id || null,
      });
    }

    if (saved && workflowId) {
      await saveWorkflowAction(workflowId, saved, task.title, 'email');
      if (personData.phone) {
        await saveWorkflowAction(workflowId, { ...saved, phone: personData.phone }, task.title, 'sms');
      }
      // Fire immediate assignment notification if contact info provided
      if (personData.email) {
        fetch('/api/sendEmail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: personData.email, toName: personData.name, taskTitle: task.title, workflowId, actionType: 'assignment' }),
        }).catch(e => console.warn('Email send failed:', e));
      }
      if (personData.phone) {
        fetch('/api/sendSMS', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: personData.phone, toName: personData.name, taskTitle: task.title, workflowId, actionType: 'assignment' }),
        }).catch(e => console.warn('SMS send failed:', e));
      }
    }

    onAssign(task.id, personData.name, personData.role);
    setSaving(false);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.bgCard, borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 560, maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ width: 32, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 18px" }} />

        <Heading size={18}>{step === "pick" ? "Assign this task" : "Add their details"}</Heading>
        <div style={{ fontSize: 12.5, color: C.mid, background: C.bgSubtle, borderRadius: 9, padding: "9px 13px", marginBottom: 18, lineHeight: 1.4 }}>{task.title}</div>

        {step === "pick" && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {[["roster","Choose from list"],["custom","Add someone new"]].map(([m, l]) => (
                <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "9px", borderRadius: 9, border: `1.5px solid ${mode === m ? C.rose : C.border}`, background: mode === m ? C.roseFaint : C.bgCard, fontSize: 12.5, fontWeight: 600, color: mode === m ? C.rose : C.mid, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>
              ))}
            </div>

            {mode === "roster" ? (
              <div>
                {PEOPLE_ROLES.map(group => (
                  <div key={group.group} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: C.soft, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 7 }}>{group.group}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {group.roles.map(r => (
                        <button key={r} onClick={() => handleRoleSelect(r)} style={{ padding: "6px 13px", borderRadius: 18, fontSize: 12, fontWeight: 500, border: `1.5px solid ${C.border}`, background: C.bgCard, color: C.mid, cursor: "pointer", fontFamily: "inherit" }}>{r}</button>
                      ))}
                    </div>
                  </div>
                ))}
                <div style={{ fontSize: 11, color: C.soft, marginTop: 8, fontStyle: "italic" }}>
                  Tap a role to add their contact details
                </div>
              </div>
            ) : (
              <div>
                <Field label="Their name *" placeholder="e.g. Sarah Collins" value={name} onChange={setName} />
                <Field label="Their role (optional)" placeholder="e.g. My sister, Estate attorney" value={role} onChange={setRole} />
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
                  <Btn variant="rose" onClick={() => setStep("details")} disabled={!name} style={{ flex: 1 }}>Add details →</Btn>
                </div>
              </div>
            )}

            {mode === "roster" && (
              <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
              </div>
            )}
          </>
        )}

        {step === "details" && (
          <div>
            {selectedRole && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.roseFaint, border: `1px solid ${C.rose}30`, borderRadius: 9, padding: "5px 12px", marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: C.rose, fontWeight: 600 }}>Role: {selectedRole || role}</span>
              </div>
            )}
            <Field label="Their name *" placeholder="e.g. Rabbi David Cohen" value={name} onChange={setName}
              hint="The name that will appear on task assignments and notifications." />
            <Field label="Email" type="email" placeholder="rabbi@temple.org" value={email} onChange={setEmail} />
            <Field label="Phone" placeholder="(555) 000-0000" value={phone} onChange={setPhone} />

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.soft, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Notify via</div>
              <div style={{ display: "flex", gap: 7 }}>
                {[["both","📧 + 📱 Both"],["email","📧 Email only"],["sms","📱 SMS only"]].map(([v, l]) => (
                  <button key={v} onClick={() => setNotifyChannel(v)}
                    style={{ flex: 1, padding: "7px 4px", borderRadius: 9, border: `1.5px solid ${notifyChannel === v ? C.sage : C.border}`, background: notifyChannel === v ? C.sageFaint : C.bgCard, fontSize: 11, fontWeight: 600, color: notifyChannel === v ? C.sage : C.mid, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: C.soft, marginTop: 5 }}>
                {notifyChannel === "both" ? "SMS for immediate attention, email as the paper trail." : notifyChannel === "email" ? "Email only — best for vendors and professionals." : "SMS only — best for family members."}
              </div>
            </div>

            {showPreview && (
              <MessagePreviewModal
                personName={name} personEmail={email} personPhone={phone}
                notifyChannel={notifyChannel} taskTitle={task.title}
                deceasedName={deceasedName} coordinatorName={coordinatorName}
                workflowId={workflowId}
                onConfirmSend={handleSendWithPreview}
                onClose={() => setShowPreview(false)}
              />
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" onClick={() => setStep("pick")}>← Back</Btn>
              <Btn variant="rose" onClick={() => setShowPreview(true)} disabled={!name || saving} style={{ flex: 1 }}>
                {saving ? "Sending..." : "Preview & send →"}
              </Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TASK LIST ────────────────────────────────────────────────────────────────
function TaskList({ deceasedName, coordinatorName, workflowId, userId, onBack, onDashboard, onSignOut }) {
  const [showRoleTemplates, setShowRoleTemplates] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [eventCount, setEventCount] = useState(0);
  const [toast, setToast] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [assigningTask, setAssigningTask] = useState(null);
  const [expanded, setExpanded] = useState({ 1: true, 2: true, 3: false, 4: false });
  const [filter, setFilter] = useState("all");
  const [addingTier, setAddingTier] = useState(null);
  const [customText, setCustomText] = useState("");
  const [saveStatus, setSaveStatus] = useState("idle");

  const initTasks = useCallback(async () => {
    if (workflowId) {
      const dbTasks = await loadTasks(workflowId);
      setTasks(buildTaskList(dbTasks));
    } else {
      setTasks(buildTaskList([]));
    }
    setLoaded(true);
  }, [workflowId]);

  useEffect(() => { initTasks(); }, [initTasks]);

  const toggleDone = async (taskId) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const next = { ...t, completed: !t.completed };
      if (next.dbId) {
        updateTask(next.dbId, {
          status: next.completed ? 'completed' : 'pending',
          completed_at: next.completed ? new Date().toISOString() : null,
        });
      }
      return next;
    }));
  };

  const handleAssign = (taskId, name, role) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assignedTo: name, assignedRole: role } : t));
  };

  const addCustom = async (tier) => {
    if (!customText.trim()) return;
    const tierMeta = POST_DEATH_TASKS.find(t => t.tier === tier);
    const dbTask = workflowId ? await insertCustomTask(workflowId, userId, customText.trim(), tier) : null;
    setTasks(prev => [...prev, {
      id: dbTask?.id || `custom_${Date.now()}`,
      title: customText.trim(), desc: '', category: 'other',
      tier, tierLabel: tierMeta.tierLabel, tierColor: tierMeta.tierColor,
      tierBg: tierMeta.tierBg, tierIcon: tierMeta.icon,
      completed: false, assignedTo: null, isCustom: true, dbId: dbTask?.id || null,
    }]);
    setCustomText(''); setAddingTier(null);
  };

  const handleSave = async () => {
    if (!userId) { handleSignInWithGoogle(); return; }
    setSaveStatus("saving");
    if (workflowId) await supabase.from('workflows').update({ updated_at: new Date().toISOString() }).eq('id', workflowId);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2500);
  };

  const done = tasks.filter(t => t.completed).length;
  const assigned = tasks.filter(t => t.assignedTo).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  const tierMeta = POST_DEATH_TASKS.reduce((a, t) => {
    a[t.tier] = { label: t.tierLabel, color: t.tierColor, bg: t.tierBg, icon: t.icon }; return a;
  }, {});

  const getFiltered = (tier) => {
    const t = tasks.filter(t => t.tier === tier);
    if (filter === "pending") return t.filter(t => !t.completed && !t.assignedTo);
    if (filter === "assigned") return t.filter(t => t.assignedTo && !t.completed);
    if (filter === "done") return t.filter(t => t.completed);
    return t;
  };

  if (!loaded) return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <TopNav onBack={onBack} label="Loading your plan..." onSignOut={onSignOut} />
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", color: C.soft }}>Building your plan...</div>
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 80 }}>
      <TopNav user={userId ? {} : null} onDashboard={onDashboard} onBack={onBack} onSignOut={onSignOut}
        label={deceasedName ? `Plan for ${deceasedName.split(" ")[0]}` : "Estate plan"} />

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "18px 14px 40px" }}>

        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <Heading size={20}>{deceasedName ? `Estate plan — ${deceasedName}` : "Your estate plan"}</Heading>
          {coordinatorName && <div style={{ fontSize: 13, color: C.mid, marginBottom: 12 }}>Coordinated by {coordinatorName}</div>}

          {/* Progress */}
          <div style={{ background: C.bgCard, borderRadius: 14, padding: "14px 16px", border: `1px solid ${C.border}`, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{done} of {tasks.length} tasks complete</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: pct === 100 ? C.sage : C.ink }}>{pct}%</span>
            </div>
            <div style={{ height: 8, background: C.border, borderRadius: 4, marginBottom: 8 }}>
              <div style={{ height: "100%", borderRadius: 4, background: pct === 100 ? C.sage : `linear-gradient(90deg, ${C.red}, ${C.orange}, ${C.yellow})`, width: `${pct}%`, transition: "width 0.5s ease" }} />
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              {[
                { label: "Urgent remaining", value: tasks.filter(t => !t.completed && t.tier === 1).length, color: C.red },
                { label: "Assigned", value: assigned, color: C.sage },
                { label: "Done", value: done, color: C.mid },
              ].map(s => (
                <div key={s.label} style={{ fontSize: 11.5, color: C.soft }}>
                  <span style={{ fontWeight: 700, color: s.color }}>{s.value}</span> {s.label}
                </div>
              ))}
            </div>
          </div>

          {/* Filter */}
          <div style={{ display: "flex", gap: 6 }}>
            {[["all","All"],["pending","To do"],["assigned","Assigned"],["done","Done"]].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)} style={{ padding: "6px 13px", borderRadius: 18, fontSize: 11.5, fontWeight: 600, border: `1.5px solid ${filter === v ? C.sage : C.border}`, background: filter === v ? C.sageFaint : C.bgCard, color: filter === v ? C.sage : C.mid, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>
            ))}
          </div>
        </div>

        {/* Tiers */}
        {[1,2,3,4].map(tier => {
          const meta = tierMeta[tier];
          const allTier = tasks.filter(t => t.tier === tier);
          const filtered = getFiltered(tier);
          const tierDone = allTier.filter(t => t.completed).length;
          const isOpen = expanded[tier];

          return (
            <div key={tier} style={{ marginBottom: 9 }}>
              <button onClick={() => setExpanded(p => ({ ...p, [tier]: !p[tier] }))}
                style={{ width: "100%", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, background: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: meta.bg, borderRadius: isOpen ? "13px 13px 0 0" : 13, padding: "11px 14px", border: `1px solid ${meta.color}22` }}>
                  <span style={{ fontSize: 17 }}>{meta.icon}</span>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: meta.color }}>{meta.label}</div>
                    <div style={{ fontSize: 10.5, color: C.soft }}>{tierDone} of {allTier.length} complete</div>
                  </div>
                  {tierDone === allTier.length && allTier.length > 0 && <span style={{ fontSize: 10.5, color: C.sage, fontWeight: 700, background: C.sageFaint, padding: "2px 8px", borderRadius: 8 }}>✓ All done</span>}
                  <span style={{ fontSize: 13, color: meta.color }}>{isOpen ? "▾" : "▸"}</span>
                </div>
              </button>

              {isOpen && (
                <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderTop: "none", borderRadius: "0 0 13px 13px", overflow: "hidden" }}>
                  {filtered.length === 0 && (
                    <div style={{ padding: "16px", textAlign: "center", fontSize: 13, color: C.muted, fontStyle: "italic" }}>
                      {filter === "all" ? "No tasks." : `No ${filter} tasks here.`}
                    </div>
                  )}

                  {filtered.map((task, idx) => (
                    <div key={task.id} style={{ padding: "12px 14px", borderBottom: idx < filtered.length - 1 ? `1px solid ${C.border}` : "none", background: task.completed ? "#fafaf8" : "white" }}>
                      <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                        {/* Checkbox */}
                        <button onClick={() => toggleDone(task.id)} style={{ width: 21, height: 21, borderRadius: 6, flexShrink: 0, marginTop: 2, border: `2px solid ${task.completed ? C.sage : C.border}`, background: task.completed ? C.sage : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, transition: "all 0.15s" }}>
                          {task.completed && <svg width="11" height="8" viewBox="0 0 12 9"><path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </button>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: task.completed ? 400 : 600, color: task.completed ? C.muted : C.ink, textDecoration: task.completed ? "line-through" : "none", lineHeight: 1.4, marginBottom: 2 }}>
                            {task.title}
                            {task.isCustom && <span style={{ fontSize: 9, color: C.sage, fontWeight: 700, background: C.sageFaint, padding: "1px 6px", borderRadius: 5, marginLeft: 7, textDecoration: "none" }}>CUSTOM</span>}
                          </div>
                          {task.desc && !task.completed && <div style={{ fontSize: 11.5, color: C.soft, lineHeight: 1.5, marginBottom: task.assignedTo ? 5 : 0 }}>{task.desc}</div>}
                          {task.assignedTo && (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 9, padding: "2px 9px", marginTop: 4 }}>
                              <span style={{ fontSize: 10 }}>👤</span>
                              <span style={{ fontSize: 11, color: C.sage, fontWeight: 600 }}>{task.assignedTo}</span>
                              {task.assignedEmail && <span style={{ fontSize: 10, color: C.soft }}>· {task.assignedEmail}</span>}
                            </div>
                          )}
                        </div>

                        {!task.completed && (
                          task.isSocial ? (
                            <button onClick={() => { var p = new URLSearchParams({wid: workflowId||"", dn: deceasedName||"", cn: coordinatorName||""}); window.open("/share?" + p.toString(), "_blank"); }} style={{ fontSize: 11, fontWeight: 700, color: "#1877F2", background: "#f0f4ff", border: "1px solid #1877F220", borderRadius: 7, padding: "4px 9px", cursor: "pointer", fontFamily: "inherit", flexShrink: 0, whiteSpace: "nowrap" }}>
                              📣 Share
                            </button>
                          ) : (
                            <button onClick={() => setAssigningTask(task)} style={{ fontSize: 11, fontWeight: 700, color: task.assignedTo ? C.sage : C.soft, background: task.assignedTo ? C.sageFaint : C.bgSubtle, border: "none", borderRadius: 7, padding: "4px 9px", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                              {task.assignedTo ? "Reassign" : "Assign"}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add custom */}
                  {addingTier === tier ? (
                    <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.border}`, background: C.bgSubtle }}>
                      <div style={{ fontSize: 11, color: C.mid, marginBottom: 7 }}>Add to "{meta.label}"</div>
                      <div style={{ display: "flex", gap: 7 }}>
                        <input value={customText} onChange={e => setCustomText(e.target.value)}
                          placeholder="Describe the task..." autoFocus
                          onKeyDown={e => e.key === 'Enter' && addCustom(tier)}
                          style={{ flex: 1, padding: "9px 13px", borderRadius: 9, fontSize: 13, border: `1.5px solid ${C.border}`, background: C.bgCard, fontFamily: "inherit", outline: "none", color: C.ink }} />
                        <button onClick={() => addCustom(tier)} style={{ background: C.sage, color: "#fff", border: "none", borderRadius: 9, padding: "9px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Add</button>
                        <button onClick={() => { setAddingTier(null); setCustomText(''); }} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 11px", fontSize: 13, color: C.mid, cursor: "pointer", fontFamily: "inherit" }}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setAddingTier(tier)} style={{ width: "100%", padding: "10px 14px", background: "none", border: "none", borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.soft, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                      + Add a task to this section
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sticky save bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.bgCard, borderTop: `1px solid ${C.border}`, padding: "10px 16px", zIndex: 99 }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", gap: 8, alignItems: "center" }}>
          {!userId ? (
            <>
              <div style={{ flex: 1, fontSize: 12.5, color: C.mid }}>Sign in to save your progress across devices</div>
              <GoogleSignInBtn label="Save with Google" />
            </>
          ) : (
            <>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: C.mid }}>{done} done · {assigned} assigned · {tasks.length - done} remaining</div>
                <div style={{ fontSize: 10.5, color: C.soft }}>Changes save automatically as you go</div>
              </div>
              <button onClick={() => { var p = new URLSearchParams({wid: workflowId||"", dn: deceasedName||"", cn: coordinatorName||""}); window.open("/share?" + p.toString(), "_blank"); }} style={{ background: "#f0f4ff", color: "#1877F2", border: "1px solid #1877F220", borderRadius: 10, padding: "9px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                📣 Share news
              </button>
              <button onClick={() => setShowEvents(true)} style={{ background: C.goldFaint, color: C.amber, border: `1px solid ${C.gold}30`, borderRadius: 10, padding: "9px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                📍 {eventCount > 0 ? `${eventCount} event${eventCount > 1 ? "s" : ""}` : "Add events"}
              </button>
              <button onClick={() => setShowRoleTemplates(true)} style={{ background: C.roseFaint, color: C.rose, border: `1px solid ${C.rose}30`, borderRadius: 10, padding: "9px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                ⚡ Quick assign
              </button>
              <button onClick={handleSave} style={{ background: saveStatus === "saved" ? C.sageFaint : C.sage, color: saveStatus === "saved" ? C.sage : "#fff", border: saveStatus === "saved" ? `1px solid ${C.sageLight}` : "none", borderRadius: 10, padding: "9px 18px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
                {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "✓ Saved" : "Save progress"}
              </button>
              {onDashboard && (
                <button onClick={onDashboard} style={{ background: C.bgSubtle, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: C.mid }}>← Dashboard</button>
              )}
            </>
          )}
        </div>
      </div>

      {assigningTask && (
        <AssignModal task={assigningTask} workflowId={workflowId} userId={userId}
          deceasedName={deceasedName} coordinatorName={coordinatorName}
          onAssign={handleAssign} onClose={() => setAssigningTask(null)} />
      )}
      {showEvents && workflowId && (
        <EventsModal workflowId={workflowId} deceasedName={deceasedName}
          onClose={() => setShowEvents(false)}
          onSaved={(count) => { setEventCount(count); setToast(`✅ Service details saved — included in all notifications`); }} />
      )}

      {showRoleTemplates && workflowId && (
        <RoleTemplateModal
          workflowId={workflowId} userId={userId}
          deceasedName={deceasedName} coordinatorName={coordinatorName}
          onClose={() => setShowRoleTemplates(false)}
          onDone={() => setShowRoleTemplates(false)}
        />
      )}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

// ─── EMERGENCY ONBOARDING ─────────────────────────────────────────────────────
function EmergencyFlow({ onBack, user, onSignOut, onDashboard }) {
  const [step, setStep] = useState(0);
  const [deceasedName, setDeceasedName] = useState("");
  const [dateOfDeath, setDateOfDeath] = useState("");
  const [relationship, setRelationship] = useState("");
  const [yourName, setYourName] = useState(() => user?.user_metadata?.full_name || "");
  const [yourEmail, setYourEmail] = useState(() => user?.email || "");
  const [workflowId, setWorkflowId] = useState(null);
  const [building, setBuilding] = useState(false);
  const [showTaskList, setShowTaskList] = useState(false);
  const buildPlan = async () => {
    setBuilding(true);
    await saveLead({ flow_type: "immediate", your_name: yourName, your_email: yourEmail, deceased_name: deceasedName, relationship, date_of_death: dateOfDeath, timestamp: new Date().toISOString() });
    const wf = await createWorkflow(user?.id, deceasedName, yourName, yourEmail, dateOfDeath);
    if (wf?.id) {
      const wfId = wf.id;
      setWorkflowId(wfId);
      await saveAllTasks(wfId, user?.id);
    }
    setBuilding(false);
    setShowTaskList(true);
  };

  if (showTaskList) {
    return <TaskList deceasedName={deceasedName} coordinatorName={yourName} workflowId={workflowId} userId={user?.id} onBack={() => setShowTaskList(false)} onDashboard={user ? onDashboard : null} onSignOut={onSignOut} />;
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <TopNav onBack={onBack} label="Emergency setup" user={user} onDashboard={user ? onDashboard : null} onSignOut={onSignOut} />
      <div style={{ padding: "24px 16px 80px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%" }}>
          {step === 0 && (
            <Card>
              <div style={{ background: C.roseFaint, border: `1px solid ${C.rose}30`, borderRadius: 14, padding: "22px 18px", marginBottom: 22, textAlign: "center" }}>
                <div style={{ fontSize: 34, marginBottom: 10 }}>🕊️</div>
                <Heading size={21}>We're so sorry for your loss.</Heading>
                <Sub>We'll guide you step by step. Nothing will be missed.</Sub>
              </div>
              <Field label="Name of the person who passed" placeholder="e.g. Robert James Collins" value={deceasedName} onChange={setDeceasedName} />
              <Field label="Date of passing" type="date" placeholder="" value={dateOfDeath} onChange={setDateOfDeath} hint="Needed for death certificates and official documents." />
              <Select label="Your relationship" value={relationship} onChange={setRelationship} options={[["","Select..."],["child","Son or daughter"],["spouse","Spouse or partner"],["sibling","Brother or sister"],["grandchild","Grandchild"],["friend","Close friend"],["other","Other"]]} />
              <Btn onClick={() => setStep(1)} disabled={!deceasedName || !relationship} style={{ width: "100%", background: C.rose }}>Continue →</Btn>
            </Card>
          )}

          {step === 1 && (
            <Card>
              <StepBar current={1} total={2} color={C.rose} />
              <Eyebrow text="Almost there" color={C.rose} />
              <Heading size={21}>Who's coordinating right now?</Heading>
              <Sub>Sign in to save your plan and come back anytime.</Sub>
              <div style={{ height: 18 }} />
              <Field label="Your name" placeholder="Your full name" value={yourName} onChange={setYourName} />
              <Field label="Your email" type="email" placeholder="your@email.com" value={yourEmail} onChange={setYourEmail} hint="Your task list will be associated with this email." />

              {!user && (
                <div style={{ background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 11, padding: "14px", marginBottom: 14 }}>
                  <div style={{ fontSize: 12.5, color: C.mid, marginBottom: 10 }}>Sign in to save your plan across devices and return anytime.</div>
                  <GoogleSignInBtn />
                  <div style={{ fontSize: 11, color: C.muted, textAlign: "center", marginTop: 6 }}>or continue without signing in</div>
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <Btn variant="ghost" onClick={() => setStep(0)}>← Back</Btn>
                <Btn onClick={buildPlan} disabled={!yourName || !yourEmail || building} style={{ flex: 1, background: C.rose }}>
                  {building ? "Building your plan..." : "Build my plan →"}
                </Btn>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PLANNED ONBOARDING ───────────────────────────────────────────────────────
function PlanFlow({ onComplete, onBack, user, onSignOut, onDashboard }) {
  const [step, setStep] = useState(0);
  const [forWhom, setForWhom] = useState("");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [disposition, setDisposition] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [executorName, setExecutorName] = useState("");
  const [executorEmail, setExecutorEmail] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("annual");

  const activate = async (mode) => {
    await saveLead({ flow_type: "planning", mode, executor_name: executorName, executor_email: executorEmail, person_name: name, disposition, service_type: serviceType, timestamp: new Date().toISOString() });
    if (user?.id) {
      const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
      const wf = await createWorkflow(user.id, name, user.email, user.email);
      if (wf) {
        const wfId = wf.id;
        // Mark as green path with trigger token and ready status
        await supabase.from('workflows').update({
          path: 'green',
          status: mode === 'paid' ? 'ready' : 'draft',
          trigger_token: token,
          trigger_people: executorEmail ? [executorEmail] : [],
          confirmation_count: 2,
        }).eq('id', wfId);

        // Save all tasks for the green path plan
        await saveAllTasks(wfId, user.id);

        // Queue notification actions for executor
        if (executorEmail) {
          await supabase.from('workflow_actions').insert([
            { workflow_id: wfId, action_type: 'email', recipient_type: 'person', recipient_email: executorEmail, recipient_name: executorName, task_title: 'Estate executor notification', status: 'pending', delay_hours: 0 },
            { workflow_id: wfId, action_type: 'sms', recipient_type: 'person', recipient_email: executorEmail, recipient_name: executorName, task_title: 'Estate executor notification', status: 'pending', delay_hours: 0 },
          ]);
        }

        // If activating, send executor their "you have been named" email
        if (mode === 'paid' && executorEmail) {
          fetch('/api/sendEmail', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: executorEmail, toName: executorName,
              taskTitle: 'You have been named executor of this estate plan',
              deceasedName: name, coordinatorName: user.email,
              workflowId: wfId, actionType: 'assignment',
            }),
          }).catch(() => {});
        }
      }
    }
    onComplete(mode);
  };

  const steps = [
    <Card key={0}>
      <Eyebrow text="Let's build your plan" />
      <Heading>Who are you protecting?</Heading>
      <Sub>Whether planning for yourself or helping someone you love.</Sub>
      <div style={{ height: 18 }} />
      {[
        { value: "self", icon: "🙋", title: "Myself", desc: "Set up my own plan so my family has everything they need." },
        { value: "parent", icon: "👴👵", title: "A parent or grandparent", desc: "Help someone I love get organized before it's urgent." },
        { value: "spouse", icon: "💑", title: "My spouse or partner", desc: "Planning together so neither of us is left guessing." },
      ].map(o => <OptionCard key={o.value} {...o} selected={forWhom === o.value} onClick={() => setForWhom(o.value)} />)}
      {!user && <div style={{ marginTop: 14 }}><GoogleSignInBtn /><div style={{ fontSize: 11, color: C.muted, textAlign: "center", marginTop: 6 }}>or continue without signing in</div></div>}
      <Btn onClick={() => setStep(1)} disabled={!forWhom} style={{ width: "100%", marginTop: 12 }}>Let's start →</Btn>
    </Card>,

    <Card key={1}>
      <StepBar current={1} total={5} />
      <Eyebrow text={forWhom === "self" ? "About you" : "About them"} />
      <Heading>{forWhom === "self" ? "Let's personalize your plan" : "Tell us about the person this plan protects"}</Heading>
      <Sub>Pre-fills notifications and documents so your family never has to look anything up.</Sub>
      <div style={{ height: 16 }} />
      <Field label="Full legal name" placeholder="e.g. Patricia Anne Collins" value={name} onChange={setName} hint="Appears on all official notifications and letters." />
      <Field label="Date of birth" type="date" value={dob} onChange={setDob} />
      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        <Btn variant="ghost" onClick={() => setStep(0)}>← Back</Btn>
        <Btn onClick={() => setStep(2)} disabled={!name || !dob} style={{ flex: 1 }}>Continue →</Btn>
      </div>
    </Card>,

    <Card key={2}>
      <StepBar current={2} total={5} />
      <Eyebrow text="Final wishes" />
      <Heading>The decisions your family would otherwise have to make without you</Heading>
      <div style={{ height: 14 }} />
      <Select label="Burial or cremation?" value={disposition} onChange={setDisposition} options={[["","Choose one..."],["cremation","Cremation"],["burial","Traditional burial"],["green","Green / natural burial"],["donation","Body donation to science"],["unsure","Not decided yet"]]} />
      <Select label="Type of service?" value={serviceType} onChange={setServiceType} options={[["","Choose one..."],["funeral","Traditional funeral service"],["celebration","Celebration of life"],["graveside","Graveside only"],["private","Private — close family only"],["none","No formal service"]]} />
      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        <Btn variant="ghost" onClick={() => setStep(1)}>← Back</Btn>
        <Btn onClick={() => setStep(3)} disabled={!disposition || !serviceType} style={{ flex: 1 }}>Continue →</Btn>
      </div>
    </Card>,

    <Card key={3}>
      <StepBar current={3} total={5} />
      <Eyebrow text="The trust mechanism" color={C.sage} />
      <Heading>Who activates your plan?</Heading>
      <div style={{ background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 12, padding: "14px 16px", marginBottom: 16, fontSize: 12.5, color: C.mid, lineHeight: 1.65 }}>
        🔒 <strong style={{ color: C.ink }}>Two people must independently confirm your passing</strong> before anything sends. This prevents accidental activation and gives your family confidence the system is trustworthy.
      </div>

      <div style={{ background: C.bgSubtle, borderRadius: 12, padding: "16px 18px", marginBottom: 12 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: C.sage, marginBottom: 4 }}>⚖️ Primary Executor</div>
        <div style={{ fontSize: 12, color: C.mid, marginBottom: 12, lineHeight: 1.5 }}>Receives the full task list the moment both confirmations arrive.</div>
        <Field label="Full name" placeholder="e.g. Sarah Collins" value={executorName} onChange={setExecutorName} />
        <Field label="Email" type="email" placeholder="sarah@email.com" value={executorEmail} onChange={setExecutorEmail} hint="Used for automatic notification when plan activates." />
      </div>

      <div style={{ background: C.bgSubtle, borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: C.ink, marginBottom: 4 }}>👤 Second Confirmer</div>
        <div style={{ fontSize: 12, color: C.mid, marginBottom: 10, lineHeight: 1.5 }}>The second person who confirms your passing. Can be the same as executor or someone different.</div>
        <div style={{ fontSize: 12, color: C.soft, fontStyle: "italic" }}>You can add this after setup — they'll receive a unique confirmation link.</div>
      </div>

      <div style={{ background: C.goldFaint, border: `1px solid ${C.gold}30`, borderRadius: 9, padding: "10px 14px", fontSize: 12, color: C.amber, marginBottom: 14, lineHeight: 1.5 }}>
        💡 Passage sends each person a unique, secure link. When both tap confirm, your plan activates automatically.
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Btn variant="ghost" onClick={() => setStep(2)}>← Back</Btn>
        <Btn onClick={() => setStep(4)} disabled={!executorName || !executorEmail} style={{ flex: 1 }}>Continue →</Btn>
      </div>
    </Card>,

    <Card key={4}>
      <StepBar current={4} total={5} />
      <Eyebrow text="Account map" />
      <Heading>Where are the important accounts?</Heading>
      <Sub>Pre-filled into notification letters so your family never has to hunt.</Sub>
      <div style={{ height: 16 }} />
      <div style={{ background: C.bgSubtle, borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
        {[["🏦","Primary bank account",false],["🏛️","Social Security",false],["🛡️","Life insurance policy",false],["📱","Recurring subscriptions",true],["₿","Digital assets / crypto",true]].map(([icon,label,locked],i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 17 }}>{icon}</span>
            <div style={{ flex: 1, fontSize: 13, color: locked ? C.muted : C.ink }}>{label}</div>
            {locked ? <span style={{ fontSize: 10, color: C.gold, fontWeight: 700, background: C.goldFaint, padding: "2px 7px", borderRadius: 5 }}>Upgrade</span> : <span style={{ fontSize: 10, color: C.sage, fontWeight: 700 }}>+ Add</span>}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Btn variant="ghost" onClick={() => setStep(3)}>← Back</Btn>
        <Btn onClick={() => setStep(5)} style={{ flex: 1 }}>Continue →</Btn>
      </div>
    </Card>,

    <Card key={5} maxWidth={540}>
      <StepBar current={5} total={5} />
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 34, marginBottom: 12 }}>🕊️</div>
        <Heading>Your plan is built. Now make it real.</Heading>
        <div style={{ background: C.bgSubtle, borderRadius: 11, padding: "13px 16px", fontSize: 13, color: C.mid, lineHeight: 1.65, marginTop: 10 }}>
          Right now this is a draft. <strong style={{ color: C.ink }}>Without activation, your family won't see any of this.</strong>
        </div>
        <div style={{ fontSize: 12, color: C.gold, fontWeight: 700, marginTop: 8 }}>Less than the cost of a single hour with an estate attorney.</div>
      </div>
      {[
        { id: "annual", label: "Annual", price: "$79", per: "/year", badge: "Best value — save 45%", popular: true },
        { id: "monthly", label: "Monthly", price: "$12", per: "/month", badge: "Start anytime, cancel anytime" },
        { id: "lifetime", label: "Lifetime", price: "$249", per: "one time", badge: "Pay once. Active forever." },
      ].map(p => (
        <div key={p.id} onClick={() => setSelectedPlan(p.id)} style={{ border: `2px solid ${selectedPlan === p.id ? C.sage : C.border}`, borderRadius: 12, padding: "13px 16px", cursor: "pointer", background: selectedPlan === p.id ? C.sageFaint : C.bgCard, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7, position: "relative" }}>
          {p.popular && <div style={{ position: "absolute", top: -9, left: 14, background: C.sage, color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 9px", borderRadius: 9 }}>RECOMMENDED</div>}
          <div><div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>{p.label}</div><div style={{ fontSize: 11, color: C.soft, marginTop: 2 }}>{p.badge}</div></div>
          <div><span style={{ fontSize: 20, fontWeight: 800, color: selectedPlan === p.id ? C.sage : C.ink }}>{p.price}</span><span style={{ fontSize: 11.5, color: C.soft }}> {p.per}</span></div>
        </div>
      ))}
      <div style={{ background: C.bgSubtle, borderRadius: 11, padding: "13px 15px", marginBottom: 18, marginTop: 8 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: C.ink, marginBottom: 7 }}>Activates immediately:</div>
        {[`${executorName || "Your executor"} gets email + SMS with their task list`,"Vendor notifications — funeral home, attorney, florist, caterer, cemetery","Social posts family-approved before sending","Unlimited wishes, accounts, documents","Memory vault — voice notes delivered after death"].map((f,i) => (
          <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: C.mid, padding: "3px 0" }}>
            <span style={{ color: C.sage, fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
          </div>
        ))}
      </div>
      <Btn onClick={() => activate("paid")} style={{ width: "100%", padding: "16px", fontSize: 15.5, marginBottom: 9 }}>Activate my plan →</Btn>
      <div style={{ textAlign: "center" }}>
        <button onClick={() => activate("draft")} style={{ background: "none", border: "none", fontSize: 12, color: C.soft, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}>
          Save as draft — nothing activates until I upgrade
        </button>
      </div>
    </Card>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <TopNav onBack={onBack} label="Setting up your plan" user={user} onDashboard={user ? onDashboard : null} onSignOut={onSignOut} />
      <div style={{ padding: "28px 16px 80px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%" }}>{steps[step]}</div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function PeopleList({ userId }) {
  const [people, setPeople] = useState([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    supabase.from('people').select('*').eq('owner_id', userId).order('created_at').then(({ data }) => {
      setPeople(data || []);
      setLoaded(true);
    });
  }, [userId]);
  if (!loaded) return <div style={{ fontSize: 12, color: C.soft }}>Loading...</div>;
  if (people.length === 0) return <div style={{ fontSize: 13, color: C.soft, fontStyle: "italic" }}>No people added yet. Use Quick assign in an estate plan to add people.</div>;
  return (
    <div>
      {people.map((p, i) => (
        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < people.length - 1 ? "1px solid " + C.border : "none" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.sageFaint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>👤</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{p.first_name} {p.last_name}</div>
            <div style={{ fontSize: 11, color: C.soft }}>{p.relationship || "No role"} {p.email ? "· " + p.email : ""}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Dashboard({ user, onStartPlan, onEmergency, onSignOut, onOpenPlan }) {
  const [userData, setUserData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [archiving, setArchiving] = useState(null);
  const [showWishes, setShowWishes] = useState(false);
  const [showPeople, setShowPeople] = useState(false);
  const [wishesData, setWishesData] = useState({});
  const [wishesToast, setWishesToast] = useState("");

  const [taskStats, setTaskStats] = useState({});

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const [{ user: u, profile: p }, wfs] = await Promise.all([
        loadUserProfile(user.id),
        loadUserWorkflows(user.id),
      ]);
      setUserData(u); setProfile(p); setWorkflows(wfs); setLoading(false);

      // Load task completion stats for all workflows
      const { data: stats } = await supabase.from('tasks')
        .select('workflow_id, status, assigned_to_name')
        .in('workflow_id', (wfs || []).map(w => w.id));
      if (stats) {
        const grouped = {};
        stats.forEach(t => {
          if (!grouped[t.workflow_id]) grouped[t.workflow_id] = { total: 0, completed: 0, assigned: 0 };
          grouped[t.workflow_id].total++;
          if (t.status === 'completed') grouped[t.workflow_id].completed++;
          if (t.assigned_to_name) grouped[t.workflow_id].assigned++;
        });
        setTaskStats(grouped);
      }
    };
    load();
  }, [user]);

  const handleArchive = async (wfId) => {
    if (!confirm("Archive this estate plan? You can still view it but it will be marked as complete.")) return;
    setArchiving(wfId);
    await archiveWorkflow(wfId);
    setWorkflows(prev => prev.filter(w => w.id !== wfId));
    setArchiving(null);
  };

  const plan = userData?.plan || 'free';
  const planMap = {
    free: { label: "Free Plan", color: C.soft, price: "$0", nextCharge: "None", renewal: "N/A" },
    monthly: { label: "Monthly", color: C.sage, price: "$12/mo", nextCharge: "Next month", renewal: "Monthly" },
    annual: { label: "Annual", color: C.sage, price: "$79/yr", nextCharge: "Next year", renewal: "Annual" },
    lifetime: { label: "Lifetime", color: C.gold, price: "$249", nextCharge: "Never", renewal: "Never" },
  };
  const pd = planMap[plan] || planMap.free;
  const redWorkflows = workflows.filter(w => w.status !== 'archived' && w.path !== 'green');
  const greenWorkflows = workflows.filter(w => w.status !== 'archived' && w.path === 'green');

  const saveWishes = async () => {
    if (!user) return;
    await supabase.from('wishes').upsert([{ user_id: user.id, disposition: wishesData.disposition || '', service_type: wishesData.service_type || '', religious_leader: wishesData.religious_leader || '', music_preferences: wishesData.music_preferences || '', special_requests: wishesData.special_requests || '', organ_donation: wishesData.organ_donation || false, updated_at: new Date().toISOString() }], { onConflict: 'user_id' });
    setShowWishes(false);
    setWishesToast("Wishes saved.");
    setTimeout(() => setWishesToast(""), 3000);
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <div style={{ background: C.bgCard, borderBottom: `1px solid ${C.border}`, padding: "13px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div onClick={onSignOut} style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }} title="Home">
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: `radial-gradient(circle, ${C.sageLight}, ${C.sage}70)` }} />
          <span style={{ fontFamily: "Georgia, serif", fontSize: 16, color: C.ink }}>Passage</span>
        </div>
        <div style={{ fontSize: 11, color: C.soft, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>
        <button onClick={onSignOut} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 12px", fontSize: 11.5, color: C.mid, cursor: "pointer", fontFamily: "inherit" }}>Sign out</button>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 14px 80px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: C.soft }}>Loading your file...</div>
        ) : (
          <>
            <div style={{ marginBottom: 18 }}>
              <Heading size={23}>Welcome back{userData?.first_name ? `, ${userData.first_name}` : ""}.</Heading>
              <Sub>
                {redWorkflows.length > 0 && redWorkflows[0]
                  ? 'Next: assign tasks and add service details to notify your people.'
                  : plan === 'free'
                    ? 'Start a plan now, or coordinate an estate if someone just passed.'
                    : 'Your plan is active.'}
              </Sub>
            </div>

            {/* Subscription */}
            <div style={{ background: C.bgCard, borderRadius: 18, padding: "18px", border: `1px solid ${C.border}`, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 9.5, letterSpacing: "0.15em", textTransform: "uppercase", color: C.soft, fontWeight: 600, marginBottom: 3 }}>Current Plan</div>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 19, color: pd.color }}>{pd.label}</div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: pd.color }}>{pd.price}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: plan === 'free' ? 12 : 0 }}>
                {[{l:"Status",v:userData?.plan_status === 'active' ? '✓ Active' : 'Free'},{l:"Next Charge",v:pd.nextCharge},{l:"Renewal",v:pd.renewal}].map(i => (
                  <div key={i.l} style={{ background: C.bgSubtle, borderRadius: 9, padding: "9px 11px" }}>
                    <div style={{ fontSize: 9, color: C.soft, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 3 }}>{i.l}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>{i.v}</div>
                  </div>
                ))}
              </div>
              {plan === 'free' && (
                <div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <button onClick={onStartPlan} style={{ flex: 1, padding: "10px", background: C.sage, border: "none", borderRadius: 11, fontSize: 12.5, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
                      🗓️ Plan ahead →
                    </button>
                    <button onClick={onEmergency} style={{ flex: 1, padding: "10px", background: C.roseFaint, border: `1px solid ${C.rose}30`, borderRadius: 11, fontSize: 12.5, fontWeight: 700, color: C.rose, cursor: "pointer", fontFamily: "inherit" }}>
                      🚨 Emergency plan
                    </button>
                  </div>
                  <button onClick={() => handleCheckout('annual', user && user.id, user && user.email)}
                    style={{ width: "100%", padding: "10px", background: "#1a1916", border: "none", borderRadius: 11, fontSize: 12.5, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
                    Upgrade to Passage — $49/yr
                  </button>
                </div>
              )}
              {plan !== 'free' && (
                <div style={{ background: C.sageFaint, borderRadius: 10, padding: "10px 14px", fontSize: 12, color: C.sage, fontWeight: 600 }}>
                  ✓ Active plan — full access
                </div>
              )}
            </div>

            {/* Red path active plans */}
            {redWorkflows.length > 0 && (
              <div style={{ background: C.bgCard, borderRadius: 18, padding: "18px", border: `1px solid ${C.border}`, marginBottom: 12 }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: C.ink, marginBottom: 4 }}>Active estate plans</div>
                <div style={{ fontSize: 12, color: C.mid, marginBottom: 13 }}>Tap to view and manage tasks</div>
                {redWorkflows.map((wf) => {
                  const wfId = wf.id;
                  const wfName = wf.name;
                  const wfCoord = wf.coordinator_name;
                  const wfDate = wf.created_at;
                  return (
                    <div key={wfId} style={{ marginBottom: 7 }}>
                      <button onClick={() => onOpenPlan(wf)}
                        style={{ width: "100%", background: C.roseFaint, border: `1px solid ${C.rose}25`, borderRadius: 12, padding: "13px 14px", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>{wfName}</div>
                            <div style={{ fontSize: 11, color: C.mid, marginTop: 2 }}>
                              {wfCoord && `Coordinator: ${wfCoord} · `}
                              Started {new Date(wfDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                            {taskStats[wfId] && (() => {
                              const s = taskStats[wfId];
                              const pct = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
                              return (
                                <div style={{ marginTop: 7 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ fontSize: 10.5, color: C.mid }}>{s.completed} of {s.total} tasks done</span>
                                    <span style={{ fontSize: 10.5, fontWeight: 700, color: pct > 0 ? C.sage : C.soft }}>{pct}%</span>
                                  </div>
                                  <div style={{ height: 4, borderRadius: 2, background: C.border, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? C.sage : C.rose, borderRadius: 2, transition: 'width 0.3s' }} />
                                  </div>
                                  {s.assigned > 0 && <div style={{ fontSize: 10, color: C.soft, marginTop: 3 }}>{s.assigned} task{s.assigned > 1 ? 's' : ''} assigned</div>}
                                </div>
                              );
                            })()}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <span style={{ fontSize: 10.5, color: C.rose, fontWeight: 700, background: C.roseFaint, border: `1px solid ${C.rose}30`, borderRadius: 7, padding: "2px 9px" }}>Active</span>
                            <span style={{ color: C.mid, fontSize: 14 }}>→</span>
                          </div>
                        </div>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleArchive(wfId); }}
                        style={{ width: "100%", padding: "6px", fontSize: 11, color: C.soft, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "center" }}>
                        {archiving === wfId ? "Archiving..." : "Archive plan"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Green path advance plans */}
            {greenWorkflows.length > 0 && (
              <div style={{ background: C.bgCard, borderRadius: 18, padding: "18px", border: `1px solid ${C.border}`, marginBottom: 12 }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: C.ink, marginBottom: 4 }}>Your advance plans</div>
                <div style={{ fontSize: 12, color: C.mid, marginBottom: 13 }}>Activates automatically when two people confirm</div>
                {greenWorkflows.map((wf) => {
                  const wfId = wf.id;
                  const wfName = wf.name;
                  const wfStatus = wf.status;
                  const confirmCount = (wf.confirmed_by || []).length;
                  const reqCount = wf.confirmation_count || 2;
                  const triggerUrl = typeof window !== 'undefined' ? `${window.location.origin}/confirm?token=${wf.trigger_token}` : '';
                  return (
                    <div key={wfId} style={{ marginBottom: 7 }}>
                      <div style={{ background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 12, padding: "13px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>{wfName}</div>
                          <span style={{ fontSize: 10.5, color: wfStatus === 'ready' ? C.sage : C.amber, fontWeight: 700, background: wfStatus === 'ready' ? C.sageFaint : C.goldFaint, border: `1px solid ${wfStatus === 'ready' ? C.sageLight : C.gold}30`, borderRadius: 7, padding: "2px 9px" }}>
                            {wfStatus === 'triggered' ? '🔔 Activated' : wfStatus === 'ready' ? '✓ Ready' : '⏳ Draft'}
                          </span>
                        </div>
                        {wfStatus === 'ready' && (
                          <div style={{ fontSize: 11.5, color: C.mid, lineHeight: 1.55, marginBottom: 8 }}>
                            <strong>{confirmCount} of {reqCount}</strong> confirmations received.
                            {confirmCount < reqCount && " Waiting for second person to confirm."}
                          </div>
                        )}
                        {wfStatus === 'ready' && triggerUrl && (
                          <div style={{ background: C.bgSubtle, borderRadius: 9, padding: "9px 12px", marginBottom: 8 }}>
                            <div style={{ fontSize: 10.5, fontWeight: 700, color: C.soft, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Confirmation link</div>
                            <div style={{ fontSize: 11, color: C.mid, wordBreak: "break-all", marginBottom: 6 }}>{triggerUrl}</div>
                            <button onClick={() => navigator.clipboard.writeText(triggerUrl).then(() => alert('Link copied!'))}
                              style={{ fontSize: 11, color: C.sage, fontWeight: 700, background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 7, padding: "4px 11px", cursor: "pointer", fontFamily: "inherit" }}>
                              Copy link
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Green path file */}
            <div style={{ background: C.bgCard, borderRadius: 18, padding: "18px", border: `1px solid ${C.border}`, marginBottom: 12 }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: C.ink, marginBottom: 14 }}>Your planning file</div>
              {[
                { label: "Wishes", complete: profile?.wishes_complete, icon: "📝", desc: profile?.disposition || "Not started" },
                { label: "Accounts", complete: profile?.accounts_complete, icon: "🗂️", desc: "Map your financial accounts" },
                { label: "People", complete: profile?.people_complete, icon: "👥", desc: profile?.attorney_name ? `Executor: ${profile.attorney_name}` : "Designate your people" },
                { label: "Documents", complete: profile?.documents_complete, icon: "📄", desc: "Upload important documents" },
                { label: "Memories", complete: profile?.vault_complete, icon: "🎙️", desc: "Record voice notes and letters" },
              ].map((s, i, arr) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: s.complete ? C.sageFaint : C.bgSubtle, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 15 }}>{s.complete ? "✓" : s.icon}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: s.complete ? C.sage : C.ink }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: C.soft, marginTop: 1 }}>{s.desc}</div>
                  </div>
                  <button onClick={() => {
                    if (s.label === "Wishes") setShowWishes(true);
                    else if (s.label === "People") setShowPeople(true);
                    else onStartPlan();
                  }} style={{ fontSize: 11, color: C.sage, fontWeight: 700, background: C.sageFaint, border: "none", borderRadius: 7, padding: "4px 11px", cursor: "pointer", fontFamily: "inherit" }}>
                    {s.complete ? "Edit" : "Add"} →
                  </button>
                </div>
              ))}
              <button onClick={onStartPlan} style={{ width: "100%", marginTop: 12, padding: "10px", background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 11, fontSize: 12.5, fontWeight: 600, color: C.sage, cursor: "pointer", fontFamily: "inherit" }}>
                Continue building my file →
              </button>
            </div>

            {/* Start emergency */}
            <div style={{ background: C.roseFaint, borderRadius: 18, padding: "18px", border: `1px solid ${C.rose}22`, marginBottom: 12 }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 15.5, color: C.ink, marginBottom: 5 }}>Someone in your family passed away?</div>
              <Sub>Start an emergency estate plan. We'll build a full task list and help coordinate everything.</Sub>
              <button onClick={onEmergency} style={{ marginTop: 12, padding: "10px 18px", background: C.rose, border: "none", borderRadius: 11, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
                Start emergency plan →
              </button>
            </div>

            {/* Account */}
            <div style={{ background: C.bgCard, borderRadius: 18, padding: "18px", border: `1px solid ${C.border}`, marginBottom: 12 }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: C.ink, marginBottom: 12 }}>Account</div>
              {[{l:"Email",v:user?.email},{l:"Member since",v:userData?.created_at ? new Date(userData.created_at).toLocaleDateString('en-US',{month:'long',year:'numeric'}) : "—"},{l:"Plan",v:pd.label},{l:"Status",v:userData?.plan_status || "active"}].map(i => (
                <div key={i.l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 12, color: C.soft, fontWeight: 600 }}>{i.l}</span>
                  <span style={{ fontSize: 12.5, color: C.ink, fontWeight: 500 }}>{i.v}</span>
                </div>
              ))}
            </div>

            <button onClick={onSignOut} style={{ width: "100%", padding: "12px", background: "none", border: `1px solid ${C.border}`, borderRadius: 11, fontSize: 13, color: C.mid, cursor: "pointer", fontFamily: "inherit" }}>
              Sign out of Passage
            </button>
          </>
        )}
      </div>
      {wishesToast ? (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: C.sage, color: "#fff", borderRadius: 12, padding: "11px 20px", fontSize: 13, fontWeight: 600, zIndex: 999 }}>{wishesToast}</div>
      ) : null}

      {showWishes ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setShowWishes(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.bgCard, borderRadius: "20px 20px 0 0", padding: "24px 20px 48px", width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ width: 32, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 18px" }} />
            <div style={{ fontFamily: "Georgia, serif", fontSize: 19, color: C.ink, marginBottom: 4 }}>Your wishes</div>
            <div style={{ fontSize: 12.5, color: C.mid, marginBottom: 20, lineHeight: 1.55 }}>These guide your family so they do not have to guess. Saved securely and shared only when your plan activates.</div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.soft, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Final arrangements</div>
              {[["burial","Burial"],["cremation","Cremation"],["green_burial","Green burial"],["donation","Body donation"],["undecided","Not sure yet"]].map(([v,l]) => (
                <button key={v} onClick={() => setWishesData(w => ({ ...w, disposition: v }))}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 13px", borderRadius: 10, border: "1.5px solid " + (wishesData.disposition === v ? C.sage : C.border), background: wishesData.disposition === v ? C.sageFaint : C.bgCard, fontSize: 13, color: C.ink, cursor: "pointer", fontFamily: "inherit", marginBottom: 6 }}>
                  {wishesData.disposition === v ? "✓ " : ""}{l}
                </button>
              ))}
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.soft, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Type of service</div>
              {[["religious","Religious service"],["celebration_of_life","Celebration of life"],["graveside","Graveside only"],["memorial","Memorial service"],["none","No service"]].map(([v,l]) => (
                <button key={v} onClick={() => setWishesData(w => ({ ...w, service_type: v }))}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 13px", borderRadius: 10, border: "1.5px solid " + (wishesData.service_type === v ? C.sage : C.border), background: wishesData.service_type === v ? C.sageFaint : C.bgCard, fontSize: 13, color: C.ink, cursor: "pointer", fontFamily: "inherit", marginBottom: 6 }}>
                  {wishesData.service_type === v ? "✓ " : ""}{l}
                </button>
              ))}
            </div>
            <Field label="Religious leader (name + contact)" placeholder="Rabbi David Cohen, rabbi@temple.org" value={wishesData.religious_leader || ""} onChange={v => setWishesData(w => ({ ...w, religious_leader: v }))} />
            <Field label="Music preferences" placeholder="e.g. Bach Cello Suite No. 1, Amazing Grace" value={wishesData.music_preferences || ""} onChange={v => setWishesData(w => ({ ...w, music_preferences: v }))} />
            <Field label="Special requests" placeholder="Anything else your family should know" value={wishesData.special_requests || ""} onChange={v => setWishesData(w => ({ ...w, special_requests: v }))} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <button onClick={() => setWishesData(w => ({ ...w, organ_donation: !w.organ_donation }))}
                style={{ width: 22, height: 22, borderRadius: 5, border: "1.5px solid " + (wishesData.organ_donation ? C.sage : C.border), background: wishesData.organ_donation ? C.sage : C.bgCard, cursor: "pointer", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: C.ink }}>I wish to be an organ donor</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowWishes(false)} style={{ padding: "11px 16px", borderRadius: 12, border: "1.5px solid " + C.border, background: C.bgCard, fontSize: 13, color: C.mid, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={saveWishes} style={{ flex: 1, padding: "11px", borderRadius: 12, border: "none", background: C.sage, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Save wishes</button>
            </div>
          </div>
        </div>
      ) : null}

      {showPeople ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setShowPeople(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.bgCard, borderRadius: "20px 20px 0 0", padding: "24px 20px 48px", width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ width: 32, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 18px" }} />
            <div style={{ fontFamily: "Georgia, serif", fontSize: 19, color: C.ink, marginBottom: 4 }}>Your people</div>
            <div style={{ fontSize: 12.5, color: C.mid, marginBottom: 20, lineHeight: 1.55 }}>Designate who handles what when your plan activates. They receive their tasks automatically.</div>
            <div style={{ background: C.sageFaint, border: "1px solid " + C.sageLight, borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: C.sage, fontWeight: 600, marginBottom: 6 }}>Use role templates from your estate plan</div>
              <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.55 }}>Go to any active estate plan, tap ⚡ Quick assign, and add role holders there. They will appear here automatically.</div>
            </div>
            <div style={{ fontSize: 13, color: C.ink, fontWeight: 600, marginBottom: 10 }}>People already added:</div>
            {profile && profile.user_id ? (
              <PeopleList userId={profile.user_id} />
            ) : (
              <div style={{ fontSize: 13, color: C.soft, fontStyle: "italic" }}>Sign in to view and manage your people.</div>
            )}
            <button onClick={() => setShowPeople(false)} style={{ width: "100%", marginTop: 18, padding: "11px", borderRadius: 12, border: "none", background: C.sage, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Done</button>
          </div>
        </div>
      ) : null}

    </div>
  );
}

// ─── LANDING ──────────────────────────────────────────────────────────────────
function Landing({ onPlan, onEmergency, user, onDashboard, onSignOut }) {
  const [visible, setVisible] = useState(false);
  const [breathe, setBreathe] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 80);
    setTimeout(() => setBreathe(true), 500);
    const t = setInterval(() => setBreathe(b => !b), 3800);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      <nav style={{ maxWidth: 1080, margin: "0 auto", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: `radial-gradient(circle at 40% 40%, ${C.sageLight}, ${C.sage}80)`, boxShadow: breathe ? `0 0 22px ${C.sage}50` : `0 0 7px ${C.sage}20`, transition: "box-shadow 3.8s ease-in-out" }} />
          <span style={{ fontFamily: "Georgia, serif", fontSize: 21, color: C.ink }}>Passage</span>
        </div>
        <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
          <button onClick={() => window.open(TALLY_URL, '_blank')} style={{ background: "none", border: "none", fontSize: 13, color: C.mid, cursor: "pointer", fontFamily: "inherit" }}>Join beta</button>
          {user ? (
            <>
              <button onClick={onDashboard} style={{ background: C.sage, border: "none", borderRadius: 9, padding: "8px 17px", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#fff", fontFamily: "inherit" }}>My file →</button>
              <button onClick={onSignOut} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 9, padding: "7px 13px", fontSize: 12, cursor: "pointer", color: C.mid, fontFamily: "inherit" }}>Sign out</button>
            </>
          ) : (
            <button onClick={handleSignInWithGoogle} style={{ background: C.bgCard, border: `1.5px solid ${C.border}`, borderRadius: 9, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", color: C.ink, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Sign in with Google
            </button>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "50px 24px 32px", textAlign: "center", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)", transition: "all 0.7s ease" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 18, padding: "5px 14px", fontSize: 11.5, color: C.sage, fontWeight: 700, marginBottom: 26 }}>🕊️ The family operating system for the end of life</div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(30px, 5.5vw, 55px)", lineHeight: 1.13, color: C.ink, marginBottom: 20, fontWeight: 400 }}>
          Your family shouldn't have to{" "}<em style={{ color: C.sage }}>figure it out</em><br />while they're grieving.
        </h1>
        <p style={{ fontSize: "clamp(14px, 2vw, 16px)", color: C.mid, lineHeight: 1.8, maxWidth: 540, margin: "0 auto 12px" }}>
          Passage lets you capture everything your family would otherwise have to guess — your wishes, your accounts, your people — so when the time comes, your plan executes itself.
        </p>
        <p style={{ fontSize: 13.5, color: C.soft, marginBottom: 32, fontStyle: "italic" }}>Set it up while there's time. Let it take over when there isn't.</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 18 }}>
          <Btn onClick={onPlan} style={{ padding: "16px 32px", fontSize: 15.5 }}>Start planning now →</Btn>
          <Btn variant="rose" onClick={onEmergency} style={{ padding: "16px 24px", fontSize: 14.5 }}>Someone just passed ↗</Btn>
        </div>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
          {["Free to start","No credit card required","Your data, always yours"].map(t => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: C.soft }}>
              <span style={{ color: C.sage, fontWeight: 700 }}>✓</span>{t}
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 90, maxWidth: 560, margin: "0 auto 44px", background: `radial-gradient(ellipse at 50% 100%, ${C.sageLight}50, transparent 70%)`, borderRadius: "50% 50% 0 0 / 100% 100% 0 0" }} />

      <div style={{ maxWidth: 940, margin: "0 auto", padding: "16px 24px 56px" }}>
        <div style={{ textAlign: "center", marginBottom: 38 }}>
          <Heading size={30}>How it works</Heading>
          <Sub>Set it up while there's time. Let it take over when there isn't.</Sub>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 18 }}>
          {[
            { n: "01", icon: "📝", title: "Capture everything that matters", body: "Your wishes, accounts, documents, and the people responsible for each decision." },
            { n: "02", icon: "👨‍👩‍👧‍👦", title: "Assign the right people ahead of time", body: "Everyone knows their role. Tasks pre-assigned. Letters pre-written. Responsibility clear." },
            { n: "03", icon: "⚡", title: "One confirmation activates everything", body: "Your attorney gets documents. The funeral home is contacted. Everything happens — so your family doesn't have to." },
          ].map(item => (
            <div key={item.n} style={{ background: C.bgCard, borderRadius: 18, padding: "24px", border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 13 }}>
                <span style={{ fontSize: 24 }}>{item.icon}</span>
                <span style={{ fontSize: 9.5, color: C.sage, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>{item.n}</span>
              </div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: C.ink, marginBottom: 9, lineHeight: 1.3 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.7 }}>{item.body}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: C.bgSage, padding: "50px 24px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
          <Heading size={26}>When the trigger fires, your plan comes to life</Heading>
          <Sub>You're not just notifying people. You're orchestrating the most important moment your family will ever face.</Sub>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, maxWidth: 440, margin: "28px auto 20px" }}>
            {[["👨‍👩‍👧‍👦","Family"],["⚖️","Attorney"],["🏛️","Funeral home"],["🌸","Florist"],["🍽️","Caterer"],["⛪","Cemetery"],["📰","Obituaries"],["📱","Socials"]].map(([icon,label]) => (
              <div key={label} style={{ background: C.bgCard, borderRadius: 11, padding: "12px 6px", textAlign: "center", border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 19, marginBottom: 4 }}>{icon}</div>
                <div style={{ fontSize: 10, color: C.mid, fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: C.soft, lineHeight: 1.6 }}>Social posts are family-approved before going live.<br />Two people must confirm before anything triggers.</div>
        </div>
      </div>

      <div style={{ background: C.bgDark, padding: "50px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", color: C.soft, fontWeight: 600, textAlign: "center", marginBottom: 32 }}>What families say</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 14 }}>
            {[
              { q: "I had no idea I needed to notify the DMV, the passport office, AND three credit bureaus. Nobody tells you this.", a: "Adult daughter, 54" },
              { q: "Two months after losing my mom I realized I'd missed the Social Security survivor benefit window. That was thousands of dollars.", a: "Son, 31" },
              { q: "We sat with the funeral director for two hours and left more confused than when we walked in. I wish we'd had this.", a: "Family navigating Medicaid pre-planning" },
            ].map((v,i) => (
              <div key={i} style={{ background: "#252520", borderRadius: 14, padding: "22px", border: "1px solid #333" }}>
                <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: "#e8e4dc", lineHeight: 1.75, marginBottom: 12 }}>"{v.q}"</div>
                <div style={{ fontSize: 11, color: C.soft }}>— {v.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "56px 24px", textAlign: "center" }}>
        <Heading size={28}>Start your family's plan today</Heading>
        <Sub>Free to set up. Activate when you're ready.</Sub>
        <div style={{ fontSize: 12.5, color: C.gold, fontWeight: 700, margin: "8px 0 28px" }}>Less than the cost of a single hour with an estate attorney.</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 12 }}>
          <Btn onClick={onPlan} style={{ padding: "16px 32px", fontSize: 15.5 }}>Start planning — it's free →</Btn>
          <Btn variant="rose" onClick={onEmergency} style={{ padding: "16px 22px", fontSize: 14 }}>Someone just passed</Btn>
        </div>
        <div style={{ fontSize: 11.5, color: C.muted }}>No credit card required to start</div>
      </div>
    </div>
  );
}

// ─── SUCCESS ──────────────────────────────────────────────────────────────────
function Success({ mode, onDashboard }) {
  const isDraft = mode === "draft";
  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "36px 16px" }}>
      <div style={{ maxWidth: 460, width: "100%" }}>
        <div style={{ background: C.bgCard, borderRadius: 22, padding: "44px 32px", textAlign: "center", boxShadow: "0 2px 36px rgba(0,0,0,0.07)" }}>
          <div style={{ width: 68, height: 68, borderRadius: "50%", background: isDraft ? C.goldFaint : C.sageFaint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, margin: "0 auto 22px" }}>
            {isDraft ? "📄" : "🕊️"}
          </div>
          <Heading size={24}>{isDraft ? "Your draft is saved." : "Your file is activated."}</Heading>
          <div style={{ fontSize: 14, color: C.mid, lineHeight: 1.8, margin: "10px 0 22px" }}>
            {isDraft ? "Nothing will be triggered until you activate your plan." : "Your family will never have to guess. When the time comes, everything is waiting."}
          </div>
          <div style={{ background: isDraft ? C.goldFaint : C.sageFaint, borderRadius: 11, padding: "11px 15px", fontSize: 13, color: isDraft ? C.amber : C.sage, fontWeight: 600, marginBottom: onDashboard ? 18 : 0 }}>
            {isDraft ? "We'll remind you to activate in 7 days." : "Welcome to Passage. 🕊️"}
          </div>
          {onDashboard && (
            <button onClick={onDashboard} style={{ width: "100%", padding: "12px", background: C.sage, border: "none", borderRadius: 11, fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
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
  const [activePlan, setActivePlan] = useState(null); // workflow object for tasklist view

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setActivePlan(null);
    setView("landing");
  };

  const handleOpenPlan = (workflow) => {
    setActivePlan(workflow);
    setView("tasklist");
  };

  const commonProps = { user, onSignOut: handleSignOut, onDashboard: () => setView("dashboard") };

  return (
    <>
      {view === "landing" && <Landing {...commonProps} onPlan={() => setView("plan")} onEmergency={() => setView("emergency")} />}
      {view === "plan" && <PlanFlow {...commonProps} onComplete={(mode) => { setSuccessMode(mode); setView("success"); }} onBack={() => setView("landing")} />}
      {view === "emergency" && <EmergencyFlow {...commonProps} onBack={() => setView("landing")} />}
      {view === "success" && <Success mode={successMode} onDashboard={user ? () => setView("dashboard") : null} />}
      {view === "dashboard" && <Dashboard {...commonProps} onStartPlan={() => setView("plan")} onEmergency={() => setView("emergency")} onOpenPlan={handleOpenPlan} />}
      {view === "tasklist" && activePlan && (
        <TaskList
          deceasedName={activePlan.deceased_name || activePlan.name?.replace("Estate of ", "") || ""}
          coordinatorName={activePlan.coordinator_name || user?.email || ""}
          workflowId={activePlan.id}
          userId={user?.id}
          onBack={() => setView("dashboard")}
          onDashboard={() => setView("dashboard")}
          onSignOut={handleSignOut}
        />
      )}
    </>
  );
}
