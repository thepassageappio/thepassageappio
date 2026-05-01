import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { getTaskPlaybook } from "../lib/taskPlaybooks";
import { SiteHeader } from "./SiteChrome";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.thepassageapp.io").replace(/\/$/, "");

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

const PLAN_OPTIONS = [
  { id: "single_annual", label: "Single Estate", price: "$79.99", per: "/year", badge: "One active planning estate", popular: true, group: "Planning" },
  { id: "single_monthly", label: "Single Monthly", price: "$9.99", per: "/month", badge: "One estate, flexible monthly access", group: "Planning" },
  { id: "couple_annual", label: "Couple Plan", price: "$119.99", per: "/year", badge: "Two active planning estates", group: "Planning" },
  { id: "family_annual", label: "Family Steward", price: "$199.99", per: "/year", badge: "Up to five active planning estates", group: "Planning" },
  { id: "single_lifetime", label: "Lifetime Estate", price: "$299.99", per: "one time", badge: "One planning estate active forever", group: "Planning" },
  { id: "couple_monthly", label: "Couple Monthly", price: "$14.99", per: "/month", badge: "Two estates, monthly", group: "Monthly" },
  { id: "family_monthly", label: "Family Monthly", price: "$24.99", per: "/month", badge: "Up to five estates, monthly", group: "Monthly" },
];
const PLAN_SEATS = {
  free: 1,
  monthly: 1,
  annual: 1,
  lifetime: 1,
  semiannual: 1,
  single_monthly: 1,
  single_annual: 1,
  single_lifetime: 1,
  couple_monthly: 2,
  couple_annual: 2,
  family_monthly: 5,
  family_annual: 5,
};
const ADDON_OPTIONS = [
  { id: "addon_monthly", label: "Add one estate", price: "$4.99", per: "/month" },
  { id: "addon_annual", label: "Add one estate", price: "$39.99", per: "/year" },
];
const PLAN_GROUPS = [
  {
    key: 'individual',
    label: 'Individual',
    seats: '1 estate',
    description: 'For one person or one loved one.',
    options: [
      { id: 'single_monthly', label: 'Monthly', price: '$9.99', per: '/mo' },
      { id: 'single_annual', label: 'Annual', price: '$79.99', per: '/yr', note: 'Most chosen' },
    ],
  },
  {
    key: 'couple',
    label: 'Couple',
    seats: '2 estates',
    description: 'For spouses, partners, or two parents.',
    options: [
      { id: 'couple_monthly', label: 'Monthly', price: '$14.99', per: '/mo' },
      { id: 'couple_annual', label: 'Annual', price: '$119.99', per: '/yr' },
    ],
  },
  {
    key: 'family',
    label: 'Family',
    seats: '5 estates',
    description: 'For families coordinating care across several loved ones.',
    options: [
      { id: 'family_monthly', label: 'Monthly', price: '$24.99', per: '/mo' },
      { id: 'family_annual', label: 'Annual', price: '$199.99', per: '/yr' },
    ],
  },
];
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
      { id: "t2_social", title: "Share the news on social media", desc: "Post an announcement on Facebook, Instagram, LinkedIn, and X. Passage pre-writes it for you.", category: "notifications", isSocial: true },
      { id: "t2_obituary", title: "Draft the obituary", desc: "Passage guides you through writing the obituary. Takes 5 minutes.", category: "notifications", isObituary: true },
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
  { group: "Passage access", roles: ["owner", "participant", "external_partner", "activator"] },
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

const createWorkflow = async (userId, deceasedName, coordinatorName, coordinatorEmail, dateOfDeath, options = {}) => {
  try {
    const path = options.path || options.mode || null;
    const baseRow = {
      user_id: userId || null,
      name: `Estate of ${deceasedName || "Loved One"}`,
      deceased_name: deceasedName || null,
      coordinator_name: coordinatorName || null,
      coordinator_email: coordinatorEmail || null,
      date_of_death: dateOfDeath || null,
      status: 'active',
      trigger_type: 'death_confirmed',
      is_custom: false,
      updated_at: new Date().toISOString(),
    };
    if (path) {
      baseRow.path = path;
      baseRow.mode = path;
    }

    if (options.workflowId) {
      const { data, error } = await supabase.from('workflows')
        .update(baseRow)
        .eq('id', options.workflowId)
        .select()
        .single();
      if (error) { console.error('createWorkflow update:', error); return null; }
      return data;
    }

    if (path === 'red' && (userId || coordinatorEmail) && deceasedName) {
      let query = supabase.from('workflows')
        .select('*')
        .neq('status', 'archived')
        .eq('path', 'red')
        .eq('deceased_name', deceasedName);
      if (dateOfDeath) query = query.eq('date_of_death', dateOfDeath);
      if (userId) query = query.eq('user_id', userId);
      else query = query.eq('coordinator_email', coordinatorEmail);
      const { data: existing } = await query.order('updated_at', { ascending: false }).limit(1).maybeSingle();
      if (existing?.id) {
        const { data, error } = await supabase.from('workflows')
          .update(baseRow)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) { console.error('createWorkflow reuse:', error); return existing; }
        return data;
      }
    }

    const { data, error } = await supabase.from('workflows').insert([{
      ...baseRow,
      created_at: new Date().toISOString(),
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
        isObituary: t.isObituary || false,
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

const accessRoleFor = (role = '') => {
  const value = role.toLowerCase();
  if (['owner', 'participant', 'external_partner', 'activator'].includes(value)) return value;
  if (value.includes('funeral') || value.includes('cemetery') || value.includes('crematorium') || value.includes('attorney') || value.includes('accountant') || value.includes('banker')) return 'external_partner';
  if (value.includes('executor') || value.includes('trusted') || value.includes('activator')) return 'activator';
  return 'participant';
};

const grantEstateAccess = async (workflowId, person) => {
  if (!workflowId || !person?.email) return;
  const email = person.email.toLowerCase().trim();
  if (!email) return;
  const role = accessRoleFor(person.role || person.relationship || person.estate_role_label);
  const row = { workflow_id: workflowId, email, role, status: 'active', updated_at: new Date().toISOString() };
  const { data: existing } = await supabase
    .from('estate_access')
    .select('id')
    .eq('workflow_id', workflowId)
    .ilike('email', email)
    .limit(1)
    .maybeSingle();
  if (existing?.id) await supabase.from('estate_access').update(row).eq('id', existing.id);
  else await supabase.from('estate_access').insert([{ ...row, created_at: new Date().toISOString() }]);
};

const humanStatus = (status) => {
  if (status === 'handled' || status === 'completed' || status === 'done') return 'Handled';
  if (status === 'sent' || status === 'assigned' || status === 'waiting') return 'Waiting for confirmation';
  if (status === 'acknowledged') return 'Confirmed';
  if (status === 'blocked') return 'Blocked';
  if (status === 'needs_review') return 'Needs review';
  if (status === 'in_progress') return 'In progress';
  if (status === 'pending') return 'Draft';
  return status ? status.replace(/_/g, ' ') : 'Draft';
};

const taskIsHandled = (status) => status === 'handled' || status === 'completed' || status === 'done' || status === 'not_applicable';
const taskCountsForReadiness = (tasks = []) => {
  return tasks.reduce((acc, task) => {
    if (task.status === 'not_applicable') return acc;
    acc.required += 1;
    if (task.status === 'handled' || task.status === 'completed' || task.status === 'done' || task.completed) acc.handled += 1;
    if (task.assignedTo || task.assigned_to_name || task.assigned_to_email) acc.assigned += 1;
    return acc;
  }, { required: 0, handled: 0, assigned: 0 });
};
const readinessPercentage = (counts) => counts.required > 0 ? Math.round((counts.handled / counts.required) * 100) : 0;

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
  const firstName = nameParts[0] || person.name;
  const lastName = nameParts.slice(1).join(' ') || '';
  const inviteToken = person.invitation_token || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}`);
  if (userId && person.id) {
    const { data, error } = await supabase.from('people').update({
      first_name: firstName,
      last_name: lastName,
      email: person.email || null,
      phone: person.phone || null,
      relationship: person.role || null,
      notify_on_trigger: true,
      estate_role_label: person.role || null,
      participant_discount_offered: true,
      updated_at: new Date().toISOString(),
    }).eq('id', person.id).eq('owner_id', userId).select().single();
    if (!error) return data;
  }
  if (userId) {
    let existing = null;
    if (person.email) {
      const { data } = await supabase.from('people').select('*').eq('owner_id', userId).eq('email', person.email).maybeSingle();
      existing = data;
    } else if (person.phone) {
      const { data } = await supabase.from('people').select('*').eq('owner_id', userId).eq('phone', person.phone).maybeSingle();
      existing = data;
    }
    if (existing) {
      const { data, error } = await supabase.from('people').update({
        first_name: firstName,
        last_name: lastName,
        email: person.email || existing.email || null,
        phone: person.phone || existing.phone || null,
        relationship: person.role || existing.relationship || null,
        notify_on_trigger: true,
        estate_role_label: person.role || existing.estate_role_label || null,
        participant_discount_offered: true,
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id).select().single();
      if (!error) return data;
    }
  }
  const { data, error } = await supabase.from('people').insert([{
    owner_id: userId || null,
    first_name: firstName,
    last_name: lastName,
    email: person.email || null,
    phone: person.phone || null,
    relationship: person.role || null,
    role: 'recipient',
    notify_on_trigger: true,
    invitation_token: inviteToken,
    participant_status: 'not_invited',
    participant_discount_offered: true,
    estate_role_label: person.role || null,
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

const loadPeople = async (userId) => {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .eq('owner_id', userId)
    .order('updated_at', { ascending: false });
  if (error) {
    console.warn('loadPeople:', error);
    return [];
  }
  return data || [];
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
      task_title: taskTitle,
      body: `${personData.first_name || personData.name} - you've been asked to help coordinate an estate task in Passage.\n\nTask: ${taskTitle}\n\nOpen Passage to accept the task, add notes, or ask for more details. The coordinator will see your update.`,
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

const handleCheckout = async (planId, userId, userEmail, workflowId = null) => {
  try {
    let checkoutUserId = userId;
    let checkoutUserEmail = userEmail;
    if (!checkoutUserId) {
      const { data: { session } } = await supabase.auth.getSession();
      checkoutUserId = session?.user?.id || null;
      checkoutUserEmail = checkoutUserEmail || session?.user?.email || '';
    }
    if (!checkoutUserId) {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('passage_pending_checkout', JSON.stringify({
          planId,
          workflowId,
          userEmail: checkoutUserEmail || '',
          createdAt: new Date().toISOString(),
        }));
      }
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: SITE_URL },
      });
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + (sessionData?.session?.access_token || ''),
      },
      body: JSON.stringify({ planId, userId: checkoutUserId, userEmail: checkoutUserEmail, workflowId }),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || 'Checkout could not be started');
    if (data.url) window.location.href = data.url;
  } catch (err) {
    console.error('Checkout error:', err);
    alert(err.message || 'Checkout could not be started. Please try again.');
  }
};

const getEstateSeatLimit = (userData) => {
  const fromDb = Number(userData?.estate_seats_total || 0);
  if (fromDb > 0) return fromDb;
  return PLAN_SEATS[userData?.plan || 'free'] || 1;
};

const getUsedGreenSeatCount = (workflows) => workflows.filter(w =>
  w.status !== 'archived' &&
  w.path === 'green' &&
  (w.seat_status || 'active') !== 'archived'
).length;

const shorten = (value, max) => {
  const text = String(value || '').replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, ' ').trim();
  return text.length > max ? text.slice(0, Math.max(0, max - 3)).trim() + '...' : text;
};

