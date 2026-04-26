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
  rose: "#c47a7a", roseFaint: "#fdf3f3", amber: "#b07a3a", amberFaint: "#fdf5eb",
  red: "#c0392b", redFaint: "#fdf0ef",
  orange: "#d4651a", orangeFaint: "#fef3eb",
  yellow: "#c8941a", yellowFaint: "#fefaeb",
};

const TALLY_URL = "https://tally.so/r/q4Ev05";

// ─── TASK DATA ────────────────────────────────────────────────────────────────
const POST_DEATH_TASKS = [
  {
    tier: 1, tierLabel: "First 24 Hours", tierColor: C.red, tierBg: C.redFaint, icon: "🚨",
    tasks: [
      { id: "t1_01", title: "Obtain official pronouncement of death", desc: "From attending physician, hospice nurse, or coroner. Required before any other steps.", category: "legal" },
      { id: "t1_02", title: "Contact the funeral home", desc: "Arrange transportation of the body. Share pre-documented wishes if available.", category: "service" },
      { id: "t1_03", title: "Notify immediate family members", desc: "Spouse, children, siblings, parents. Always call — don't text for immediate family.", category: "notifications" },
      { id: "t1_04", title: "Secure the home and valuables", desc: "Lock the residence. Secure jewelry, cash, firearms, and important documents.", category: "property" },
      { id: "t1_05", title: "Locate the will and advance directives", desc: "Check home safe, filing cabinet, or attorney's office. Needed immediately.", category: "legal" },
      { id: "t1_06", title: "Make arrangements for minor children and pets", desc: "Ensure children and pets are cared for immediately.", category: "personal" },
      { id: "t1_07", title: "Notify the executor of the estate", desc: "Inform them of the death and their legal responsibilities.", category: "legal" },
      { id: "t1_08", title: "Document the date, time, and location of death", desc: "Required on death certificates and all official documents.", category: "legal" },
      { id: "t1_09", title: "Notify hospice or home care providers", desc: "They will need to retrieve equipment and close out care records.", category: "medical" },
    ]
  },
  {
    tier: 2, tierLabel: "First 72 Hours", tierColor: C.orange, tierBg: C.orangeFaint, icon: "⏰",
    tasks: [
      { id: "t2_01", title: "Order death certificates — minimum 15 copies", desc: "Banks, insurance, government, and employers each require originals. Certified copies cost ~$10–25 each.", category: "legal" },
      { id: "t2_02", title: "Notify close friends and extended family", desc: "Use a phone tree or designate someone to help spread the word.", category: "notifications" },
      { id: "t2_03", title: "Meet with funeral director to finalize arrangements", desc: "Confirm burial vs cremation, service type, casket or urn, and date/time.", category: "service" },
      { id: "t2_04", title: "Draft and submit the obituary", desc: "Contact local newspapers. Most require 24–48 hour lead time.", category: "memorial" },
      { id: "t2_05", title: "Notify the deceased's employer or business", desc: "Contact HR for final paycheck, benefits continuation, and employer life insurance.", category: "notifications" },
      { id: "t2_06", title: "Coordinate out-of-town family travel and lodging", desc: "Help arrange flights, hotels, and transportation for family traveling to the service.", category: "logistics" },
      { id: "t2_07", title: "Select readings, music, and pallbearers", desc: "Coordinate with the officiant and funeral director on service details.", category: "memorial" },
      { id: "t2_08", title: "Gather photos and memories for the service", desc: "Collect digital and print photos for slideshow, memory boards, and programs.", category: "memorial" },
      { id: "t2_09", title: "Plan the reception or post-service gathering", desc: "Determine location, catering, and designate someone to organize.", category: "logistics" },
      { id: "t2_10", title: "Notify the faith community or religious leader", desc: "Contact priest, rabbi, pastor, imam, or other officiant.", category: "notifications" },
      { id: "t2_11", title: "Contact the cemetery or crematorium", desc: "Confirm plot, interment date, and any additional fees or requirements.", category: "service" },
      { id: "t2_12", title: "Request an itemized funeral home contract", desc: "Federal law requires itemized pricing. Review before signing anything.", category: "legal" },
    ]
  },
  {
    tier: 3, tierLabel: "First Week", tierColor: C.yellow, tierBg: C.yellowFaint, icon: "📋",
    tasks: [
      { id: "t3_01", title: "Notify Social Security Administration", desc: "Call 1-800-772-1213. Survivor benefits may apply. Required within 10 days.", category: "government" },
      { id: "t3_02", title: "Notify primary bank and all financial institutions", desc: "Bring death certificates. Ask about joint accounts and automatic payments.", category: "financial" },
      { id: "t3_03", title: "Contact all life insurance companies to file claims", desc: "Required: certified death certificate, policy number, beneficiary ID.", category: "financial" },
      { id: "t3_04", title: "Contact estate attorney to begin probate process", desc: "Probate requirements vary by state. May be required to transfer assets.", category: "legal" },
      { id: "t3_05", title: "Notify pension and retirement account administrators", desc: "IRA, 401(k), and pension plans. Beneficiaries must file claims — some have deadlines.", category: "financial" },
      { id: "t3_06", title: "Address health insurance for surviving family members", desc: "COBRA continuation available. Must elect within 60 days of coverage loss.", category: "financial" },
      { id: "t3_07", title: "Notify Medicare and Medicaid if applicable", desc: "Required by law. May affect surviving spouse's coverage and benefits.", category: "government" },
      { id: "t3_08", title: "Contact Veterans Affairs if the deceased was a veteran", desc: "VA may provide burial benefits, survivor pension. Call 1-800-827-1000.", category: "government" },
      { id: "t3_09", title: "Cancel voter registration", desc: "Contact local board of elections. Prevents fraudulent use.", category: "government" },
      { id: "t3_10", title: "Set up mail forwarding or hold with USPS", desc: "Forward to executor's address. Important bills will continue to arrive.", category: "logistics" },
      { id: "t3_11", title: "Secure digital accounts and retrieve important passwords", desc: "Access email, financial accounts, and cloud storage.", category: "digital" },
      { id: "t3_12", title: "Notify all credit card companies", desc: "Close individual accounts. Clarify joint account liability. Prevents fraud.", category: "financial" },
      { id: "t3_13", title: "Contact the DMV to cancel the driver's license", desc: "Some states require the physical license to be surrendered.", category: "government" },
      { id: "t3_14", title: "Begin collecting contact info for thank you notes", desc: "List everyone who sent flowers, food, donations, or cards.", category: "personal" },
      { id: "t3_15", title: "Notify professional licensing boards if applicable", desc: "Medical, legal, or other professional licenses may need to be surrendered.", category: "government" },
    ]
  },
  {
    tier: 4, tierLabel: "First 30–60 Days", tierColor: C.sage, tierBg: C.sageFaint, icon: "📅",
    tasks: [
      { id: "t4_01", title: "Apply for Social Security survivor benefits", desc: "Surviving spouse (60+), disabled spouse (50+), or minor children may qualify. The 60-day deadline is strict.", category: "government" },
      { id: "t4_02", title: "File for pension and annuity survivor benefits", desc: "Contact all pension plan administrators. Benefits vary by plan.", category: "financial" },
      { id: "t4_03", title: "Update or create a new will for the surviving spouse", desc: "Death of a spouse often invalidates prior estate plans. Consult an attorney.", category: "legal" },
      { id: "t4_04", title: "Update beneficiary designations on all accounts", desc: "Retirement accounts, life insurance, POD bank accounts. The will does NOT override beneficiary designations.", category: "financial" },
      { id: "t4_05", title: "Transfer vehicle titles with the DMV", desc: "Bring death certificate and current title. Requirements vary by state.", category: "property" },
      { id: "t4_06", title: "Begin real property transfer or sale process", desc: "Contact a real estate attorney or title company.", category: "property" },
      { id: "t4_07", title: "Cancel all subscriptions and recurring services", desc: "Streaming, magazines, memberships, gym, clubs, professional associations.", category: "digital" },
      { id: "t4_08", title: "Memorialize or close social media accounts", desc: "Facebook, Instagram, LinkedIn, X/Twitter each have different processes.", category: "digital" },
      { id: "t4_09", title: "File the final income tax return", desc: "Required for the year of death. Surviving spouse may file jointly.", category: "financial" },
      { id: "t4_10", title: "File estate tax return if applicable", desc: "Federal and some state estate taxes may apply.", category: "financial" },
      { id: "t4_11", title: "Notify the three credit bureaus", desc: "Equifax, Experian, TransUnion. Prevents credit fraud.", category: "financial" },
      { id: "t4_12", title: "Arrange estate sale or donation of belongings", desc: "Contact an estate sale company or charity.", category: "property" },
      { id: "t4_13", title: "Cancel or surrender the passport", desc: "Submit to the Department of State with death certificate.", category: "government" },
      { id: "t4_14", title: "Notify professional and alumni associations", desc: "Bar association, medical board, alumni networks, fraternal organizations.", category: "notifications" },
      { id: "t4_15", title: "Establish a memorial fund or charitable giving option", desc: "Coordinate with a charity or foundation for donations in lieu of flowers.", category: "memorial" },
      { id: "t4_16", title: "Send handwritten thank you notes", desc: "Acknowledge flowers, food, donations, and those who attended.", category: "personal" },
      { id: "t4_17", title: "Review and update home and auto insurance", desc: "Policies may need to be transferred or updated.", category: "financial" },
      { id: "t4_18", title: "Contact the attorney about closing the estate", desc: "Once debts are settled and assets distributed, formally close the estate.", category: "legal" },
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

// ─── SUPABASE HELPERS ─────────────────────────────────────────────────────────
const saveLead = async (data) => {
  try {
    await fetch('/api/saveLead', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (err) { console.error('saveLead:', err); }
};

const createWorkflow = async (userId, deceasedName) => {
  try {
    const { data, error } = await supabase.from('workflows').insert([{
      user_id: userId || null,
      name: `Estate of ${deceasedName || "Loved One"}`,
      status: 'active', trigger_type: 'death_confirmed', is_custom: false,
    }]).select().single();
    if (error) { console.error('createWorkflow:', error); return null; }
    return data;
  } catch (err) { console.error('createWorkflow:', err); return null; }
};

const saveTasksToSupabase = async (workflowId, userId, tasks) => {
  if (!workflowId) return;
  try {
    const rows = tasks.map(t => ({
      workflow_id: workflowId, user_id: userId || null,
      title: t.title, description: t.desc || "",
      category: t.category || "other",
      priority: t.tier === 1 ? "urgent" : t.tier === 2 ? "high" : "normal",
      due_days_after_trigger: t.tier === 1 ? 1 : t.tier === 2 ? 3 : t.tier === 3 ? 7 : 45,
      status: "pending",
    }));
    const { error } = await supabase.from('tasks').insert(rows);
    if (error) console.error('saveTasksToSupabase:', error);
  } catch (err) { console.error('saveTasksToSupabase:', err); }
};

const loadTasksFromSupabase = async (workflowId) => {
  if (!workflowId) return [];
  const { data } = await supabase.from('tasks').select('*').eq('workflow_id', workflowId).order('created_at');
  return data || [];
};

const updateTaskInSupabase = async (taskId, updates) => {
  try { await supabase.from('tasks').update(updates).eq('id', taskId); }
  catch (err) { console.error('updateTask:', err); }
};

const savePersonAndAssignTask = async (workflowId, userId, taskDbId, person) => {
  try {
    const nameParts = (person.name || "").trim().split(" ");
    const { data: personData, error } = await supabase.from('people').insert([{
      owner_id: userId || "00000000-0000-0000-0000-000000000000",
      first_name: nameParts[0] || person.name,
      last_name: nameParts.slice(1).join(" ") || "",
      email: person.email || null,
      phone: person.phone || null,
      relationship: person.role || null,
      role: "recipient",
      notify_on_trigger: true,
    }]).select().single();
    if (error) { console.error('savePerson:', error); return null; }

    // Wire notification action — ready for email/SMS/social hooks
    if (workflowId && personData) {
      await supabase.from('workflow_actions').insert([{
        workflow_id: workflowId,
        action_type: 'email',
        recipient_type: 'person',
        recipient_person_id: personData.id,
        recipient_email: person.email || null,
        recipient_phone: person.phone || null,
        subject: `You've been asked to help with an estate task`,
        body: `${person.name || person.role} — you've been assigned a task in Passage. Task: ${person.taskTitle || "Estate coordination task"}. You'll receive details when the plan is activated.`,
        status: 'pending',
        delay_hours: 0,
      }]);
    }

    if (taskDbId && personData) {
      await supabase.from('tasks').update({
        assigned_to_person_id: personData.id,
        assigned_to_name: person.name,
        assigned_to_email: person.email || null,
      }).eq('id', taskDbId);
    }
    return personData;
  } catch (err) { console.error('savePersonAndAssignTask:', err); return null; }
};

const loadUserWorkflows = async (userId) => {
  if (!userId) return [];
  const { data } = await supabase.from('workflows')
    .select('*, tasks(count)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return data || [];
};

// ─── AUTH HELPERS ─────────────────────────────────────────────────────────────
const signInWithGoogle = async () => {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: 'https://thepassageapp.io' }
  });
};

// signOut is handled in root to reset state properly

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────
const Btn = ({ children, onClick, variant = "primary", disabled, style = {} }) => {
  const base = {
    border: "none", borderRadius: 14, padding: "15px 28px", fontSize: 15,
    fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit",
    transition: "all 0.2s", display: "inline-flex", alignItems: "center",
    justifyContent: "center", gap: 8, opacity: disabled ? 0.5 : 1, boxSizing: "border-box",
  };
  const variants = {
    primary: { background: C.sage, color: "#fff", boxShadow: `0 4px 20px ${C.sage}35` },
    ghost: { background: "transparent", color: C.mid, padding: "12px 20px" },
    rose: { background: C.rose, color: "#fff", boxShadow: `0 4px 20px ${C.rose}35` },
    secondary: { background: C.bgCard, color: C.ink, border: `1.5px solid ${C.border}` },
    dark: { background: C.bgDark, color: "#fff" },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>{children}</button>;
};

const Input = ({ label, placeholder, value, onChange, type = "text", hint }) => (
  <div style={{ marginBottom: 18 }}>
    {label && <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.mid, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>{label}</label>}
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", padding: "14px 16px", borderRadius: 12, fontSize: 15, border: `1.5px solid ${C.border}`, background: C.bgCard, color: C.ink, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
    {hint && <div style={{ fontSize: 11.5, color: C.soft, marginTop: 6 }}>{hint}</div>}
  </div>
);

const OptionCard = ({ icon, title, desc, selected, onClick }) => (
  <div onClick={onClick} style={{ border: `2px solid ${selected ? C.sage : C.border}`, borderRadius: 16, padding: "18px 20px", cursor: "pointer", background: selected ? C.sage + "0a" : C.bgCard, transition: "all 0.18s", marginBottom: 10, display: "flex", alignItems: "flex-start", gap: 16 }}>
    <div style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: C.mid, lineHeight: 1.6 }}>{desc}</div>
    </div>
    <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${selected ? C.sage : C.muted}`, background: selected ? C.sage : "transparent", flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {selected && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
    </div>
  </div>
);

const ProgressBar = ({ current, total, color }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
      <div style={{ fontSize: 11, color: C.soft, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Step {current} of {total}</div>
      <div style={{ fontSize: 11, color: color || C.sage, fontWeight: 700 }}>{Math.round((current / total) * 100)}% complete</div>
    </div>
    <div style={{ height: 4, background: C.border, borderRadius: 2 }}>
      <div style={{ height: "100%", borderRadius: 2, transition: "width 0.4s ease", width: `${(current / total) * 100}%`, background: color || C.sage }} />
    </div>
  </div>
);

const StepCard = ({ children, maxWidth = 520 }) => (
  <div style={{ background: C.bgCard, borderRadius: 24, padding: "36px 32px", maxWidth, width: "100%", margin: "0 auto", boxShadow: "0 2px 40px rgba(0,0,0,0.07)" }}>{children}</div>
);

const StepTitle = ({ eyebrow, title, sub, color }) => (
  <div style={{ marginBottom: 26 }}>
    {eyebrow && <div style={{ fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", color: color || C.sage, fontWeight: 700, marginBottom: 8 }}>{eyebrow}</div>}
    <div style={{ fontFamily: "Georgia, serif", fontSize: 24, color: C.ink, lineHeight: 1.25, marginBottom: sub ? 10 : 0 }}>{title}</div>
    {sub && <div style={{ fontSize: 14, color: C.mid, lineHeight: 1.65 }}>{sub}</div>}
  </div>
);

// Top nav — used across all inner screens
const TopNav = ({ user, onDashboard, onBack, label, onSignOut }) => (
  <div style={{ background: C.bgCard, borderBottom: `1px solid ${C.border}`, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 26, height: 26, borderRadius: "50%", background: `radial-gradient(circle, ${C.sageLight}, ${C.sage}70)`, flexShrink: 0 }} />
      <span style={{ fontFamily: "Georgia, serif", fontSize: 17, color: C.ink }}>Passage</span>
    </div>
    {label && <div style={{ fontSize: 11, color: C.soft, fontWeight: 500 }}>{label}</div>}
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {user && onDashboard && (
        <button onClick={onDashboard} style={{ background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, color: C.sage, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
          My file
        </button>
      )}
      {onSignOut && (
        <button onClick={onSignOut} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, color: C.mid, cursor: "pointer", fontFamily: "inherit" }}>
          Sign out
        </button>
      )}
      {onBack && !onSignOut && (
        <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 13, color: C.soft, cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
      )}
    </div>
  </div>
);

const GoogleBtn = ({ label = "Continue with Google" }) => (
  <button onClick={signInWithGoogle} style={{ width: "100%", padding: "13px 20px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: C.bgCard, border: `1.5px solid ${C.border}`, color: C.ink, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
    {label}
  </button>
);

// ─── ASSIGN MODAL ─────────────────────────────────────────────────────────────
function AssignModal({ task, onAssign, onClose, workflowId, userId }) {
  const [mode, setMode] = useState("roster");
  const [selectedRole, setSelectedRole] = useState("");
  const [customName, setCustomName] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [customPhone, setCustomPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAssign = async () => {
    setSaving(true);
    const person = mode === "roster"
      ? { name: selectedRole, role: selectedRole, email: "", phone: "", taskTitle: task.title }
      : { name: customName, role: customRole, email: customEmail, phone: customPhone, taskTitle: task.title };
    await savePersonAndAssignTask(workflowId, userId, task.dbId, person);
    onAssign(task.id, person.name, person.role);
    setSaving(false);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.bgCard, borderRadius: "20px 20px 0 0", padding: "28px 20px 44px", width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 20px" }} />
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: C.ink, marginBottom: 4 }}>Assign this task</div>
        <div style={{ fontSize: 12.5, color: C.mid, marginBottom: 20, background: C.bgSubtle, borderRadius: 10, padding: "10px 14px", lineHeight: 1.5 }}>{task.title}</div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[["roster", "Choose from list"], ["custom", "Add someone new"]].map(([m, l]) => (
            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1.5px solid ${mode === m ? C.rose : C.border}`, background: mode === m ? C.roseFaint : C.bgCard, fontSize: 13, fontWeight: 600, color: mode === m ? C.rose : C.mid, cursor: "pointer", fontFamily: "inherit" }}>
              {l}
            </button>
          ))}
        </div>

        {mode === "roster" ? (
          <div>
            {PEOPLE_ROLES.map(group => (
              <div key={group.group} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.soft, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>{group.group}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {group.roles.map(role => (
                    <button key={role} onClick={() => setSelectedRole(role)} style={{ padding: "7px 14px", borderRadius: 20, fontSize: 12.5, fontWeight: 500, border: `1.5px solid ${selectedRole === role ? C.rose : C.border}`, background: selectedRole === role ? C.roseFaint : C.bgCard, color: selectedRole === role ? C.rose : C.mid, cursor: "pointer", fontFamily: "inherit" }}>
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <Input label="Their name" placeholder="e.g. Sarah Collins" value={customName} onChange={setCustomName} />
            <Input label="Their role (optional)" placeholder="e.g. My sister" value={customRole} onChange={setCustomRole} />
            <Input label="Email — for notification when trigger fires" type="email" placeholder="sarah@email.com" value={customEmail} onChange={setCustomEmail} />
            <Input label="Phone — for SMS notification" placeholder="(555) 000-0000" value={customPhone} onChange={setCustomPhone} />
            <div style={{ background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 10, padding: "10px 14px", fontSize: 11.5, color: C.mid, marginBottom: 4 }}>
              📧 Email and phone are saved now and will be used to automatically notify this person when the trigger fires.
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn variant="rose" onClick={handleAssign} disabled={!(mode === "roster" ? selectedRole : customName) || saving} style={{ flex: 1 }}>
            {saving ? "Saving..." : "Assign →"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── TASK LIST VIEW ───────────────────────────────────────────────────────────
function TaskListView({ deceasedName, yourName, workflowId, userId, onBack, onDashboard, onSignOut }) {
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [assigningTask, setAssigningTask] = useState(null);
  const [addingCustomTier, setAddingCustomTier] = useState(null);
  const [customText, setCustomText] = useState("");
  const [expandedTiers, setExpandedTiers] = useState({ 1: true, 2: true, 3: false, 4: false });
  const [filterMode, setFilterMode] = useState("all");
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved

  useEffect(() => {
    const init = async () => {
      const staticTasks = POST_DEATH_TASKS.flatMap(tier =>
        tier.tasks.map(t => ({
          ...t, tier: tier.tier, tierLabel: tier.tierLabel,
          tierColor: tier.tierColor, tierBg: tier.tierBg, tierIcon: tier.icon,
          completed: false, assignedTo: null, assignedRole: null, isCustom: false, dbId: null,
        }))
      );
      if (workflowId) {
        const dbTasks = await loadTasksFromSupabase(workflowId);
        const merged = staticTasks.map(t => {
          const db = dbTasks.find(d => d.title === t.title);
          return db ? { ...t, dbId: db.id, completed: db.status === 'completed', assignedTo: db.assigned_to_name } : t;
        });
        const customDb = dbTasks.filter(d => !staticTasks.find(s => s.title === d.title));
        const customFormatted = customDb.map(d => {
          const tierData = POST_DEATH_TASKS.find(t => t.tier === (d.priority === 'urgent' ? 1 : d.priority === 'high' ? 2 : 3)) || POST_DEATH_TASKS[0];
          return { id: `custom_${d.id}`, title: d.title, desc: d.description || "", category: d.category || "other", tier: d.priority === 'urgent' ? 1 : d.priority === 'high' ? 2 : 3, tierLabel: tierData.tierLabel, tierColor: tierData.tierColor, tierBg: tierData.tierBg, tierIcon: tierData.icon, completed: d.status === 'completed', assignedTo: d.assigned_to_name, isCustom: true, dbId: d.id };
        });
        setTasks([...merged, ...customFormatted]);
      } else {
        setTasks(staticTasks);
      }
      setLoaded(true);
    };
    init();
  }, [workflowId]);

  const toggleComplete = async (taskId) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const next = { ...t, completed: !t.completed };
      if (next.dbId) updateTaskInSupabase(next.dbId, { status: next.completed ? 'completed' : 'pending', completed_at: next.completed ? new Date().toISOString() : null });
      return next;
    }));
  };

  const handleAssign = (taskId, name, role) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assignedTo: name, assignedRole: role } : t));
  };

  const addCustomTask = async (tier) => {
    if (!customText.trim()) return;
    const tierData = POST_DEATH_TASKS.find(t => t.tier === tier);
    const newTask = { id: `custom_${Date.now()}`, title: customText.trim(), desc: "", category: "other", tier, tierLabel: tierData.tierLabel, tierColor: tierData.tierColor, tierBg: tierData.tierBg, tierIcon: tierData.icon, completed: false, assignedTo: null, isCustom: true, dbId: null };
    if (workflowId) {
      const { data } = await supabase.from('tasks').insert([{ workflow_id: workflowId, user_id: userId || null, title: newTask.title, description: "", category: "other", priority: tier === 1 ? "urgent" : tier === 2 ? "high" : "normal", due_days_after_trigger: tier === 1 ? 1 : tier === 2 ? 3 : tier === 3 ? 7 : 45, status: "pending" }]).select().single();
      if (data) newTask.dbId = data.id;
    }
    setTasks(prev => [...prev, newTask]);
    setCustomText(""); setAddingCustomTier(null);
  };

  const handleSave = async () => {
    if (!workflowId || !userId) { signInWithGoogle(); return; }
    setSaveStatus("saving");
    // All task state is already persisted via toggleComplete/assign
    // This is a visual confirmation save
    await supabase.from('workflows').update({ updated_at: new Date().toISOString() }).eq('id', workflowId);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const assignedCount = tasks.filter(t => t.assignedTo).length;
  const pct = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  const tierMeta = POST_DEATH_TASKS.reduce((acc, t) => { acc[t.tier] = { label: t.tierLabel, color: t.tierColor, bg: t.tierBg, icon: t.icon }; return acc; }, {});

  const getFiltered = (tier) => {
    const t = tasks.filter(t => t.tier === tier);
    if (filterMode === "pending") return t.filter(t => !t.completed && !t.assignedTo);
    if (filterMode === "assigned") return t.filter(t => t.assignedTo && !t.completed);
    if (filterMode === "done") return t.filter(t => t.completed);
    return t;
  };

  if (!loaded) return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <TopNav onBack={onBack} label="Loading plan..." />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: C.soft, fontSize: 14 }}>Building your plan...</div>
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 80 }}>
      <TopNav
        user={userId ? { email: "" } : null}
        onDashboard={onDashboard}
        onBack={onBack}
        onSignOut={onSignOut}
        label={deceasedName ? `Plan for ${deceasedName.split(" ")[0]}` : "Estate plan"}
      />

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 16px 40px" }}>

        {/* Header + stats */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 21, color: C.ink, marginBottom: 4 }}>
            {deceasedName ? `Estate plan — ${deceasedName}` : "Your estate plan"}
          </div>
          {yourName && <div style={{ fontSize: 13, color: C.mid, marginBottom: 14 }}>Coordinated by {yourName}</div>}

          {/* Progress card */}
          <div style={{ background: C.bgCard, borderRadius: 16, padding: "16px 18px", border: `1px solid ${C.border}`, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{completedCount} of {tasks.length} tasks complete</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: pct === 100 ? C.sage : C.ink }}>{pct}%</div>
            </div>
            <div style={{ height: 8, background: C.border, borderRadius: 4, marginBottom: 10 }}>
              <div style={{ height: "100%", borderRadius: 4, background: pct === 100 ? C.sage : `linear-gradient(90deg, ${C.rose}, ${C.amber})`, width: `${pct}%`, transition: "width 0.5s ease" }} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ fontSize: 11.5, color: C.soft }}><span style={{ fontWeight: 700, color: C.rose }}>{tasks.filter(t => !t.completed && t.tier === 1).length}</span> urgent remaining</div>
              <div style={{ fontSize: 11.5, color: C.soft }}><span style={{ fontWeight: 700, color: C.sage }}>{assignedCount}</span> assigned</div>
              <div style={{ fontSize: 11.5, color: C.soft }}><span style={{ fontWeight: 700, color: C.ink }}>{completedCount}</span> done</div>
            </div>
          </div>

          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 6 }}>
            {[["all","All"],["pending","To do"],["assigned","Assigned"],["done","Done"]].map(([val, lbl]) => (
              <button key={val} onClick={() => setFilterMode(val)} style={{ padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, border: `1.5px solid ${filterMode === val ? C.sage : C.border}`, background: filterMode === val ? C.sageFaint : C.bgCard, color: filterMode === val ? C.sage : C.mid, cursor: "pointer", fontFamily: "inherit" }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Tier sections */}
        {[1,2,3,4].map(tier => {
          const meta = tierMeta[tier];
          const filtered = getFiltered(tier);
          const all = tasks.filter(t => t.tier === tier);
          const done = all.filter(t => t.completed).length;
          const isOpen = expandedTiers[tier];

          return (
            <div key={tier} style={{ marginBottom: 10 }}>
              <button onClick={() => setExpandedTiers(p => ({ ...p, [tier]: !p[tier] }))}
                style={{ width: "100%", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: meta.bg, borderRadius: isOpen ? "14px 14px 0 0" : 14, padding: "12px 16px", border: `1px solid ${meta.color}25` }}>
                  <span style={{ fontSize: 18 }}>{meta.icon}</span>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: meta.color }}>{meta.label}</div>
                    <div style={{ fontSize: 11, color: C.soft }}>{done} of {all.length} complete</div>
                  </div>
                  {done === all.length && all.length > 0 && <span style={{ fontSize: 11, color: C.sage, fontWeight: 700 }}>✓ Done</span>}
                  <span style={{ fontSize: 14, color: meta.color }}>{isOpen ? "▾" : "▸"}</span>
                </div>
              </button>

              {isOpen && (
                <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderTop: "none", borderRadius: "0 0 14px 14px", overflow: "hidden" }}>
                  {filtered.length === 0 && (
                    <div style={{ padding: "18px", textAlign: "center", fontSize: 13, color: C.muted, fontStyle: "italic" }}>
                      {filterMode === "all" ? "No tasks." : `No ${filterMode} tasks here.`}
                    </div>
                  )}

                  {filtered.map((task, idx) => (
                    <div key={task.id} style={{ padding: "13px 16px", borderBottom: idx < filtered.length - 1 ? `1px solid ${C.border}` : "none", background: task.completed ? "#fafaf8" : "white" }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        {/* Checkbox */}
                        <button onClick={() => toggleComplete(task.id)} style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 2, border: `2px solid ${task.completed ? C.sage : C.border}`, background: task.completed ? C.sage : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, transition: "all 0.15s" }}>
                          {task.completed && (
                            <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                              <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: task.completed ? 400 : 600, color: task.completed ? C.muted : C.ink, textDecoration: task.completed ? "line-through" : "none", marginBottom: 3, lineHeight: 1.4 }}>
                            {task.title}
                            {task.isCustom && <span style={{ fontSize: 9, color: C.sage, fontWeight: 700, background: C.sageFaint, padding: "1px 6px", borderRadius: 6, marginLeft: 8, textDecoration: "none" }}>CUSTOM</span>}
                          </div>
                          {task.desc && !task.completed && <div style={{ fontSize: 11.5, color: C.soft, lineHeight: 1.5, marginBottom: task.assignedTo ? 6 : 0 }}>{task.desc}</div>}
                          {task.assignedTo && (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 10, padding: "3px 10px", marginTop: 4 }}>
                              <span style={{ fontSize: 10 }}>👤</span>
                              <span style={{ fontSize: 11, color: C.sage, fontWeight: 600 }}>{task.assignedTo}{task.assignedRole && task.assignedRole !== task.assignedTo ? ` · ${task.assignedRole}` : ""}</span>
                            </div>
                          )}
                        </div>

                        {!task.completed && (
                          <button onClick={() => setAssigningTask(task)} style={{ fontSize: 11, fontWeight: 700, color: task.assignedTo ? C.sage : C.soft, background: task.assignedTo ? C.sageFaint : C.bgSubtle, border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit", flexShrink: 0, whiteSpace: "nowrap" }}>
                            {task.assignedTo ? "Reassign" : "Assign"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {addingCustomTier === tier ? (
                    <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}`, background: C.bgSubtle }}>
                      <div style={{ fontSize: 11.5, color: C.mid, marginBottom: 8 }}>Add a task to "{meta.label}"</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input value={customText} onChange={e => setCustomText(e.target.value)} placeholder="Describe the task..." onKeyDown={e => e.key === 'Enter' && addCustomTask(tier)} autoFocus
                          style={{ flex: 1, padding: "10px 14px", borderRadius: 10, fontSize: 13, border: `1.5px solid ${C.border}`, background: C.bgCard, fontFamily: "inherit", outline: "none", color: C.ink }} />
                        <button onClick={() => addCustomTask(tier)} style={{ background: C.sage, color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Add</button>
                        <button onClick={() => { setAddingCustomTier(null); setCustomText(""); }} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", fontSize: 13, color: C.mid, cursor: "pointer", fontFamily: "inherit" }}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setAddingCustomTier(tier)} style={{ width: "100%", padding: "11px 16px", background: "none", border: "none", borderTop: `1px solid ${C.border}`, fontSize: 12.5, color: C.soft, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                      + Add a task to this section
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Notification infrastructure info */}
        <div style={{ background: C.bgCard, borderRadius: 16, padding: "18px 20px", border: `1px solid ${C.border}`, marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 8 }}>📬 Notification infrastructure</div>
          <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.6 }}>
            Every person you assign a task to is saved with their email and phone. When the trigger fires, Passage will automatically send them their task list via email and SMS. Social media notifications will be family-approved before sending.
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {[["📧","Email","Ready to wire"],["📱","SMS","Ready to wire"],["📘","Facebook","Family-approved"],["📷","Instagram","Family-approved"]].map(([icon, label, status]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, background: C.bgSubtle, borderRadius: 8, padding: "5px 10px" }}>
                <span style={{ fontSize: 12 }}>{icon}</span>
                <span style={{ fontSize: 11, color: C.mid, fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: 10, color: C.soft }}>· {status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky bottom save bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.bgCard, borderTop: `1px solid ${C.border}`, padding: "12px 20px", zIndex: 100 }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", gap: 10, alignItems: "center" }}>
          {!userId ? (
            <>
              <div style={{ flex: 1, fontSize: 13, color: C.mid }}>Sign in to save your progress</div>
              <GoogleBtn label="Save with Google" />
            </>
          ) : (
            <>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: C.mid }}>{completedCount} tasks done · {assignedCount} assigned</div>
                <div style={{ fontSize: 11, color: C.soft }}>All changes save automatically</div>
              </div>
              <button onClick={handleSave} style={{ background: saveStatus === "saved" ? C.sageFaint : C.sage, color: saveStatus === "saved" ? C.sage : "#fff", border: saveStatus === "saved" ? `1px solid ${C.sageLight}` : "none", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
                {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "✓ Saved" : "Save progress"}
              </button>
              {onDashboard && (
                <button onClick={onDashboard} style={{ background: C.bgSubtle, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: C.mid }}>
                  Dashboard
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {assigningTask && (
        <AssignModal task={assigningTask} workflowId={workflowId} userId={userId} onAssign={handleAssign} onClose={() => setAssigningTask(null)} />
      )}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ user, onStartPlan, onEmergency, onSignOut, onOpenTaskList }) {
  const [userData, setUserData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const [{ data: u }, { data: p }, wfs] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        loadUserWorkflows(user.id),
      ]);
      setUserData(u);
      setProfile(p);
      setWorkflows(wfs);
      setLoading(false);
    };
    load();
  }, [user]);

  const plan = userData?.plan || 'free';
  const pd = {
    free: { label: "Free Plan", color: C.soft, price: "$0", next_charge: "None", renewal: "N/A" },
    monthly: { label: "Monthly", color: C.sage, price: "$12/mo", next_charge: "Next month", renewal: "Monthly" },
    annual: { label: "Annual", color: C.sage, price: "$79/yr", next_charge: "Next year", renewal: "Annual" },
    lifetime: { label: "Lifetime", color: C.gold, price: "$249", next_charge: "Never", renewal: "Never" },
  }[plan] || { label: "Free Plan", color: C.soft, price: "$0", next_charge: "None", renewal: "N/A" };

  // Split workflows by type
  const activeWorkflows = workflows.filter(w => w.trigger_type === 'death_confirmed' && w.status === 'active');
  const greenWorkflow = workflows.find(w => w.trigger_type !== 'death_confirmed');

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      {/* Nav */}
      <div style={{ background: C.bgCard, borderBottom: `1px solid ${C.border}`, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: `radial-gradient(circle, ${C.sageLight}, ${C.sage}70)` }} />
          <span style={{ fontFamily: "Georgia, serif", fontSize: 17, color: C.ink }}>Passage</span>
        </div>
        <div style={{ fontSize: 11, color: C.soft }}>{user?.email}</div>
        <button onClick={onSignOut} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 14px", fontSize: 12, color: C.mid, cursor: "pointer", fontFamily: "inherit" }}>
          Sign out
        </button>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 80px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: C.soft }}>Loading your file...</div>
        ) : (
          <>
            {/* Welcome */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 24, color: C.ink, marginBottom: 4 }}>
                Welcome back{userData?.first_name ? `, ${userData.first_name}` : ""}.
              </div>
              <div style={{ fontSize: 13.5, color: C.mid }}>
                {plan === 'free' ? 'Your plan is not yet active — upgrade to protect your family.' : 'Your plan is active.'}
              </div>
            </div>

            {/* Subscription card */}
            <div style={{ background: C.bgCard, borderRadius: 20, padding: "20px", border: `1px solid ${C.border}`, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.soft, fontWeight: 600, marginBottom: 3 }}>Current Plan</div>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: pd.color }}>{pd.label}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: pd.color }}>{pd.price}</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: plan === 'free' ? 14 : 0 }}>
                {[
                  { label: "Status", value: userData?.plan_status === 'active' ? '✓ Active' : 'Free' },
                  { label: "Next Charge", value: pd.next_charge },
                  { label: "Renewal", value: pd.renewal },
                ].map(item => (
                  <div key={item.label} style={{ background: C.bgSubtle, borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 9, color: C.soft, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>{item.value}</div>
                  </div>
                ))}
              </div>
              {plan === 'free' && (
                <button onClick={onStartPlan} style={{ width: "100%", padding: "11px", background: C.sage, border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
                  Activate my plan →
                </button>
              )}
            </div>

            {/* Active estate plans (red path workflows) */}
            {activeWorkflows.length > 0 && (
              <div style={{ background: C.bgCard, borderRadius: 20, padding: "20px", border: `1px solid ${C.border}`, marginBottom: 14 }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: C.ink, marginBottom: 4 }}>Active estate plans</div>
                <div style={{ fontSize: 12.5, color: C.mid, marginBottom: 16 }}>Tap any plan to view and manage tasks.</div>
                {activeWorkflows.map(wf => {
                  const taskCount = wf.tasks?.[0]?.count || 0;
                  return (
                    <button key={wf.id} onClick={() => onOpenTaskList(wf)}
                      style={{ width: "100%", background: C.roseFaint, border: `1px solid ${C.rose}30`, borderRadius: 14, padding: "14px 16px", cursor: "pointer", fontFamily: "inherit", textAlign: "left", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{wf.name}</div>
                          <div style={{ fontSize: 11.5, color: C.mid, marginTop: 3 }}>
                            Created {new Date(wf.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ fontSize: 11, color: C.rose, fontWeight: 600, background: C.roseFaint, border: `1px solid ${C.rose}30`, borderRadius: 8, padding: "3px 10px" }}>Active</div>
                          <span style={{ color: C.mid, fontSize: 14 }}>→</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Green path file */}
            <div style={{ background: C.bgCard, borderRadius: 20, padding: "20px", border: `1px solid ${C.border}`, marginBottom: 14 }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: C.ink, marginBottom: 16 }}>Your planning file</div>
              {[
                { label: "Wishes", complete: profile?.wishes_complete, icon: "📝", desc: profile?.disposition || "Not started", action: onStartPlan },
                { label: "Accounts", complete: profile?.accounts_complete, icon: "🗂️", desc: "Map your financial accounts", action: onStartPlan },
                { label: "People", complete: profile?.people_complete, icon: "👥", desc: profile?.attorney_name ? `Executor: ${profile.attorney_name}` : "Designate your people", action: onStartPlan },
                { label: "Documents", complete: profile?.documents_complete, icon: "📄", desc: "Upload important documents", action: onStartPlan },
                { label: "Memories", complete: profile?.vault_complete, icon: "🎙️", desc: "Record voice notes and letters", action: onStartPlan },
              ].map((s, i, arr) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: s.complete ? C.sageFaint : C.bgSubtle, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 16 }}>{s.complete ? "✓" : s.icon}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: s.complete ? C.sage : C.ink }}>{s.label}</div>
                    <div style={{ fontSize: 11.5, color: C.soft, marginTop: 2 }}>{s.desc}</div>
                  </div>
                  <button onClick={s.action} style={{ fontSize: 11, color: C.sage, fontWeight: 700, background: C.sageFaint, border: "none", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit" }}>
                    {s.complete ? "Edit" : "Add"} →
                  </button>
                </div>
              ))}
              <button onClick={onStartPlan} style={{ width: "100%", marginTop: 14, padding: "11px", background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 12, fontSize: 13, fontWeight: 600, color: C.sage, cursor: "pointer", fontFamily: "inherit" }}>
                Continue building my file →
              </button>
            </div>

            {/* Someone passed — start emergency plan */}
            <div style={{ background: C.roseFaint, borderRadius: 20, padding: "20px", border: `1px solid ${C.rose}25`, marginBottom: 14 }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 16, color: C.ink, marginBottom: 6 }}>Someone in your family passed away?</div>
              <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.6, marginBottom: 14 }}>
                Start an emergency estate plan. We'll build a full task list, help you assign people, and coordinate everything.
              </div>
              <button onClick={onEmergency} style={{ padding: "11px 20px", background: C.rose, border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
                Start emergency plan →
              </button>
            </div>

            {/* Account */}
            <div style={{ background: C.bgCard, borderRadius: 20, padding: "20px", border: `1px solid ${C.border}`, marginBottom: 14 }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: C.ink, marginBottom: 14 }}>Account</div>
              {[
                { label: "Email", value: user?.email },
                { label: "Member since", value: userData?.created_at ? new Date(userData.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "—" },
                { label: "Plan", value: pd.label },
                { label: "Plan status", value: userData?.plan_status || "active" },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 12, color: C.soft, fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: 13, color: C.ink, fontWeight: 500 }}>{item.value}</div>
                </div>
              ))}
            </div>

            <button onClick={onSignOut} style={{ width: "100%", padding: "13px", background: "none", border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 13, color: C.mid, cursor: "pointer", fontFamily: "inherit" }}>
              Sign out of Passage
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── EMERGENCY ONBOARDING ─────────────────────────────────────────────────────
function EmergencyOnboarding({ onComplete, onBack, user, onSignOut, onDashboard }) {
  const [step, setStep] = useState(0);
  const [deceasedName, setDeceasedName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [yourName, setYourName] = useState("");
  const [yourEmail, setYourEmail] = useState("");
  const [workflowId, setWorkflowId] = useState(null);
  const [creating, setCreating] = useState(false);

  const handleBuild = async () => {
    if (!yourName || !yourEmail) return;
    setCreating(true);
    await saveLead({ flow_type: "immediate", mode: "emergency", your_name: yourName, your_email: yourEmail, deceased_name: deceasedName, relationship, timestamp: new Date().toISOString() });
    const workflow = await createWorkflow(user?.id, deceasedName);
    const wfId = workflow?.id || null;
    setWorkflowId(wfId);
    if (wfId) {
      const allTasks = POST_DEATH_TASKS.flatMap(tier => tier.tasks.map(t => ({ ...t, tier: tier.tier })));
      await saveTasksToSupabase(wfId, user?.id, allTasks);
    }
    setCreating(false);
    setStep(2);
  };

  if (step === 2) {
    return (
      <TaskListView
        deceasedName={deceasedName} yourName={yourName}
        workflowId={workflowId} userId={user?.id}
        onBack={onBack} onDashboard={user ? onDashboard : null}
        onSignOut={onSignOut}
      />
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <TopNav onBack={onBack} label="Emergency setup" user={user} onDashboard={user ? onDashboard : null} onSignOut={onSignOut} />
      <div style={{ padding: "28px 20px 80px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%" }}>
          {step === 0 && (
            <StepCard>
              <div style={{ background: C.roseFaint, border: `1px solid ${C.rose}30`, borderRadius: 16, padding: "24px 20px", marginBottom: 24, textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🕊️</div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 22, color: C.ink, marginBottom: 10 }}>We're so sorry for your loss.</div>
                <div style={{ fontSize: 13.5, color: C.mid, lineHeight: 1.75 }}>We'll guide you step by step. Nothing will be missed.</div>
              </div>
              <Input label="Name of the person who passed" placeholder="e.g. Robert James Collins" value={deceasedName} onChange={setDeceasedName} />
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.mid, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>Your relationship</label>
                <select value={relationship} onChange={e => setRelationship(e.target.value)}
                  style={{ width: "100%", padding: "14px 16px", borderRadius: 12, fontSize: 15, border: `1.5px solid ${C.border}`, background: C.bgCard, color: relationship ? C.ink : C.soft, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}>
                  {[["","Select..."],["child","Son or daughter"],["spouse","Spouse or partner"],["sibling","Brother or sister"],["grandchild","Grandchild"],["friend","Close friend"],["other","Other"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <Btn onClick={() => setStep(1)} disabled={!deceasedName || !relationship} style={{ width: "100%", background: C.rose, boxShadow: `0 4px 20px ${C.rose}35` }}>Continue →</Btn>
            </StepCard>
          )}
          {step === 1 && (
            <StepCard>
              <ProgressBar current={1} total={2} color={C.rose} />
              <StepTitle eyebrow="Almost there" color={C.rose} title="Who's coordinating things right now?" sub="Sign in to save your plan and come back anytime." />
              <Input label="Your name" placeholder="Your full name" value={yourName} onChange={setYourName} />
              <Input label="Your email" type="email" placeholder="your@email.com" value={yourEmail} onChange={setYourEmail} hint="We'll save your task list here." />
              {!user && (
                <div style={{ background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
                  <div style={{ fontSize: 12.5, color: C.mid, marginBottom: 10, lineHeight: 1.5 }}>Sign in to save your plan and come back anytime.</div>
                  <GoogleBtn />
                  <div style={{ fontSize: 11, color: C.muted, textAlign: "center" }}>or continue without signing in</div>
                </div>
              )}
              <div style={{ display: "flex", gap: 12 }}>
                <Btn variant="ghost" onClick={() => setStep(0)}>← Back</Btn>
                <Btn onClick={handleBuild} disabled={!yourName || !yourEmail || creating} style={{ flex: 1, background: C.rose, boxShadow: `0 4px 20px ${C.rose}35` }}>
                  {creating ? "Building your plan..." : "Build my plan →"}
                </Btn>
              </div>
            </StepCard>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PLANNED ONBOARDING ───────────────────────────────────────────────────────
function PlannedOnboarding({ onComplete, onBack, user, onSignOut, onDashboard }) {
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
    await saveLead({ flow_type: "planning", mode, executor_name: executorName, executor_email: executorEmail, person_name: name, disposition, service_type: serviceType, timestamp: new Date().toISOString() });

    // Wire notification action for executor on green path
    if (user?.id && executorEmail) {
      const workflow = await createWorkflow(user.id, name);
      if (workflow) {
        await supabase.from('workflow_actions').insert([{
          workflow_id: workflow.id,
          action_type: 'email',
          recipient_type: 'person',
          recipient_email: executorEmail,
          subject: `${name || "Your loved one"}'s estate plan has been activated`,
          body: `${executorName} — you have been designated as executor. When the trigger fires, you will receive a full task list via email and SMS. This message is sent automatically by Passage.`,
          status: 'pending',
          delay_hours: 0,
        }]);
        await supabase.from('workflow_actions').insert([{
          workflow_id: workflow.id,
          action_type: 'sms',
          recipient_type: 'person',
          recipient_email: executorEmail,
          subject: 'Passage — executor notification',
          body: `${executorName}, you have been designated as executor in Passage. You'll receive a full task list when the plan activates.`,
          status: 'pending',
          delay_hours: 0,
        }]);
      }
    }
    onComplete(mode);
  };

  const steps = [
    <StepCard key={0}>
      <StepTitle eyebrow="Let's build your plan" title="Who are you protecting?" sub="Whether you're planning for yourself or helping someone you love get organized." />
      {[
        { value: "self", icon: "🙋", title: "Myself", desc: "I want to set up my own plan so my family has everything they need." },
        { value: "parent", icon: "👴👵", title: "A parent or grandparent", desc: "I'm helping someone I love get their wishes organized before it's urgent." },
        { value: "spouse", icon: "💑", title: "My spouse or partner", desc: "We're planning together so neither of us is left guessing." },
      ].map(o => <OptionCard key={o.value} icon={o.icon} title={o.title} desc={o.desc} selected={forWhom === o.value} onClick={() => setForWhom(o.value)} />)}
      {!user && (<div style={{ marginTop: 16 }}><div style={{ fontSize: 12, color: C.soft, textAlign: "center", marginBottom: 10 }}>Sign in to save your plan and come back anytime.</div><GoogleBtn /><div style={{ fontSize: 11, color: C.muted, textAlign: "center", marginBottom: 8 }}>or continue without signing in</div></div>)}
      <Btn onClick={() => setStep(1)} disabled={!forWhom} style={{ width: "100%", marginTop: 4 }}>Let's start →</Btn>
    </StepCard>,

    <StepCard key={1}>
      <ProgressBar current={1} total={5} />
      <StepTitle eyebrow={forWhom === "self" ? "About you" : "About them"} title={forWhom === "self" ? "Let's personalize your plan" : "Tell us about the person this plan protects"} sub="Pre-fills notifications, letters, and documents so your family never has to look anything up." />
      <Input label="Full legal name" placeholder="e.g. Patricia Anne Collins" value={name} onChange={setName} hint="Appears on all official notifications and letters." />
      <Input label="Date of birth" type="date" value={dob} onChange={setDob} />
      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <Btn variant="ghost" onClick={() => setStep(0)}>← Back</Btn>
        <Btn onClick={() => setStep(2)} disabled={!name || !dob} style={{ flex: 1 }}>Continue →</Btn>
      </div>
    </StepCard>,

    <StepCard key={2}>
      <ProgressBar current={2} total={5} />
      <StepTitle eyebrow="Final wishes" title="The decisions your family would otherwise have to make without you" sub="Being specific is the greatest gift you can give." />
      {[
        { label: "Burial or cremation?", value: disposition, onChange: setDisposition, options: [["","Choose one..."],["cremation","Cremation"],["burial","Traditional burial"],["green","Green / natural burial"],["donation","Body donation to science"],["unsure","Not decided yet"]] },
        { label: "Type of service?", value: serviceType, onChange: setServiceType, options: [["","Choose one..."],["funeral","Traditional funeral service"],["celebration","Celebration of life"],["graveside","Graveside only"],["private","Private — close family only"],["none","No formal service"]] },
      ].map(({ label, value, onChange, options }) => (
        <div key={label} style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.mid, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>{label}</label>
          <select value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", padding: "14px 16px", borderRadius: 12, fontSize: 15, border: `1.5px solid ${C.border}`, background: C.bgCard, color: value ? C.ink : C.soft, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}>
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
      <StepTitle eyebrow="Your people" title="Who do you trust to carry this out?" sub="They'll know exactly what to do when the time comes." />
      <div style={{ background: C.bgSubtle, borderRadius: 14, padding: "18px 20px", marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.sage, marginBottom: 4 }}>⚖️ Executor</div>
        <div style={{ fontSize: 12, color: C.mid, marginBottom: 14, lineHeight: 1.5 }}>The person who manages the estate. They receive their full task list the moment the trigger fires — via email and SMS.</div>
        <Input label="Full name" placeholder="e.g. Sarah Collins" value={executorName} onChange={setExecutorName} />
        <Input label="Email" type="email" placeholder="sarah@email.com" value={executorEmail} onChange={setExecutorEmail} hint="Used for automatic notification when the trigger fires." />
      </div>
      <div style={{ background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 10, padding: "10px 14px", fontSize: 11.5, color: C.mid, marginBottom: 18 }}>
        📧 Their email is stored now and will be used automatically when the trigger fires. SMS and social notifications will be wired in the next release.
      </div>
      <div style={{ background: C.goldFaint, border: `1px solid ${C.gold}30`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: C.gold, marginBottom: 18 }}>
        💡 Upgrade to add a Witness, multiple Recipients, and custom message delivery.
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <Btn variant="ghost" onClick={() => setStep(2)}>← Back</Btn>
        <Btn onClick={() => setStep(4)} disabled={!executorName || !executorEmail} style={{ flex: 1 }}>Continue →</Btn>
      </div>
    </StepCard>,

    <StepCard key={4}>
      <ProgressBar current={4} total={5} />
      <StepTitle eyebrow="Account map" title="Where are the important accounts?" sub="Your family won't have to hunt. Pre-filled into notification letters automatically." />
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
            {item.locked ? <span style={{ fontSize: 10, color: C.gold, fontWeight: 700, background: C.goldFaint, padding: "2px 8px", borderRadius: 6 }}>Upgrade</span> : <span style={{ fontSize: 10, color: C.sage, fontWeight: 700 }}>+ Add</span>}
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
        <div style={{ fontFamily: "Georgia, serif", fontSize: 24, color: C.ink, marginBottom: 10, lineHeight: 1.25 }}>Your plan is built.<br />Now make it real.</div>
        <div style={{ background: C.bgSubtle, borderRadius: 12, padding: "14px 18px", fontSize: 13.5, color: C.mid, lineHeight: 1.7, marginBottom: 8 }}>
          Right now this is a draft. <strong style={{ color: C.ink }}>Without activation, your family won't see any of this.</strong> Activate so your plan executes when they need it most.
        </div>
        <div style={{ fontSize: 12.5, color: C.gold, fontWeight: 700, marginTop: 10 }}>Less than the cost of a single hour with an estate attorney.</div>
      </div>
      {[
        { id: "annual", label: "Annual", price: "$79", per: "/year", badge: "Best value — save 45%", popular: true },
        { id: "monthly", label: "Monthly", price: "$12", per: "/month", badge: "Start anytime, cancel anytime" },
        { id: "lifetime", label: "Lifetime", price: "$249", per: "one time", badge: "Pay once. Active forever." },
      ].map(plan => (
        <div key={plan.id} onClick={() => setSelectedPlan(plan.id)} style={{ border: `2px solid ${selectedPlan === plan.id ? C.sage : C.border}`, borderRadius: 14, padding: "14px 18px", cursor: "pointer", background: selectedPlan === plan.id ? C.sageFaint : C.bgCard, display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.15s", marginBottom: 8, position: "relative" }}>
          {plan.popular && <div style={{ position: "absolute", top: -10, left: 16, background: C.sage, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 10 }}>RECOMMENDED</div>}
          <div><div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{plan.label}</div><div style={{ fontSize: 11, color: C.soft, marginTop: 3 }}>{plan.badge}</div></div>
          <div><span style={{ fontSize: 22, fontWeight: 800, color: selectedPlan === plan.id ? C.sage : C.ink }}>{plan.price}</span><span style={{ fontSize: 12, color: C.soft }}> {plan.per}</span></div>
        </div>
      ))}
      <div style={{ background: C.bgSubtle, borderRadius: 12, padding: "14px 16px", marginBottom: 20, marginTop: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Everything that activates immediately:</div>
        {[
          `Executor notification — ${executorName || "your executor"} receives email + SMS instantly`,
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
      <Btn onClick={() => handleActivate("paid")} style={{ width: "100%", padding: "17px", fontSize: 16, marginBottom: 10 }}>Activate my plan →</Btn>
      <div style={{ textAlign: "center" }}>
        <button onClick={() => handleActivate("draft")} style={{ background: "none", border: "none", fontSize: 12.5, color: C.soft, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline", padding: "8px" }}>
          Save as draft — I understand nothing will activate until I upgrade
        </button>
      </div>
    </StepCard>,
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <TopNav onBack={onBack} label="Setting up your plan" user={user} onDashboard={user ? onDashboard : null} onSignOut={onSignOut} />
      <div style={{ padding: "32px 20px 80px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%" }}>{steps[step]}</div>
      </div>
    </div>
  );
}

// ─── LANDING ──────────────────────────────────────────────────────────────────
function Landing({ onPlan, onEmergency, user, onDashboard, onSignOut }) {
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

      <nav style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: `radial-gradient(circle at 40% 40%, ${C.sageLight}, ${C.sage}80)`, boxShadow: breathe ? `0 0 24px ${C.sage}50` : `0 0 8px ${C.sage}20`, transition: "box-shadow 3.8s ease-in-out" }} />
          <span style={{ fontFamily: "Georgia, serif", fontSize: 22, color: C.ink }}>Passage</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => window.open(TALLY_URL, '_blank')} style={{ background: "none", border: "none", fontSize: 13, color: C.mid, cursor: "pointer", fontFamily: "inherit" }}>Join beta</button>
          {user ? (
            <>
              <button onClick={onDashboard} style={{ background: C.sage, border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#fff", fontFamily: "inherit" }}>My file →</button>
              <button onClick={onSignOut} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 14px", fontSize: 12, cursor: "pointer", color: C.mid, fontFamily: "inherit" }}>Sign out</button>
            </>
          ) : (
            <button onClick={signInWithGoogle} style={{ background: C.bgCard, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", color: C.ink, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Sign in with Google
            </button>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "56px 28px 36px", textAlign: "center", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(18px)", transition: "all 0.75s ease" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 20, padding: "6px 16px", fontSize: 12, color: C.sage, fontWeight: 700, marginBottom: 30 }}>🕊️ The family operating system for the end of life</div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(32px, 5.5vw, 58px)", lineHeight: 1.12, color: C.ink, marginBottom: 22, fontWeight: 400 }}>Your family shouldn't have to{" "}<em style={{ color: C.sage }}>figure it out</em><br />while they're grieving.</h1>
        <p style={{ fontSize: "clamp(15px, 2vw, 17px)", color: C.mid, lineHeight: 1.8, maxWidth: 580, margin: "0 auto 14px" }}>Passage lets you capture everything your family would otherwise have to guess — your wishes, your accounts, your people — so when the time comes, your plan executes itself.</p>
        <p style={{ fontSize: 14, color: C.soft, marginBottom: 36, fontStyle: "italic" }}>Set it up while there's time. Let it take over when there isn't.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
          <Btn onClick={onPlan} style={{ padding: "17px 34px", fontSize: 16 }}>Start planning now →</Btn>
          <Btn variant="rose" onClick={onEmergency} style={{ padding: "17px 28px", fontSize: 15 }}>Someone just passed ↗</Btn>
        </div>
        <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
          {["Free to start", "No credit card required", "Your data, always yours"].map(t => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.soft }}><span style={{ color: C.sage, fontWeight: 700 }}>✓</span>{t}</div>
          ))}
        </div>
      </div>

      <div style={{ height: 100, maxWidth: 600, margin: "0 auto 50px", background: `radial-gradient(ellipse at 50% 100%, ${C.sageLight}55, transparent 70%)`, borderRadius: "50% 50% 0 0 / 100% 100% 0 0" }} />

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "20px 28px 60px" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}><div style={{ fontFamily: "Georgia, serif", fontSize: 32, color: C.ink, marginBottom: 10 }}>How it works</div><div style={{ fontSize: 15, color: C.mid }}>Set it up while there's time. Let it take over when there isn't.</div></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          {[{ n: "01", icon: "📝", title: "Capture everything that matters", body: "So your family isn't left guessing. Your wishes, accounts, documents, and the people responsible for each decision." },{ n: "02", icon: "👨‍👩‍👧‍👦", title: "Assign the right people ahead of time", body: "Everyone knows their role before the moment arrives. Tasks pre-assigned. Letters pre-written. Responsibility clear." },{ n: "03", icon: "⚡", title: "One confirmation activates everything", body: "Your sister gets instructions. Your attorney gets documents. The funeral home is contacted. Everything happens — so your family doesn't have to." }].map(item => (
            <div key={item.n} style={{ background: C.bgCard, borderRadius: 20, padding: "28px", border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}><span style={{ fontSize: 26 }}>{item.icon}</span><span style={{ fontSize: 10, color: C.sage, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>{item.n}</span></div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: C.ink, marginBottom: 10, lineHeight: 1.3 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.75 }}>{item.body}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: C.bgSage, padding: "56px 28px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 28, color: C.ink, marginBottom: 10 }}>When the trigger fires, your plan comes to life</div>
          <div style={{ fontSize: 14, color: C.mid, lineHeight: 1.75, marginBottom: 32 }}>You're not just notifying people.<br />You're orchestrating the most important moment your family will ever face.</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, maxWidth: 480, margin: "0 auto 24px" }}>
            {[["👨‍👩‍👧‍👦","Family"],["⚖️","Attorney"],["🏛️","Funeral home"],["🌸","Florist"],["🍽️","Caterer"],["⛪","Cemetery"],["📰","Obituaries"],["📱","Socials"]].map(([icon, label]) => (
              <div key={label} style={{ background: C.bgCard, borderRadius: 12, padding: "14px 8px", textAlign: "center", border: `1px solid ${C.border}` }}><div style={{ fontSize: 20, marginBottom: 5 }}>{icon}</div><div style={{ fontSize: 10.5, color: C.mid, fontWeight: 600 }}>{label}</div></div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: C.soft, lineHeight: 1.6 }}>Social posts are always family-approved before going live.<br />Two people must confirm before anything triggers.</div>
        </div>
      </div>

      <div style={{ background: C.bgDark, padding: "56px 28px" }}>
        <div style={{ maxWidth: 940, margin: "0 auto" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: C.soft, fontWeight: 600, textAlign: "center", marginBottom: 36 }}>What families say about the experience</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {[{ q: "I had no idea I needed to notify the DMV, the passport office, AND three credit bureaus. Nobody tells you this.", a: "Adult daughter, 54" },{ q: "Two months after losing my mom I realized I'd missed the Social Security survivor benefit window. That was thousands of dollars.", a: "Son, 31" },{ q: "We sat with the funeral director for two hours and left more confused than when we walked in. I wish we'd had this.", a: "Family navigating Medicaid pre-planning" }].map((v, i) => (
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

// ─── SUCCESS ──────────────────────────────────────────────────────────────────
function Success({ mode, onDashboard }) {
  const isDraft = mode === "draft";
  const isEmergencyPaid = mode === "emergency_paid";
  const isEmergencyFree = mode === "emergency_free";
  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ maxWidth: 480, width: "100%" }}>
        <div style={{ background: C.bgCard, borderRadius: 24, padding: "48px 36px", textAlign: "center", boxShadow: "0 2px 40px rgba(0,0,0,0.08)" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: isDraft ? C.goldFaint : (isEmergencyFree || isEmergencyPaid) ? C.roseFaint : C.sageFaint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 24px" }}>
            {isDraft ? "📄" : isEmergencyFree ? "📋" : "🕊️"}
          </div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 26, color: C.ink, marginBottom: 12 }}>
            {isDraft ? "Your draft is saved." : isEmergencyFree ? "Your task list is saved." : isEmergencyPaid ? "Your plan is live." : "Your file is activated."}
          </div>
          <div style={{ fontSize: 14, color: C.mid, lineHeight: 1.8, marginBottom: 24 }}>
            {isDraft ? "Nothing will be triggered or sent to your family until you activate."
              : isEmergencyFree ? "Take a breath. Your task list has been saved."
              : isEmergencyPaid ? "Your task list is active. Take a breath — your family has what they need."
              : "Your family will never have to guess. When the time comes, everything is waiting."}
          </div>
          <div style={{ background: isDraft ? C.goldFaint : C.sageFaint, borderRadius: 12, padding: "12px 16px", fontSize: 13, color: isDraft ? C.amber : C.sage, fontWeight: 600, marginBottom: onDashboard ? 20 : 0 }}>
            {isDraft ? "We'll send you a reminder in 7 days." : isEmergencyPaid ? "Everyone you've invited will receive their tasks shortly." : "Welcome to Passage. 🕊️"}
          </div>
          {onDashboard && (
            <button onClick={onDashboard} style={{ width: "100%", padding: "13px", background: C.sage, border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
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
  const [activeWorkflow, setActiveWorkflow] = useState(null); // for opening task list from dashboard

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // *** THIS IS THE FIX — sign out resets state properly ***
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setView("landing");
    setActiveWorkflow(null);
  };

  const handleOpenTaskList = (workflow) => {
    setActiveWorkflow(workflow);
    setView("tasklist");
  };

  const commonProps = {
    user,
    onSignOut: handleSignOut,
    onDashboard: () => setView("dashboard"),
  };

  return (
    <>
      {view === "landing" && (
        <Landing
          {...commonProps}
          onPlan={() => setView("plan")}
          onEmergency={() => setView("emergency")}
        />
      )}
      {view === "plan" && (
        <PlannedOnboarding
          {...commonProps}
          onComplete={(mode) => { setSuccessMode(mode); setView("success"); }}
          onBack={() => setView("landing")}
        />
      )}
      {view === "emergency" && (
        <EmergencyOnboarding
          {...commonProps}
          onComplete={(mode) => { setSuccessMode(mode); setView("success"); }}
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
          {...commonProps}
          onStartPlan={() => setView("plan")}
          onEmergency={() => setView("emergency")}
          onOpenTaskList={handleOpenTaskList}
        />
      )}
      {view === "tasklist" && activeWorkflow && (
        <TaskListView
          deceasedName={activeWorkflow.name?.replace("Estate of ", "") || ""}
          yourName={user?.email || ""}
          workflowId={activeWorkflow.id}
          userId={user?.id}
          onBack={() => setView("dashboard")}
          onDashboard={() => setView("dashboard")}
          onSignOut={handleSignOut}
        />
      )}
    </>
  );
}