const executionForTask = (task, deceasedName, coordinatorName, userEmail) => {
  const title = task?.title || 'Estate coordination task';
  const lower = title.toLowerCase();
  const taskPlaybook = task?.playbook || getTaskPlaybook(title);
  const deceased = deceasedName || 'your loved one';
  const coordinator = coordinatorName || 'the family coordinator';
  const defaultSms = `Passage: ${coordinator} is handling ${shorten(title, 42)} for ${shorten(deceased, 22)}. Please sign in to Passage if you were assigned this task.`;
  const base = {
    executionMode: 'message',
    primaryLabel: 'Send message',
    recipientLabel: 'the right contact',
    recipientEmail: '',
    recipientPhone: '',
    link: '',
    linkLabel: 'Open link',
    subject: `${deceased} - ${title}`,
    draft: `Hello,\n\nI am helping coordinate next steps for ${deceased}. I am reaching out about: ${title}.\n\nCan you please let me know what information you need from us next?\n\nThank you,\n${coordinator}`,
    sms: defaultSms,
    steps: ['Review the prepared note.', 'Add any missing details.', 'Send it or copy it into the right portal.', 'Mark handled when you have confirmation.'],
    playbook: taskPlaybook,
    automationLabel: taskPlaybook.automationLabel,
    automationShortLabel: taskPlaybook.automationShortLabel,
    automationExplanation: taskPlaybook.automationExplanation,
    waitingOn: taskPlaybook.waitingOn,
    proofRequired: taskPlaybook.proofRequired,
    funeralHomeEligible: taskPlaybook.funeralHomeEligible,
    partnerOwnerRole: taskPlaybook.partnerOwnerRole,
  };

  if (lower.includes('document the date') || lower.includes('date, time') || lower.includes('location of death')) {
    return { ...base, executionMode: 'record', primaryLabel: 'Save official details', recipientLabel: 'your private estate notes', subject: `${deceased} - death details record`, draft: `For Passage records:\n\nName: ${deceased}\nDate of death:\nTime of death:\nLocation of death:\nPronouncing provider or official:\nFuneral home or next contact:\n\nNotes:\n`, sms: `Passage: ${coordinator} is recording official death details for ${shorten(deceased, 24)}. Sign in if you were assigned this task.`, steps: ['Write down the date, time, and exact location as provided by the medical professional or official.', 'Record who pronounced the death and how they can be reached.', 'Keep this private until death certificates are ordered.', 'Mark handled once the details are saved in notes.'] };
  }
  if (lower.includes('funeral home') || lower.includes('funeral director')) {
    return { ...base, executionMode: 'call', primaryLabel: 'Call and log outcome', recipientLabel: 'funeral home', subject: `${deceased} - funeral arrangements`, draft: `Hello,\n\nMy name is ${coordinator}. ${deceased} has passed away, and our family needs help with transportation and first arrangements.\n\nCan you please tell us what you need from us first, including documents, timing, and itemized pricing?\n\nThank you,\n${coordinator}`, sms: `Passage: ${coordinator} is coordinating funeral arrangements for ${shorten(deceased, 26)}. Please sign in to Passage for task details.`, steps: ['Call the funeral home if this is urgent.', 'Ask what they need for transportation and arrangements.', 'Request itemized pricing before approving services.', 'Save the contact and mark handled after the next step is scheduled.'] };
  }
  if (lower.includes('hospice') || lower.includes('home care')) {
    return { ...base, executionMode: 'call', primaryLabel: 'Call and log outcome', recipientLabel: 'hospice or home care provider', subject: `${deceased} - care provider notification`, draft: `Hello,\n\nI am helping coordinate next steps for ${deceased}. Can you please confirm any equipment pickup, final care records, medication disposal instructions, and billing or benefits steps we need to handle?\n\nThank you,\n${coordinator}`, sms: `Passage: ${coordinator} is notifying hospice or care providers for ${shorten(deceased, 23)}. Sign in to Passage for details.`, steps: ['Call the hospice or home care main number.', 'Ask about equipment pickup, medications, records, and final billing.', 'Record any pickup window or case number.', 'Mark handled after the provider confirms the next step.'] };
  }
  if (lower.includes('death certificate') || lower.includes('pronouncement')) {
    return { ...base, executionMode: 'link', primaryLabel: 'Open official records path', recipientLabel: 'physician, hospice nurse, coroner, or funeral director', link: 'https://www.cdc.gov/nchs/w2w/index.htm', linkLabel: 'Find state vital records office', subject: `${deceased} - official pronouncement / death certificates`, draft: `Hello,\n\nI am helping coordinate next steps for ${deceased}. Can you confirm who will provide the official pronouncement and how we should order certified death certificates?\n\nThank you,\n${coordinator}`, sms: `Passage: ${coordinator} needs help with death certificate steps for ${shorten(deceased, 26)}. Sign in to Passage for details.`, steps: ['Confirm who is legally pronouncing the death.', 'Ask how many certified death certificates to order.', 'Record the contact name and phone number.', 'Use the state vital records link if certificates must be ordered directly.', 'Mark handled once the document path is clear.'] };
  }
  if (lower.includes('minor children')) {
    return { ...base, recipientLabel: 'guardian or trusted family contact', subject: `${deceased} - immediate care for minor children`, draft: `Hello,\n\nWe need to confirm immediate care for the children connected to ${deceased}. Can you please confirm who has them, where they are staying, and whether any school, medication, or transportation needs must be handled today?\n\nThank you,\n${coordinator}`, sms: `Passage: urgent child-care coordination for ${shorten(deceased, 24)}. Please sign in to Passage if assigned.`, steps: ['Confirm the children are physically safe and with an approved adult.', 'Write down where they are, who is with them, and any medication or school needs.', 'Avoid permanent custody decisions until the legal guardian path is clear.', 'Mark handled when immediate care is confirmed.'] };
  }
  if (lower.includes('family') || lower.includes('notify')) {
    return { ...base, recipientLabel: 'family contact', subject: `${deceased} - family update`, draft: `Hello,\n\nI am so sorry to share that ${deceased} has passed away. ${coordinator} is helping coordinate next steps through Passage so the family can keep tasks, service details, and updates in one place.\n\nPlease sign in to Passage if you have been assigned a role or task.\n\nWith care,\n${coordinator}`, sms: `Passage: ${coordinator} shared a family update for ${shorten(deceased, 26)}. If assigned, sign in to Passage for details.`, steps: ['Choose the closest family contact first.', 'Use the prepared message or soften it in your own voice.', 'Avoid broadcasting service details until they are confirmed.', 'Mark handled once the first family circle knows who is coordinating.'] };
  }
  if (lower.includes('cemetery') || lower.includes('crematorium')) {
    return { ...base, executionMode: 'call', primaryLabel: 'Call and log outcome', recipientLabel: 'cemetery or crematorium', subject: `${deceased} - cemetery or crematorium coordination`, draft: `Hello,\n\nI am helping coordinate arrangements for ${deceased}. Can you please confirm availability, timing, fees, required documents, and who should approve the next step?\n\nThank you,\n${coordinator}`, sms: `Passage: ${coordinator} is coordinating cemetery or crematorium details for ${shorten(deceased, 22)}. Sign in for details.`, steps: ['Call the cemetery or crematorium.', 'Ask about timing, fees, required documents, and approvals.', 'Save the contact name and next deadline.', 'Mark handled once the next step is confirmed.'] };
  }
  if ((lower.includes('home') || lower.includes('pet') || lower.includes('vehicle') || lower.includes('valuables') || lower.includes('secure')) && !lower.includes('insurance')) {
    return { ...base, recipientLabel: 'trusted local person', subject: `${deceased} - home, pets, and property`, draft: `Hello,\n\nCan you help us check on ${deceased}'s home, pets, vehicle, and important belongings? We need someone to confirm the home is secure and let us know if anything urgent needs attention.\n\nPlease reply with what you find and any next steps.\n\nThank you,\n${coordinator}`, sms: `Passage: ${coordinator} needs help checking home, pets, or vehicle for ${shorten(deceased, 24)}. Sign in to Passage for task details.`, steps: ['Ask a trusted local person to check doors, pets, mail, vehicle, and valuables.', 'Do not remove items unless the authorized person agrees.', 'Take notes or photos if something needs follow-up.', 'Save what was checked and mark handled.'] };
  }
  if (lower.includes('social security')) {
    return { ...base, executionMode: 'link', primaryLabel: 'Open SSA path', recipientLabel: 'Social Security Administration', link: 'https://www.ssa.gov/benefits/survivors/', linkLabel: 'Open SSA survivor benefits', subject: `${deceased} - survivor benefits`, sms: `Passage: ${coordinator} is starting Social Security survivor steps for ${shorten(deceased, 22)}. Sign in to Passage for details.`, steps: ['Open the SSA survivor benefits page.', 'Gather Social Security numbers, death certificate, marriage/birth records if applicable.', 'Call SSA or schedule the required appointment.', 'Mark handled once the appointment or claim is started.'] };
  }
  if (lower.includes('medicare') || lower.includes('medicaid')) {
    return { ...base, executionMode: 'link', primaryLabel: 'Open benefits guidance', recipientLabel: 'Medicare, Medicaid, or benefits office', link: 'https://www.medicare.gov/basics/reporting-medicare-fraud-and-abuse/report-death', linkLabel: 'Open Medicare death reporting guidance', subject: `${deceased} - health benefits notification`, sms: `Passage: ${coordinator} is handling Medicare or Medicaid steps for ${shorten(deceased, 22)}. Sign in for details.`, steps: ['Confirm whether the funeral home reports the death automatically.', 'Gather Medicare/Medicaid ID and certified death certificate if requested.', 'Ask about final claims, premiums, or estate recovery notices.', 'Mark handled once the agency path is recorded.'] };
  }
  if (lower.includes('veteran') || lower.includes('va ') || lower.includes('military')) {
    return { ...base, executionMode: 'link', primaryLabel: 'Open VA benefits path', recipientLabel: 'U.S. Department of Veterans Affairs', link: 'https://www.va.gov/burials-memorials/', linkLabel: 'Open VA burial and survivor benefits', subject: `${deceased} - veteran burial and survivor benefits`, sms: `Passage: ${coordinator} is checking VA benefits for ${shorten(deceased, 24)}. Sign in to Passage for details.`, steps: ['Find DD214 or military service records if available.', 'Open VA burial and survivor benefit guidance.', 'Ask about burial allowance, flag, headstone, and survivor benefits.', 'Mark handled when the claim or appointment is started.'] };
  }
  if (lower.includes('dmv') || lower.includes('driver')) {
    return { ...base, executionMode: 'link', primaryLabel: 'Open DMV path', recipientLabel: 'state DMV', link: 'https://www.usa.gov/motor-vehicle-services', linkLabel: 'Find state DMV office', subject: `${deceased} - license and vehicle records`, sms: `Passage: ${coordinator} is handling DMV or vehicle records for ${shorten(deceased, 24)}. Sign in to Passage for details.`, steps: ['Open your state DMV site.', 'Search for deceased driver license cancellation or vehicle title transfer.', 'Gather death certificate and title/registration.', 'Mark handled once the DMV instruction or appointment is saved.'] };
  }
  if (lower.includes('credit bureaus')) {
    return { ...base, executionMode: 'link', primaryLabel: 'Open credit alert guidance', recipientLabel: 'Equifax, Experian, and TransUnion', link: 'https://www.identitytheft.gov/', linkLabel: 'Open identity theft/deceased alert guidance', subject: `${deceased} - deceased alert`, sms: `Passage: ${coordinator} is handling credit bureau alerts for ${shorten(deceased, 24)}. Sign in to Passage for details.`, steps: ['Contact each credit bureau to place a deceased alert.', 'Prepare certified death certificate and proof of authority.', 'Save confirmation numbers.', 'Mark handled after all three bureaus are notified.'] };
  }
  if (lower.includes('mail') || lower.includes('usps')) {
    return { ...base, executionMode: 'link', primaryLabel: 'Open USPS path', recipientLabel: 'USPS or trusted mail contact', link: 'https://www.usps.com/manage/forward.htm', linkLabel: 'Open USPS mail forwarding', subject: `${deceased} - mail forwarding`, sms: `Passage: ${coordinator} is handling mail forwarding for ${shorten(deceased, 24)}. Sign in to Passage for details.`, steps: ['Decide who is authorized to receive estate mail.', 'Forward or hold mail through USPS if appropriate.', 'Watch mail for bank, insurance, tax, and benefits notices.', 'Mark handled once mail is controlled.'] };
  }
  if (lower.includes('passport') || lower.includes('voter') || lower.includes('license') || lower.includes('professional')) {
    return { ...base, executionMode: 'link', primaryLabel: 'Open agency path', recipientLabel: 'issuing agency', link: 'https://www.usa.gov/death-notification', linkLabel: 'Open government death notification guidance', subject: `${deceased} - government record update`, sms: `Passage: ${coordinator} is updating government records for ${shorten(deceased, 24)}. Sign in for details.`, steps: ['Identify the agency for this record.', 'Gather certified death certificate and proof of authority.', 'Ask whether the record should be cancelled, returned, or updated.', 'Mark handled once the agency confirms what happens next.'] };
  }
  if (lower.includes('travel') || lower.includes('lodging') || lower.includes('hotel') || lower.includes('flight')) {
    return { ...base, recipientLabel: 'travel coordinator or hotel contact', subject: `${deceased} - family travel coordination`, draft: `Hello,\n\nOur family is coordinating travel for services for ${deceased}. Can you please confirm availability, group rates, check-in details, and any deadlines we should know about?\n\nThank you,\n${coordinator}`, sms: `Passage: ${coordinator} is coordinating family travel for ${shorten(deceased, 24)}. Sign in for details.`, steps: ['Pick one person to coordinate travel questions.', 'Send the prepared note to hotel or travel contact.', 'Save rates, deadlines, and confirmation numbers.', 'Mark handled when lodging/travel instructions are clear.'] };
  }
  if (lower.includes('readings') || lower.includes('music') || lower.includes('pallbearers') || lower.includes('officiant')) {
    return { ...base, recipientLabel: 'officiant or service coordinator', subject: `${deceased} - service readings and music`, draft: `Hello,\n\nWe are preparing service details for ${deceased}. Can you please confirm readings, music, pallbearers, timing, and anything needed from the family before the service?\n\nThank you,\n${coordinator}`, sms: `Passage: ${coordinator} is coordinating service details for ${shorten(deceased, 24)}. Sign in for details.`, steps: ['Choose one person to collect service preferences.', 'Send the prepared note to the officiant or coordinator.', 'Save readings, music, pallbearer names, and deadlines.', 'Mark handled when the service plan is confirmed.'] };
  }
  if (lower.includes('photos') || lower.includes('memories') || lower.includes('slideshow') || lower.includes('program')) {
    return { ...base, recipientLabel: 'family photo coordinator', subject: `${deceased} - photos and memories for service`, draft: `Hello,\n\nCan you help gather photos and memories for ${deceased}'s service? Please reply with what you can provide and any deadlines for slideshow, boards, programs, or printed materials.\n\nThank you,\n${coordinator}`, sms: `Passage: ${coordinator} is gathering photos and memories for ${shorten(deceased, 24)}. Sign in for details.`, steps: ['Ask one person to gather photos and memories.', 'Send the prepared note to family contributors.', 'Save upload links, deadlines, and who is responsible.', 'Mark handled when the materials are with the service coordinator.'] };
  }
  if (lower.includes('employer') || lower.includes('hr')) {
    return { ...base, recipientLabel: 'employer / HR department', subject: `${deceased} - employment and benefits notification`, draft: `Hello,\n\nI am writing to notify you that ${deceased} has passed away. Can you please let us know the next steps for final pay, benefits, life insurance, and any required paperwork?\n\nPlease copy me at ${userEmail || 'this email'} on the response.\n\nThank you,\n${coordinator}`, sms: `Passage: ${coordinator} is handling employer or benefits steps for ${shorten(deceased, 24)}. Sign in to Passage for details.`, steps: ['Find HR or benefits contact information.', 'Ask about final pay, employer life insurance, retirement plans, and required forms.', 'Save names, deadlines, and claim numbers.', 'Mark handled when HR confirms the next step.'] };
  }
  if (lower.includes('attorney') || lower.includes('probate') || lower.includes('will')) {
    return { ...base, recipientLabel: 'estate attorney', subject: `${deceased} - estate documents and next steps`, draft: `Hello,\n\nI am helping coordinate the estate of ${deceased}. We need guidance on the will, probate requirements, and what documents you need from the family.\n\nCan you please advise on the next step?\n\nThank you,\n${coordinator}`, sms: `Passage: ${coordinator} is handling attorney/probate steps for ${shorten(deceased, 24)}. Sign in to Passage for details.`, steps: ['Locate will, trust, power of attorney, and any attorney contact.', 'Ask whether probate is needed and who has authority to act.', 'Do not distribute assets until legal guidance is clear.', 'Mark handled when the attorney or court path is recorded.'] };
  }
  if (lower.includes('florist') || lower.includes('flowers') || lower.includes('reception') || lower.includes('cater')) {
    return { ...base, recipientLabel: 'service provider', subject: `${deceased} - memorial service coordination`, draft: `Hello,\n\nOur family is coordinating memorial arrangements for ${deceased}. Can you please share availability, pricing, and what details you need from us?\n\nThank you,\n${coordinator}`, sms: `Passage: ${coordinator} is coordinating memorial service details for ${shorten(deceased, 22)}. Sign in to Passage for details.`, steps: ['Have one already? Add their contact and send the prepared note.', 'Need one? Passage can suggest local options once a service ZIP code is added.', 'Save pricing and availability.', 'Mark handled when the provider is confirmed.'] };
  }
  if (lower.includes('bank') || lower.includes('account') || lower.includes('insurance') || lower.includes('subscription')) {
    return { ...base, recipientLabel: 'institution or account provider', subject: `${deceased} - account notification`, draft: `Hello,\n\nI am helping coordinate account notifications for ${deceased}. Can you please tell us what documentation is required to update or close this account and whether there are beneficiary or survivor claim steps?\n\nThank you,\n${coordinator}`, sms: `Passage: ${coordinator} is handling account or insurance steps for ${shorten(deceased, 23)}. Sign in to Passage for details.`, steps: ['Find the institution contact and account type.', 'Ask what documents are required before sharing private information.', 'Record claim numbers, deadlines, and mailing/upload instructions.', 'Mark handled once the institution confirms the next step.'] };
  }
  if (lower.includes('pension') || lower.includes('retirement') || lower.includes('beneficiary')) {
    return { ...base, recipientLabel: 'retirement plan or benefits administrator', subject: `${deceased} - retirement or beneficiary claim`, draft: `Hello,\n\nI am helping coordinate benefits for ${deceased}. Can you please tell us what beneficiary, pension, retirement, or survivor claim steps are required and what documents should be submitted?\n\nThank you,\n${coordinator}`, sms: `Passage: ${coordinator} is handling retirement or beneficiary steps for ${shorten(deceased, 22)}. Sign in for details.`, steps: ['Locate the plan administrator or benefits portal.', 'Ask what beneficiary claim forms are required.', 'Record deadlines, claim numbers, and document upload instructions.', 'Mark handled once the claim path is clear.'] };
  }
  if (lower.includes('tax')) {
    return { ...base, executionMode: 'link', primaryLabel: 'Open IRS guidance', recipientLabel: 'tax preparer or estate accountant', link: 'https://www.irs.gov/individuals/file-the-final-income-tax-returns-of-a-deceased-person', linkLabel: 'Open IRS final return guidance', subject: `${deceased} - final tax return`, draft: `Hello,\n\nI am helping coordinate final tax steps for ${deceased}. Can you please advise what records you need for the final income tax return and whether any estate tax filing may be required?\n\nThank you,\n${coordinator}`, sms: `Passage: ${coordinator} is handling final tax steps for ${shorten(deceased, 24)}. Sign in to Passage for details.`, steps: ['Gather prior tax returns, income statements, and account records.', 'Contact the tax preparer or review IRS final return guidance.', 'Ask whether estate tax filings may apply.', 'Mark handled once the tax owner and next deadline are recorded.'] };
  }
  if (lower.includes('digital') || lower.includes('password') || lower.includes('online')) {
    return { ...base, recipientLabel: 'executor or digital account contact', subject: `${deceased} - digital account access`, draft: `Hello,\n\nWe need to inventory digital accounts for ${deceased}. Please do not reset or delete anything yet. Can you help identify critical accounts, password manager access, and any accounts with bills or family photos?\n\nThank you,\n${coordinator}`, sms: `Passage: ${coordinator} is coordinating digital accounts for ${shorten(deceased, 24)}. Sign in for details.`, steps: ['List critical accounts before changing passwords.', 'Look for a password manager, recovery email, or documented instructions.', 'Preserve photos, billing accounts, and financial records.', 'Mark handled once access and next steps are documented.'] };
  }
  if (lower.includes('obituary')) {
    return { ...base, recipientLabel: 'newspaper, funeral home, or family reviewer', subject: `${deceased} - obituary draft`, draft: `Hello,\n\nWe are preparing an obituary for ${deceased}. Can you please review the draft for names, dates, service details, and any memorial donation language before it is published?\n\nThank you,\n${coordinator}`, sms: `Passage: ${coordinator} is preparing the obituary for ${shorten(deceased, 26)}. Sign in to Passage if you were asked to review.`, steps: ['Draft the obituary with names, dates, survivors, and service information.', 'Ask one trusted person to review before publishing.', 'Confirm publication cost and deadline if using a newspaper.', 'Mark handled once the draft is saved or submitted.'] };
  }
  if (lower.includes('announcement') || lower.includes('social')) {
    return { ...base, recipientLabel: 'family reviewer', subject: `${deceased} - announcement review`, draft: `Hello,\n\nWe are preparing a family announcement for ${deceased}. Please review the wording before anything is shared publicly.\n\nThank you,\n${coordinator}`, sms: `Passage: ${coordinator} is preparing an announcement for ${shorten(deceased, 24)}. Sign in to Passage to review if assigned.`, steps: ['Write a short, calm announcement.', 'Confirm immediate family has been notified first.', 'Have one person review before posting.', 'Mark handled once the family-approved version is saved.'] };
  }
  if (lower.includes('thank you') || lower.includes('memorial fund') || lower.includes('charitable') || lower.includes('donation') || lower.includes('estate sale') || lower.includes('belongings')) {
    return { ...base, recipientLabel: 'family coordinator or service provider', subject: `${deceased} - memorial follow-up`, draft: `Hello,\n\nI am helping coordinate follow-up for ${deceased}. Can you please confirm what is needed next, who owns it, and any deadlines or costs we should record?\n\nThank you,\n${coordinator}`, sms: `Passage: ${coordinator} is coordinating memorial follow-up for ${shorten(deceased, 24)}. Sign in for details.`, steps: ['Choose the person or provider responsible for this follow-up.', 'Send the prepared note or assign the task.', 'Save names, costs, deadlines, and confirmations.', 'Mark handled once the next step is clear.'] };
  }
  return base;
};

const buildAssignmentSms = ({ toName, taskTitle, deceasedName }) => {
  const name = shorten(toName || 'You', 18);
  const task = shorten(taskTitle || 'estate task', 30);
  const deceased = shorten(deceasedName || 'the estate', 18);
  return shorten(`Passage: ${name}, ${deceased} task: ${task}. Details: thepassageapp.io`, 118);
};

const safeFileName = (name) => String(name || 'file')
  .replace(/[^\w.\-]+/g, '-')
  .replace(/-+/g, '-')
  .slice(0, 90);

const handleSignInWithGoogle = async () => {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: SITE_URL },
  });
};

// ─── MERGE helper — merge DB tasks back onto static task list ─────────────────
const buildTaskList = (dbTasks) => {
  const result = [];
  POST_DEATH_TASKS.forEach(tier => {
    tier.tasks.forEach(staticTask => {
      const db = dbTasks.find(d => d.title === staticTask.title);
      const playbook = getTaskPlaybook(staticTask.title);
      result.push({
        ...staticTask,
        playbook,
        tier: tier.tier, tierLabel: tier.tierLabel,
        tierColor: tier.tierColor, tierBg: tier.tierBg, tierIcon: tier.icon,
        completed: db ? taskIsHandled(db.status) : false,
        status: db?.status || 'pending',
        notes: db?.notes || '',
        outcomeStatus: db?.outcome_status || '',
        followUpAt: db?.follow_up_at || null,
        updatedAt: db?.updated_at || db?.created_at || null,
        completedAt: db?.completed_at || null,
        lastActionAt: db?.last_action_at || db?.notified_at || db?.updated_at || null,
        lastActor: db?.last_actor || db?.completed_by_email || null,
        channel: db?.channel || null,
        recipient: db?.recipient || db?.execution_recipient_email || db?.assigned_to_name || db?.assigned_to_email || null,
        acknowledgedAt: db?.acknowledged_at || null,
        deliveredAt: db?.delivered_at || null,
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
    const playbook = getTaskPlaybook(d.title);
    result.push({
      id: `custom_${d.id}`, title: d.title, desc: d.description || '',
      category: d.category || 'other',
      playbook,
      tier: tierNum, tierLabel: tierMeta.tierLabel,
      tierColor: tierMeta.tierColor, tierBg: tierMeta.tierBg, tierIcon: tierMeta.icon,
      completed: taskIsHandled(d.status),
      status: d.status || 'pending',
      notes: d.notes || '',
      outcomeStatus: d.outcome_status || '',
      followUpAt: d.follow_up_at || null,
      updatedAt: d.updated_at || d.created_at || null,
      completedAt: d.completed_at || null,
      lastActionAt: d.last_action_at || d.notified_at || d.updated_at || null,
      lastActor: d.last_actor || d.completed_by_email || null,
      channel: d.channel || null,
      recipient: d.recipient || d.execution_recipient_email || d.assigned_to_name || d.assigned_to_email || null,
      acknowledgedAt: d.acknowledged_at || null,
      deliveredAt: d.delivered_at || null,
      assignedTo: d.assigned_to_name || null,
      assignedEmail: d.assigned_to_email || null,
      isCustom: true, dbId: d.id,
    });
  });
  return result;
};

const taskAwareness = (task) => {
  if (!task || task.completed || task.status === 'not_applicable') return '';
  const when = task.lastActionAt ? new Date(task.lastActionAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
  if (task.status === 'sent') return `Message sent to ${task.recipient || task.assignedTo || 'recipient'}${when ? ' at ' + when : ''}. Waiting for confirmation.`;
  if (task.status === 'delivered') return `Delivered to ${task.recipient || task.assignedTo || 'recipient'}${when ? ' at ' + when : ''}`;
  if (task.status === 'acknowledged') return `${task.lastActor || task.recipient || task.assignedTo || 'Someone'} confirmed this${when ? ' at ' + when : ''}`;
  if (task.status === 'blocked') return `${task.lastActor || task.recipient || task.assignedTo || 'Someone'} needs help with this${when ? ' at ' + when : ''}`;
  if (['assigned', 'waiting', 'in_progress'].includes(task.status) && task.assignedTo) return `${task.assignedTo} is working on this`;
  if (['assigned', 'waiting', 'in_progress'].includes(task.status)) return 'Someone is working on this';
  return '';
};

const fastActionForTask = (task) => {
  const title = String(task?.title || '').toLowerCase();
  if (title.includes('funeral')) return 'Call the funeral home';
  if (title.includes('certificate')) return 'Ask how death certificates are ordered';
  if (title.includes('notify') || title.includes('announcement')) return 'Notify the first person';
  if (title.includes('secure') || title.includes('home') || title.includes('pet')) return 'Ask someone to check the home';
  if (title.includes('document') || title.includes('will')) return 'Find the document';
  return task?.title || 'Open the first task';
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

const AddressField = ({ label, value, onChange, placeholder }) => {
  const inputRef = useCallback((node) => {
    if (!node || typeof window === 'undefined') return;
    const key = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!key) return;
    const attach = () => {
      if (!window.google?.maps?.places || node.dataset.autocompleteAttached) return;
      node.dataset.autocompleteAttached = 'true';
      const ac = new window.google.maps.places.Autocomplete(node, { types: ['establishment', 'geocode'], fields: ['formatted_address', 'name'] });
      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        onChange(place.formatted_address || place.name || node.value);
      });
    };
    if (window.google?.maps?.places) { attach(); return; }
    if (!document.getElementById('passage-google-places')) {
      const script = document.createElement('script');
      script.id = 'passage-google-places';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
      script.async = true;
      script.onload = attach;
      document.head.appendChild(script);
    } else {
      setTimeout(attach, 600);
    }
  }, [onChange]);
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.mid, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{label}</label>}
      <input ref={inputRef} type="text" value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder || "Start typing an address or place"}
        style={{ width: "100%", padding: "13px 15px", borderRadius: 11, fontSize: 15, border: `1.5px solid ${C.border}`, background: C.bgCard, color: C.ink, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
      <div style={{ fontSize: 11, color: C.soft, marginTop: 5 }}>{process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ? "Start typing to choose the right place." : "Address suggestions activate when Google Places is configured."}</div>
    </div>
  );
};

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
  <div onClick={onClick} style={{ border: `1.5px solid ${selected ? C.sage : C.border}`, borderRadius: 14, padding: "14px 16px", cursor: "pointer", background: selected ? C.sageFaint : C.bgCard, transition: "all 0.15s", marginBottom: 8, display: "flex", alignItems: "flex-start", gap: 14 }}>
    <span aria-hidden="true" style={{ width: 24, height: 24, borderRadius: "50%", background: selected ? C.sage : C.sageFaint, color: selected ? "#fff" : C.sage, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, flexShrink: 0 }}>{icon}</span>
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
  <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 22, padding: "26px 24px", maxWidth, width: "100%", margin: "0 auto", boxShadow: "0 18px 48px rgba(55,45,35,.06)" }}>{children}</div>
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

const CandleLogo = ({ size = 24, nameSize = 16 }) => (
  <div className="passage-brand" style={{ display: "flex", alignItems: "center", gap: Math.max(8, size * 0.32) }}>
    <style>{`
      @keyframes passageGlow {
        0%, 100% { opacity: .28; transform: translate(-50%, -50%) scale(.92); }
        46% { opacity: .52; transform: translate(-50%, -50%) scale(1.06); }
      }
      @keyframes passageMarkFlicker {
        0%, 100% { filter: drop-shadow(0 0 0 rgba(184,120,58,0)); opacity: .96; transform: scale(1); }
        38% { filter: drop-shadow(0 0 8px rgba(184,120,58,.18)); opacity: 1; transform: scale(1.01); }
        52% { filter: drop-shadow(0 0 3px rgba(184,120,58,.12)); opacity: .92; transform: scale(.995); }
      }
      @keyframes passageWordFlicker {
        0%, 100% { color: #5b7a63; text-shadow: 0 0 0 rgba(184,148,90,0); }
        42% { color: #6f7f5c; text-shadow: 0 0 11px rgba(184,148,90,.18); }
        58% { color: #506d58; text-shadow: 0 0 4px rgba(184,148,90,.10); }
      }
    `}</style>
    <div style={{ width: size, height: size, position: "relative", flexShrink: 0 }}>
      <div style={{ position: "absolute", left: "50%", top: "46%", width: size * 1.12, height: size * 1.12, borderRadius: "50%", background: "radial-gradient(circle, rgba(213,165,83,.28) 0%, rgba(213,165,83,.1) 38%, rgba(213,165,83,0) 68%)", animation: "passageGlow 4.8s ease-in-out infinite" }} />
      <img src="/passage-icon-light-onbg.svg" alt="" style={{ position: "relative", display: "block", width: size, height: size, borderRadius: Math.max(8, size * 0.24), animation: "passageMarkFlicker 5.2s ease-in-out infinite" }} />
    </div>
    <span style={{ fontFamily: '"SF Pro Display", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', fontSize: nameSize, color: "#5b7a63", letterSpacing: "0.02em", fontWeight: 620, animation: "passageWordFlicker 5.8s ease-in-out infinite" }}>PASSAGE</span>
  </div>
);

// Top navigation bar used across all inner screens
const TopNav = ({ user, onDashboard, onBack, onSignOut, label, accentColor, onHome }) => (
  <div style={{ background: C.bgCard, borderBottom: `1px solid ${C.border}`, padding: "12px 18px", display: "grid", gridTemplateColumns: "180px minmax(0,1fr) 180px", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
    <div onClick={onHome || onDashboard || onBack} style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
      <CandleLogo size={24} nameSize={16} />
    </div>
    {label && <div style={{ fontSize: 11, color: C.soft, fontWeight: 500, textAlign: "center" }}>{label}</div>}
    <div style={{ display: "flex", gap: 7, alignItems: "center", justifyContent: "flex-end", minHeight: 30 }}>
      {onBack && (
        <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 12.5, color: C.soft, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>Back</button>
      )}
      {user && onDashboard && (
        <button onClick={onDashboard} style={{ background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 8, padding: "5px 12px", fontSize: 11.5, color: C.sage, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>My file</button>
      )}
      {user && onSignOut && (
        <button onClick={onSignOut} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 12px", fontSize: 11.5, color: C.mid, cursor: "pointer", fontFamily: "inherit" }}>Sign out</button>
      )}
    </div>
  </div>
);

const GoogleSignInBtn = ({ label = "Continue with Google", compact = false }) => (
  <button onClick={handleSignInWithGoogle} style={{ width: compact ? "auto" : "100%", minWidth: compact ? 172 : undefined, padding: compact ? "9px 14px" : "12px 18px", borderRadius: 11, fontSize: compact ? 12.5 : 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: C.bgCard, border: `1.5px solid ${C.border}`, color: C.ink, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, whiteSpace: "nowrap" }}>
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
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const authHeaders = token ? { Authorization: 'Bearer ' + token } : {};
      fetch("/api/handleEvent", {
        method: "POST", headers: { "Content-Type": "application/json", ...authHeaders },
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
            <AddressField label="Full address" placeholder="5th Ave & 50th St, New York, NY" value={form.locationAddress} onChange={v => setForm(f => ({ ...f, locationAddress: v }))} />
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

Please open Passage to accept the task, add a note, or tell me if you need more details. Passage will show only the estate work connected to you.

With gratitude,
Passage`);
    setEditedSMS(buildAssignmentSms({ toName: personName, taskTitle, deceasedName }));
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

function TaskExecutionView({ task, deceasedName, coordinatorName, userEmail, workflowId, onHandled, onNotApplicable, onAssign, onOpenObituary, onClose }) {
  const playbook = executionForTask(task, deceasedName, coordinatorName, userEmail);
  const [recipientEmail, setRecipientEmail] = useState(task?.assignedEmail || playbook.recipientEmail || '');
  const [recipientPhone, setRecipientPhone] = useState(playbook.recipientPhone || '');
  const [draft, setDraft] = useState(playbook.draft);
  const [smsDraft, setSmsDraft] = useState(playbook.sms || '');
  const [notes, setNotes] = useState(task?.notes || '');
  const [outcome, setOutcome] = useState(task?.outcomeStatus || '');
  const [followUp, setFollowUp] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentAt, setSentAt] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [actionNotice, setActionNotice] = useState('');
  const [sendError, setSendError] = useState('');
  const [savedPulse, setSavedPulse] = useState(false);
  const markSaved = () => {
    setSavedPulse(true);
    setTimeout(() => setSavedPulse(false), 1400);
  };

  const logTaskAction = async ({ status = 'waiting', channel = 'record', recipient = '', detail = '', outcomeStatus = '' }) => {
    if (!task?.dbId) {
      setActionNotice(detail || 'Saved locally. Add notes below so the plan knows what happened.');
      return true;
    }
    setSendError('');
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    const res = await fetch(`/api/tasks/${task.dbId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: JSON.stringify({
        status,
        channel,
        recipient,
        detail,
        notes,
        outcomeStatus,
        actor: coordinatorName || userEmail || 'Passage',
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setSendError(data.error || 'Passage could not save this yet. Try again before closing this task.');
      return false;
    }
    setActionNotice(detail || 'Saved to the estate record.');
    return true;
  };

  const sendDraft = async () => {
    if (!recipientEmail) return;
    setSending(true);
    setSendError('');
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    const sendUrl = task?.dbId ? `/api/tasks/${task.dbId}/send` : '/api/sendEmail';
    const res = await fetch(sendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: JSON.stringify({ channel: 'email', to: recipientEmail, cc: userEmail || undefined, subject: playbook.subject, taskId: task.dbId || task.id, taskTitle: task.title, deceasedName, coordinatorName, workflowId, actionType: 'execution', messageText: draft }),
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (res.ok) {
      const stamp = new Date();
      setSent(true);
      setSentAt(stamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
      setActionNotice(`Message sent to ${recipientEmail} at ${stamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}. Waiting for confirmation.`);
    }
    else setSendError(data.error || 'Failed to send - retry? You can copy the draft while Passage keeps this task open.');
  };

  const sendSmsDraft = async () => {
    if (!recipientPhone || !task?.dbId) return;
    setSending(true);
    setSendError('');
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    const res = await fetch(`/api/tasks/${task.dbId}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: JSON.stringify({ channel: 'sms', to: recipientPhone, taskTitle: task.title, deceasedName, coordinatorName, workflowId, actionType: 'execution', messageText: smsDraft }),
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (res.ok) {
      const stamp = new Date();
      setSent(true);
      setSentAt(stamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
      setActionNotice(`Text sent to ${recipientPhone} at ${stamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}. Waiting for confirmation.`);
    } else setSendError(data.error || 'Failed to send text - retry? Check the phone number and try again.');
  };

  const lowerTitle = String(task?.title || '').toLowerCase();
  const isCallTask = playbook.executionMode === 'call' || lowerTitle.includes('funeral') || lowerTitle.includes('hospice') || lowerTitle.includes('home care');
  const isLinkTask = playbook.executionMode === 'link' || Boolean(playbook.link);
  const isRecordTask = playbook.executionMode === 'record';
  const outcomeOptions = lowerTitle.includes('funeral') ? [
    ['spoke_next_step_set', 'I spoke with them and saved the next step', 'handled'],
    ['left_voicemail', 'I left a voicemail', 'waiting'],
    ['sent_email', 'I sent the email', 'waiting'],
    ['appointment_scheduled', 'The next appointment is scheduled', 'handled'],
  ] : lowerTitle.includes('obituary') || lowerTitle.includes('announcement') || lowerTitle.includes('notify') ? [
    ['message_sent', 'The message was sent', 'handled'],
    ['draft_saved', 'Draft saved for review', 'waiting'],
    ['family_review_needed', 'Family review is needed', 'waiting'],
  ] : lowerTitle.includes('certificate') || lowerTitle.includes('document') || lowerTitle.includes('probate') || lowerTitle.includes('bank') || lowerTitle.includes('insurance') ? [
    ['called_waiting', 'I called and am waiting for a reply', 'waiting'],
    ['documents_needed', 'They need documents from us', 'waiting'],
    ['submitted', 'Forms or documents were submitted', 'handled'],
    ['next_deadline_saved', 'Next deadline is saved', 'waiting'],
  ] : [
    ['done_confirmed', 'This is done', 'handled'],
    ['waiting_for_reply', 'Waiting for reply', 'waiting'],
    ['needs_information', 'Needs more information', 'waiting'],
    ['someone_else_handling', 'Someone else is handling it', 'waiting'],
  ];
  const selectedOutcome = outcomeOptions.find(opt => opt[0] === outcome);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.58)", zIndex: 240, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.bgCard, borderRadius: "20px 20px 0 0", padding: "24px 20px 48px", width: "100%", maxWidth: 620, maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ width: 32, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 18px" }} />
        <div style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: C.sage, fontWeight: 800, marginBottom: 8 }}>Handle this task</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 21, color: C.ink, lineHeight: 1.25, marginBottom: 8 }}>{task.title}</div>
        <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.65, marginBottom: 16 }}>Passage prepared the next action. You can handle it yourself or assign it to someone else.</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8, marginBottom: 14 }}>
          <div style={{ background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase", color: C.sage, marginBottom: 4 }}>Passage can do</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>{playbook.automationShortLabel || playbook.automationLabel}</div>
            <div style={{ fontSize: 11.5, color: C.mid, lineHeight: 1.45, marginTop: 3 }}>{playbook.automationExplanation}</div>
          </div>
          <div style={{ background: C.bgSubtle, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase", color: C.soft, marginBottom: 4 }}>Waiting on</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>{playbook.waitingOn || "recipient"}</div>
            <div style={{ fontSize: 11.5, color: C.mid, lineHeight: 1.45, marginTop: 3 }}>Proof needed: {playbook.proofRequired || "confirmation"}</div>
          </div>
          {playbook.funeralHomeEligible && (
            <div style={{ background: C.goldFaint, border: `1px solid ${C.gold}40`, borderRadius: 12, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase", color: C.gold, marginBottom: 4 }}>Partner ready</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>Funeral home can help</div>
              <div style={{ fontSize: 11.5, color: C.mid, lineHeight: 1.45, marginTop: 3 }}>This is visible in the partner command center when linked.</div>
            </div>
          )}
        </div>
        <div style={{ background: C.bgSubtle, border: `1px solid ${C.border}`, borderRadius: 13, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 8 }}>Are you handling this?</div>
          <div style={{ fontSize: 12.5, color: C.mid, lineHeight: 1.55 }}>Choose "I am handling this" to use the script and notes here, or assign it to someone else.</div>
        </div>
        <div style={{ background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 13, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.sage, marginBottom: 8 }}>What to do right now</div>
          {playbook.steps.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: C.mid, lineHeight: 1.55, marginBottom: 6 }}>
              <span style={{ color: C.sage, fontWeight: 800 }}>{i + 1}.</span><span>{step}</span>
            </div>
          ))}
          <div style={{ marginTop: 10, fontSize: 12, color: C.mid }}>Use the prepared action below, then save what happened so the estate stays current.</div>
        </div>
        {playbook.link && (
          <a href={playbook.link} target="_blank" rel="noreferrer" onClick={() => setActionNotice('Link opened. Save the outcome after the form or website step is done.')} style={{ display: "block", textAlign: "center", background: C.bgSubtle, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", color: C.ink, fontWeight: 800, textDecoration: "none", marginBottom: 14 }}>{playbook.linkLabel || 'Open link'}</a>
        )}
        {(task.isSocial || task.isObituary) && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8, marginBottom: 14 }}>
            {task.isSocial && (
              <button onClick={() => { var p = new URLSearchParams({wid: workflowId || "", dn: deceasedName || "", cn: coordinatorName || ""}); window.open("/share?" + p.toString(), "_blank"); }} style={{ padding: "11px", borderRadius: 11, border: "1px solid #1877F220", background: "#f0f4ff", color: "#1877F2", fontFamily: "Georgia, serif", fontWeight: 800, cursor: "pointer" }}>
                Open announcement draft
              </button>
            )}
            {task.isObituary && (
              <button onClick={onOpenObituary} style={{ padding: "11px", borderRadius: 11, border: `1px solid ${C.border}`, background: C.bgSubtle, color: C.ink, fontFamily: "Georgia, serif", fontWeight: 800, cursor: "pointer" }}>
                Draft obituary
              </button>
            )}
          </div>
        )}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.soft, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 6 }}>Prepared email</div>
          <input value={recipientEmail} onChange={e => { setRecipientEmail(e.target.value); markSaved(); }} placeholder={`Email for ${playbook.recipientLabel}`} style={{ width: "100%", boxSizing: "border-box", padding: "11px 13px", borderRadius: 11, border: `1.5px solid ${C.border}`, fontFamily: "Georgia, serif", marginBottom: 8 }} />
          <textarea value={draft} onChange={e => { setDraft(e.target.value); markSaved(); }} style={{ width: "100%", minHeight: 180, boxSizing: "border-box", padding: 12, borderRadius: 11, border: `1.5px solid ${C.border}`, background: C.bgSubtle, color: C.ink, fontFamily: "Georgia, serif", fontSize: 13, lineHeight: 1.65 }} />
          {userEmail && <div style={{ fontSize: 11.5, color: C.soft, marginTop: 5 }}>You will be copied at {userEmail} when the email is sent.</div>}
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.soft, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 6 }}>Prepared text message</div>
          <input value={recipientPhone} onChange={e => { setRecipientPhone(e.target.value); markSaved(); }} placeholder={`Phone for ${playbook.recipientLabel}`} style={{ width: "100%", boxSizing: "border-box", padding: "11px 13px", borderRadius: 11, border: `1.5px solid ${C.border}`, fontFamily: "Georgia, serif", marginBottom: 8 }} />
          <textarea value={smsDraft} onChange={e => { setSmsDraft(e.target.value); markSaved(); }} style={{ width: "100%", minHeight: 74, boxSizing: "border-box", padding: 12, borderRadius: 11, border: `1.5px solid ${C.border}`, background: C.bgSubtle, color: C.ink, fontFamily: "Georgia, serif", fontSize: 13, lineHeight: 1.55 }} />
          <div style={{ fontSize: 11.5, color: C.soft, marginTop: 5 }}>Texts should stay short and point people back to Passage when they are assigned a task.</div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.soft, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 6 }}>Notes</div>
          <textarea value={notes} onChange={e => { setNotes(e.target.value); markSaved(); }} placeholder="Save confirmation numbers, names, next appointment times, or anything the family should know." style={{ width: "100%", minHeight: 96, boxSizing: "border-box", padding: 12, borderRadius: 11, border: `1.5px solid ${C.border}`, background: C.bgCard, color: C.ink, fontFamily: "Georgia, serif", fontSize: 13, lineHeight: 1.65 }} />
          {savedPulse && <div style={{ fontSize: 11.5, color: C.sage, fontWeight: 800, marginTop: 5 }}>Saved</div>}
        </div>
        <div style={{ background: C.bgSubtle, border: `1px solid ${C.border}`, borderRadius: 13, padding: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.soft, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 8 }}>Tell Passage what happened</div>
          <div style={{ display: "grid", gap: 7 }}>
            {outcomeOptions.map(opt => (
              <button key={opt[0]} onClick={() => setOutcome(opt[0])} style={{ textAlign: "left", padding: "10px 11px", borderRadius: 10, border: `1.5px solid ${outcome === opt[0] ? C.sage : C.border}`, background: outcome === opt[0] ? C.sageFaint : C.bgCard, color: outcome === opt[0] ? C.sage : C.ink, fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {opt[1]}
              </button>
            ))}
          </div>
          {selectedOutcome?.[2] === 'waiting' && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11.5, color: C.mid, marginBottom: 5 }}>Optional follow-up date/time</div>
              <input type="datetime-local" value={followUp} onChange={e => setFollowUp(e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "10px 11px", borderRadius: 10, border: `1px solid ${C.border}`, fontFamily: "Georgia, serif" }} />
            </div>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, marginBottom: 8 }}>
          {isCallTask ? (
            <button onClick={async () => {
              if (recipientPhone) window.location.href = 'tel:' + recipientPhone.replace(/[^\d+]/g, '');
              await logTaskAction({ status: 'waiting', channel: 'call', recipient: recipientPhone || playbook.recipientLabel, detail: `Call started for ${task.title}. Waiting for confirmation/outcome.`, outcomeStatus: 'call_started' });
            }} style={{ padding: "11px", borderRadius: 11, border: "none", background: C.sage, color: "#fff", fontFamily: "Georgia, serif", fontWeight: 800, cursor: "pointer" }}>{recipientPhone ? "Call now" : playbook.primaryLabel || "Log call"}</button>
          ) : isLinkTask ? (
            <button onClick={async () => {
              if (playbook.link) window.open(playbook.link, '_blank', 'noopener,noreferrer');
              await logTaskAction({ status: 'waiting', channel: 'website', recipient: playbook.recipientLabel, detail: `${playbook.linkLabel || 'Official link'} opened for ${task.title}. Waiting for confirmation/outcome.`, outcomeStatus: 'link_opened' });
            }} style={{ padding: "11px", borderRadius: 11, border: "none", background: C.sage, color: "#fff", fontFamily: "Georgia, serif", fontWeight: 800, cursor: "pointer" }}>{playbook.primaryLabel || playbook.linkLabel || "Open link"}</button>
          ) : isRecordTask ? (
            <button onClick={async () => {
              const ok = await logTaskAction({ status: 'handled', channel: 'record', recipient: 'Estate record', detail: `${task.title} saved to the estate record.`, outcomeStatus: 'record_saved' });
              if (ok) setOutcome('done_confirmed');
            }} style={{ padding: "11px", borderRadius: 11, border: "none", background: C.sage, color: "#fff", fontFamily: "Georgia, serif", fontWeight: 800, cursor: "pointer" }}>{playbook.primaryLabel || "Save record"}</button>
          ) : (
            <button onClick={sendDraft} disabled={!recipientEmail || sending} style={{ padding: "11px", borderRadius: 11, border: "none", background: C.sage, color: "#fff", fontFamily: "Georgia, serif", fontWeight: 800, cursor: "pointer" }}>{sending ? "Sending..." : sent ? "Message sent" : "Send message"}</button>
          )}
          <button onClick={() => navigator.clipboard.writeText(draft).then(() => alert('Draft copied'))} style={{ padding: "11px", borderRadius: 11, border: `1px solid ${C.border}`, background: C.bgCard, color: C.mid, fontFamily: "Georgia, serif", fontWeight: 700, cursor: "pointer" }}>Copy draft</button>
          <button onClick={sendSmsDraft} disabled={!recipientPhone || sending || !task?.dbId} style={{ padding: "11px", borderRadius: 11, border: `1px solid ${C.border}`, background: recipientPhone && task?.dbId ? C.bgSubtle : C.bgCard, color: recipientPhone && task?.dbId ? C.ink : C.soft, fontFamily: "Georgia, serif", fontWeight: 700, cursor: recipientPhone && task?.dbId ? "pointer" : "not-allowed" }}>Send text</button>
          <button onClick={() => navigator.clipboard.writeText(smsDraft).then(() => alert('Text copied'))} style={{ padding: "11px", borderRadius: 11, border: `1px solid ${C.border}`, background: C.bgCard, color: C.mid, fontFamily: "Georgia, serif", fontWeight: 700, cursor: "pointer" }}>Copy text</button>
        </div>
        {(sent || actionNotice) && (
          <div style={{ marginBottom: 8, background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 12, padding: "10px 12px", color: C.sage, fontSize: 12.5, fontWeight: 800, lineHeight: 1.5 }}>
            {actionNotice || (sentAt ? 'Message sent at ' + sentAt + '. Waiting for confirmation.' : 'Message sent and copied to the estate record. Waiting for confirmation.')} Save the outcome below so the plan knows what happened next.
          </div>
        )}
        {sendError && (
          <div style={{ marginBottom: 8, background: C.roseFaint, border: `1px solid ${C.rose}30`, borderRadius: 12, padding: "10px 12px", color: C.rose, fontSize: 12.5, fontWeight: 800, lineHeight: 1.5 }}>
            {sendError}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
          <button onClick={() => onNotApplicable(notes)} style={{ padding: "11px", borderRadius: 11, border: `1px solid ${C.border}`, background: C.bgCard, color: C.soft, fontFamily: "Georgia, serif", fontWeight: 700, cursor: "pointer" }}>Not applicable</button>
          <button onClick={onAssign} style={{ padding: "11px", borderRadius: 11, border: `1px solid ${C.border}`, background: C.bgSubtle, color: C.ink, fontFamily: "Georgia, serif", fontWeight: 700, cursor: "pointer" }}>Assign instead</button>
          <button onClick={() => { if (!outcome) return; setConfirmed(true); setTimeout(() => onHandled({ notes, outcomeStatus: outcome, followUpAt: followUp || null, finalStatus: selectedOutcome?.[2] === 'waiting' ? 'waiting' : 'handled' }), 1400); }} disabled={!outcome} style={{ padding: "11px", borderRadius: 11, border: "none", background: !outcome ? C.border : confirmed ? C.sage : C.ink, color: "#fff", fontFamily: "Georgia, serif", fontWeight: 800, cursor: outcome ? "pointer" : "not-allowed" }}>{confirmed ? "Handled" : "Save outcome"}</button>
        </div>
        {confirmed && (
          <div style={{ marginTop: 10, background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 12, padding: "11px 12px", color: C.sage, fontSize: 13, fontWeight: 800, textAlign: "center" }}>
            {selectedOutcome?.[2] === 'waiting' ? "We've saved this as waiting and kept it on the plan." : "That's handled. Passage saved what happened and updated the plan."}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivatePlanView({ workflowId, deceasedName, actions, tasks, events, onClose, onSent }) {
  const [sending, setSending] = useState(false);
  const pendingActions = (actions || []).filter(a => !['sent', 'handled', 'completed'].includes(a.status));
  const [selectedIds, setSelectedIds] = useState(() => pendingActions.map(a => a.id).filter(Boolean));
  const assignedTasks = (tasks || []).filter(t => t.assignedTo || t.assignedEmail).slice(0, 12);
  const selectedActions = pendingActions.filter(a => !a.id || selectedIds.includes(a.id));
  const invalidSelected = selectedActions.filter(a => (a.action_type === 'sms' || a.recipient_phone) ? !a.recipient_phone : !a.recipient_email);
  const channels = [
    ['Email', pendingActions.filter(a => a.action_type === 'email' || a.recipient_email).length],
    ['Text', pendingActions.filter(a => a.action_type === 'sms' || a.recipient_phone).length],
    ['Assigned tasks', assignedTasks.length],
  ];
  const sendAll = async () => {
    setSending(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    const res = await fetch('/api/handleEvent', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify({ type: 'death_confirmed', payload: { workflowId, actionIds: selectedIds } }) });
    setSending(false);
    if (res.ok) { onSent && onSent(); onClose(); } else alert('Passage could not send these yet. Review contacts and try again.');
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 245, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.bgCard, borderRadius: "20px 20px 0 0", padding: "24px 20px 48px", width: "100%", maxWidth: 640, maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ width: 32, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 18px" }} />
        <div style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: C.rose, fontWeight: 800, marginBottom: 8 }}>Activate plan</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 22, color: C.ink, lineHeight: 1.25, marginBottom: 8 }}>Here's what will happen.</div>
        <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.65, marginBottom: 16 }}>Nothing sends until you press the button below. After that, Passage records what was sent and what needs follow-up for {deceasedName || 'this estate'}.</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginBottom: 14 }}>
          {channels.map(([label, count]) => (
            <div key={label} style={{ background: C.bgSubtle, borderRadius: 12, padding: 11 }}>
              <div style={{ fontSize: 18, color: C.ink, fontWeight: 800 }}>{count}</div>
              <div style={{ fontSize: 10.5, color: C.mid }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ background: C.roseFaint, border: `1px solid ${C.rose}30`, borderRadius: 13, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.rose, marginBottom: 8 }}>Messages ready for approval</div>
          {pendingActions.length === 0 ? <div style={{ fontSize: 13, color: C.mid }}>No pending messages are queued yet. Assign people to tasks first.</div> : pendingActions.map((a, i) => (
            <label key={a.id || i} style={{ borderTop: i ? `1px solid ${C.border}` : 'none', padding: "8px 0", fontSize: 13, color: C.mid, lineHeight: 1.5, display: "grid", gridTemplateColumns: "22px minmax(0, 1fr)", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={!a.id || selectedIds.includes(a.id)} onChange={e => setSelectedIds(prev => e.target.checked ? Array.from(new Set(prev.concat(a.id).filter(Boolean))) : prev.filter(id => id !== a.id))} />
              <span><strong style={{ color: C.ink }}>{a.action_type === 'sms' ? 'Notify' : 'Email'}</strong> - {a.recipient_name || a.recipient_email || a.recipient_phone || 'recipient'}<br /><span>{a.task_title || a.subject || a.body || 'Estate coordination notice'}</span><br /><span style={{ color: C.soft, fontSize: 12 }}>Action: {a.recipient_email || a.recipient_phone ? 'sends immediately, then waits for confirmation' : 'recipient missing - edit before sending'}.</span></span>
            </label>
          ))}
        </div>
        {invalidSelected.length > 0 && <div style={{ background: C.roseFaint, border: `1px solid ${C.rose}30`, borderRadius: 12, padding: "10px 12px", color: C.rose, fontSize: 12.5, fontWeight: 800, marginBottom: 14 }}>Some selected messages are missing a recipient. Edit them before activating.</div>}
        <div style={{ background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 13, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.sage, marginBottom: 8 }}>Who owns what</div>
          {assignedTasks.length === 0 ? <div style={{ fontSize: 13, color: C.mid }}>No tasks are assigned yet.</div> : assignedTasks.map((t, i) => <div key={t.id || i} style={{ borderTop: i ? `1px solid ${C.border}` : 'none', padding: "7px 0", fontSize: 13, color: C.mid }}><strong style={{ color: C.ink }}>{t.title}</strong><br />Owner: {t.assignedTo || t.assignedEmail}</div>)}
        </div>
        {events?.length > 0 && <div style={{ background: C.bgSubtle, borderRadius: 13, padding: 14, marginBottom: 14 }}><div style={{ fontSize: 12, fontWeight: 800, color: C.soft, marginBottom: 8 }}>Service details included</div>{events.map((e, i) => <div key={e.id || i} style={{ fontSize: 13, color: C.mid, padding: "5px 0" }}>{e.name || e.event_type}{e.date ? ` - ${e.date}` : ''}{e.location_name ? ` at ${e.location_name}` : ''}</div>)}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
          <button onClick={onClose} style={{ padding: "11px", borderRadius: 11, border: `1px solid ${C.border}`, background: C.bgCard, color: C.mid, fontFamily: "Georgia, serif", fontWeight: 700, cursor: "pointer" }}>Review</button>
          <button onClick={() => { window.location.href = '/?open=people&backEstate=' + encodeURIComponent(workflowId || ''); }} style={{ padding: "11px", borderRadius: 11, border: `1px solid ${C.border}`, background: C.bgSubtle, color: C.ink, fontFamily: "Georgia, serif", fontWeight: 700, cursor: "pointer" }}>Edit</button>
          <button onClick={sendAll} disabled={sending || selectedIds.length === 0 || invalidSelected.length > 0} style={{ padding: "11px", borderRadius: 11, border: "none", background: selectedIds.length === 0 || invalidSelected.length > 0 ? C.border : C.rose, color: "#fff", fontFamily: "Georgia, serif", fontWeight: 800, cursor: selectedIds.length === 0 || invalidSelected.length > 0 ? "default" : "pointer" }}>{sending ? "Activating..." : "Send / Activate"}</button>
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
  const [savedPeople, setSavedPeople] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [sendError, setSendError] = useState("");

  useEffect(() => {
    loadPeople(userId).then(setSavedPeople);
  }, [userId]);

  // When a roster role is tapped, pre-fill role and advance to details
  const handleRoleSelect = (r) => {
    setSelectedPerson(null);
    setSelectedRole(r);
    setRole(r);
    setName(""); // clear name so user fills in the actual person's name
    setStep("details");
  };

  const handleSavedPersonSelect = (person) => {
    const fullName = [person.first_name, person.last_name].filter(Boolean).join(' ');
    setSelectedPerson(person);
    setSelectedRole(person.relationship || person.role || '');
    setName(fullName || person.email || person.phone || '');
    setRole(person.relationship || '');
    setEmail(person.email || '');
    setPhone(person.phone || '');
    setNotifyChannel(person.phone && person.email ? 'both' : person.phone ? 'sms' : 'email');
    setStep("details");
  };

  const sendAssignmentNotice = async (personData, emailBody, smsBody) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    const authHeaders = token ? { Authorization: 'Bearer ' + token } : {};
    const response = await fetch('/api/handleEvent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        type: 'task_assigned',
        payload: {
          workflowId,
          taskId: task.dbId || task.id,
          taskTitle: task.title,
          deceasedName,
          coordinatorName,
          personEmail: personData.email || null,
          personPhone: personData.phone || null,
          personName: personData.name,
          notifyChannel: personData.notifyChannel,
          emailBody,
          smsBody,
        },
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Passage could not send the assignment notice.');
    }
    return data.result || {};
  };

  const handleSendWithPreview = async ({ emailBody, smsBody }) => {
    setSaving(true);
    setSendError("");
    const personData = { name: name || selectedRole, role: role || selectedRole, email, phone, notifyChannel };
    const saved = await savePerson(userId, { ...personData, id: selectedPerson?.id, notify_channel: notifyChannel });
    await grantEstateAccess(workflowId, personData);
    if (task.dbId) {
      await updateTask(task.dbId, { assigned_to_name: personData.name, assigned_to_email: personData.email || null, assigned_to_person_id: saved?.id || null, status: 'assigned' });
    }
    if (saved && workflowId) {
      if (personData.email && notifyChannel !== 'sms') await saveWorkflowAction(workflowId, saved, task.title, 'email');
      if (personData.phone && notifyChannel !== 'email') await saveWorkflowAction(workflowId, { ...saved, phone: personData.phone }, task.title, 'sms');
      try {
        await sendAssignmentNotice(personData, emailBody, smsBody);
      } catch (err) {
        setSaving(false);
        setSendError(err.message || 'Passage could not send that assignment. Please check the contact details and try again.');
        return;
      }
    }
    onAssign(task.id, personData.name, personData.role, { email: personData.email, phone: personData.phone });
    setSaving(false);
    setShowPreview(false);
    onClose();
  };

  const handleAssign = async () => {
    setSaving(true);
    setSendError("");
    const personData = {
      name: name || selectedRole,
      role: role || selectedRole,
      email, phone, notifyChannel,
    };

    const saved = await savePerson(userId, { ...personData, id: selectedPerson?.id });
    await grantEstateAccess(workflowId, personData);

    if (task.dbId) {
      await updateTask(task.dbId, {
        assigned_to_name: personData.name,
        assigned_to_email: personData.email || null,
        assigned_to_person_id: saved?.id || null,
        status: 'assigned',
      });
    }

    if (saved && workflowId) {
      if (personData.email && notifyChannel !== 'sms') await saveWorkflowAction(workflowId, saved, task.title, 'email');
      if (personData.phone && notifyChannel !== 'email') await saveWorkflowAction(workflowId, { ...saved, phone: personData.phone }, task.title, 'sms');
      try {
        await sendAssignmentNotice(personData);
      } catch (err) {
        setSaving(false);
        setSendError(err.message || 'Passage could not send that assignment. Please check the contact details and try again.');
        return;
      }
    }

    onAssign(task.id, personData.name, personData.role, { email: personData.email, phone: personData.phone });
    setSaving(false);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.bgCard, borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 560, maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ width: 32, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 18px" }} />

        <Heading size={18}>{step === "pick" ? "Assign this task" : "Add their details"}</Heading>
        <div style={{ fontSize: 12.5, color: C.mid, background: C.bgSubtle, borderRadius: 9, padding: "9px 13px", marginBottom: 18, lineHeight: 1.4 }}>{task.title}</div>
        {sendError && (
          <div style={{ background: C.roseFaint, border: `1px solid ${C.rose}55`, color: C.rose, borderRadius: 11, padding: "10px 12px", marginBottom: 14, fontSize: 12.5, lineHeight: 1.45, fontWeight: 700 }}>
            {sendError}
          </div>
        )}

        {step === "pick" && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {[["roster","Choose from list"],["custom","Add someone new"]].map(([m, l]) => (
                <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "9px", borderRadius: 9, border: `1.5px solid ${mode === m ? C.rose : C.border}`, background: mode === m ? C.roseFaint : C.bgCard, fontSize: 12.5, fontWeight: 600, color: mode === m ? C.rose : C.mid, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>
              ))}
            </div>

            {mode === "roster" ? (
              <div>
                {savedPeople.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: C.soft, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 7 }}>Saved people</div>
                    <div style={{ display: "grid", gap: 7 }}>
                      {savedPeople.slice(0, 8).map(person => {
                        const fullName = [person.first_name, person.last_name].filter(Boolean).join(' ');
                        return (
                          <button key={person.id} onClick={() => handleSavedPersonSelect(person)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "9px 11px", borderRadius: 11, border: `1.5px solid ${C.border}`, background: C.bgCard, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                            <span style={{ minWidth: 0 }}>
                              <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: C.ink }}>{fullName || person.email || person.phone}</span>
                              <span style={{ display: "block", fontSize: 11, color: C.soft, marginTop: 2 }}>{person.relationship || 'Contact'}{person.email ? ` · ${person.email}` : ''}</span>
                            </span>
                            <span style={{ color: C.sage, fontSize: 12, fontWeight: 700 }}>Use</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
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
function TaskList({ deceasedName, coordinatorName, workflowId, userId, userEmail, onBack, onDashboard, onSignOut }) {
  const [showRoleTemplates, setShowRoleTemplates] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [showObituary, setShowObituary] = useState(false);
  const [eventCount, setEventCount] = useState(0);
  const [toast, setToast] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [assigningTask, setAssigningTask] = useState(null);
  const [executingTask, setExecutingTask] = useState(null);
  const [showActivation, setShowActivation] = useState(false);
  const [activationActions, setActivationActions] = useState([]);
  const [activationEvents, setActivationEvents] = useState([]);
  const [expanded, setExpanded] = useState({ 1: true, 2: true, 3: false, 4: false });
  const [filter, setFilter] = useState("all");
  const [addingTier, setAddingTier] = useState(null);
  const [customText, setCustomText] = useState("");
  const [saveStatus, setSaveStatus] = useState("idle");
  const [lastTaskId, setLastTaskId] = useState("");
  const [activationComplete, setActivationComplete] = useState(false);

  const initTasks = useCallback(async () => {
    if (workflowId) {
      const dbTasks = await loadTasks(workflowId);
      setTasks(buildTaskList(dbTasks));
    } else {
      setTasks(buildTaskList([]));
    }
    setLoaded(true);
    if (workflowId && typeof window !== 'undefined') setLastTaskId(window.localStorage.getItem(`passage:lastTask:${workflowId}`) || "");
  }, [workflowId]);

  useEffect(() => { initTasks(); }, [initTasks]);

  const rememberTask = (task) => {
    if (!task) return;
    setLastTaskId(task.id);
    if (workflowId && typeof window !== 'undefined') window.localStorage.setItem(`passage:lastTask:${workflowId}`, task.id);
  };

  const handleAssign = (taskId, name, role, contact = {}) => {
    const hasMessage = contact.email || contact.phone;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assignedTo: name, assignedRole: role, status: t.completed ? t.status : (hasMessage ? 'sent' : 'assigned') } : t));
    setToast(hasMessage ? `Message sent to ${name}. Waiting for them to confirm.` : `Waiting for ${name} to confirm.`);
  };

  const markHandled = async (task, result = '') => {
    const payload = typeof result === 'object' && result !== null ? result : { notes: result, finalStatus: 'handled' };
    const finalStatus = payload.finalStatus === 'waiting' ? 'waiting' : 'handled';
    const dbUpdates = {
      status: finalStatus,
      completed_at: finalStatus === 'handled' ? new Date().toISOString() : null,
      owner_kind: 'self',
      notes: payload.notes || '',
      outcome_status: payload.outcomeStatus || null,
      follow_up_at: payload.followUpAt ? new Date(payload.followUpAt).toISOString() : null,
      completed_by_email: userEmail || null,
      coordinator_notified_at: new Date().toISOString(),
    };
    if (task.dbId) await updateTask(task.dbId, dbUpdates);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: finalStatus === 'handled', status: finalStatus, notes: payload.notes || '', outcomeStatus: payload.outcomeStatus || '' } : t));
    setExecutingTask(null);
    setToast(finalStatus === 'waiting' ? "Saved as waiting. Passage will keep it visible." : "That's handled. Something real was recorded and the plan is updated.");
  };

  const markNotApplicable = async (task, notes = '') => {
    const savedNotes = notes?.trim() ? notes : 'Not applicable';
    if (task.dbId) await updateTask(task.dbId, { status: 'not_applicable', completed_at: new Date().toISOString(), owner_kind: 'self', notes: savedNotes });
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: true, status: 'not_applicable', notes: savedNotes } : t));
    setExecutingTask(null);
    setToast("Got it - we won't include this going forward.");
  };

  const openActivationPreview = async () => {
    if (!workflowId) return;
    const [{ data: actions }, { data: events }] = await Promise.all([
      supabase.from('workflow_actions').select('*').eq('workflow_id', workflowId).order('created_at', { ascending: true }),
      supabase.from('workflow_events').select('*').eq('workflow_id', workflowId).order('date', { ascending: true }),
    ]);
    setActivationActions(actions || []);
    setActivationEvents(events || []);
    setShowActivation(true);
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

  const readiness = taskCountsForReadiness(tasks);
  const done = readiness.handled;
  const assigned = tasks.filter(t => t.assignedTo).length;
  const pct = readinessPercentage(readiness);
  const requiredRemaining = Math.max(0, readiness.required - done);
  const dayOneRequired = tasks.filter(t => t.tier === 1 && t.status !== 'not_applicable');
  const dayOneHandled = dayOneRequired.filter(t => t.completed);
  const dayOneReady = dayOneRequired.length > 0 && dayOneHandled.length === dayOneRequired.length;
  const firstLiveTask = tasks.find(t => !t.completed && t.status !== 'not_applicable');
  const resumeTask = tasks.find(t => t.id === lastTaskId && !t.completed && t.status !== 'not_applicable');

  const tierMeta = POST_DEATH_TASKS.reduce((a, t) => {
    a[t.tier] = { label: t.tierLabel, color: t.tierColor, bg: t.tierBg, icon: t.icon }; return a;
  }, {});

  const getFiltered = (tier) => {
    const t = tasks.filter(t => t.tier === tier && t.status !== 'not_applicable');
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
              <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{done} of {readiness.required} required tasks handled</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: pct === 100 ? C.sage : C.ink }}>{pct}% ready</span>
            </div>
            <div style={{ height: 8, background: C.border, borderRadius: 4, marginBottom: 8 }}>
              <div style={{ height: "100%", borderRadius: 4, background: pct === 100 ? C.sage : `linear-gradient(90deg, ${C.red}, ${C.orange}, ${C.yellow})`, width: `${pct}%`, transition: "width 0.5s ease" }} />
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              {[
                { label: "Urgent remaining", value: tasks.filter(t => !t.completed && t.tier === 1 && t.status !== 'not_applicable').length, color: C.red },
                { label: "Assigned", value: assigned, color: C.sage },
                { label: "Handled", value: done, color: C.mid },
              ].map(s => (
                <div key={s.label} style={{ fontSize: 11.5, color: C.soft }}>
                  <span style={{ fontWeight: 700, color: s.color }}>{s.value}</span> {s.label}
                </div>
              ))}
            </div>
          </div>

          {resumeTask && (
            <button onClick={() => { rememberTask(resumeTask); setExecutingTask(resumeTask); }} style={{ width: "100%", textAlign: "left", background: C.bgSubtle, border: `1px solid ${C.border}`, borderRadius: 13, padding: "12px 14px", marginBottom: 10, fontFamily: "Georgia, serif", cursor: "pointer" }}>
              <div style={{ fontSize: 11, color: C.soft, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 4 }}>Last thing you were working on</div>
              <div style={{ fontSize: 14, color: C.ink, fontWeight: 800 }}>{resumeTask.title}</div>
              <div style={{ fontSize: 12, color: C.sage, fontWeight: 800, marginTop: 4 }}>Continue -&gt;</div>
            </button>
          )}

          {firstLiveTask && (
            <button onClick={() => { rememberTask(firstLiveTask); setExecutingTask(firstLiveTask); }} style={{ width: "100%", textAlign: "left", background: C.roseFaint, border: `1px solid ${C.rose}30`, borderRadius: 13, padding: "12px 14px", marginBottom: 10, fontFamily: "Georgia, serif", cursor: "pointer" }}>
              <div style={{ fontSize: 11, color: C.rose, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 4 }}>Just do this now</div>
              <div style={{ fontSize: 15, color: C.ink, fontWeight: 800 }}>{fastActionForTask(firstLiveTask)}</div>
            </button>
          )}

          <div style={{ background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 13, padding: "12px 14px", marginBottom: 10 }}>
            <div style={{ fontSize: 13, color: C.sage, fontWeight: 800, marginBottom: 3 }}>We'll guide and track everything from here.</div>
            <div style={{ fontSize: 12.5, color: C.mid, lineHeight: 1.55 }}>Passage keeps owners, messages, and handled tasks visible so you are not carrying this alone.</div>
          </div>

          {activationComplete && (
            <div style={{ background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 13, padding: "13px 15px", marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.sage, marginBottom: 6 }}>Your plan is in motion.</div>
              <div style={{ fontSize: 12.5, color: C.mid, lineHeight: 1.6 }}>We've:</div>
              <div style={{ fontSize: 12.5, color: C.mid, lineHeight: 1.6 }}>- Contacted the funeral home</div>
              <div style={{ fontSize: 12.5, color: C.mid, lineHeight: 1.6 }}>- Notified assigned people</div>
              <div style={{ fontSize: 12.5, color: C.mid, lineHeight: 1.6 }}>- Set tasks in progress</div>
              <div style={{ fontSize: 12.5, color: C.sage, fontWeight: 800, marginTop: 6 }}>We'll keep you updated.</div>
            </div>
          )}

          {dayOneReady && (
            <div style={{ background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 13, padding: "13px 15px", marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.sage, marginBottom: 4 }}>You've handled what is needed right now.</div>
              <div style={{ fontSize: 12.5, color: C.mid, lineHeight: 1.6 }}>
                You're in a good place. If you have a little room, the next 72 hours are ready below. Take them one at a time.
              </div>
              <div style={{ fontSize: 12.5, color: C.mid, lineHeight: 1.6, marginTop: 6 }}>Need a moment? We can pick this up later.</div>
            </div>
          )}

          {/* Filter */}
          <div style={{ display: "flex", gap: 6 }}>
            {[["all","All"],["pending","To do"],["assigned","Assigned"],["done","Handled"]].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)} style={{ padding: "6px 13px", borderRadius: 18, fontSize: 11.5, fontWeight: 600, border: `1.5px solid ${filter === v ? C.sage : C.border}`, background: filter === v ? C.sageFaint : C.bgCard, color: filter === v ? C.sage : C.mid, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>
            ))}
          </div>
        </div>

        {/* Tiers */}
        {[1,2,3,4].map(tier => {
          const meta = tierMeta[tier];
          const allTier = tasks.filter(t => t.tier === tier && t.status !== 'not_applicable');
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
                    <div style={{ fontSize: 10.5, color: C.soft }}>{tierDone} of {allTier.length} handled</div>
                  </div>
                  {tierDone === allTier.length && allTier.length > 0 && <span style={{ fontSize: 10.5, color: C.sage, fontWeight: 700, background: C.sageFaint, padding: "2px 8px", borderRadius: 8 }}>All handled</span>}
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
                        <button
                          onClick={() => { rememberTask(task); setExecutingTask(task); }}
                          aria-label={task.completed ? "Review handled task" : "Handle this task"}
                          title={task.completed ? "Review handled task" : "Handle this task"}
                          style={{ width: 21, height: 21, borderRadius: 6, flexShrink: 0, marginTop: 2, border: `2px solid ${task.completed ? C.sage : C.border}`, background: task.completed ? C.sage : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, transition: "all 0.15s" }}>
                          {task.completed && <svg width="11" height="8" viewBox="0 0 12 9"><path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </button>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: task.completed ? 500 : 600, color: task.completed ? C.mid : C.ink, lineHeight: 1.4, marginBottom: 2 }}>
                            {task.title}
                            {task.isCustom && <span style={{ fontSize: 9, color: C.sage, fontWeight: 700, background: C.sageFaint, padding: "1px 6px", borderRadius: 5, marginLeft: 7, textDecoration: "none" }}>CUSTOM</span>}
                            {task.status === 'not_applicable' && <span style={{ fontSize: 9, color: C.soft, fontWeight: 700, background: C.bgSubtle, padding: "1px 6px", borderRadius: 5, marginLeft: 7 }}>NOT APPLICABLE</span>}
                          </div>
                          {task.desc && !task.completed && <div style={{ fontSize: 11.5, color: C.soft, lineHeight: 1.5, marginBottom: task.assignedTo ? 5 : 0 }}>{task.desc}</div>}
                          {task.playbook && !task.completed && (
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 5 }}>
                              <span style={{ fontSize: 10.5, color: C.sage, background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 999, padding: "2px 8px", fontWeight: 800 }}>{task.playbook.automationShortLabel}</span>
                              <span style={{ fontSize: 10.5, color: C.mid, background: C.bgSubtle, border: `1px solid ${C.border}`, borderRadius: 999, padding: "2px 8px" }}>Waiting on {task.playbook.waitingOn}</span>
                              {task.playbook.funeralHomeEligible && <span style={{ fontSize: 10.5, color: C.gold, background: C.goldFaint, border: `1px solid ${C.gold}40`, borderRadius: 999, padding: "2px 8px", fontWeight: 800 }}>Funeral home can help</span>}
                            </div>
                          )}
                          {taskAwareness(task) && <div style={{ fontSize: 11.5, color: C.sage, fontWeight: 800, marginTop: 4 }}>{taskAwareness(task)}</div>}
                          {task.lastActionAt && (
                            <div style={{ fontSize: 10.8, color: C.soft, lineHeight: 1.45, marginTop: 4 }}>
                              {[
                                task.lastActor ? `By: ${task.lastActor}` : '',
                                `At: ${new Date(task.lastActionAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`,
                                task.recipient ? `To: ${task.recipient}` : '',
                                task.channel ? `Channel: ${task.channel === 'sms' ? 'SMS' : task.channel}` : '',
                                `Status: ${humanStatus(task.status)}`,
                              ].filter(Boolean).join(' | ')}
                            </div>
                          )}
                          {['sent', 'delivered'].includes(task.status) && !task.acknowledgedAt && (
                            <div style={{ marginTop: 5, display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
                              <span style={{ fontSize: 11.5, color: C.soft, fontWeight: 700 }}>Waiting for confirmation</span>
                              <button onClick={() => { rememberTask(task); setExecutingTask(task); }} style={{ border: `1px solid ${C.border}`, background: C.bgCard, color: C.mid, borderRadius: 7, padding: "3px 8px", fontSize: 11, fontFamily: "inherit", cursor: "pointer" }}>Send reminder</button>
                            </div>
                          )}
                          {task.completed && <div style={{ fontSize: 11.5, color: C.sage, fontWeight: 800, marginTop: 4 }}>That's taken care of. You're all set here.</div>}
                          {task.assignedTo && (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 9, padding: "2px 9px", marginTop: 4 }}>
                              <span style={{ fontSize: 10 }}>👤</span>
                              <span style={{ fontSize: 11, color: C.sage, fontWeight: 600 }}>{task.assignedTo}</span>
                              {task.assignedEmail && <span style={{ fontSize: 10, color: C.soft }}>· {task.assignedEmail}</span>}
                            </div>
                          )}
                        </div>

                        {task.completed ? (
                          <button onClick={() => { rememberTask(task); setExecutingTask(task); }} style={{ fontSize: 11, fontWeight: 700, color: C.mid, background: C.bgSubtle, border: `1px solid ${C.border}`, borderRadius: 7, padding: "4px 9px", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                            Review
                          </button>
                        ) : (
                          task.isSocial ? (
                            <button onClick={() => { rememberTask(task); setExecutingTask(task); }} style={{ fontSize: 11, fontWeight: 700, color: C.sage, background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 7, padding: "4px 9px", cursor: "pointer", fontFamily: "inherit", flexShrink: 0, whiteSpace: "nowrap" }}>
                              Handle
                            </button>
                          ) : task.isObituary ? (
                            <button onClick={() => { rememberTask(task); setExecutingTask(task); }} style={{ fontSize: 11, fontWeight: 700, color: C.sage, background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 7, padding: "4px 9px", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                              Handle
                            </button>
                          ) : (
                            <button onClick={() => { rememberTask(task); setExecutingTask(task); }} style={{ fontSize: 11, fontWeight: 700, color: C.sage, background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 7, padding: "4px 9px", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                              Handle
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
                        <input value={customText} onChange={e => { setCustomText(e.target.value); setSaveStatus("saved"); setTimeout(() => setSaveStatus("idle"), 1400); }}
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
      <div style={{ position: "sticky", bottom: 0, background: "rgba(255,255,255,0.96)", borderTop: `1px solid ${C.border}`, padding: "10px 16px", zIndex: 99, backdropFilter: "blur(10px)" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {!userId ? (
            <>
              <div style={{ flex: "1 1 220px", minWidth: 180, fontSize: 12.5, color: C.mid, lineHeight: 1.35 }}>Sign in to save this plan across devices.</div>
              <GoogleSignInBtn label="Save with Google" compact />
            </>
          ) : (
            <>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: C.mid }}>{done} handled | {assigned} assigned | {requiredRemaining} remaining</div>
                <div style={{ fontSize: 10.5, color: C.soft }}>Changes save automatically as you go</div>
              </div>
              <button onClick={() => { var p = new URLSearchParams({wid: workflowId||"", dn: deceasedName||"", cn: coordinatorName||""}); window.open("/share?" + p.toString(), "_blank"); }} style={{ background: "#f0f4ff", color: "#1877F2", border: "1px solid #1877F220", borderRadius: 10, padding: "9px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Handle news
              </button>
              <button onClick={() => setShowEvents(true)} style={{ background: C.goldFaint, color: C.amber, border: `1px solid ${C.gold}30`, borderRadius: 10, padding: "9px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                📍 {eventCount > 0 ? `${eventCount} event${eventCount > 1 ? "s" : ""}` : "Add events"}
              </button>
              <button onClick={() => setShowRoleTemplates(true)} style={{ background: C.roseFaint, color: C.rose, border: `1px solid ${C.rose}30`, borderRadius: 10, padding: "9px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                ⚡ Quick assign
              </button>
              {firstLiveTask && (
                <button onClick={() => { rememberTask(firstLiveTask); setExecutingTask(firstLiveTask); }} style={{ background: C.bgCard, color: C.sage, border: `1px solid ${C.sageLight}`, borderRadius: 10, padding: "9px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                  Next task
                </button>
              )}
              <button onClick={openActivationPreview} style={{ background: C.ink, color: "#fff", border: "none", borderRadius: 10, padding: "9px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Review & activate
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
      {executingTask && (
        <TaskExecutionView
          task={executingTask}
          deceasedName={deceasedName}
          coordinatorName={coordinatorName}
          userEmail={userEmail}
          workflowId={workflowId}
          onHandled={(notes) => markHandled(executingTask, notes)}
          onNotApplicable={(notes) => markNotApplicable(executingTask, notes)}
          onAssign={() => { setAssigningTask(executingTask); setExecutingTask(null); }}
          onOpenObituary={() => { setExecutingTask(null); setShowObituary(true); }}
          onClose={() => setExecutingTask(null)}
        />
      )}
      {showActivation && (
        <ActivatePlanView
          workflowId={workflowId}
          deceasedName={deceasedName}
          tasks={tasks}
          actions={activationActions}
          events={activationEvents}
          onClose={() => setShowActivation(false)}
          onSent={() => { setActivationComplete(true); setToast("Your plan is in motion. We'll keep you updated."); }}
        />
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
      {showObituary && (
        <ObituaryModal
          workflowId={workflowId} userId={userId}
          deceasedName={deceasedName}
          onClose={() => setShowObituary(false)}
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
  const buildPlan = async (purchase = false) => {
    setBuilding(true);
    await saveLead({ flow_type: "immediate", your_name: yourName, your_email: yourEmail, deceased_name: deceasedName, relationship, date_of_death: dateOfDeath, timestamp: new Date().toISOString() });
    let createdWorkflowId = workflowId;
    const wf = await createWorkflow(user?.id, deceasedName, yourName, yourEmail, dateOfDeath, { workflowId, path: 'red' });
    if (wf?.id) {
      const wfId = wf.id;
      createdWorkflowId = wfId;
      setWorkflowId(wfId);
      await saveAllTasks(wfId, user?.id);
    }
    setBuilding(false);
    if (purchase) {
      await handleCheckout('urgent', user && user.id, user && user.email ? user.email : yourEmail, createdWorkflowId);
      return;
    }
    setShowTaskList(true);
  };

  if (showTaskList) {
    return <TaskList deceasedName={deceasedName} coordinatorName={yourName} workflowId={workflowId} userId={user?.id} userEmail={user?.email || yourEmail} onBack={() => setShowTaskList(false)} onDashboard={user ? onDashboard : null} onSignOut={onSignOut} />;
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
                <Btn onClick={() => buildPlan(true)} disabled={!yourName || !yourEmail || building || !user} style={{ flex: 1, background: C.rose }}>
                  {building ? "Building your plan..." : "Start urgent plan - $79"}
                </Btn>
              </div>
              <div style={{ marginTop: 10, background: C.roseFaint, border: `1px solid ${C.rose}25`, borderRadius: 10, padding: "10px 12px", fontSize: 12, color: C.mid, lineHeight: 1.55 }}>
                Includes the guided estate task plan, coordination tools, and a planned $20 memorial impact donation.
              </div>
              <button onClick={() => buildPlan(false)} disabled={!yourName || !yourEmail || building} style={{ width: "100%", marginTop: 10, background: "none", border: "none", fontSize: 12, color: C.soft, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}>
                Preview first steps before checkout
              </button>
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
  const [secondConfirmerName, setSecondConfirmerName] = useState("");
  const [secondConfirmerEmail, setSecondConfirmerEmail] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("single_annual");

  const activate = async (mode) => {
    const triggerPeople = Array.from(new Set([executorEmail, secondConfirmerEmail].filter(Boolean).map(email => email.trim().toLowerCase())));
    await saveLead({ flow_type: "planning", mode, executor_name: executorName, executor_email: executorEmail, second_confirmer_name: secondConfirmerName, second_confirmer_email: secondConfirmerEmail, person_name: name, disposition, service_type: serviceType, timestamp: new Date().toISOString() });
    let createdWorkflowId = null;
    if (user?.id) {
      const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
      const wf = await createWorkflow(user.id, name, user.email, user.email, null, { path: 'green' });
      if (wf) {
        const wfId = wf.id;
        createdWorkflowId = wfId;
        // Mark as green path with trigger token and ready status
        await supabase.from('workflows').update({
          path: 'green',
          status: 'draft',
          trigger_token: token,
          trigger_people: triggerPeople,
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
        if (secondConfirmerEmail && secondConfirmerEmail.trim().toLowerCase() !== executorEmail.trim().toLowerCase()) {
          await supabase.from('workflow_actions').insert([
            { workflow_id: wfId, action_type: 'email', recipient_type: 'person', recipient_email: secondConfirmerEmail, recipient_name: secondConfirmerName || 'Second confirmer', task_title: 'Second confirmation contact', status: 'pending', delay_hours: 0 },
          ]);
        }

        // Paid activation is finalized by Stripe webhook after checkout succeeds.
      }
    }
    if (mode === 'paid') {
      await handleCheckout(selectedPlan, user && user.id, user && user.email, createdWorkflowId);
      return;
    }
    onComplete(mode);
  };

  const steps = [
    <Card key={0} maxWidth={820}>
      <Eyebrow text="Plan ahead" />
      <Heading size={28}>Leave your family one calm place to start.</Heading>
      <Sub>Build the estate command center before it is needed: people, wishes, documents, and the trusted contacts who can activate it later.</Sub>
      <div style={{ height: 14 }} />
      {[
        { value: "self", icon: "1", title: "Myself", desc: "Set up my own plan so my family has what they need." },
        { value: "parent", icon: "2", title: "A parent or grandparent", desc: "Help someone I love get organized before it is urgent." },
        { value: "spouse", icon: "3", title: "My spouse or partner", desc: "Plan together so neither of us is left guessing." },
      ].map(o => <OptionCard key={o.value} {...o} selected={forWhom === o.value} onClick={() => setForWhom(o.value)} />)}
      {!user && <div style={{ marginTop: 14 }}><GoogleSignInBtn /><div style={{ fontSize: 11, color: C.muted, textAlign: "center", marginTop: 6 }}>or continue without signing in</div></div>}
      <Btn onClick={() => setStep(1)} disabled={!forWhom} style={{ width: "100%", marginTop: 12 }}>Continue</Btn>
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

    <Card key={3} maxWidth={760}>
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
        <div style={{ fontSize: 12, color: C.mid, marginBottom: 10, lineHeight: 1.5 }}>The second person who confirms your passing. Can be the same as executor or someone different. You can add them now or later.</div>
        <Field label="Full name (optional)" placeholder="e.g. Michael Collins" value={secondConfirmerName} onChange={setSecondConfirmerName} />
        <Field label="Email (optional)" type="email" placeholder="michael@email.com" value={secondConfirmerEmail} onChange={setSecondConfirmerEmail} hint="If you add this now, Passage saves them as the second confirmation contact." />
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
        <div style={{ fontSize: 12, color: C.gold, fontWeight: 700, marginTop: 8 }}>Choose one estate now. Add spouse, parent, or family coverage when you need it.</div>
      </div>
      {PLAN_OPTIONS.map(p => (
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
      <div style={{ padding: "18px 16px 70px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%" }}>{steps[step]}</div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
// ─── OBITUARY MODAL ──────────────────────────────────────────────────────────
const normalizeDisposition = (value) => ({
  cremation: 'cremation',
  burial: 'burial',
  green_burial: 'green',
  donation: 'donation',
  undecided: 'unsure',
})[value] || value || '';

const normalizeServiceType = (value) => ({
  religious: 'funeral',
  celebration_of_life: 'celebration',
  graveside: 'graveside',
  memorial: 'private',
  none: 'none',
})[value] || value || '';

function ObituaryModal({ workflowId, userId, deceasedName, dateOfDeath, onClose, onSaved }) {
  const [form, setForm] = useState({
    full_name: deceasedName || '',
    date_of_death: dateOfDeath || '',
    date_of_birth: '',
    city_of_residence: '',
    occupation: '',
    survivors: '',
    preceded_by: '',
    life_summary: '',
    memorial_fund: '',
  });
  const [draft, setDraft] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    supabase.from('profiles').select('obituary_draft').eq('user_id', userId).maybeSingle().then(({ data }) => {
      if (data?.obituary_draft) {
        try {
          const saved = JSON.parse(data.obituary_draft);
          if (saved && typeof saved === 'object') {
            if (saved.form) setForm(f => ({ ...f, ...saved.form }));
            if (saved.draft) setDraft(saved.draft);
            return;
          }
        } catch {}
        setDraft(data.obituary_draft);
      }
    });
  }, [userId]);

  const generateDraft = async () => {
    setGenerating(true);
    const NL = String.fromCharCode(10);
    const d = form;
    const lines = [];
    lines.push((d.full_name || 'Our loved one') + ' passed away' + (d.date_of_death ? ' on ' + new Date(d.date_of_death + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '') + '.');
    if (d.city_of_residence) lines.push((d.full_name || 'They') + ' lived in ' + d.city_of_residence + '.');
    if (d.occupation) lines.push((d.full_name || 'They') + ' was known for their work as ' + d.occupation + '.');
    if (d.life_summary) lines.push(d.life_summary);
    if (d.survivors) lines.push((d.full_name || 'They') + ' is survived by ' + d.survivors + '.');
    if (d.preceded_by) lines.push((d.full_name || 'They') + ' was preceded in death by ' + d.preceded_by + '.');
    if (d.memorial_fund) lines.push('In lieu of flowers, the family requests donations to ' + d.memorial_fund + '.');
    setDraft(lines.join(NL + NL));
    setGenerating(false);
  };

  const saveDraft = async () => {
    if (!userId) {
      setError('Please sign in again before saving.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = JSON.stringify({ form, draft, saved_at: new Date().toISOString() });
    const { error } = await supabase.from('profiles').upsert([{
      user_id: userId,
      obituary_draft: payload,
      updated_at: new Date().toISOString(),
    }], { onConflict: 'user_id' });
    setSaving(false);
    if (error) {
      console.error('saveObituary:', error);
      setError('Could not save this obituary yet. Please try again.');
      return;
    }
    setSaved(true);
    if (onSaved) onSaved(payload);
    setTimeout(() => setSaved(false), 2000);
  };

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.bgCard, borderRadius: '20px 20px 0 0', padding: '24px 20px 48px', width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ width: 32, height: 4, borderRadius: 2, background: C.border, margin: '0 auto 18px' }} />
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 19, color: C.ink, marginBottom: 4 }}>Obituary</div>
        <div style={{ fontSize: 12.5, color: C.mid, marginBottom: 20, lineHeight: 1.55 }}>Fill in what you know. Passage drafts it for you.</div>

        <Field label="Full name" value={form.full_name} onChange={set('full_name')} placeholder="Robert James Collins" />
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}><Field label="Date of birth" type="date" value={form.date_of_birth} onChange={set('date_of_birth')} /></div>
          <div style={{ flex: 1 }}><Field label="Date of passing" type="date" value={form.date_of_death} onChange={set('date_of_death')} /></div>
        </div>
        <Field label="City of residence" value={form.city_of_residence} onChange={set('city_of_residence')} placeholder="New York, NY" />
        <Field label="Occupation / life work" value={form.occupation} onChange={set('occupation')} placeholder="e.g. retired teacher, business owner" />
        <Field label="Survived by" value={form.survivors} onChange={set('survivors')} placeholder="e.g. his wife Mary, daughters Sarah and Kate" />
        <Field label="Preceded in death by" value={form.preceded_by} onChange={set('preceded_by')} placeholder="e.g. his parents John and Ruth" />
        <Field label="Life in your words (optional)" value={form.life_summary} onChange={set('life_summary')} placeholder="A few sentences about who they were..." />
        <Field label="Memorial fund / charity (optional)" value={form.memorial_fund} onChange={set('memorial_fund')} placeholder="e.g. American Heart Association" />

        <button onClick={generateDraft} disabled={generating || !form.full_name}
          style={{ width: '100%', padding: '11px', borderRadius: 11, border: 'none', background: C.ink, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 14 }}>
          {generating ? 'Writing...' : 'Generate obituary draft'}
        </button>

        {draft && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.soft, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Your draft — edit as needed</div>
            <textarea value={draft} onChange={e => setDraft(e.target.value)}
              style={{ width: '100%', height: 200, padding: '12px', borderRadius: 11, border: '1.5px solid ' + C.border, fontFamily: 'Georgia, serif', fontSize: 13, color: C.ink, lineHeight: 1.7, resize: 'vertical', boxSizing: 'border-box', background: C.bgSubtle }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={saveDraft} disabled={saving}
                style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: saved ? C.sageFaint : C.sage, color: saved ? C.sage : '#fff', border: saved ? "1px solid " + C.sageLight : "none", fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                {saving ? 'Saving...' : saved ? '✓ Saved to your planning file' : 'Save draft'}
              </button>
              <button onClick={() => navigator.clipboard.writeText(draft).then(() => alert('Copied to clipboard'))}
                style={{ padding: '10px 16px', borderRadius: 10, border: '1.5px solid ' + C.border, background: C.bgCard, fontSize: 13, color: C.mid, cursor: 'pointer', fontFamily: 'inherit' }}>
                Copy
              </button>
            </div>
            {error && <div style={{ fontSize: 12, color: C.rose, marginTop: 8 }}>{error}</div>}
          </div>
        )}

        <button onClick={onClose} style={{ width: '100%', padding: '10px', borderRadius: 11, border: '1.5px solid ' + C.border, background: C.bgCard, fontSize: 13, color: C.mid, cursor: 'pointer', fontFamily: 'inherit' }}>
          Close
        </button>
      </div>
    </div>
  );
}

function PeopleList({ userId }) {
  const [people, setPeople] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', role: '', email: '', phone: '' });
  const load = useCallback(() => {
    if (!userId) return;
    supabase.from('people').select('*').eq('owner_id', userId).order('updated_at', { ascending: false }).then(({ data }) => {
      setPeople(data || []);
      setLoaded(true);
    });
  }, [userId]);
  useEffect(() => { load(); }, [load]);
  const startEdit = (person = null) => {
    setEditing(person || { id: null });
    setForm(person ? {
      name: [person.first_name, person.last_name].filter(Boolean).join(' '),
      role: person.relationship || '',
      email: person.email || '',
      phone: person.phone || '',
    } : { name: '', role: '', email: '', phone: '' });
  };
  const save = async () => {
    if (!form.name.trim()) return;
    await savePerson(userId, { id: editing?.id, name: form.name, role: form.role, email: form.email, phone: form.phone });
    await supabase.from('profiles').upsert([{ user_id: userId, people_complete: true, updated_at: new Date().toISOString() }], { onConflict: 'user_id' });
    setEditing(null);
    load();
  };
  if (!loaded) return <div style={{ fontSize: 12, color: C.soft }}>Loading...</div>;
  return (
    <div>
      <button onClick={() => startEdit()} style={{ width: "100%", padding: "10px 12px", borderRadius: 11, border: "1.5px solid " + C.sageLight, background: C.sageFaint, color: C.sage, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 12 }}>Add a trusted person</button>
      {people.length === 0 ? <div style={{ fontSize: 13, color: C.soft, fontStyle: "italic", marginBottom: 12 }}>No people added yet.</div> : null}
      {people.map((p, i) => (
        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < people.length - 1 ? "1px solid " + C.border : "none" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.sageFaint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>👤</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{p.first_name} {p.last_name}</div>
            <div style={{ fontSize: 11, color: C.soft }}>{p.relationship || "No role"} {p.email ? "· " + p.email : ""}</div>
          </div>
          <button onClick={() => startEdit(p)} style={{ border: "none", background: C.bgSubtle, borderRadius: 8, padding: "5px 10px", fontSize: 11, color: C.mid, cursor: "pointer", fontFamily: "inherit" }}>Edit</button>
        </div>
      ))}
      {editing ? (
        <div style={{ marginTop: 14, background: C.bgSubtle, borderRadius: 12, padding: 14, border: "1px solid " + C.border }}>
          <Field label="Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
          <Field label="Role / relationship" value={form.role} onChange={v => setForm(f => ({ ...f, role: v }))} placeholder="Brother, spouse, attorney, funeral director" />
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}><Field label="Email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} /></div>
            <div style={{ flex: 1 }}><Field label="Phone" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} /></div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setEditing(null)} style={{ flex: 1, padding: "9px", borderRadius: 10, border: "1.5px solid " + C.border, background: C.bgCard, color: C.mid, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
            <button onClick={save} disabled={!form.name.trim()} style={{ flex: 1, padding: "9px", borderRadius: 10, border: "none", background: C.sage, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Save person</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DocumentsModal({ userId, workflowId, onClose, onSaved }) {
  const [docs, setDocs] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ label: '', document_type: 'will', notes: '', unlocks_on_trigger: true });

  const loadDocs = useCallback(() => {
    if (!userId) return;
    let query = supabase.from('documents').select('*').eq('user_id', userId);
    query = workflowId ? query.eq('workflow_id', workflowId) : query.is('workflow_id', null);
    query.order('created_at', { ascending: false }).then(({ data }) => {
      setDocs(data || []);
      setLoaded(true);
    });
  }, [userId, workflowId]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const saveDoc = async () => {
    if (!form.label.trim()) return;
    setSaving(true);
    setError('');
    let filePath = null;
    if (file) {
      filePath = `${userId}/${Date.now()}-${safeFileName(file.name)}`;
      const { error: uploadError } = await supabase.storage.from('passage-documents').upload(filePath, file, { upsert: false });
      if (uploadError) {
        setError(uploadError.message || 'Could not upload this document.');
        setSaving(false);
        return;
      }
    }
    const { error } = await supabase.from('documents').insert([{
      user_id: userId,
      workflow_id: workflowId || null,
      label: form.label.trim(),
      document_type: form.document_type,
      file_url: filePath,
      file_size_bytes: file ? file.size : null,
      file_type: file ? file.type : null,
      notes: form.notes || null,
      unlocks_on_trigger: form.unlocks_on_trigger,
    }]);
    if (!error) {
      await supabase.from('profiles').upsert([{ user_id: userId, documents_complete: true, updated_at: new Date().toISOString() }], { onConflict: 'user_id' });
      setLoaded(false);
      setForm({ label: '', document_type: 'will', notes: '', unlocks_on_trigger: true });
      setFile(null);
      loadDocs();
      if (onSaved) onSaved(filePath ? 'Document uploaded.' : 'Document note saved.');
    } else {
      setError(error.message || 'Could not save this document.');
    }
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.bgCard, borderRadius: "20px 20px 0 0", padding: "24px 20px 48px", width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ width: 32, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 18px" }} />
        <div style={{ fontFamily: "Georgia, serif", fontSize: 19, color: C.ink, marginBottom: 5 }}>Documents</div>
        <div style={{ fontSize: 12.5, color: C.mid, lineHeight: 1.6, marginBottom: 18 }}>Upload the document or note where it lives. Nothing is shared unless your plan activates and access is approved.</div>
        <Field label="Document name" placeholder="Will in fire safe, blue folder" value={form.label} onChange={v => setForm(f => ({ ...f, label: v }))} />
        <Select label="Document type" value={form.document_type} onChange={v => setForm(f => ({ ...f, document_type: v }))} options={[["will","Will"],["trust","Trust"],["advance_directive","Advance directive"],["power_of_attorney","Power of attorney"],["life_insurance","Life insurance"],["funeral_contract","Funeral contract"],["property_deed","Property deed"],["passport","Passport"],["tax_return","Tax return"],["other","Other"]]} />
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.soft, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Upload file</div>
          <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} style={{ width: "100%", padding: 10, borderRadius: 11, border: "1.5px solid " + C.border, background: C.bgSubtle, boxSizing: "border-box" }} />
          {file && <div style={{ fontSize: 11.5, color: C.soft, marginTop: 5 }}>{file.name}</div>}
        </div>
        <Field label="Where to find it" placeholder="Home office safe. Code held by executor." value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} />
        <label style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: C.ink, marginBottom: 14 }}>
          <input type="checkbox" checked={form.unlocks_on_trigger} onChange={e => setForm(f => ({ ...f, unlocks_on_trigger: e.target.checked }))} />
          Share with trusted contacts when the plan activates
        </label>
        <button onClick={saveDoc} disabled={saving || !form.label.trim()} style={{ width: "100%", padding: "12px", borderRadius: 12, border: "none", background: C.sage, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 8 }}>{saving ? "Saving..." : file ? "Upload document" : "Save document note"}</button>
        {error && <div style={{ fontSize: 12, color: C.rose, marginBottom: 12 }}>{error}</div>}
        <div style={{ fontSize: 11, fontWeight: 700, color: C.soft, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Saved</div>
        {!loaded ? <div style={{ fontSize: 13, color: C.soft }}>Loading...</div> : docs.length === 0 ? <div style={{ fontSize: 13, color: C.soft, marginBottom: 16 }}>No documents saved yet.</div> : docs.map(doc => (
          <div key={doc.id} style={{ background: C.bgSubtle, borderRadius: 11, padding: "11px 13px", marginBottom: 7 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{doc.label}</div>
            <div style={{ fontSize: 11.5, color: C.soft, marginTop: 2 }}>{doc.document_type?.replace(/_/g, ' ')}</div>
            {doc.file_url && <div style={{ fontSize: 11.5, color: C.sage, marginTop: 4 }}>File uploaded</div>}
            {doc.notes && <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.5, marginTop: 6 }}>{doc.notes}</div>}
          </div>
        ))}
        <button onClick={onClose} style={{ width: "100%", padding: "10px", borderRadius: 11, border: "1.5px solid " + C.border, background: C.bgCard, fontSize: 13, color: C.mid, cursor: "pointer", fontFamily: "inherit", marginTop: 8 }}>Close</button>
      </div>
    </div>
  );
}

function MemoriesModal({ userId, workflowId, onClose, onSaved }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ title: '', to_name: '', to_email: '', to_phone: '', delivery_channel: 'email', content_type: 'letter', delivery_trigger: 'on_death', delivery_date: '', delivery_event: '', content_text: '' });

  const loadItems = useCallback(() => {
    if (!userId) return;
    let query = supabase.from('scheduled_deliveries').select('*').eq('from_user_id', userId);
    query = workflowId ? query.eq('workflow_id', workflowId) : query.is('workflow_id', null);
    query.order('created_at', { ascending: false }).then(({ data }) => {
      setItems(data || []);
      setLoaded(true);
    });
  }, [userId, workflowId]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const saveMemory = async () => {
    if (!form.title.trim() || (!form.content_text.trim() && !file)) return;
    if ((form.delivery_channel === 'email' || form.delivery_channel === 'email_and_sms') && !form.to_email.trim()) {
      setError('Add an email recipient for this delivery.');
      return;
    }
    if ((form.delivery_channel === 'sms' || form.delivery_channel === 'email_and_sms') && !form.to_phone.trim()) {
      setError('Add a phone number for this text delivery.');
      return;
    }
    if ((form.delivery_trigger === 'on_date' || form.delivery_trigger === 'on_event') && !form.delivery_date) {
      setError('Choose the date this should be delivered.');
      return;
    }
    setSaving(true);
    setError('');
    let contentUrl = null;
    if (file) {
      contentUrl = `${userId}/${Date.now()}-${safeFileName(file.name)}`;
      const bucket = form.content_type === 'voice_note' ? 'passage-voice-notes' : form.content_type === 'photo_album' ? 'passage-photos' : 'passage-memories';
      const { error: uploadError } = await supabase.storage.from(bucket).upload(contentUrl, file, { upsert: false });
      if (uploadError) {
        setError(uploadError.message || 'Could not upload this memory.');
        setSaving(false);
        return;
      }
    }
    const { error } = await supabase.from('scheduled_deliveries').insert([{
      from_user_id: userId,
      workflow_id: workflowId || null,
      title: form.title.trim(),
      to_name: form.to_name || null,
      to_email: form.to_email || null,
      to_phone: form.to_phone || null,
      delivery_channel: form.delivery_channel,
      content_type: form.content_type,
      delivery_trigger: form.delivery_trigger,
      delivery_date: form.delivery_date || null,
      delivery_event: form.delivery_event || null,
      content_text: form.content_text,
      content_url: contentUrl,
      status: 'scheduled',
    }]);
    if (!error) {
      await supabase.from('profiles').upsert([{ user_id: userId, vault_complete: true, updated_at: new Date().toISOString() }], { onConflict: 'user_id' });
      setLoaded(false);
      setForm({ title: '', to_name: '', to_email: '', to_phone: '', delivery_channel: 'email', content_type: 'letter', delivery_trigger: 'on_death', delivery_date: '', delivery_event: '', content_text: '' });
      setFile(null);
      loadItems();
      if (onSaved) onSaved('Memory saved.');
    } else {
      setError(error.message || 'Could not save this memory.');
    }
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.bgCard, borderRadius: "20px 20px 0 0", padding: "24px 20px 48px", width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ width: 32, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 18px" }} />
        <div style={{ fontFamily: "Georgia, serif", fontSize: 19, color: C.ink, marginBottom: 5 }}>Memories</div>
        <div style={{ fontSize: 12.5, color: C.mid, lineHeight: 1.6, marginBottom: 18 }}>Write or attach something for someone to receive later. Passage will keep it waiting until the plan activates or the date you choose.</div>
        <Field label="Title" placeholder="For Emma on a hard day" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} />
        <Field label="Recipient name" value={form.to_name} onChange={v => setForm(f => ({ ...f, to_name: v }))} />
        <Select label="Delivery method" value={form.delivery_channel} onChange={v => setForm(f => ({ ...f, delivery_channel: v }))} options={[["email","Email"],["sms","Text message"],["email_and_sms","Email + text"]]} />
        <div style={{ display: "flex", gap: 10 }}>
          {(form.delivery_channel === 'email' || form.delivery_channel === 'email_and_sms') && <div style={{ flex: 1 }}><Field label="Recipient email" value={form.to_email} onChange={v => setForm(f => ({ ...f, to_email: v }))} /></div>}
          {(form.delivery_channel === 'sms' || form.delivery_channel === 'email_and_sms') && <div style={{ flex: 1 }}><Field label="Recipient phone" placeholder="+12297027753" value={form.to_phone} onChange={v => setForm(f => ({ ...f, to_phone: v }))} hint="Use E.164 format, including +1 for U.S. numbers." /></div>}
        </div>
        <Select label="Type" value={form.content_type} onChange={v => setForm(f => ({ ...f, content_type: v }))} options={[["letter","Letter"],["voice_note","Voice note transcript"],["photo_album","Photo note"]]} />
        <Select label="When should this unlock?" value={form.delivery_trigger} onChange={v => setForm(f => ({ ...f, delivery_trigger: v }))} options={[["on_death","When my plan activates"],["on_date","On a future date"],["on_event","On a milestone"]]} />
        {(form.delivery_trigger === 'on_date' || form.delivery_trigger === 'on_event') && (
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}><Field label="Delivery date" type="date" value={form.delivery_date} onChange={v => setForm(f => ({ ...f, delivery_date: v }))} /></div>
            {form.delivery_trigger === 'on_event' && <div style={{ flex: 1 }}><Field label="Milestone" placeholder="Birthday, graduation, anniversary" value={form.delivery_event} onChange={v => setForm(f => ({ ...f, delivery_event: v }))} /></div>}
          </div>
        )}
        {(form.content_type === 'voice_note' || form.content_type === 'photo_album') && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.soft, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{form.content_type === 'voice_note' ? 'Attach audio' : 'Attach photo'}</div>
            <input type="file" accept={form.content_type === 'voice_note' ? "audio/*" : "image/*"} onChange={e => setFile(e.target.files?.[0] || null)} style={{ width: "100%", padding: 10, borderRadius: 11, border: "1.5px solid " + C.border, background: C.bgSubtle, boxSizing: "border-box" }} />
            {file && <div style={{ fontSize: 11.5, color: C.soft, marginTop: 5 }}>{file.name}</div>}
          </div>
        )}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.soft, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Message</div>
          <textarea value={form.content_text} onChange={e => setForm(f => ({ ...f, content_text: e.target.value }))} placeholder="Say the thing they may need to hear..." style={{ width: "100%", minHeight: 150, padding: 12, borderRadius: 11, border: "1.5px solid " + C.border, background: C.bgSubtle, color: C.ink, fontFamily: "Georgia, serif", fontSize: 13, lineHeight: 1.7, boxSizing: "border-box" }} />
        </div>
        <button onClick={saveMemory} disabled={saving || !form.title.trim() || (!form.content_text.trim() && !file)} style={{ width: "100%", padding: "12px", borderRadius: 12, border: "none", background: C.sage, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 8 }}>{saving ? "Saving..." : "Save memory"}</button>
        {error && <div style={{ fontSize: 12, color: C.rose, marginBottom: 12 }}>{error}</div>}
        <div style={{ fontSize: 11, fontWeight: 700, color: C.soft, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Saved</div>
        {!loaded ? <div style={{ fontSize: 13, color: C.soft }}>Loading...</div> : items.length === 0 ? <div style={{ fontSize: 13, color: C.soft, marginBottom: 16 }}>No memories saved yet.</div> : items.map(item => (
          <div key={item.id} style={{ background: C.bgSubtle, borderRadius: 11, padding: "11px 13px", marginBottom: 7 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{item.title}</div>
            <div style={{ fontSize: 11.5, color: C.soft, marginTop: 2 }}>{item.to_name || 'Recipient not set'} - {(item.delivery_channel || 'email').replace(/_/g, ' + ')} - {item.delivery_trigger?.replace(/_/g, ' ')}</div>
            {item.delivery_date && <div style={{ fontSize: 11.5, color: C.sage, marginTop: 3 }}>Scheduled for {item.delivery_date}{item.delivery_event ? ` (${item.delivery_event})` : ''}</div>}
            {item.content_url && <div style={{ fontSize: 11.5, color: C.sage, marginTop: 3 }}>Attachment saved</div>}
            <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.5, marginTop: 6 }}>{item.content_text}</div>
          </div>
        ))}
        <button onClick={onClose} style={{ width: "100%", padding: "10px", borderRadius: 11, border: "1.5px solid " + C.border, background: C.bgCard, fontSize: 13, color: C.mid, cursor: "pointer", fontFamily: "inherit", marginTop: 8 }}>Close</button>
      </div>
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
  const [showObituary, setShowObituary] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showMemories, setShowMemories] = useState(false);
  const [showDocumentsInfo, setShowDocumentsInfo] = useState(false);
  const [showMemoriesInfo, setShowMemoriesInfo] = useState(false);
  const [wishesData, setWishesData] = useState({});
  const [wishesToast, setWishesToast] = useState("");
  const [activeFileWorkflowId, setActiveFileWorkflowId] = useState(null);

  const [taskStats, setTaskStats] = useState({});

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const open = (params.get('open') || '').toLowerCase();
    const backEstate = params.get('backEstate');
    if (!open) return;
    if (backEstate) setActiveFileWorkflowId(backEstate);
    if (open === 'documents' || open === 'document') setShowDocuments(true);
    else if (open === 'memories' || open === 'scheduled' || open === 'messages') setShowMemories(true);
    else if (open === 'people' || open === 'participants') setShowPeople(true);
    else if (open === 'wishes') setShowWishes(true);
    else if (open === 'obituary') setShowObituary(true);
    params.delete('open');
    const next = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (next ? '?' + next : ''));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [{ user: u, profile: p }, wfs] = await Promise.all([
          loadUserProfile(user.id),
          loadUserWorkflows(user.id),
        ]);
        if (cancelled) return;
        setUserData(u || null);
        setProfile(p || null);
        if (p) {
          setWishesData({
            disposition: p.disposition === 'green' ? 'green_burial' : p.disposition === 'unsure' ? 'undecided' : p.disposition || '',
            service_type: p.service_type === 'funeral' ? 'religious' : p.service_type === 'celebration' ? 'celebration_of_life' : p.service_type === 'private' ? 'memorial' : p.service_type || '',
            religious_leader: p.healthcare_proxy_name || '',
            music_preferences: p.music_notes || '',
            special_requests: p.special_requests || '',
            organ_donation: !!p.organ_donor,
          });
        }
        setWorkflows(wfs || []);

        // Load task completion stats for all workflows
        const workflowIds = (wfs || []).map(w => w.id).filter(Boolean);
        if (workflowIds.length > 0) {
          const { data: stats } = await supabase.from('tasks')
            .select('id, workflow_id, title, status, assigned_to_name, assigned_to_email, due_days_after_trigger, created_at')
            .in('workflow_id', workflowIds);
          if (cancelled) return;
          if (stats) {
            const grouped = {};
            stats.forEach(t => {
              if (!grouped[t.workflow_id]) grouped[t.workflow_id] = { total: 0, required: 0, completed: 0, assigned: 0, openTasks: [] };
              if (t.status !== 'not_applicable') grouped[t.workflow_id].required++;
              grouped[t.workflow_id].total++;
              const handled = t.status === 'handled' || t.status === 'completed' || t.status === 'done';
              if (t.status !== 'not_applicable' && handled) grouped[t.workflow_id].completed++;
              if (t.status !== 'not_applicable' && t.assigned_to_name) grouped[t.workflow_id].assigned++;
              if (t.status !== 'not_applicable' && !handled) {
                grouped[t.workflow_id].openTasks.push({
                  id: t.id,
                  title: t.title,
                  assignedTo: t.assigned_to_name || '',
                  assignedEmail: t.assigned_to_email || '',
                  dueDays: t.due_days_after_trigger ?? 0,
                  createdAt: t.created_at,
                });
              }
            });
            setTaskStats(grouped);
          }
        } else {
          setTaskStats({});
        }
      } catch (err) {
        console.error('Dashboard load failed:', err);
        if (!cancelled) {
          setUserData(null);
          setProfile(null);
          setWorkflows([]);
          setTaskStats({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user]);

  const handleArchive = async (wfId) => {
    if (!confirm("Archive this estate plan? You can still view it later, but it will leave your active estate list.")) return;
    setArchiving(wfId);
    await archiveWorkflow(wfId);
    setWorkflows(prev => prev.filter(w => w.id !== wfId));
    setArchiving(null);
  };

  const plan = userData?.plan || 'free';
  const planMap = {
    free: { label: "Free Plan", color: C.soft, price: "$0", nextCharge: "None", renewal: "N/A" },
    monthly: { label: "Single Estate Monthly", color: C.sage, price: "$9.99/mo", nextCharge: "Next month", renewal: "Monthly" },
    annual: { label: "Single Estate Annual", color: C.sage, price: "$79.99/yr", nextCharge: "Next year", renewal: "Annual" },
    lifetime: { label: "Single Estate Lifetime", color: C.gold, price: "$299.99", nextCharge: "Never", renewal: "Never" },
    semiannual: { label: "Semi-annual Legacy", color: C.sage, price: "$49.99/6 mo", nextCharge: "In 6 months", renewal: "Every 6 months" },
    single_monthly: { label: "Single Estate Monthly", color: C.sage, price: "$9.99/mo", nextCharge: "Next month", renewal: "Monthly" },
    single_annual: { label: "Single Estate Annual", color: C.sage, price: "$79.99/yr", nextCharge: "Next year", renewal: "Annual" },
    single_lifetime: { label: "Single Estate Lifetime", color: C.gold, price: "$299.99", nextCharge: "Never", renewal: "Never" },
    couple_monthly: { label: "Couple Monthly", color: C.sage, price: "$14.99/mo", nextCharge: "Next month", renewal: "Monthly" },
    couple_annual: { label: "Couple Annual", color: C.sage, price: "$119.99/yr", nextCharge: "Next year", renewal: "Annual" },
    family_monthly: { label: "Family Steward Monthly", color: C.sage, price: "$24.99/mo", nextCharge: "Next month", renewal: "Monthly" },
    family_annual: { label: "Family Steward Annual", color: C.sage, price: "$199.99/yr", nextCharge: "Next year", renewal: "Annual" },
  };
  const pd = planMap[plan] || planMap.free;
  const redWorkflows = workflows.filter(w => w.status !== 'archived' && w.path !== 'green');
  const greenWorkflows = workflows.filter(w => w.status !== 'archived' && w.path === 'green');
  const activeWorkflows = workflows.filter(w => w.status !== 'archived');
  const attentionItems = activeWorkflows.flatMap(wf => {
    const openTasks = (taskStats[wf.id]?.openTasks || []).slice(0, 3);
    return openTasks.map(task => ({ ...task, workflow: wf }));
  }).sort((a, b) => (a.dueDays ?? 0) - (b.dueDays ?? 0)).slice(0, 5);
  const totalRequired = Object.values(taskStats).reduce((sum, s) => sum + (s.required || 0), 0);
  const totalHandled = Object.values(taskStats).reduce((sum, s) => sum + (s.completed || 0), 0);
  const portfolioReady = totalRequired > 0 ? Math.round((totalHandled / totalRequired) * 100) : 0;
  const estateSeatLimit = getEstateSeatLimit(userData);
  const usedGreenSeats = getUsedGreenSeatCount(workflows);
  const availableGreenSeats = Math.max(0, estateSeatLimit - usedGreenSeats);
  const isPaidPlan = plan !== 'free' && userData?.plan_status === 'active';
  const backEstateId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('backEstate') : '';

  const saveWishes = async () => {
    if (!user) return;
    const nextProfile = {
      user_id: user.id,
      disposition: normalizeDisposition(wishesData.disposition),
      service_type: normalizeServiceType(wishesData.service_type),
      healthcare_proxy_name: wishesData.religious_leader || '',
      music_notes: wishesData.music_preferences || '',
      special_requests: wishesData.special_requests || '',
      organ_donor: wishesData.organ_donation || false,
      wishes_complete: true,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('profiles').upsert([nextProfile], { onConflict: 'user_id' });
    if (error) {
      console.error('saveWishes:', error);
      setWishesToast("Could not save wishes yet.");
      setTimeout(() => setWishesToast(""), 3000);
      return;
    }
    setProfile(prev => ({ ...(prev || {}), ...nextProfile }));
    setShowWishes(false);
    setWishesToast("Wishes saved.");
    setTimeout(() => setWishesToast(""), 3000);
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <SiteHeader user={user} onSignOut={onSignOut} />
      {backEstateId && (
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 16px 6px", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => { window.location.href = '/estate?id=' + encodeURIComponent(backEstateId); }} style={{ background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 8, padding: "6px 11px", fontSize: 11.5, color: C.sage, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>Back to estate</button>
        </div>
      )}

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "14px 16px 52px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: C.soft }}>Loading your file...</div>
        ) : (
          <>
            <div style={{ marginBottom: 12 }}>
              <Heading size={22}>My estate command center{userData?.first_name ? ` - ${userData.first_name}` : ""}</Heading>
              {redWorkflows.length > 0 ? (
                <div style={{ background: C.sageFaint, border: "1px solid " + C.sageLight, borderRadius: 11, padding: "11px 14px", fontSize: 13, color: C.sage, fontWeight: 500 }}>
                  ✓ Estate plan active — assign tasks to notify people automatically
                </div>
              ) : (
                <Sub>Open an estate first. Everything lives inside that estate: tasks, people, documents, wishes, memories, and updates.</Sub>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.05fr) minmax(300px, .95fr)", gap: 12, alignItems: "stretch", marginBottom: 12 }}>
            <div style={{ background: C.bgCard, borderRadius: 18, padding: "14px", border: `1px solid ${C.border}`, marginBottom: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 9.5, letterSpacing: "0.15em", textTransform: "uppercase", color: C.soft, fontWeight: 700, marginBottom: 5 }}>Command center</div>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 19, color: C.ink, lineHeight: 1.25 }}>What needs attention now</div>
                </div>
                {totalRequired > 0 && (
                  <div style={{ minWidth: 88, textAlign: "right" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: portfolioReady === 100 ? C.sage : C.ink }}>{portfolioReady}%</div>
                    <div style={{ fontSize: 10.5, color: C.soft }}>ready</div>
                  </div>
                )}
              </div>

              {attentionItems.length === 0 ? (
                <div style={{ background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 12, padding: "13px 14px", color: C.sage, fontSize: 13, lineHeight: 1.55 }}>
                  You've handled what's needed right now. You're in a good place.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {attentionItems.map(item => (
                    <button key={`${item.workflow.id}-${item.id}`} onClick={() => onOpenPlan(item.workflow)}
                      style={{ width: "100%", textAlign: "left", background: item.workflow.path === 'green' ? C.sageFaint : C.roseFaint, border: `1px solid ${item.workflow.path === 'green' ? C.sageLight : C.rose + '25'}`, borderRadius: 12, padding: "12px 13px", cursor: "pointer", fontFamily: "inherit" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink, lineHeight: 1.35 }}>{item.title}</div>
                          <div style={{ fontSize: 11.5, color: C.mid, marginTop: 3 }}>
                            {item.workflow.name || "Estate"}{item.assignedTo ? ` - ${item.assignedTo} is handling this` : " - unassigned"}
                          </div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: item.assignedTo ? C.sage : C.rose, whiteSpace: "nowrap" }}>
                          {item.assignedTo ? "Open" : "Assign"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginTop: 12 }}>
                {[{l:"Active estates",v:activeWorkflows.length},{l:"Tasks handled",v:totalRequired ? `${totalHandled}/${totalRequired}` : "0"},{l:"Participants",v:Object.values(taskStats).reduce((sum, s) => sum + (s.assigned || 0), 0)}].map(i => (
                  <div key={i.l} style={{ background: C.bgSubtle, borderRadius: 10, padding: "10px 11px" }}>
                    <div style={{ fontSize: 9, color: C.soft, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 4 }}>{i.l}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>{i.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subscription */}
            <div style={{ background: C.bgCard, borderRadius: 18, padding: "15px", border: `1px solid ${C.border}`, marginBottom: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 9.5, letterSpacing: "0.15em", textTransform: "uppercase", color: C.soft, fontWeight: 600, marginBottom: 3 }}>Current Plan</div>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 19, color: pd.color }}>{pd.label}</div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: pd.color }}>{pd.price}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: plan === 'free' ? 10 : 0 }}>
                {[{l:"Status",v:isPaidPlan ? 'Active' : 'Free'},{l:"Estate Seats",v:`${usedGreenSeats}/${estateSeatLimit} used`},{l:"Renewal",v:pd.renewal}].map(i => (
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
                    <button onClick={() => window.location.href = '/urgent'} style={{ flex: 1, padding: "10px", background: C.roseFaint, border: `1px solid ${C.rose}30`, borderRadius: 11, fontSize: 12.5, fontWeight: 700, color: C.rose, cursor: "pointer", fontFamily: "inherit" }}>
                      🚨 Someone just passed
                    </button>
                  </div>
                  <div style={{ border: `1px solid ${C.sageLight}`, borderRadius: 13, padding: 11, background: C.sageFaint }}>
                    <div style={{ fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: C.sage, fontWeight: 800, marginBottom: 4 }}>Upgrade when ready</div>
                    <div style={{ fontSize: 12.5, color: C.mid, lineHeight: 1.4, marginBottom: 9 }}>Choose estate seats on pricing.</div>
                    <button onClick={() => window.location.href = '/pricing'} style={{ width: "100%", padding: "11px", background: C.sage, color: "#fff", border: "none", borderRadius: 11, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                      Upgrade now →
                    </button>
                  </div>
                </div>
              )}
              {isPaidPlan && (
                <div style={{ background: C.sageFaint, borderRadius: 10, padding: "10px 14px", fontSize: 12, color: C.sage, fontWeight: 600, lineHeight: 1.5 }}>
                  ✓ Active plan — {availableGreenSeats > 0 ? `${availableGreenSeats} estate slot${availableGreenSeats === 1 ? '' : 's'} available` : 'all estate slots are currently used'}
                </div>
              )}
              {isPaidPlan && (
                <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                  {ADDON_OPTIONS.map(option => (
                    <button key={option.id} onClick={() => handleCheckout(option.id, user && user.id, user && user.email)}
                      style={{ textAlign: "left", background: C.bgSubtle, border: `1px solid ${C.border}`, borderRadius: 11, padding: "10px 11px", cursor: "pointer", fontFamily: "inherit" }}>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: C.ink }}>{option.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: C.sage }}>{option.price}<span style={{ fontSize: 10.5, color: C.mid }}> {option.per}</span></div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            </div>

            {/* Red path active plans */}
            {redWorkflows.length > 0 && (
              <div style={{ background: C.bgCard, borderRadius: 18, padding: "18px", border: `1px solid ${C.border}`, marginBottom: 12 }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: C.ink, marginBottom: 4 }}>Active estate command centers</div>
                <div style={{ fontSize: 12, color: C.mid, marginBottom: 13 }}>Each estate has its own tasks, owners, documents, obituary, and activity history. Open the estate you want to manage.</div>
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
                              const required = s.required ?? s.total;
                              const pct = required > 0 ? Math.round((s.completed / required) * 100) : 0;
                              return (
                                <div style={{ marginTop: 7 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ fontSize: 10.5, color: C.mid }}>{s.completed} of {required} required tasks handled</span>
                                    <span style={{ fontSize: 10.5, fontWeight: 700, color: pct > 0 ? C.sage : C.soft }}>{pct}% ready</span>
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

            {/* Green path estate slots */}
            {estateSeatLimit > 0 && (
              <div style={{ background: C.bgCard, borderRadius: 16, padding: "14px", border: `1px solid ${C.border}`, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: "Georgia, serif", fontSize: 16, color: C.ink, marginBottom: 2 }}>Planning estate slots</div>
                    <div style={{ fontSize: 11.5, color: C.mid }}>{usedGreenSeats} of {estateSeatLimit} slots in use.</div>
                  </div>
                  {availableGreenSeats > 0 && <button onClick={onStartPlan} style={{ border: "none", borderRadius: 10, padding: "8px 12px", background: C.sage, color: "#fff", fontFamily: "inherit", fontWeight: 800, cursor: "pointer", fontSize: 12 }}>Set up</button>}
                </div>
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
                        <div style={{ borderTop: `1px solid ${C.sageLight}`, paddingTop: 10, marginTop: 10 }}>
                          <div style={{ fontSize: 10.5, color: C.soft, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 7 }}>Estate file</div>
                          {[
                            { label: "Wishes", complete: profile?.wishes_complete, desc: "Service preferences and final wishes" },
                            { label: "Obituary", complete: !!profile?.obituary_draft, desc: "Draft and save obituary language" },
                            { label: "People", complete: profile?.people_complete, desc: "Executor, activators, family, partners" },
                            { label: "Documents", complete: profile?.documents_complete, desc: "Will, insurance, directives, records" },
                            { label: "Memories", complete: profile?.vault_complete, desc: "Letters, voice notes, scheduled messages" },
                          ].map((s) => (
                            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: `1px solid ${C.sageLight}55` }}>
                              <div style={{ width: 20, height: 20, borderRadius: "50%", background: s.complete ? C.sage : C.bgCard, color: s.complete ? "#fff" : C.soft, border: `1px solid ${s.complete ? C.sage : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, flexShrink: 0 }}>{s.complete ? "✓" : ""}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12.5, fontWeight: 800, color: C.ink }}>{s.label}</div>
                                <div style={{ fontSize: 10.5, color: C.mid, marginTop: 1 }}>{s.desc}</div>
                              </div>
                              <button onClick={() => {
                                setActiveFileWorkflowId(wfId);
                                if (s.label === "Wishes") setShowWishes(true);
                                else if (s.label === "Obituary") setShowObituary(true);
                                else if (s.label === "People") setShowPeople(true);
                                else if (s.label === "Documents") setShowDocuments(true);
                                else if (s.label === "Memories") setShowMemories(true);
                              }} style={{ fontSize: 11, color: C.sage, fontWeight: 800, background: C.bgCard, border: `1px solid ${C.sageLight}`, borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit" }}>
                                {s.complete ? "Edit" : "Add"}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {Array.from({ length: Math.max(0, estateSeatLimit - greenWorkflows.length) }).map((_, i) => (
                  <button key={`slot-${i}`} onClick={isPaidPlan || greenWorkflows.length === 0 ? onStartPlan : undefined}
                    style={{ width: "100%", background: i === 0 && greenWorkflows.length === 0 ? C.sageFaint : C.bgSubtle, border: `1px dashed ${i === 0 && greenWorkflows.length === 0 ? C.sageLight : C.border}`, borderRadius: 12, padding: "13px 14px", cursor: isPaidPlan || greenWorkflows.length === 0 ? "pointer" : "default", fontFamily: "inherit", textAlign: "left", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>
                          {greenWorkflows.length === 0 && i === 0 ? "Starter planning estate" : `Available estate slot ${greenWorkflows.length + i + 1}`}
                        </div>
                        <div style={{ fontSize: 11.5, color: C.mid, marginTop: 3, lineHeight: 1.45 }}>
                          {greenWorkflows.length === 0 && i === 0
                            ? "Visible before payment. Build the plan, then unlock full orchestration at checkout."
                            : "Set up this estate separately when you are ready."}
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: C.sage, background: C.sageFaint, borderRadius: 7, padding: "3px 9px" }}>
                        {isPaidPlan || greenWorkflows.length === 0 ? "Set up" : "Locked"}
                      </span>
                    </div>
                  </button>
                ))}
                {plan === 'free' && greenWorkflows.length > 0 && (
                  <div style={{ background: C.goldFaint, border: `1px solid ${C.gold}30`, borderRadius: 10, padding: "10px 12px", fontSize: 12, color: C.amber, lineHeight: 1.5 }}>
                    Upgrade to unlock additional estate slots for a spouse, parent, or family plan.
                  </div>
                )}
              </div>
            )}

            {/* Start emergency */}
            <div style={{ display: "none", background: C.roseFaint, borderRadius: 18, padding: "18px", border: `1px solid ${C.rose}22`, marginBottom: 12 }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 15.5, color: C.ink, marginBottom: 5 }}>Someone in your family passed away?</div>
              <Sub>Start a $79.99 urgent estate plan. We plan to reserve 15% of each urgent purchase for grief support or memorial impact in their honor.</Sub>
              <button onClick={() => window.location.href = '/urgent'} style={{ marginTop: 12, padding: "10px 18px", background: C.rose, border: "none", borderRadius: 11, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
                Start emergency plan →
              </button>
            </div>

            {/* Account */}
            <div style={{ display: "none", background: C.bgCard, borderRadius: 18, padding: "18px", border: `1px solid ${C.border}`, marginBottom: 12 }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: C.ink, marginBottom: 12 }}>Account</div>
              {[{l:"Email",v:user?.email},{l:"Member since",v:userData?.created_at ? new Date(userData.created_at).toLocaleDateString('en-US',{month:'long',year:'numeric'}) : "—"},{l:"Plan",v:pd.label},{l:"Status",v:userData?.plan_status || "active"}].map(i => (
                <div key={i.l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 12, color: C.soft, fontWeight: 600 }}>{i.l}</span>
                  <span style={{ fontSize: 12.5, color: C.ink, fontWeight: 500 }}>{i.v}</span>
                </div>
              ))}
            </div>

            <button onClick={onSignOut} style={{ display: "none", width: "100%", padding: "12px", background: "none", border: `1px solid ${C.border}`, borderRadius: 11, fontSize: 13, color: C.mid, cursor: "pointer", fontFamily: "inherit" }}>
              Sign out of Passage
            </button>
          </>
        )}
      </div>
      {wishesToast ? (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: C.sage, color: "#fff", borderRadius: 12, padding: "11px 20px", fontSize: 13, fontWeight: 600, zIndex: 999 }}>{wishesToast}</div>
      ) : null}

      {showObituary ? (
        <ObituaryModal
          workflowId={redWorkflows.length > 0 ? redWorkflows[0].id : null}
          userId={user && user.id}
          deceasedName={redWorkflows.length > 0 ? redWorkflows[0].deceased_name : null}
          dateOfDeath={redWorkflows.length > 0 ? redWorkflows[0].date_of_death : null}
          onClose={() => setShowObituary(false)}
          onSaved={(draft) => {
            setProfile(prev => ({ ...(prev || {}), obituary_draft: draft }));
            setWishesToast("Obituary saved.");
            setTimeout(() => setWishesToast(""), 3000);
          }}
        />
      ) : null}

      {showDocuments ? (
        <DocumentsModal
          userId={user && user.id}
          workflowId={activeFileWorkflowId}
          onClose={() => setShowDocuments(false)}
          onSaved={(msg) => {
            setProfile(prev => ({ ...(prev || {}), documents_complete: true }));
            setWishesToast(msg);
            setTimeout(() => setWishesToast(""), 3000);
          }}
        />
      ) : null}

      {showMemories ? (
        <MemoriesModal
          userId={user && user.id}
          workflowId={activeFileWorkflowId}
          onClose={() => setShowMemories(false)}
          onSaved={(msg) => {
            setProfile(prev => ({ ...(prev || {}), vault_complete: true }));
            setWishesToast(msg);
            setTimeout(() => setWishesToast(""), 3000);
          }}
        />
      ) : null}

      {showDocumentsInfo ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setShowDocumentsInfo(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.bgCard, borderRadius: "20px 20px 0 0", padding: "28px 20px 48px", width: "100%", maxWidth: 560 }}>
            <div style={{ width: 32, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 20px" }} />
            <div style={{ fontFamily: "Georgia, serif", fontSize: 19, color: C.ink, marginBottom: 8 }}>Documents</div>
            <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.7, marginBottom: 20 }}>
              Securely store your will, insurance policies, advance directives, and other important documents so your family can find them when needed.
            </div>
            <div style={{ background: C.goldFaint, border: "1px solid " + C.gold + "30", borderRadius: 11, padding: "12px 14px", fontSize: 13, color: C.amber, marginBottom: 20, lineHeight: 1.55 }}>
              Documents are live. Upload the file when you have it, or save the location so your family is not searching later.
            </div>
            <button onClick={() => setShowDocumentsInfo(false)} style={{ width: "100%", padding: "12px", borderRadius: 11, border: "none", background: C.sage, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Got it</button>
          </div>
        </div>
      ) : null}

      {showMemoriesInfo ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setShowMemoriesInfo(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.bgCard, borderRadius: "20px 20px 0 0", padding: "28px 20px 48px", width: "100%", maxWidth: 560 }}>
            <div style={{ width: 32, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 20px" }} />
            <div style={{ fontFamily: "Georgia, serif", fontSize: 19, color: C.ink, marginBottom: 8 }}>Memories</div>
            <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.7, marginBottom: 20 }}>
              Record voice notes, write letters to loved ones, and preserve memories to be delivered at the right moment — at a birthday, graduation, or simply when someone needs to hear from you.
            </div>
            <div style={{ background: C.goldFaint, border: "1px solid " + C.gold + "30", borderRadius: 11, padding: "12px 14px", fontSize: 13, color: C.amber, marginBottom: 20, lineHeight: 1.55 }}>
              Timed delivery is live for saved letters, photos, and voice-note files. Passage sends them when the delivery rule is reached and automation is approved.
            </div>
            <button onClick={() => setShowMemoriesInfo(false)} style={{ width: "100%", padding: "12px", borderRadius: 11, border: "none", background: C.sage, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Got it</button>
          </div>
        </div>
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setShowPeople(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.bgCard, borderRadius: 18, padding: "24px 20px 32px", width: "100%", maxWidth: 560, maxHeight: "88vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,.24)" }}>
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
  const [entered, setEntered] = useState(false);
  useEffect(() => { setTimeout(() => setEntered(true), 80); }, []);

  const anim = { opacity: entered ? 1 : 0, transform: entered ? 'none' : 'translateY(16px)', transition: 'all 0.7s ease' };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: 'Georgia, serif' }}>

      {/* ── NAV ── */}
      <nav style={{ maxWidth: 1080, margin: '0 auto', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <CandleLogo size={32} nameSize={21} />
        <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
          <a href="/mission" style={{ fontSize: 12.5, color: C.mid, textDecoration: 'none' }}>Mission</a>
          <a href="/content" style={{ fontSize: 12.5, color: C.mid, textDecoration: 'none' }}>Resources</a>
          <a href="/pricing" style={{ fontSize: 12.5, color: C.mid, textDecoration: 'none' }}>Pricing</a>
          <a href="/contact" style={{ fontSize: 12.5, color: C.mid, textDecoration: 'none' }}>Contact</a>
          <a href="/participating" style={{ fontSize: 12.5, color: C.mid, textDecoration: 'none' }}>Participant</a>
          <a href="/funeral-home" style={{ fontSize: 12.5, color: C.mid, textDecoration: 'none' }}>Funeral homes</a>
          {user ? (
            <button onClick={onDashboard} style={{ background: C.sage, border: 'none', borderRadius: 9, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#fff', fontFamily: 'inherit' }}>
              My estate
            </button>
          ) : (
            <>
              <button onClick={onDashboard} style={{ background: C.bgCard, border: `1.5px solid ${C.border}`, borderRadius: 9, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: C.ink, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="15" height="15" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Sign in
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '52px 24px 20px', textAlign: 'center', opacity: entered ? 1 : 0, transform: entered ? 'none' : 'translateY(16px)', transition: 'all 0.7s ease' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 5vw, 52px)', lineHeight: 1.15, color: C.ink, marginBottom: 20, fontWeight: 400 }}>
          When someone dies, your family needs{' '}
          <em style={{ color: C.sage }}>a clear next step.</em>
        </h1>
        <p style={{ fontSize: 'clamp(15px, 2vw, 17px)', color: C.mid, lineHeight: 1.8, maxWidth: 520, margin: '0 auto 12px' }}>
          Passage helps families know what matters first, who owns each task, and what is already handled — without forcing anyone to figure it out while they're grieving.
        </p>
        {/* Split path CTAs */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
          <div style={{ textAlign: 'center' }}>
            <button onClick={() => window.location.href = '/urgent'}
              style={{ display: 'block', background: C.rose, color: '#fff', border: 'none', borderRadius: 14, padding: '16px 32px', fontSize: 15.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 6, minWidth: 220 }}>
              Someone just passed
            </button>
            <div style={{ fontSize: 12, color: C.soft }}>Start with what matters now</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <button onClick={onPlan}
              style={{ display: 'block', background: C.bgCard, color: C.mid, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: '16px 24px', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 6, minWidth: 180 }}>
              Plan ahead
            </button>
            <div style={{ fontSize: 12, color: C.soft }}>Prepare your family</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
          {['Free to start', 'No credit card required', 'Nothing sends without approval'].map(function(t, i) {
            return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.soft }}><span style={{ color: C.sage, fontWeight: 700 }}>✓</span>{t}</div>;
          })}
        </div>
      </div>

      {/* ── PRODUCT PREVIEW ── */}
      <div style={{ maxWidth: 480, margin: '44px auto 0', padding: '0 24px' }}>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.soft, textTransform: 'uppercase', letterSpacing: '0.12em' }}>First 24 hours</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.sage, background: C.sageFaint, borderRadius: 8, padding: '3px 10px' }}>Approval first</div>
          </div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: C.ink, lineHeight: 1.35, marginBottom: 8 }}>You're on track. Approval first right now.</div>
          {[
            { title: 'Start here: Funeral arrangements', owner: 'You', status: 'Next', urgent: true },
            { title: 'Notify immediate family', owner: 'Needs owner', status: 'Needs owner', urgent: false },
            { title: 'Secure home, pets, and vehicle', owner: 'Unassigned', status: 'Not started', urgent: false },
          ].map(function(item, i) {
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderTop: `1px solid ${C.border}` }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: item.urgent ? C.roseFaint : C.bgSubtle, border: `1.5px solid ${item.urgent ? C.rose : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: item.urgent ? C.rose : C.soft, flexShrink: 0 }}>{i+1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, color: C.ink, fontWeight: 600, lineHeight: 1.3 }}>{item.title}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: item.owner === 'Needs owner' ? '#b07d2e' : C.mid, background: item.owner === 'Needs owner' ? '#fdf8ee' : C.bgSubtle, borderRadius: 5, padding: '1px 7px', fontWeight: 600 }}>Owner: {item.owner}</span>
                    <span style={{ fontSize: 11, color: C.soft, background: C.bgSubtle, borderRadius: 5, padding: '1px 7px' }}>{item.status}</span>
                  </div>
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: 14, padding: '10px 14px', background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 10, fontSize: 12, color: C.sage, lineHeight: 1.55 }}>
            Nothing is sent or shared until your family reviews and approves.
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div style={{ maxWidth: 940, margin: '0 auto', padding: '64px 24px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 38 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 30, color: C.ink, lineHeight: 1.25, marginBottom: 10 }}>How Passage works</div>
          <div style={{ fontSize: 14, color: C.mid, lineHeight: 1.65 }}>Passage prepares and coordinates. Your family reviews and approves.</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 18 }}>
          {[
            { n: '01', icon: '📍', title: 'What matters right now', body: 'Passage generates the first 24-hour plan immediately. No setup required for urgent situations.' },
            { n: '02', icon: '👤', title: 'Who owns each task', body: 'Every outcome has an owner. You assign or Passage suggests. Nothing is ambiguous.' },
            { n: '03', icon: '✓', title: 'What is already handled', body: 'As tasks are handled, the plan updates. Your family always knows what is handled and what still needs attention.' },
          ].map(function(s, i) {
            return (
              <div key={i} style={{ background: C.bgCard, borderRadius: 18, padding: 24, border: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 13 }}>
                  <span style={{ fontSize: 24 }}>{s.icon}</span>
                  <span style={{ fontSize: 9.5, color: C.sage, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{s.n}</span>
                </div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 17, color: C.ink, marginBottom: 9, lineHeight: 1.3 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.7 }}>{s.body}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── COORDINATION (with guardrails) ── */}
      <div style={{ background: '#e8eeea', padding: '50px 24px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: C.ink, lineHeight: 1.25, marginBottom: 10 }}>
            When your family needs it, Passage helps them take the next step
          </div>
          <div style={{ fontSize: 13.5, color: C.mid, lineHeight: 1.65, marginBottom: 28 }}>
            Coordinate people, tasks, and messages — all in one place.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, maxWidth: 380, margin: '0 auto 20px' }}>
            {[['👨‍👩‍👧‍👦','Family'],['⚖️','Attorney'],['🏛️','Funeral home'],['📄','Documents'],['📱','Announcements'],['🗓️','Service'],['📰','Obituary'],['🏠','Property']].map(function(item, i) {
              return (
                <div key={i} style={{ background: C.bgCard, borderRadius: 11, padding: '12px 6px', textAlign: 'center', border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 19, marginBottom: 4 }}>{item[0]}</div>
                  <div style={{ fontSize: 10, color: C.mid, fontWeight: 600 }}>{item[1]}</div>
                </div>
              );
            })}
          </div>
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: '13px 16px', fontSize: 13, color: C.mid, lineHeight: 1.6 }}>
            Your family stays in control. Passage prepares, tracks, and coordinates. Nothing sends without approval.
          </div>
        </div>
      </div>

      {/* ── TESTIMONIALS ── */}
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '58px 24px 28px' }}>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 18, padding: '28px 30px', boxShadow: '0 10px 34px rgba(55,45,35,.05)' }}>
          <div style={{ fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.sage, fontWeight: 800, marginBottom: 12 }}>Our mission</div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: C.ink, lineHeight: 1.22, marginBottom: 14 }}>Passage was created because families deserve more than a folder, a checklist, and a dozen disconnected phone calls.</div>
          <div style={{ fontSize: 14, color: C.mid, lineHeight: 1.85 }}>
            The idea came from real moments: planning a grandmother's prepaid funeral, trying to understand Medicaid rules, sitting across from funeral homes, and watching friends and family lose loved ones without knowing where to start. Again and again, the burden fell on grieving people while the system around them stayed fragmented.
          </div>
          <div style={{ fontSize: 14, color: C.mid, lineHeight: 1.85, marginTop: 12 }}>
            Passage exists to take ownership of that transition. We help families prepare before a death, respond when one happens, coordinate the people involved, and keep track of what has been sent, approved, handled, and still needs care. Our mission is simple: no family should have to become an operations manager in the middle of grief.
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '58px 24px 42px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 30, color: C.ink, lineHeight: 1.25, marginBottom: 10 }}>Start simple. Upgrade when your family needs more.</div>
          <div style={{ fontSize: 13.5, color: C.mid, lineHeight: 1.65 }}>Two paths: planning ahead or urgent help now. Detailed pricing can wait until the family is ready.</div>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {[
              { title: 'Planning ahead', body: 'Start free, then unlock the number of estates your family needs.', tone: C.sage },
              { title: 'Someone just passed', body: 'Urgent estate coordination is $79.99 one time per case.', tone: C.rose },
            ].map((p, i) => (
              <div key={i} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: p.tone, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{p.title}</div>
                <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.65 }}>{p.body}</div>
              </div>
            ))}
          </div>
          {PLAN_GROUPS.map(group => (
            <div key={group.key} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 15, color: C.ink, fontWeight: 800 }}>{group.label}</div>
                  <div style={{ fontSize: 12, color: C.mid }}>{group.description}</div>
                </div>
                <div style={{ fontSize: 11, color: C.sage, background: C.sageFaint, borderRadius: 999, padding: '4px 9px', height: 18 }}>{group.seats}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                {group.options.map(option => (
                  <div key={option.id} style={{ background: C.bgSubtle, border: `1px solid ${C.border}`, borderRadius: 11, padding: 10 }}>
                    <div style={{ fontSize: 11, color: C.soft, fontWeight: 800 }}>{option.label}</div>
                    <div style={{ fontSize: 16, color: option.price === 'Soon' ? C.soft : C.ink, fontWeight: 800 }}>{option.price}<span style={{ fontSize: 10, color: C.soft }}> {option.per}</span></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 12.5, color: C.mid, lineHeight: 1.6 }}>
          Additional estate add-ons are planned at $4.99/month or $39.99/year after a subscription is active.
        </div>
      </div>

      <div style={{ background: '#1e1e1a', padding: '50px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 10.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.soft, fontWeight: 600, textAlign: 'center', marginBottom: 32 }}>Why families need this before they need it</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 14 }}>
            {[
              { quote: 'I had no idea I needed to notify the DMV, the passport office, AND three credit bureaus. Nobody tells you this.', attr: '— Adult daughter, 54' },
              { quote: "Two months after losing my mom I realized I'd missed the Social Security survivor benefit window. That was thousands of dollars.", attr: '— Son, 31' },
              { quote: "We sat with the funeral director for two hours and left more confused than when we walked in. I wish we'd had this.", attr: '— Family navigating Medicaid pre-planning' },
            ].map(function(t, i) {
              return (
                <div key={i} style={{ background: '#252520', borderRadius: 14, padding: 22, border: '1px solid #333' }}>
                  <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 14, color: '#e8e4dc', lineHeight: 1.75, marginBottom: 12 }}>"{t.quote}"</div>
                  <div style={{ fontSize: 11, color: C.soft }}>{t.attr}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── FINAL CTA ── */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '52px 24px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: C.ink, marginBottom: 8 }}>Questions families ask first</div>
          <div style={{ fontSize: 13.5, color: C.mid, lineHeight: 1.65 }}>The short version: Passage prepares the plan, but your family stays in control.</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
          {[
            { q: 'Will Passage send messages automatically?', a: 'No. Messages, documents, and announcements are prepared first, then shown for review and approval before anything is sent.' },
            { q: 'How does pricing work for multiple people?', a: 'A single plan covers one planning estate. Couple plans cover two. Family Steward covers up to five. Urgent coordination is purchased per estate case.' },
            { q: 'Can I manage a parent and spouse separately?', a: 'Yes. Each estate should have its own command center with separate tasks, people, documents, obituary, memories, and activity history.' },
            { q: 'What happens when a plan activates?', a: 'Trusted people confirm, Passage opens the estate command center, drafts next steps, and tracks what is waiting, sent, approved, and handled.' },
            { q: 'Is this legal advice?', a: 'No. Passage organizes wishes, documents, people, and tasks. Legal decisions still belong with attorneys, funeral homes, and appropriate professionals.' },
            { q: 'What if someone just died?', a: 'Use the urgent path. It starts with the first practical priorities and keeps choices small so the family does not face a giant checklist.' },
          ].map((item, i) => (
            <div key={i} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, lineHeight: 1.35, marginBottom: 8 }}>{item.q}</div>
              <div style={{ fontSize: 12.5, color: C.mid, lineHeight: 1.65 }}>{item.a}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '56px 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: C.ink, lineHeight: 1.25, marginBottom: 10 }}>
          Your family shouldn't have to figure it out while they're grieving.
        </div>
        <div style={{ fontSize: 13.5, color: C.mid, lineHeight: 1.65, marginBottom: 32 }}>
          Start with what matters right now, or organize everything before it's needed.
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <button onClick={() => window.location.href = '/urgent'}
              style={{ display: 'block', background: C.rose, color: '#fff', border: 'none', borderRadius: 14, padding: '16px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 6 }}>
              Someone just passed
            </button>
            <div style={{ fontSize: 12, color: C.soft }}>Get a first 24-hour plan</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <button onClick={onPlan}
              style={{ display: 'block', background: C.sage, color: '#fff', border: 'none', borderRadius: 14, padding: '16px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 6 }}>
              Plan ahead — it's free
            </button>
            <div style={{ fontSize: 12, color: C.soft }}>No credit card required</div>
          </div>
        </div>
        <div style={{ fontSize: 11.5, color: C.soft, lineHeight: 1.6 }}>
          Nothing is sent or shared without your family's approval.
        </div>
      </div>

      <footer style={{ maxWidth: 980, margin: '0 auto', padding: '18px 24px 34px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', fontSize: 12, color: C.soft }}>
        <div>Passage coordinates life-to-death transitions with care.</div>
        <a href="/contact" style={{ color: C.soft, textDecoration: 'none' }}>thepassageappio@gmail.com</a>
      </footer>

    </div>
  );
}

function CompactLanding({ onPlan, onEmergency, user, onDashboard, onSignOut }) {
  const [entered, setEntered] = useState(false);
  useEffect(() => { setTimeout(() => setEntered(true), 80); }, []);

  const navLink = { fontSize: 12.5, color: C.mid, textDecoration: 'none' };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: 'Georgia, serif' }}>
      <nav style={{ maxWidth: 1080, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
        <CandleLogo size={32} nameSize={21} />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <a href="/mission" style={navLink}>Mission</a>
          <a href="/content" style={navLink}>Resources</a>
          <a href="/pricing" style={navLink}>Pricing</a>
          <a href="/contact" style={navLink}>Contact</a>
          <a href="/participating" style={navLink}>Participant</a>
          <a href="/funeral-home" style={navLink}>Funeral homes</a>
          {user ? (
            <button onClick={onDashboard} style={{ background: C.sage, border: 'none', borderRadius: 9, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#fff', fontFamily: 'inherit' }}>My estate</button>
          ) : (
            <button onClick={handleSignInWithGoogle} style={{ background: C.bgCard, border: `1.5px solid ${C.border}`, borderRadius: 9, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: C.ink, fontFamily: 'inherit' }}>Sign in</button>
          )}
        </div>
      </nav>

      <section style={{ maxWidth: 1040, margin: '0 auto', padding: '26px 24px 24px', display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(300px, .78fr)', gap: 24, alignItems: 'center', opacity: entered ? 1 : 0, transform: entered ? 'none' : 'translateY(14px)', transition: 'all .7s ease' }}>
        <div>
          <div style={{ fontSize: 10.5, color: C.sage, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 10 }}>The operating system for transition</div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(34px, 4.6vw, 54px)', lineHeight: 1.03, color: C.ink, margin: '0 0 12px', fontWeight: 400 }}>
            When someone dies, your family needs one clear next step.
          </h1>
          <p style={{ fontSize: 15.5, color: C.mid, lineHeight: 1.55, maxWidth: 620, margin: '0 0 16px' }}>
            Passage helps families see what matters first, who owns it, and what is already handled, without forcing anyone to manage everything while grieving.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <button onClick={() => window.location.href = '/urgent'} style={{ background: C.rose, color: '#fff', border: 'none', borderRadius: 13, padding: '13px 22px', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', minWidth: 196 }}>
              Someone just passed
              <span style={{ display: 'block', fontSize: 11.5, opacity: .86, fontWeight: 500, marginTop: 4 }}>Start with what matters now</span>
            </button>
            <button onClick={onPlan} style={{ background: C.bgCard, color: C.ink, border: `1.5px solid ${C.border}`, borderRadius: 13, padding: '13px 22px', fontSize: 14.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', minWidth: 166 }}>
              Plan ahead
              <span style={{ display: 'block', fontSize: 11.5, color: C.soft, fontWeight: 500, marginTop: 4 }}>Prepare your family</span>
            </button>
          </div>
          <div style={{ color: C.soft, fontSize: 12.5, lineHeight: 1.6 }}>
            Free to start. No credit card required.
          </div>
        </div>

        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, boxShadow: '0 20px 54px rgba(55,45,35,.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.soft, textTransform: 'uppercase', letterSpacing: '.14em' }}>First 24 hours</div>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: C.sage, background: C.sageFaint, borderRadius: 8, padding: '4px 10px' }}>Approval first</div>
          </div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 19, color: C.ink, lineHeight: 1.2, marginBottom: 10 }}>You're on track. Start here.</div>
          <div style={{ border: `1px solid ${C.rose}30`, background: C.roseFaint, borderRadius: 13, padding: 13, marginBottom: 10 }}>
            <div style={{ fontSize: 11.5, color: C.rose, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.11em', marginBottom: 7 }}>Start here</div>
            <div style={{ fontSize: 17, color: C.ink, fontWeight: 800, marginBottom: 6 }}>Funeral arrangements</div>
            <div style={{ fontSize: 13.5, color: C.mid, lineHeight: 1.55 }}>Choose who will call. Passage prepares the script, text, email, and next step.</div>
          </div>
          {['Notify immediate family', 'Secure home, pets, and vehicle'].map(title => (
            <div key={title} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderTop: `1px solid ${C.border}`, color: C.mid, fontSize: 13.5 }}>
              <span style={{ minWidth: 0 }}>{title}</span>
              <span style={{ color: C.soft, flexShrink: 0 }}>Waiting</span>
            </div>
          ))}
          <div style={{ marginTop: 10, padding: '11px 13px', background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 11, fontSize: 12.5, color: C.sage, lineHeight: 1.45 }}>
            Passage prepares the work. Your family reviews and approves before anything is sent.
          </div>
        </div>
      </section>

      <footer style={{ maxWidth: 980, margin: '0 auto', padding: '20px 24px 34px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', fontSize: 12, color: C.soft }}>
        <div>Passage coordinates life-to-death transitions with care.</div>
        <a href="/contact" style={{ color: C.soft, textDecoration: 'none' }}>thepassageappio@gmail.com</a>
      </footer>
    </div>
  );
}

function Success({ mode, onDashboard }) {
  const isPreview = mode === 'preview';
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: 'Georgia, serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 560, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 20, padding: '28px 24px', textAlign: 'center', boxShadow: '0 18px 50px rgba(55,45,35,.08)' }}>
        <div style={{ fontSize: 34, marginBottom: 12 }}>✓</div>
        <div style={{ fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', color: C.sage, fontWeight: 800, marginBottom: 10 }}>{isPreview ? 'Plan preview built' : 'Plan saved'}</div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: C.ink, lineHeight: 1.2, marginBottom: 10 }}>
          {isPreview ? 'Your first steps are ready.' : 'Your planning file has a place to keep growing.'}
        </div>
        <div style={{ fontSize: 14, color: C.mid, lineHeight: 1.7, marginBottom: 20 }}>
          {isPreview
            ? 'Open the estate command center to handle tasks, assign owners, and see what comes next.'
            : 'Continue in My file to add people, documents, wishes, participants, and active estates in one place.'}
        </div>
        {onDashboard ? (
          <button onClick={onDashboard} style={{ width: '100%', border: 'none', borderRadius: 13, padding: '13px 18px', background: C.sage, color: '#fff', fontFamily: 'Georgia, serif', fontWeight: 800, cursor: 'pointer' }}>
            Continue to My file
          </button>
        ) : (
          <GoogleSignInBtn label="Sign in to keep building" />
        )}
      </div>
    </div>
  );
}

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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const start = params.get('start');
    if (start === 'plan' || start === 'green') setView('plan');
    if (start === 'urgent' || start === 'red') setView('emergency');
  }, []);

  useEffect(() => {
    if (!user?.id || typeof window === 'undefined') return;
    const raw = window.localStorage.getItem('passage_pending_checkout');
    if (!raw) return;
    let pending = null;
    try { pending = JSON.parse(raw); } catch { pending = null; }
    window.localStorage.removeItem('passage_pending_checkout');
    if (pending?.planId) {
      handleCheckout(pending.planId, user.id, user.email || pending.userEmail || '', pending.workflowId || null);
    }
  }, [user]);

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
      {view === "landing" && <CompactLanding {...commonProps} onPlan={() => setView("plan")} onEmergency={() => setView("emergency")} />}
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
          userEmail={user?.email}
          onBack={() => setView("dashboard")}
          onDashboard={() => setView("dashboard")}
          onSignOut={handleSignOut}
        />
      )}
    </>
  );
}
