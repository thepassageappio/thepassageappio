import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseBrowser';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';
import { VENDOR_CATEGORIES } from '../../lib/vendors';
import { FUNERAL_HOME_PLAN_OPTIONS, partnerPlanFor } from '../../lib/partnerPlans';
import { personaOrchestrationContracts } from '../../lib/personaOrchestrationContracts';
import { mobileCompanionApiSurface, mobileCompanionPersonas, mobileCompanionSuccessCriteria } from '../../lib/mobileCompanionContract';

const C = {
  bg: '#f6f3ee',
  card: '#fff',
  ink: '#1a1916',
  mid: '#6a6560',
  soft: '#a09890',
  border: '#e4ddd4',
  sage: '#6b8f71',
  sageFaint: '#f0f5f1',
  amber: '#b07d2e',
  amberFaint: '#fdf8ee',
  rose: '#c47a7a',
  roseFaint: '#fdf3f3',
};

const SYSTEM_ADMIN_EMAILS = ['steventurrisi@gmail.com'];

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isSystemAdmin(user) {
  return SYSTEM_ADMIN_EMAILS.includes(normalizeEmail(user?.email));
}

function sandboxHref(href, persona = 'admin-sandbox') {
  const [path, query = ''] = String(href || '/').split('?');
  const params = new URLSearchParams(query);
  params.set('sandbox', '1');
  if (!params.has('demo') && !path.startsWith('/system') && !path.includes('/login') && !path.includes('/onboard')) params.set('demo', '1');
  if (persona && !params.has('persona')) params.set('persona', persona);
  if (!params.has('source')) params.set('source', 'system-admin-sandbox');
  return `${path}?${params.toString()}`;
}

function money(amount) {
  const value = Number(amount || 0);
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: value % 1 ? 2 : 0 });
}

const adminModules = [
  {
    title: 'Demo studio',
    body: 'Admin-only guided walkthrough using sample data for funeral-home demos and persona QA.',
    href: '/system/demo',
    status: 'Live',
  },
  {
    title: 'Vendor applications',
    body: 'Applications submitted from the vendor onboarding form. This is not the general Contact Us inbox.',
    href: '/vendors/admin',
    status: 'Live',
  },
  {
    title: 'Vendor request QA',
    body: 'System-admin demo portal for task-native vendor request status transitions.',
    href: '/vendors/request',
    status: 'Live demo',
  },
  {
    title: 'Support and lead inbox',
    body: 'Contact, guide, vendor, funeral-home, care-provider, bug, billing, and feature inquiries are grouped into a triage inbox inside Metrics with priority, next action, recent sender, and raw CSV export.',
    href: '/contact',
    status: 'Inbox live',
  },
  {
    title: 'Notification dry-run QA',
    body: 'Email and SMS endpoints can be exercised with dryRun so QA can inspect routing without sending or mutating records.',
    href: '/system/demo',
    status: 'Live scaffold',
  },
  {
    title: 'Funeral-home conversion plan',
    body: 'Owner-only asks for proof-ready pilots: ask now, prove value, clear blocker, activate, or retain, with target plan and ARR impact.',
    href: '/system/admin/conversion-plan',
    status: 'Live source',
  },
  {
    title: 'Business health dashboard',
    body: 'ARR, MRR, churn, pilots, engagement, marketplace value, customer health, and raw exports inside the Metrics tab.',
    href: '/system/admin#business-health',
    status: 'Metrics tab',
  },
  {
    title: 'Legal and FAQ trust layer',
    body: 'FAQ, Terms, Privacy, data ownership, urgent-help disclaimer, and support routing.',
    href: '/faq',
    status: 'Live scaffold',
  },
];

const reportingMetrics = [
  'ARR / MRR / NRR / churn',
  'Pilot customers not converted',
  'Leads by inquiry type',
  'Tasks by customer and estate',
  'Participants per estate',
  'Invitation acceptance time',
  'Funeral-home response times',
  'Vendor response times',
  'Marketplace value and rev share',
  'Raw CSV behind every report',
];

const personaProfiles = [
  {
    id: 'red-family',
    label: 'Red-path family',
    role: 'Family coordinator in crisis',
    href: '/urgent?demo=1&persona=red-family',
    proof: 'First-hour guidance, no dashboard setup, save command center.',
  },
  {
    id: 'green-family',
    label: 'Green-path planner',
    role: 'Planning user',
    href: '/?persona=green-family',
    proof: 'Homepage to planning flow, family record, estate switcher.',
  },
  {
    id: 'warm-family',
    label: 'Warm / hospice family',
    role: 'Care-prep coordinator',
    href: '/hospice?persona=warm-family',
    proof: 'Family record before crisis, contacts, dates, handoff promise.',
  },
  {
    id: 'participant',
    label: 'Participant',
    role: 'Invited helper',
    href: '/participating?demo=1&persona=participant&demoTour=funeral-home&demoStep=participant',
    proof: 'Scoped work only, action modal, no full estate workspace.',
  },
  {
    id: 'fh-director',
    label: 'Funeral-home director',
    role: 'Owner / director',
    href: '/funeral-home/dashboard?demo=1&persona=fh-director&demoTour=funeral-home&demoStep=dashboard',
    proof: 'Cases, staff, reports, setup, assignment, export.',
  },
  {
    id: 'fh-employee',
    label: 'Funeral-home employee',
    role: 'Staff queue',
    href: '/funeral-home/dashboard?demo=1&persona=fh-employee&demoTour=funeral-home&demoStep=task&role=staff',
    proof: 'Assigned work, owner dropdown, proof loop, lower admin clutter.',
  },
  {
    id: 'vendor',
    label: 'Vendor',
    role: 'Scoped provider',
    href: '/vendors/request?demo=1&persona=vendor&demoTour=funeral-home&demoStep=vendor',
    proof: 'Request status, response loop, no family browsing.',
  },
  {
    id: 'vendor-admin',
    label: 'Vendor admin',
    role: 'Passage approval queue',
    href: '/vendors/admin?persona=vendor-admin',
    proof: 'System-admin-only vendor approval and trust controls.',
  },
];

const qaFrontDoors = [
  ['Family record', '/estate', 'Gated family workspace and estate switcher'],
  ['Participant', '/participating', 'Invite-only scoped task spine'],
  ['Funeral-home director', '/funeral-home/login', 'Director setup, cases, staff, reporting'],
  ['Funeral-home staff', '/funeral-home/staff', 'Assigned work first'],
  ['Vendor', '/vendors/login', 'Approved vendor sign-in and request queue'],
  ['Vendor application', '/vendors/onboard', 'New support partner review path'],
  ['Demo cockpit', '/system/demo', 'Owner-only linear demo story'],
];

const guidedDemoStory = [
  {
    id: 'urgent',
    label: '1. Urgent family setup',
    persona: 'Red-path family',
    href: '/urgent?demo=1&persona=red-family&demoStory=1',
    show: 'Start with the first-hour stabilization layer: situation, pronouncement, decision authority, funeral-home readiness, reassurance, and command-center save.',
    proof: 'Urgent context should carry into the estate spine as situation, pronouncement, owner, waiting point, and next expected update.',
    pass: 'A grieving user can see what to do now without understanding Passage vocabulary first.',
  },
  {
    id: 'participant',
    label: '2. Participant action',
    persona: 'Invited helper',
    href: '/participating?demo=1&persona=participant&demoTour=funeral-home&demoStep=participant&demoStory=1',
    show: 'Open the scoped participant workspace and point to the single task, context for the request, action buttons, note/proof visibility, and handled state.',
    proof: 'Participant sees only scoped urgent context and task proof, not the full estate.',
    pass: 'A helper understands what they were asked to do, why it matters, and what the coordinator sees.',
  },
  {
    id: 'director',
    label: '3. Funeral-home My Day',
    persona: 'Funeral-home director',
    href: '/funeral-home/dashboard?demo=1&persona=fh-director&demoTour=funeral-home&demoStep=dashboard&demoStory=1',
    show: 'Show My Day, warm inbounds, unassigned cases/tasks, staff, locations, and reporting from one command center.',
    proof: 'Family handoff context appears before case work, and staff/action proof stays on the case spine.',
    pass: 'Director sees operational relief: fewer repeated calls, clearer owners, and exportable proof.',
  },
  {
    id: 'staff',
    label: '4. Staff proof loop',
    persona: 'Funeral-home employee',
    href: '/funeral-home/dashboard?demo=1&persona=fh-employee&demoTour=funeral-home&demoStep=task&role=staff&demoStory=1',
    show: 'Open assigned work, then demonstrate mark waiting, request family info, record proof, and close with proof.',
    proof: 'Employee sees assigned work first, not director clutter, with case context and proof destination.',
    pass: 'Staff can act without learning the whole admin workspace.',
  },
  {
    id: 'vendor',
    label: '5. Vendor scoped request',
    persona: 'Vendor',
    href: '/vendors/request?demo=1&persona=vendor&demoTour=funeral-home&demoStep=vendor&demoStory=1',
    show: 'Show request note, timing, location, contact boundary, quote/payment state, response modal, and proof trail.',
    proof: 'Vendor can quote or update status without browsing family records.',
    pass: 'Vendor understands the job, price/payment state, and obligation boundary.',
  },
  {
    id: 'family-update',
    label: '6. Family update proof',
    persona: 'Coordinator / funeral-home',
    href: '/share?demo=1&dn=Eleanor%20Price&cn=Michael%20Price&demoStory=1',
    show: 'Open the reviewed announcement workspace and show recipient review, platform drafts, one-pager, CSV/export, and review-before-send boundary.',
    proof: 'Reviewed family-update emails include focus task, owner, waiting point, proof, and next expected update.',
    pass: 'A coordinator can tell many people once without losing approval, audit, or proof trail.',
  },
  {
    id: 'scorecard',
    label: '7. Readiness scorecard',
    persona: 'Passage admin',
    href: '/system/admin/saas-roadmap?demoStory=1',
    show: 'Return to the canonical SaaS roadmap and run the readiness sequence before any live demo or pilot push.',
    proof: 'Public surface, spine smoke, payment/CRM, compliance, and persona contracts are all visible in one owner-only place.',
    pass: 'The demo ends with operational evidence, not vibes.',
  },
];

export default function SystemAdminPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [metricsError, setMetricsError] = useState('');
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsRangeDays, setMetricsRangeDays] = useState(30);
  const [complianceSnapshot, setComplianceSnapshot] = useState(null);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [complianceError, setComplianceError] = useState('');
  const [adminView, setAdminView] = useState('operations');
  const [activePersonaId, setActivePersonaId] = useState(personaProfiles[0].id);
  const [activeDemoStoryId, setActiveDemoStoryId] = useState(guidedDemoStory[0].id);
  const [activeModuleTitle, setActiveModuleTitle] = useState(adminModules[0].title);
  const [dryRunDraft, setDryRunDraft] = useState({ email: '', phone: '', channel: 'email' });
  const [dryRunResult, setDryRunResult] = useState(null);
  const [dryRunLoading, setDryRunLoading] = useState(false);
  const [spineSmokeLoading, setSpineSmokeLoading] = useState(false);
  const [spineSmokeResult, setSpineSmokeResult] = useState(null);
  const [partnerInviteDraft, setPartnerInviteDraft] = useState({ organizationName: '', directorName: '', directorEmail: '', supportEmail: '', supportPhone: '', planId: 'partner_local' });
  const [partnerInviteResult, setPartnerInviteResult] = useState(null);
  const [partnerInviteLoading, setPartnerInviteLoading] = useState(false);
  const [vendorSetupDraft, setVendorSetupDraft] = useState({ businessName: '', category: 'florist', email: '', phone: '', zipCodes: '', website: '', description: '' });
  const [vendorSetupResult, setVendorSetupResult] = useState(null);
  const [vendorSetupLoading, setVendorSetupLoading] = useState(false);
  const [resetPreview, setResetPreview] = useState(null);
  const [resetResult, setResetResult] = useState(null);
  const [resetPhrase, setResetPhrase] = useState('');
  const [resetSafetyChecked, setResetSafetyChecked] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [paymentReadiness, setPaymentReadiness] = useState(null);
  const [paymentReadinessLoading, setPaymentReadinessLoading] = useState(false);
  const [crmRoutingReadiness, setCrmRoutingReadiness] = useState(null);
  const [crmRoutingLoading, setCrmRoutingLoading] = useState(false);
  const [mobileReadiness, setMobileReadiness] = useState(null);
  const [mobileReadinessLoading, setMobileReadinessLoading] = useState(false);
  const [p0Readiness, setP0Readiness] = useState(null);
  const [p0ReadinessLoading, setP0ReadinessLoading] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const admin = useMemo(() => isSystemAdmin(user), [user]);
  const activeModule = useMemo(
    () => adminModules.find(module => module.title === activeModuleTitle) || adminModules[0],
    [activeModuleTitle]
  );
  const activePersona = useMemo(
    () => personaProfiles.find(profile => profile.id === activePersonaId) || personaProfiles[0],
    [activePersonaId]
  );
  const activePersonaHref = useMemo(
    () => sandboxHref(activePersona.href, activePersona.id),
    [activePersona]
  );
  const activeDemoStory = useMemo(
    () => guidedDemoStory.find(step => step.id === activeDemoStoryId) || guidedDemoStory[0],
    [activeDemoStoryId]
  );
  const activeDemoStoryHref = useMemo(
    () => sandboxHref(activeDemoStory.href, activeDemoStory.id),
    [activeDemoStory]
  );
  const dangerousMiddleScorecards = useMemo(() => buildDangerousMiddleScorecards(p0Readiness), [p0Readiness]);

  useEffect(() => {
    if (!admin || !supabase) return undefined;
    let cancelled = false;
    async function loadMetrics() {
      setMetricsLoading(true);
      setMetricsError('');
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token || '';
      const response = await fetch('/api/system/metrics?days=' + encodeURIComponent(metricsRangeDays), {
        headers: token ? { Authorization: 'Bearer ' + token } : {},
      }).catch(() => null);
      if (cancelled) return;
      setMetricsLoading(false);
      if (!response || !response.ok) {
        const data = response ? await response.json().catch(() => ({})) : {};
        setMetricsError(data.error || 'System metrics could not load.');
        return;
      }
      const data = await response.json().catch(() => ({}));
      setMetrics(data);
    }
    loadMetrics();
    return () => { cancelled = true; };
  }, [admin, metricsRangeDays]);

  useEffect(() => {
    if (!user) return;
    setDryRunDraft(prev => ({ ...prev, email: prev.email || user.email || '' }));
  }, [user]);

  async function signIn() {
    if (!supabase || typeof window === 'undefined') return;
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } });
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  }

  async function downloadMetricsCsv() {
    if (!supabase) return;
    const session = await supabase.auth.getSession();
    const token = session?.data?.session?.access_token || '';
    const response = await fetch('/api/system/metrics?format=csv&days=' + encodeURIComponent(metricsRangeDays), {
      headers: token ? { Authorization: 'Bearer ' + token } : {},
    });
    if (!response.ok) return;
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'passage-system-metrics.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function loadComplianceSnapshot() {
    if (!supabase) return;
    setComplianceLoading(true);
    setComplianceError('');
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token || '';
      const response = await fetch('/api/system/complianceReadiness', {
        headers: token ? { Authorization: 'Bearer ' + token } : {},
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        setComplianceError(json.error || 'Compliance readiness could not load.');
        setComplianceSnapshot(null);
        return;
      }
      setComplianceSnapshot(json);
    } catch (error) {
      setComplianceError(error.message || 'Compliance readiness could not load.');
      setComplianceSnapshot(null);
    } finally {
      setComplianceLoading(false);
    }
  }

  async function runNotificationDryRun(channel) {
    if (!supabase) return;
    setDryRunLoading(true);
    setDryRunResult(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token || '';
      const endpoint = channel === 'sms' ? '/api/sendSMS?dryRun=1' : '/api/sendEmail?dryRun=1';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
        },
        body: JSON.stringify({
          dryRun: true,
          to: channel === 'sms' ? dryRunDraft.phone : dryRunDraft.email,
          toName: 'Passage QA',
          toEmail: dryRunDraft.email,
          subject: 'Passage dry-run routing check',
          taskTitle: 'Confirm family handoff',
          deceasedName: 'Demo family',
          coordinatorName: user?.email || 'Passage admin',
          actionType: 'assignment',
          messageText: 'Passage dry run: no provider call, no message sent, no production record changed.',
        }),
      });
      const json = await response.json().catch(() => ({}));
      setDryRunResult({ ok: response.ok, channel, status: response.status, json });
    } catch (err) {
      setDryRunResult({ ok: false, channel, status: 0, json: { error: err.message || 'Dry run failed.' } });
    } finally {
      setDryRunLoading(false);
    }
  }

  async function runCoordinationSmokeTest() {
    if (!supabase) return;
    setSpineSmokeLoading(true);
    setSpineSmokeResult(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token || '';
      const response = await fetch('/api/system/orchestrationSmokeTest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
        },
        body: JSON.stringify({
          recipientEmail: user?.email || 'steventurrisi@gmail.com',
          keepRecords: false,
        }),
      });
      const json = await response.json().catch(() => ({}));
      setSpineSmokeResult({ ok: response.ok, status: response.status, json });
    } catch (error) {
      setSpineSmokeResult({ ok: false, status: 0, json: { error: error.message || 'Coordination smoke test failed.' } });
    } finally {
      setSpineSmokeLoading(false);
    }
  }

  async function runPaymentCrmReadiness() {
    if (!supabase) return;
    setPaymentReadinessLoading(true);
    setPaymentReadiness(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token || '';
      const response = await fetch('/api/system/paymentCrmReadiness', {
        headers: token ? { Authorization: 'Bearer ' + token } : {},
      });
      const json = await response.json().catch(() => ({}));
      setPaymentReadiness({ ok: response.ok, status: response.status, json });
    } catch (error) {
      setPaymentReadiness({ ok: false, status: 0, json: { error: error.message || 'Payment and CRM readiness check failed.' } });
    } finally {
      setPaymentReadinessLoading(false);
    }
  }

  async function runCrmRoutingReadiness() {
    if (!supabase) return;
    setCrmRoutingLoading(true);
    setCrmRoutingReadiness(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token || '';
      const response = await fetch('/api/system/crmRoutingReadiness', {
        headers: token ? { Authorization: 'Bearer ' + token } : {},
      });
      const json = await response.json().catch(() => ({}));
      setCrmRoutingReadiness({ ok: response.ok, status: response.status, json });
    } catch (error) {
      setCrmRoutingReadiness({ ok: false, status: 0, json: { error: error.message || 'CRM routing readiness check failed.' } });
    } finally {
      setCrmRoutingLoading(false);
    }
  }

  async function runMobileReadiness() {
    if (!supabase) return;
    setMobileReadinessLoading(true);
    setMobileReadiness(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token || '';
      const response = await fetch('/api/system/mobileCompanionReadiness', {
        headers: token ? { Authorization: 'Bearer ' + token } : {},
      });
      const json = await response.json().catch(() => ({}));
      setMobileReadiness({ ok: response.ok, status: response.status, json });
    } catch (error) {
      setMobileReadiness({ ok: false, status: 0, json: { error: error.message || 'Mobile companion readiness check failed.' } });
    } finally {
      setMobileReadinessLoading(false);
    }
  }

  async function runP0ReadinessLoop() {
    if (!supabase) return;
    setP0ReadinessLoading(true);
    setP0Readiness(null);
    const startedAt = new Date().toISOString();
    const steps = [];
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token || '';
      const authHeaders = token ? { Authorization: 'Bearer ' + token } : {};

      const publicResponse = await fetch('/api/system/publicSurfaceReadiness', { headers: authHeaders });
      const publicJson = await publicResponse.json().catch(() => ({}));
      const publicStep = { key: 'public', label: 'Public pages, CTAs, and copy safety', ok: publicResponse.ok && publicJson.status === 'ready', status: publicResponse.status, json: publicJson };
      steps.push(publicStep);

      const spineResponse = await fetch('/api/system/orchestrationSmokeTest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          recipientEmail: user?.email || 'steventurrisi@gmail.com',
          keepRecords: false,
        }),
      });
      const spineJson = await spineResponse.json().catch(() => ({}));
      const spineStep = { key: 'spine', label: 'Task orchestration and notifications', ok: spineResponse.ok && spineJson.success === true, status: spineResponse.status, json: spineJson };
      steps.push(spineStep);
      setSpineSmokeResult({ ok: spineResponse.ok, status: spineResponse.status, json: spineJson });

      const paymentResponse = await fetch('/api/system/paymentCrmReadiness', { headers: authHeaders });
      const paymentJson = await paymentResponse.json().catch(() => ({}));
      const paymentStep = { key: 'payment', label: 'Vendor payment and HubSpot readiness', ok: paymentResponse.ok && paymentJson.status === 'ready', status: paymentResponse.status, json: paymentJson };
      steps.push(paymentStep);
      setPaymentReadiness({ ok: paymentResponse.ok, status: paymentResponse.status, json: paymentJson });

      const crmRoutingResponse = await fetch('/api/system/crmRoutingReadiness', { headers: authHeaders });
      const crmRoutingJson = await crmRoutingResponse.json().catch(() => ({}));
      const crmRoutingStep = { key: 'crm-routing', label: 'HubSpot route map and sync proof', ok: crmRoutingResponse.ok && crmRoutingJson.status === 'ready', status: crmRoutingResponse.status, json: crmRoutingJson };
      steps.push(crmRoutingStep);
      setCrmRoutingReadiness({ ok: crmRoutingResponse.ok, status: crmRoutingResponse.status, json: crmRoutingJson });

      const complianceResponse = await fetch('/api/system/complianceReadiness', { headers: authHeaders });
      const complianceJson = await complianceResponse.json().catch(() => ({}));
      const complianceStep = { key: 'compliance', label: 'Compliance and RLS readiness', ok: complianceResponse.ok && !complianceJson.blockers?.length, status: complianceResponse.status, json: complianceJson };
      steps.push(complianceStep);
      if (complianceResponse.ok) {
        setComplianceSnapshot(complianceJson);
        setComplianceError('');
      } else {
        setComplianceError(complianceJson.error || 'Compliance readiness could not load.');
      }

      const blockers = steps.flatMap(step => {
        if (step.ok) return [];
        const explicit = step.json?.blockers || [];
        if (explicit.length) return explicit.map(item => `${step.label}: ${item}`);
        return [`${step.label}: ${step.json?.error || 'needs review'}`];
      });
      const warnings = steps.flatMap(step => (step.json?.warnings || []).map(item => `${step.label}: ${item}`));
      setP0Readiness({
        startedAt,
        completedAt: new Date().toISOString(),
        ok: blockers.length === 0,
        steps,
        blockers,
        warnings,
      });
    } catch (error) {
      setP0Readiness({
        startedAt,
        completedAt: new Date().toISOString(),
        ok: false,
        steps,
        blockers: [error.message || 'P0 readiness loop failed.'],
        warnings: [],
      });
    } finally {
      setP0ReadinessLoading(false);
    }
  }

  async function sendPartnerInvite(event) {
    event?.preventDefault?.();
    if (!supabase) return;
    setPartnerInviteLoading(true);
    setPartnerInviteResult(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token || '';
      const response = await fetch('/api/partnerInvite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
        },
        body: JSON.stringify(partnerInviteDraft),
      });
      const json = await response.json().catch(() => ({}));
      setPartnerInviteResult({ ok: response.ok, status: response.status, json });
      if (response.ok) {
        setPartnerInviteDraft({ organizationName: '', directorName: '', directorEmail: '', supportEmail: '', supportPhone: '', planId: 'partner_local' });
      }
    } catch (error) {
      setPartnerInviteResult({ ok: false, status: 0, json: { error: error.message || 'Partner invite failed.' } });
    } finally {
      setPartnerInviteLoading(false);
    }
  }

  async function submitVendorSetup(event) {
    event?.preventDefault?.();
    setVendorSetupLoading(true);
    setVendorSetupResult(null);
    try {
      const response = await fetch('/api/vendors/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...vendorSetupDraft,
          zipCodes: vendorSetupDraft.zipCodes,
          source: 'system_admin_setup',
        }),
      });
      const json = await response.json().catch(() => ({}));
      setVendorSetupResult({ ok: response.ok, status: response.status, json });
      if (response.ok) {
        setVendorSetupDraft({ businessName: '', category: 'florist', email: '', phone: '', zipCodes: '', website: '', description: '' });
      }
    } catch (error) {
      setVendorSetupResult({ ok: false, status: 0, json: { error: error.message || 'Vendor setup failed.' } });
    } finally {
      setVendorSetupLoading(false);
    }
  }

  async function loadResetPreview() {
    if (!supabase) return;
    setResetLoading(true);
    setResetResult(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token || '';
      const response = await fetch('/api/system/resetTestData', {
        headers: token ? { Authorization: 'Bearer ' + token } : {},
      });
      const json = await response.json().catch(() => ({}));
      if (response.ok) setResetPreview(json);
      else setResetResult({ ok: false, json });
    } catch (error) {
      setResetResult({ ok: false, json: { error: error.message || 'Reset preview failed.' } });
    } finally {
      setResetLoading(false);
    }
  }

  async function runProductionReset() {
    if (!supabase) return;
    if (resetPhrase !== 'RESET PASSAGE TEST DATA' || !resetSafetyChecked) {
      setResetResult({ ok: false, json: { error: 'Preview the scope, check the safety confirmation, and type the exact reset phrase before clearing production test data.' } });
      return;
    }
    setResetLoading(true);
    setResetResult(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token || '';
      const response = await fetch('/api/system/resetTestData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
        },
        body: JSON.stringify({ confirmPhrase: resetPhrase, includeAuthUsers: true, confirmedNoRealData: resetSafetyChecked }),
      });
      const json = await response.json().catch(() => ({}));
      setResetResult({ ok: response.ok, json });
      if (response.ok) {
        setResetPhrase('');
        setResetSafetyChecked(false);
        setResetPreview(json);
      }
    } catch (error) {
      setResetResult({ ok: false, json: { error: error.message || 'Production reset failed.' } });
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}>
      <style>{`
        @media (max-width: 760px) {
          .admin-spine-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <SiteHeader user={user} onSignIn={signIn} onSignOut={user ? signOut : null} />
      <section style={{ maxWidth: 1040, margin: '0 auto', padding: '22px 28px 36px' }}>
        <div style={eyebrow}>{admin ? 'Passage system admin' : 'Private Passage workspace'}</div>
        <h1 style={h1}>{admin ? 'Internal operating spine.' : 'Sign in to continue.'}</h1>
        <p style={lead}>{admin ? 'Owner-only controls for demos, vendor approval, dry-run QA, metrics export, and trust review. Separate from family, funeral-home, vendor, and estate admin views.' : 'This area is restricted to authorized Passage operators.'}</p>

        {loading && <Panel>Checking system-admin access...</Panel>}

        {!loading && !user && (
          <Panel>
            <h2 style={h2}>Use your approved Passage account.</h2>
            <p style={lead}>If you are looking for your estate, participant request, funeral-home workspace, or vendor portal, use the main sign-in page instead.</p>
            <button onClick={signIn} style={primaryButton}>Sign in with Google</button>
          </Panel>
        )}

        {!loading && user && !admin && (
          <Panel>
            <h2 style={h2}>This account is not a Passage system admin.</h2>
            <p style={lead}>Customer account admins use their own dashboard. Passage internal tools are intentionally separated.</p>
            <Link href="/funeral-home/dashboard" style={secondaryLink}>Open customer dashboard</Link>
          </Panel>
        )}

        {!loading && admin && (
          <>
            <Panel compact>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, .82fr) minmax(260px, .48fr)', gap: 14, alignItems: 'start' }} className="admin-spine-grid">
                <div>
                  <div style={eyebrow}>Today</div>
                  <h2 style={h2}>One internal queue, one source of proof.</h2>
                  <p style={lead}>Start with the operational question, then open the one tool needed. Nothing here should look like a customer dashboard.</p>
                </div>
                <div style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 15, padding: 13 }}>
                  <div style={eyebrow}>Owner access</div>
                  <div style={{ color: C.ink, fontSize: 17, lineHeight: 1.25, marginTop: 6 }}>Visible only to the Passage owner account.</div>
                  <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 6 }}>{user?.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                  {[
                    ['operations', 'Operations'],
                    ['personas', 'Personas'],
                    ['metrics', 'Metrics'],
                    ['trust', 'Trust'],
                  ].map(([key, label]) => (
                    <button key={key} onClick={() => setAdminView(key)} style={adminView === key ? selectedTab : tabButton}>{label}</button>
                  ))}
              </div>
            </Panel>

            {adminView === 'operations' && (
            <>
              <Panel compact>
                <div style={eyebrow}>P0 readiness loop</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, .45fr) minmax(0, 1fr)', gap: 14, alignItems: 'start' }} className="admin-spine-grid">
                  <div>
                    <h2 style={h2}>Run the demo and production spine proof.</h2>
                    <p style={lead}>This is the admin readiness check before demos: public CTAs and copy safety, task orchestration, notifications, participant action, funeral-home proof, vendor quote/payment dry run, HubSpot, Stripe, RLS, and compliance posture.</p>
                    <button type="button" onClick={runP0ReadinessLoop} disabled={p0ReadinessLoading} style={{ ...primaryButton, opacity: p0ReadinessLoading ? .6 : 1 }}>
                      {p0ReadinessLoading ? 'Running P0 loop...' : 'Run full P0 readiness loop'}
                    </button>
                  </div>
                  <div style={{ background: p0Readiness ? (p0Readiness.ok ? C.sageFaint : C.roseFaint) : C.bg, border: '1px solid ' + (p0Readiness ? (p0Readiness.ok ? '#c8deca' : '#efc7c7') : C.border), borderRadius: 16, padding: 15 }}>
                    <div style={{ color: p0Readiness?.ok ? C.sage : p0Readiness ? C.rose : C.mid, fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>
                      {p0Readiness ? (p0Readiness.ok ? 'P0 loop passed' : 'P0 loop needs review') : 'Ready to run'}
                    </div>
                    <p style={{ ...smallText, marginTop: 7 }}>
                      {p0Readiness ? `Completed ${p0Readiness.steps?.length || 0} checks at ${new Date(p0Readiness.completedAt).toLocaleString()}.` : 'Run this after every sprint that touches auth, notifications, task orchestration, vendor commerce, HubSpot, Stripe, compliance, or public demo readiness.'}
                    </p>
                    {p0Readiness?.steps?.length > 0 && (
                      <div style={{ display: 'grid', gap: 7, marginTop: 10 }}>
                        {p0Readiness.steps.map(step => (
                          <div key={step.key} style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 10, padding: '8px 9px', fontSize: 12.5, color: C.mid }}>
                            <strong style={{ color: step.ok ? C.sage : C.rose }}>{step.ok ? 'Pass' : 'Review'}:</strong> {step.label}
                            <span> {step.status ? `(status ${step.status})` : ''}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {p0Readiness?.blockers?.length > 0 && (
                      <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
                        {p0Readiness.blockers.map(item => <MetricRow key={item} label={item} value="P0" />)}
                      </div>
                    )}
                    {p0Readiness?.warnings?.length > 0 && (
                      <div style={{ ...smallText, color: C.amber, marginTop: 10 }}>{p0Readiness.warnings.join(' ')}</div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10, marginTop: 14 }}>
                  {dangerousMiddleScorecards.map((card) => (
                    <ReadinessScorecard key={card.id} card={card} />
                  ))}
                </div>
              </Panel>
              <Panel compact>
                <div style={eyebrow}>Persona orchestration contract</div>
                <h2 style={h2}>Every role gets one job, one proof path, and one next state.</h2>
                <p style={lead}>Use this as the demo and QA script. Each row names what the person can do, what gets written to the spine, which communication route proves it, and how the next owner sees progress.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10, marginTop: 14 }}>
                  {personaOrchestrationContracts.map((contract) => (
                    <div key={contract.id} style={{ ...subPanel, display: 'grid', gap: 7 }}>
                      <div>
                        <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>{contract.entry}</div>
                        <h3 style={{ ...h3, marginTop: 5 }}>{contract.persona}</h3>
                      </div>
                      <div style={{ color: C.ink, fontSize: 12.5, lineHeight: 1.42 }}><strong>Action:</strong> {contract.action}</div>
                      <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.42 }}><strong style={{ color: C.ink }}>Proof:</strong> {contract.proof}</div>
                      <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.42 }}><strong style={{ color: C.ink }}>Communication:</strong> {contract.notification}</div>
                      <div style={{ background: C.sageFaint, border: '1px solid #c8deca', color: C.sage, borderRadius: 10, padding: '8px 9px', fontSize: 12.5, lineHeight: 1.35, fontWeight: 800 }}>{contract.nextState}</div>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel compact>
                <div style={eyebrow}>Operations</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(210px, .42fr) minmax(0, 1fr)', gap: 14, marginTop: 10 }} className="admin-spine-grid">
                  <div style={{ display: 'grid', gap: 7 }}>
                    {adminModules.map((module) => (
                      <button key={module.title} onClick={() => setActiveModuleTitle(module.title)} style={activeModule.title === module.title ? selectedToolButton : toolButton}>
                        <span>{module.title}</span>
                        <span style={activeModule.title === module.title ? livePillOnGreen : module.status === 'Live' || module.status === 'Live demo' || module.status === 'Intake live' || module.status === 'Live scaffold' || module.status === 'Live source' || module.status === 'Inbox live' || module.status === 'Metrics tab' ? livePill : plannedPill}>{module.status}</span>
                      </button>
                    ))}
                  </div>
                  <div style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 16, padding: 17 }}>
                    <div style={eyebrow}>Selected tool</div>
                    <h2 style={{ ...h2, marginTop: 6 }}>{activeModule.title}</h2>
                    <p style={lead}>{activeModule.body}</p>
                    <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 14 }}>
                      <Link href={activeModule.href} style={primaryLink}>Open</Link>
                      <span style={livePill}>{activeModule.status}</span>
                    </div>
                  </div>
                </div>
              </Panel>
              <Panel compact>
                <div style={eyebrow}>Coordination smoke test</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, .45fr) minmax(0, 1fr)', gap: 14, alignItems: 'start' }} className="admin-spine-grid">
                  <div>
                    <h2 style={h2}>Prove task, communication, and notification spine.</h2>
                    <p style={lead}>Creates temporary QA family, funeral-home, participant, vendor, and planning-activation records. It closes funeral-home work with proof, saves a participant waiting update, requests and quotes a vendor, sends a reviewed family update, checks SMS dry-run, verifies same-person activation is blocked, simulates second confirmation, verifies notification/status/event rows, then clears the temporary records.</p>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <button type="button" onClick={runCoordinationSmokeTest} disabled={spineSmokeLoading} style={{ ...primaryButton, marginTop: 0, justifySelf: 'start', opacity: spineSmokeLoading ? .6 : 1 }}>
                      {spineSmokeLoading ? 'Running spine test...' : 'Run spine smoke test'}
                    </button>
                    <div style={{ ...smallText, marginTop: 0 }}>Default recipient is your signed-in admin email. In QA notification mode, intended recipients are preserved in the log while actual email routes to the override. The smoke test cleans up its cases, tasks, vendor request, activation records, and events unless a developer explicitly runs it with keepRecords.</div>
                    {spineSmokeResult && (
                      <div style={{ background: spineSmokeResult.ok ? C.sageFaint : C.roseFaint, border: '1px solid ' + (spineSmokeResult.ok ? '#c8deca' : '#efc7c7'), borderRadius: 13, padding: 12 }}>
                        <div style={{ color: spineSmokeResult.ok ? C.sage : C.rose, fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>{spineSmokeResult.ok ? 'Spine test complete' : 'Spine test needs review'}</div>
                        <div style={{ ...smallText, marginTop: 5 }}>
                          {spineSmokeResult.json?.success ? 'Temporary case exercised and cleaned up.' : spineSmokeResult.json?.error || 'One or more checks failed.'}
                        </div>
                        {Array.isArray(spineSmokeResult.json?.checks) && (
                          <div style={{ display: 'grid', gap: 7, marginTop: 10 }}>
                            {spineSmokeResult.json.checks.map(check => (
                              <div key={check.name} style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 10, padding: '8px 9px', fontSize: 12.5, color: C.mid }}>
                                <strong style={{ color: check.ok === false || check.status >= 400 ? C.rose : C.sage }}>{check.name}</strong>
                                <span> {check.status ? `status ${check.status}` : ''}</span>
                                {check.notificationCount != null && <span> · {check.notificationCount} notifications · {check.statusEventCount} status events · {check.estateEventCount} estate events</span>}
                              </div>
                            ))}
                          </div>
                        )}
                        {Array.isArray(spineSmokeResult.json?.personaContracts) && (
                          <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                            <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Persona proof</div>
                            {spineSmokeResult.json.personaContracts.map(contract => (
                              <div key={contract.id} style={{ background: contract.ok ? C.sageFaint : C.roseFaint, border: '1px solid ' + (contract.ok ? '#c8deca' : '#efc7c7'), borderRadius: 10, padding: '8px 9px', fontSize: 12.5, color: C.mid }}>
                                <strong style={{ color: contract.ok ? C.sage : C.rose }}>{contract.ok ? 'Pass' : 'Review'}:</strong> {contract.persona}
                                <span> - {contract.results?.filter(result => result.ok).length || 0}/{contract.results?.length || 0} proof checks</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Panel>
              <Panel compact>
                <div style={eyebrow}>Payment and CRM readiness</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, .45fr) minmax(0, 1fr)', gap: 14, alignItems: 'start' }} className="admin-spine-grid">
                  <div>
                    <h2 style={h2}>Prove Stripe, vendor commerce, and HubSpot are connected.</h2>
                    <p style={lead}>Checks the live Stripe account, webhook-secret posture, HubSpot service-key access, vendor payment tables, CRM sync table, and the default 12% Passage marketplace fee math.</p>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <button type="button" onClick={runPaymentCrmReadiness} disabled={paymentReadinessLoading} style={{ ...primaryButton, marginTop: 0, justifySelf: 'start', opacity: paymentReadinessLoading ? .6 : 1 }}>
                      {paymentReadinessLoading ? 'Checking payment spine...' : 'Run payment + CRM check'}
                    </button>
                    <div style={{ ...smallText, marginTop: 0 }}>Use this before vendor-payment demos and after changing Stripe, HubSpot, or Supabase payment schema. It does not charge cards or create customer-facing records.</div>
                    {paymentReadiness && (
                      <div style={{ background: paymentReadiness.json?.status === 'ready' ? C.sageFaint : C.roseFaint, border: '1px solid ' + (paymentReadiness.json?.status === 'ready' ? '#c8deca' : '#efc7c7'), borderRadius: 13, padding: 12 }}>
                        <div style={{ color: paymentReadiness.json?.status === 'ready' ? C.sage : C.rose, fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>
                          {paymentReadiness.json?.status === 'ready' ? 'Payment and CRM ready' : 'Needs review'}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginTop: 10 }}>
                          <MetricRow label="Stripe account" value={paymentReadiness.json?.stripe?.ok ? `${paymentReadiness.json.stripe.mode || 'live'} ready` : 'Needs review'} />
                          <MetricRow label="Stripe webhook secrets" value={paymentReadiness.json?.env?.stripeWebhookSecret ? `${paymentReadiness.json.env.stripeWebhookSecretCount || 1} configured` : 'Missing'} />
                          <MetricRow label="HubSpot service key" value={paymentReadiness.json?.hubspot?.ok ? 'Connected' : 'Needs review'} />
                          <MetricRow label="Vendor fee" value={`${paymentReadiness.json?.vendorCommerce?.defaultMarketplaceFeePercent || 12}%`} />
                          <MetricRow label="Vendor net on $100" value={money(paymentReadiness.json?.vendorCommerce?.sampleVendorNet || 88)} />
                          <MetricRow label="Dry-run invoice" value={paymentReadiness.json?.vendorCommerce?.noMoneyDryRun?.sample ? `${money(paymentReadiness.json.vendorCommerce.noMoneyDryRun.sample.grossAmount)} gross -> ${money(paymentReadiness.json.vendorCommerce.noMoneyDryRun.sample.vendorNetAmount)} vendor` : 'Ready'} />
                          <MetricRow label="Dry-run mode" value={paymentReadiness.json?.vendorCommerce?.noMoneyDryRun?.mode === 'no_money_moved' ? 'No money moved' : 'Review'} />
                          <MetricRow label="Schema checks" value={(paymentReadiness.json?.schema || []).every(row => row.ok) ? 'Pass' : 'Needs review'} />
                        </div>
                        {(paymentReadiness.json?.blockers || []).length > 0 && (
                          <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
                            {paymentReadiness.json.blockers.map(item => <MetricRow key={item} label={item} value="P0" />)}
                          </div>
                        )}
                        {(paymentReadiness.json?.warnings || []).length > 0 && (
                          <div style={{ ...smallText, marginTop: 10, color: C.amber }}>{paymentReadiness.json.warnings.join(' ')}</div>
                        )}
                      </div>
                    )}
                    <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 13, padding: 12 }}>
                      <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div>
                          <div style={eyebrow}>CRM route map</div>
                          <div style={{ ...smallText, marginTop: 4 }}>Confirms which HubSpot contact, company, deal, pipeline, and stage rule each Passage lead source uses.</div>
                        </div>
                        <button type="button" onClick={runCrmRoutingReadiness} disabled={crmRoutingLoading} style={{ ...secondaryButton, marginTop: 0, opacity: crmRoutingLoading ? .6 : 1 }}>
                          {crmRoutingLoading ? 'Checking routes...' : 'Run CRM route check'}
                        </button>
                      </div>
                      {crmRoutingReadiness && (
                        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                          <div style={{ background: crmRoutingReadiness.json?.status === 'ready' ? C.sageFaint : C.roseFaint, border: '1px solid ' + (crmRoutingReadiness.json?.status === 'ready' ? '#c8deca' : '#efc7c7'), borderRadius: 11, padding: 10 }}>
                            <div style={{ color: crmRoutingReadiness.json?.status === 'ready' ? C.sage : C.rose, fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>
                              {crmRoutingReadiness.json?.status === 'ready' ? 'HubSpot route map reachable' : 'CRM routing needs review'}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8, marginTop: 9 }}>
                              <MetricRow label="HubSpot API" value={crmRoutingReadiness.json?.hubspot?.ok ? 'Connected' : 'Needs review'} />
                              <MetricRow label="CRM rows checked" value={crmRoutingReadiness.json?.crm?.recentRows ?? 0} />
                              <MetricRow label="Routes mapped" value={(crmRoutingReadiness.json?.routes || []).length} />
                              <MetricRow label="Recent failures" value={(crmRoutingReadiness.json?.crm?.failures || []).length} />
                            </div>
                            {(crmRoutingReadiness.json?.warnings || []).length > 0 && (
                              <div style={{ ...smallText, marginTop: 9, color: C.amber }}>{crmRoutingReadiness.json.warnings.join(' ')}</div>
                            )}
                          </div>
                          {(crmRoutingReadiness.json?.routes || []).map(route => (
                            <div key={route.id} style={{ background: '#fff', border: '1px solid ' + C.border, borderRadius: 11, padding: '9px 10px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                                <strong style={{ color: C.ink }}>{route.label}</strong>
                                <span style={{ color: route.recentCount ? C.sage : C.soft, fontSize: 12, fontWeight: 900 }}>{route.recentCount ? `${route.recentCount} recent row${route.recentCount === 1 ? '' : 's'}` : 'No recent test row'}</span>
                              </div>
                              <div style={{ ...smallText, marginTop: 5 }}>{(route.creates || []).join(' + ')}</div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 7, marginTop: 8 }}>
                                <MetricRow label={route.env?.pipeline || 'Pipeline'} value={route.env?.pipelineConfigured ? 'Configured' : 'Fallback'} />
                                <MetricRow label={route.env?.stage || 'Stage'} value={route.env?.stageConfigured ? 'Configured' : 'Fallback'} />
                              </div>
                              {(route.recent || []).length > 0 && (
                                <div style={{ display: 'grid', gap: 5, marginTop: 8 }}>
                                  {route.recent.map(row => (
                                    <div key={row.id || row.createdAt} style={{ ...smallText, background: C.bg, borderRadius: 8, padding: '6px 7px' }}>
                                      <strong style={{ color: row.status === 'failed' ? C.rose : C.sage }}>{row.status || 'unknown'}</strong>
                                      <span> - {row.eventType || row.source}: {row.email || row.companyName || row.contactId || 'no contact'}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Panel>
              <Panel compact>
                <div style={eyebrow}>Mobile companion</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, .42fr) minmax(0, 1fr)', gap: 14, alignItems: 'start' }} className="admin-spine-grid">
                  <div>
                    <h2 style={h2}>Keep mobile as the calm action layer.</h2>
                    <p style={lead}>The mobile app should not clone the web command center. It should resolve the person, show the one thing that needs attention, collect proof, and write the same spine events the web app already uses.</p>
                    <button type="button" onClick={runMobileReadiness} disabled={mobileReadinessLoading} style={{ ...primaryButton, marginTop: 12, opacity: mobileReadinessLoading ? .6 : 1 }}>
                      {mobileReadinessLoading ? 'Checking mobile spine...' : 'Run mobile readiness check'}
                    </button>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8 }}>
                      {mobileCompanionPersonas.map(persona => (
                        <div key={persona.id} style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 12, padding: 11 }}>
                          <div style={eyebrow}>{persona.primaryScreen}</div>
                          <strong style={{ color: C.ink }}>{persona.label}</strong>
                          <div style={{ ...smallText, marginTop: 5 }}>{persona.promise}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 13, padding: 12 }}>
                      <div style={eyebrow}>API contract</div>
                      <div style={{ display: 'grid', gap: 7, marginTop: 8 }}>
                        {mobileCompanionApiSurface.map(item => (
                          <MetricRow key={item.id} label={item.plannedEndpoint} value={item.label} />
                        ))}
                      </div>
                    </div>
                    {mobileReadiness && (
                      <div style={{ background: mobileReadiness.json?.status === 'scoped' ? C.sageFaint : C.roseFaint, border: '1px solid ' + (mobileReadiness.json?.status === 'scoped' ? '#c8deca' : '#efc7c7'), borderRadius: 13, padding: 12 }}>
                        <div style={{ color: mobileReadiness.json?.status === 'scoped' ? C.sage : C.rose, fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>
                          {mobileReadiness.json?.status === 'scoped' ? 'Mobile companion scoped' : 'Mobile companion needs review'}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8, marginTop: 10 }}>
                          <MetricRow label="Personas" value={(mobileReadiness.json?.personas || []).length || mobileCompanionPersonas.length} />
                          <MetricRow label="API contracts" value={(mobileReadiness.json?.apiSurface || []).length || mobileCompanionApiSurface.length} />
                          <MetricRow label="Push token table" value={mobileReadiness.json?.schema?.mobile_push_tokens ? 'Ready' : 'Later'} />
                          <MetricRow label="Warnings" value={(mobileReadiness.json?.warnings || []).length} />
                        </div>
                        {(mobileReadiness.json?.checks || []).length > 0 && (
                          <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
                            {mobileReadiness.json.checks.map(check => (
                              <MetricRow key={check.id} label={check.label} value={check.ok ? 'Ready' : 'Planned'} />
                            ))}
                          </div>
                        )}
                        {(mobileReadiness.json?.warnings || []).length > 0 && (
                          <div style={{ ...smallText, marginTop: 10, color: C.amber }}>{mobileReadiness.json.warnings.join(' ')}</div>
                        )}
                      </div>
                    )}
                    <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 13, padding: 12 }}>
                      <div style={eyebrow}>Mobile success criteria</div>
                      <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
                        {mobileCompanionSuccessCriteria.map(item => <div key={item} style={smallText}>{item}</div>)}
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
              <Panel compact>
                <div style={eyebrow}>Invite funeral home</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, .45fr) minmax(0, 1fr)', gap: 14, alignItems: 'start' }} className="admin-spine-grid">
                  <div>
                    <h2 style={h2}>Send the partner-owner setup email.</h2>
                    <p style={lead}>This creates or updates the funeral-home organization, saves the director as owner, assigns the subscription/location-slot model, and emails a setup link into the co-branded partner workspace.</p>
                  </div>
                  <form onSubmit={sendPartnerInvite} style={{ display: 'grid', gap: 9 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8 }}>
                      <input value={partnerInviteDraft.organizationName} onChange={event => setPartnerInviteDraft(prev => ({ ...prev, organizationName: event.target.value }))} placeholder="Funeral home name" style={inputStyle} />
                      <input value={partnerInviteDraft.directorName} onChange={event => setPartnerInviteDraft(prev => ({ ...prev, directorName: event.target.value }))} placeholder="Director / owner name" style={inputStyle} />
                      <input value={partnerInviteDraft.directorEmail} onChange={event => setPartnerInviteDraft(prev => ({ ...prev, directorEmail: event.target.value }))} placeholder="director@funeralhome.com" style={inputStyle} />
                      <select value={partnerInviteDraft.planId} onChange={event => setPartnerInviteDraft(prev => ({ ...prev, planId: event.target.value }))} style={inputStyle} aria-label="Funeral home subscription type">
                        {Object.values(FUNERAL_HOME_PLAN_OPTIONS).map(plan => (
                          <option key={plan.id} value={plan.id}>{plan.label} - {plan.includedLocationSlots} location{plan.includedLocationSlots === 1 ? '' : 's'}</option>
                        ))}
                      </select>
                      <input value={partnerInviteDraft.supportPhone} onChange={event => setPartnerInviteDraft(prev => ({ ...prev, supportPhone: event.target.value }))} placeholder="Support phone" style={inputStyle} />
                      <input value={partnerInviteDraft.supportEmail} onChange={event => setPartnerInviteDraft(prev => ({ ...prev, supportEmail: event.target.value }))} placeholder="Family support email (optional)" style={inputStyle} />
                    </div>
                    {(() => {
                      const plan = partnerPlanFor(partnerInviteDraft.planId);
                      return (
                        <div style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 13, padding: '10px 11px', color: C.mid, fontSize: 12.5, lineHeight: 1.5 }}>
                          <strong style={{ color: C.sage }}>{plan.label}:</strong> {plan.description} Includes {plan.includedLocationSlots} location slot{plan.includedLocationSlots === 1 ? '' : 's'}; additional locations are {money(plan.additionalLocationFeeCents / 100)}/mo each unless moved to a group plan.
                        </div>
                      );
                    })()}
                    <button type="submit" disabled={partnerInviteLoading} style={{ ...primaryButton, marginTop: 0, justifySelf: 'start', opacity: partnerInviteLoading ? .6 : 1 }}>{partnerInviteLoading ? 'Sending invite...' : 'Create workspace + send invite'}</button>
                    {partnerInviteResult && (
                      <div style={{ background: partnerInviteResult.ok ? C.sageFaint : C.roseFaint, border: '1px solid ' + (partnerInviteResult.ok ? '#c8deca' : '#efc7c7'), borderRadius: 13, padding: 12 }}>
                        <div style={{ color: partnerInviteResult.ok ? C.sage : C.rose, fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>{partnerInviteResult.ok ? 'Invite ready' : 'Invite failed'}</div>
                        <div style={{ ...smallText, marginTop: 5 }}>{partnerInviteResult.json?.message || partnerInviteResult.json?.error || (partnerInviteResult.json?.inviteUrl ? 'Partner invite sent.' : 'Partner invite processed.')}</div>
                        {partnerInviteResult.json?.inviteUrl && <input readOnly value={partnerInviteResult.json.inviteUrl} style={{ ...inputStyle, width: '100%', marginTop: 8 }} />}
                      </div>
                    )}
                  </form>
                </div>
              </Panel>
              <Panel compact>
                <div style={eyebrow}>Set up vendor</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, .45fr) minmax(0, 1fr)', gap: 14, alignItems: 'start' }} className="admin-spine-grid">
                  <div>
                    <h2 style={h2}>Create a reviewed vendor record.</h2>
                    <p style={lead}>Use this when Passage is onboarding a florist, caterer, clergy/officiant, cemetery support, printing partner, or other scoped support vendor. The vendor is created as pending so Passage can approve them before they appear inside family tasks.</p>
                    <div style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 13, padding: 12, color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 10 }}>
                      Vendor commercial rule: vendor quotes should route through Passage payment collection. Passage keeps the disclosed marketplace fee and remits the vendor balance after payment clears.
                    </div>
                  </div>
                  <form onSubmit={submitVendorSetup} style={{ display: 'grid', gap: 9 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8 }}>
                      <input value={vendorSetupDraft.businessName} onChange={event => setVendorSetupDraft(prev => ({ ...prev, businessName: event.target.value }))} placeholder="Vendor business name" style={inputStyle} />
                      <select value={vendorSetupDraft.category} onChange={event => setVendorSetupDraft(prev => ({ ...prev, category: event.target.value }))} style={inputStyle}>
                        {Object.entries(VENDOR_CATEGORIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                      <input value={vendorSetupDraft.email} onChange={event => setVendorSetupDraft(prev => ({ ...prev, email: event.target.value }))} placeholder="vendor@email.com" style={inputStyle} />
                      <input value={vendorSetupDraft.phone} onChange={event => setVendorSetupDraft(prev => ({ ...prev, phone: event.target.value }))} placeholder="Support phone" style={inputStyle} />
                      <input value={vendorSetupDraft.zipCodes} onChange={event => setVendorSetupDraft(prev => ({ ...prev, zipCodes: event.target.value }))} placeholder="ZIPs served, comma separated" style={inputStyle} />
                      <input value={vendorSetupDraft.website} onChange={event => setVendorSetupDraft(prev => ({ ...prev, website: event.target.value }))} placeholder="Website" style={inputStyle} />
                    </div>
                    <textarea value={vendorSetupDraft.description} onChange={event => setVendorSetupDraft(prev => ({ ...prev, description: event.target.value }))} placeholder="How this vendor helps families" style={{ ...inputStyle, minHeight: 74, resize: 'vertical' }} />
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <button type="submit" disabled={vendorSetupLoading} style={{ ...primaryButton, marginTop: 0, opacity: vendorSetupLoading ? .6 : 1 }}>{vendorSetupLoading ? 'Creating vendor...' : 'Create vendor for review'}</button>
                      <Link href="/vendors/admin" style={secondaryLink}>Review vendors</Link>
                    </div>
                    {vendorSetupResult && (
                      <div style={{ background: vendorSetupResult.ok ? C.sageFaint : C.roseFaint, border: '1px solid ' + (vendorSetupResult.ok ? '#c8deca' : '#efc7c7'), borderRadius: 13, padding: 12 }}>
                        <div style={{ color: vendorSetupResult.ok ? C.sage : C.rose, fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>{vendorSetupResult.ok ? 'Vendor created' : 'Vendor setup failed'}</div>
                        <div style={{ ...smallText, marginTop: 5 }}>{vendorSetupResult.ok ? 'Vendor is pending review. Approve them from Vendor applications to send the workspace email.' : vendorSetupResult.json?.error || 'Could not create vendor.'}</div>
                      </div>
                    )}
                  </form>
                </div>
              </Panel>
              <Panel compact>
                <div style={eyebrow}>Production data reset</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, .45fr) minmax(0, 1fr)', gap: 14, alignItems: 'start' }} className="admin-spine-grid">
                  <div>
                    <h2 style={h2}>Clear test records for a fresh canvas.</h2>
                    <p style={lead}>Use this only while Passage has no real customers or leads. It clears operational records: estates, workflows, tasks, participants, vendors, vendor requests, funeral-home requests, organizations, leads, notifications, CRM sync rows, subscriptions, and non-admin auth users.</p>
                    <div style={{ background: C.roseFaint, border: '1px solid #efc7c7', color: C.rose, borderRadius: 13, padding: 12, fontSize: 12.5, lineHeight: 1.45, marginTop: 10, fontWeight: 800 }}>
                      Preserved: Passage admin emails, code, public pages, blog posts, and static site content. This is intentionally restricted to system admins.
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <button type="button" onClick={loadResetPreview} disabled={resetLoading} style={secondaryButton}>{resetLoading ? 'Checking...' : 'Preview rows to clear'}</button>
                      <input value={resetPhrase} onChange={event => setResetPhrase(event.target.value)} placeholder="Type RESET PASSAGE TEST DATA" style={{ ...inputStyle, flex: '1 1 260px' }} />
                      <button type="button" onClick={runProductionReset} disabled={resetLoading || resetPhrase !== 'RESET PASSAGE TEST DATA' || !resetSafetyChecked} style={{ ...primaryButton, marginTop: 0, opacity: resetLoading || resetPhrase !== 'RESET PASSAGE TEST DATA' || !resetSafetyChecked ? .55 : 1 }}>Reset production test data</button>
                    </div>
                    <label style={{ display: 'flex', gap: 9, alignItems: 'flex-start', background: C.roseFaint, border: '1px solid #efc7c7', borderRadius: 13, padding: 12, color: C.rose, fontSize: 12.5, lineHeight: 1.45, fontWeight: 800 }}>
                      <input
                        type="checkbox"
                        checked={resetSafetyChecked}
                        onChange={event => setResetSafetyChecked(event.target.checked)}
                        style={{ marginTop: 2, width: 16, height: 16 }}
                      />
                      <span>I reviewed the row preview and verified Passage has no real customers, leads, estates, vendor jobs, or partner records that should be preserved.</span>
                    </label>
                    {resetPreview && (
                      <div style={subPanel}>
                        <h3 style={h3}>Rows currently in reset scope: {resetPreview.totalRows ?? resetPreview.totalDeletedRows ?? 0}</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 7, marginTop: 8 }}>
                          {(resetPreview.tables || []).filter(row => (row.count || row.deleted || row.error) && !row.skipped).slice(0, 18).map(row => (
                            <div key={row.table} style={{ background: C.bg, border: '1px solid ' + C.border, borderRadius: 10, padding: '7px 8px', fontSize: 12.5 }}>
                              <strong>{row.table}</strong><br />
                              <span style={{ color: C.mid }}>{row.deleted != null ? `${row.deleted} deleted` : `${row.count || 0} rows`}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {resetResult && (
                      <div style={{ background: resetResult.ok ? C.sageFaint : C.roseFaint, border: '1px solid ' + (resetResult.ok ? '#c8deca' : '#efc7c7'), borderRadius: 13, padding: 12 }}>
                        <div style={{ color: resetResult.ok ? C.sage : C.rose, fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>{resetResult.ok ? 'Reset complete' : 'Reset failed'}</div>
                        <div style={{ ...smallText, marginTop: 5 }}>{resetResult.ok ? `Deleted ${resetResult.json?.totalDeletedRows || 0} public rows and ${resetResult.json?.authUsers?.deleted || 0} non-admin auth users.` : resetResult.json?.error || 'Could not reset production data.'}</div>
                      </div>
                    )}
                  </div>
                </div>
              </Panel>
            </>
            )}

            {adminView === 'personas' && (
            <>
              <Panel compact>
                <div style={eyebrow}>Demo sandbox cockpit</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(230px, .44fr) minmax(0, 1fr)', gap: 14, marginTop: 10 }} className="admin-spine-grid">
                  <div>
                    <h2 style={h2}>Open each side of the same demo story.</h2>
                    <p style={lead}>Use these sandbox roles to demo the family, participant, funeral-home, employee, and vendor experiences from one admin-only cockpit.</p>
                    <div style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 13, padding: 12, color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 10 }}>
                      <strong style={{ color: C.ink }}>Sandbox rule:</strong> these links carry sandbox, demo, source, and persona flags. They are for admin QA only; public users do not see this switcher.
                    </div>
                    <div style={{ display: 'grid', gap: 7, marginTop: 12 }}>
                      {personaProfiles.map((profile) => (
                        <button key={profile.id} onClick={() => setActivePersonaId(profile.id)} style={activePersona.id === profile.id ? selectedToolButton : toolButton}>
                          <span>
                            <span style={{ display: 'block' }}>{profile.label}</span>
                            <span style={{ display: 'block', fontSize: 11.5, color: activePersona.id === profile.id ? 'rgba(255,255,255,.78)' : C.soft, marginTop: 2 }}>{profile.role}</span>
                          </span>
                          <span style={activePersona.id === profile.id ? livePillOnGreen : livePill}>QA</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={previewPanel}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start', marginBottom: 10 }}>
                      <div>
                        <div style={eyebrow}>Selected role</div>
                        <h2 style={{ ...h2, marginTop: 5 }}>{activePersona.label}</h2>
                        <p style={{ ...smallText, marginTop: 3 }}>{activePersona.proof}</p>
                      </div>
                      <Link href={activePersonaHref} target="_blank" style={{ ...primaryLink, flexShrink: 0 }}>Open sandbox view</Link>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 10 }}>
                      {[
                        ['Persona', activePersona.role],
                        ['Route mode', 'Sandbox flagged'],
                        ['Messages', complianceSnapshot?.env?.qaNotificationMode && complianceSnapshot?.env?.qaNotificationOverride ? 'QA override enabled' : complianceSnapshot ? 'Live routing caution' : 'Check readiness first'],
                      ].map(([label, value]) => (
                        <div key={label} style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 12, padding: '9px 10px' }}>
                          <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
                          <div style={{ color: C.ink, fontSize: 13, lineHeight: 1.3, marginTop: 3, fontWeight: 900 }}>{value}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ minHeight: 310, border: '1px solid ' + C.border, borderRadius: 14, background: C.card, padding: 18, display: 'grid', alignContent: 'center', gap: 14 }}>
                      <div>
                        <div style={eyebrow}>Secure preview</div>
                        <h3 style={{ ...h3, marginTop: 6 }}>{activePersona.label} opens in a real tab.</h3>
                        <p style={{ ...smallText, marginTop: 6 }}>
                          Passage blocks iframe embedding with production security headers, so persona QA uses the actual route instead of a framed preview. This avoids the broken preview box and keeps the admin sandbox aligned with our clickjacking protection.
                        </p>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
                        {[
                          ['Role', activePersona.role],
                          ['Route', activePersonaHref.replace(/^https?:\/\/[^/]+/i, '')],
                          ['Expected proof', activePersona.proof],
                        ].map(([label, value]) => (
                          <div key={label} style={{ background: C.bg, border: '1px solid ' + C.border, borderRadius: 12, padding: '10px 11px' }}>
                            <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
                            <div style={{ color: C.ink, fontSize: 12.6, lineHeight: 1.35, marginTop: 4, fontWeight: 800, overflowWrap: 'anywhere' }}>{value}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                        <Link href={activePersonaHref} target="_blank" style={primaryLink}>Open sandbox view</Link>
                        <button type="button" onClick={() => navigator.clipboard?.writeText(activePersonaHref)} style={secondaryButton}>Copy route</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ background: C.amberFaint, border: '1px solid #ead8b8', color: C.amber, borderRadius: 13, padding: 12, marginTop: 12, fontSize: 12.5, lineHeight: 1.45, fontWeight: 800 }}>
                  Admin boundary: this is persona simulation, not production impersonation. Use it with owned QA data to test live-feeling interactions across the spine. True customer impersonation remains gated until it has audit logs, scoped tokens, session expiry, and explicit owner approval.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 10 }}>
                  <div style={{ background: C.sageFaint, border: '1px solid #c8deca', color: C.sage, borderRadius: 13, padding: 12, fontSize: 12.5, lineHeight: 1.45, fontWeight: 800 }}>
                    Browser QA: restored. Use the persona launcher plus the P0 readiness loop before demos; the no-login funeral-home sample console has been checked in-browser.
                  </div>
                  <div style={{ background: C.sageFaint, border: '1px solid #c8deca', color: C.sage, borderRadius: 13, padding: 12, fontSize: 12.5, lineHeight: 1.45, fontWeight: 800 }}>
                    Database QA: restored. Docker is healthy, migrations are aligned, Supabase diff runs, and the release-gate script writes a non-empty production schema backup.
                  </div>
                </div>
                <div style={{ background: complianceSnapshot?.env?.qaNotificationMode && complianceSnapshot?.env?.qaNotificationOverride ? C.sageFaint : C.roseFaint, border: '1px solid ' + (complianceSnapshot?.env?.qaNotificationMode && complianceSnapshot?.env?.qaNotificationOverride ? '#c8deca' : '#efc7c7'), color: complianceSnapshot?.env?.qaNotificationMode && complianceSnapshot?.env?.qaNotificationOverride ? C.sage : C.rose, borderRadius: 13, padding: 12, marginTop: 10, fontSize: 12.5, lineHeight: 1.45, fontWeight: 800 }}>
                  Notification safety: {complianceSnapshot?.env?.qaNotificationMode && complianceSnapshot?.env?.qaNotificationOverride
                    ? 'QA override is active, so outbound demo emails route to the configured QA inbox and SMS is blocked where supported.'
                    : complianceSnapshot
                      ? 'QA override is not active. Only use owned test recipients until this is enabled.'
                      : 'Run the P0 readiness loop or compliance check before sending demo notifications.'}
                </div>
              </Panel>
              <Panel compact>
                <div style={eyebrow}>Guided demo story</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(230px, .42fr) minmax(0, 1fr)', gap: 14, marginTop: 10 }} className="admin-spine-grid">
                  <div>
                    <h2 style={h2}>Run the same story in the same order.</h2>
                    <p style={lead}>Use this before a funeral-home or partner demo so the walkthrough proves the complete spine: family setup, participant action, director view, staff proof, vendor request, family update, and readiness evidence.</p>
                    <div style={{ display: 'grid', gap: 7, marginTop: 12 }}>
                      {guidedDemoStory.map(step => (
                        <button key={step.id} onClick={() => setActiveDemoStoryId(step.id)} style={activeDemoStory.id === step.id ? selectedToolButton : toolButton}>
                          <span>
                            <span style={{ display: 'block' }}>{step.label}</span>
                            <span style={{ display: 'block', fontSize: 11.5, color: activeDemoStory.id === step.id ? 'rgba(255,255,255,.78)' : C.soft, marginTop: 2 }}>{step.persona}</span>
                          </span>
                          <span style={activeDemoStory.id === step.id ? livePillOnGreen : livePill}>Step</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={previewPanel}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start', marginBottom: 12 }}>
                      <div>
                        <div style={eyebrow}>Current demo step</div>
                        <h2 style={{ ...h2, marginTop: 5 }}>{activeDemoStory.label}</h2>
                        <p style={{ ...smallText, marginTop: 3 }}>{activeDemoStory.persona}</p>
                      </div>
                      <Link href={activeDemoStoryHref} target="_blank" style={{ ...primaryLink, flexShrink: 0 }}>Open step</Link>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8 }}>
                      {[
                        ['Show', activeDemoStory.show],
                        ['Proof target', activeDemoStory.proof],
                        ['Pass criteria', activeDemoStory.pass],
                      ].map(([label, value]) => (
                        <div key={label} style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 13, padding: '11px 12px' }}>
                          <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
                          <div style={{ color: C.ink, fontSize: 13, lineHeight: 1.45, marginTop: 5, fontWeight: 800 }}>{value}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: C.sageFaint, border: '1px solid #c8deca', color: C.sage, borderRadius: 13, padding: 12, marginTop: 10, fontSize: 12.5, lineHeight: 1.45, fontWeight: 800 }}>
                      Demo rule: if a step needs narration to explain what happened, that step becomes the next sprint item. The product should show the owner, waiting point, proof, and next state itself.
                    </div>
                    <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 12 }}>
                      <Link href={activeDemoStoryHref} target="_blank" style={primaryLink}>Open step</Link>
                      <button type="button" onClick={() => navigator.clipboard?.writeText(activeDemoStoryHref)} style={secondaryButton}>Copy step route</button>
                    </div>
                  </div>
                </div>
              </Panel>
              <Panel compact>
                <div style={eyebrow}>Role front doors</div>
                <h2 style={h2}>The login and onboarding doors to test before every sales push.</h2>
                <p style={lead}>This is the owner-only checklist for public-to-private transitions: family, participant, funeral-home director, staff, vendor, and vendor application.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 9, marginTop: 14 }}>
                  {qaFrontDoors.map(([label, href, body]) => (
                    <Link key={href} href={sandboxHref(href)} target="_blank" style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 14, padding: 13, color: C.ink, textDecoration: 'none', display: 'grid', gap: 5 }}>
                      <span style={{ fontSize: 17, fontWeight: 900 }}>{label}</span>
                      <span style={{ ...smallText, marginTop: 0 }}>{body}</span>
                      <span style={{ color: C.sage, fontSize: 12.5, fontWeight: 900 }}>Open sandbox front door</span>
                    </Link>
                  ))}
                </div>
              </Panel>
            </>
            )}

            {adminView === 'metrics' && (
            <section id="business-health" style={{ marginTop: 16 }}>
              <Panel compact>
                <div style={eyebrow}>Business health dashboard</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'start', flexWrap: 'wrap' }}>
                  <div>
                    <h2 style={h2}>Internal metrics spine.</h2>
                    <p style={lead}>Show only the operating truth first. Raw CSV remains the source of record.</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {[7, 30, 90].map(days => (
                      <button key={days} onClick={() => setMetricsRangeDays(days)} style={metricsRangeDays === days ? selectedTab : tabButton}>{days}d</button>
                    ))}
                    <button onClick={downloadMetricsCsv} style={{ ...primaryButton, marginTop: 0 }}>Export raw metrics CSV</button>
                  </div>
                </div>
                {metricsLoading && <div style={{ ...smallText, marginTop: 12 }}>Loading live metrics...</div>}
                {metricsError && <div style={{ ...smallText, marginTop: 12, color: C.rose }}>{metricsError}</div>}
                {metrics?.metrics?.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginTop: 12 }}>
                    {metrics.metrics.slice(0, 12).map((item) => (
                      <div key={item.label} style={item.status === 'real' ? metricCard : unavailableMetricCard}>
                        <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: item.status === 'real' ? C.sage : C.amber, marginBottom: 5 }}>{item.status}</div>
                        <div style={{ fontSize: 24, lineHeight: 1.05 }}>{formatAdminMetricValue(item)}</div>
                        <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.35, marginTop: 5 }}>{item.label}</div>
                        <div style={{ fontSize: 10.5, color: C.soft, marginTop: 5 }}>Source: {item.source}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginTop: 12 }}>
                    {reportingMetrics.slice(0, 6).map((metric) => <div key={metric} style={metricCard}>{metric}</div>)}
                  </div>
                )}
                {metrics?.leads && (
                  <div style={{ marginTop: 18 }}>
                    <div style={eyebrow}>Lead and support inbox</div>
                    <p style={{ ...smallText, marginTop: 4 }}>Contact, vendor, partner, support, billing, feature, and bug inquiries are grouped from the leads table. The export includes the raw rows behind this view.</p>
                    {(metrics.leads.inbox || []).length > 0 && (
                      <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
                        <div style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 13, padding: 12 }}>
                          <div style={eyebrow}>Triage queue</div>
                          <div style={{ ...smallText, marginTop: 4 }}>Start with P0, then P1. Each queue says what to do next, and HubSpot sync health below confirms whether the CRM caught the same lead.</div>
                        </div>
                        {(metrics.leads.inbox || []).map(queue => (
                          <div key={queue.key} style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 13, padding: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'start' }}>
                              <div>
                                <div style={eyebrow}>{queue.priority}</div>
                                <h3 style={{ ...h3, marginTop: 4 }}>{queue.label}</h3>
                                <div style={{ ...smallText, marginTop: 4 }}>{queue.nextAction}</div>
                              </div>
                              <span style={countPill}>{queue.count}</span>
                            </div>
                            {(queue.recent || []).length > 0 && (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 8, marginTop: 10 }}>
                                {queue.recent.map(item => (
                                  <div key={(item.id || item.email || item.createdAt) + queue.key} style={{ background: C.bg, border: '1px solid ' + C.border, borderRadius: 10, padding: '8px 9px' }}>
                                    <div style={{ color: C.ink, fontSize: 13, fontWeight: 900, overflowWrap: 'anywhere' }}>{item.email || item.name || 'No contact'}</div>
                                    <div style={{ ...smallText, marginTop: 3 }}>{[item.type, item.source, item.urgency].filter(Boolean).join(' - ') || 'Lead'}</div>
                                    {item.message && <div style={{ ...smallText, marginTop: 4 }}>{item.message}</div>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10, marginTop: 10 }}>
                      <div style={subPanel}>
                        <h3 style={h3}>By inquiry type</h3>
                        {(metrics.leads.byType || []).length ? metrics.leads.byType.slice(0, 8).map((item) => (
                          <MetricRow key={item.label} label={item.label} value={item.count} />
                        )) : <div style={smallText}>No lead categories yet.</div>}
                      </div>
                      <div style={subPanel}>
                        <h3 style={h3}>Recent inquiries</h3>
                        {(metrics.leads.recent || []).length ? metrics.leads.recent.slice(0, 6).map((item) => (
                          <MetricRow key={item.email + item.createdAt} label={(item.type || 'Inquiry') + (item.urgency ? ' - ' + item.urgency : '')} value={item.email || 'No email'} />
                        )) : <div style={smallText}>No recent inquiries yet.</div>}
                      </div>
                    </div>
                  </div>
                )}
                {metrics?.crmSync && (
                  <div style={{ marginTop: 18 }}>
                    <div style={eyebrow}>HubSpot sync health</div>
                    <p style={{ ...smallText, marginTop: 4 }}>Every website-to-HubSpot attempt lands here: synced, skipped, or failed. Use this after contact, vendor, care-provider, funeral-home, and checkout tests.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10, marginTop: 10 }}>
                      <div style={subPanel}>
                        <h3 style={h3}>By sync status</h3>
                        {(metrics.crmSync.byStatus || []).length ? metrics.crmSync.byStatus.slice(0, 8).map((item) => (
                          <MetricRow key={item.label} label={item.label} value={item.count} />
                        )) : <div style={smallText}>No CRM sync attempts yet.</div>}
                      </div>
                      <div style={subPanel}>
                        <h3 style={h3}>By source</h3>
                        {(metrics.crmSync.bySource || []).length ? metrics.crmSync.bySource.slice(0, 8).map((item) => (
                          <MetricRow key={item.label} label={item.label} value={item.count} />
                        )) : <div style={smallText}>No CRM source rows yet.</div>}
                      </div>
                      <div style={subPanel}>
                        <h3 style={h3}>Recent syncs</h3>
                        {(metrics.crmSync.recent || []).length ? metrics.crmSync.recent.slice(0, 8).map((item) => (
                          <MetricRow
                            key={(item.id || item.email || item.companyName) + item.createdAt}
                            label={[item.source || item.eventType || 'CRM', item.status || 'unknown'].filter(Boolean).join(' - ')}
                            value={item.email || item.companyName || item.hubspotContactId || 'No contact'}
                          />
                        )) : <div style={smallText}>No recent CRM sync rows yet.</div>}
                      </div>
                      <div style={subPanel}>
                        <h3 style={h3}>Failures</h3>
                        {(metrics.crmSync.failures || []).length ? metrics.crmSync.failures.slice(0, 8).map((item) => (
                          <MetricRow
                            key={(item.id || item.email || item.companyName) + item.createdAt + 'failure'}
                            label={item.error || item.eventType || 'Needs review'}
                            value={item.email || item.companyName || item.status || 'Failed'}
                          />
                        )) : <div style={smallText}>No CRM sync failures in the latest rows.</div>}
                      </div>
                    </div>
                  </div>
                )}
                {metrics?.funnel && (
                  <div style={{ marginTop: 18 }}>
                    <div style={eyebrow}>Signup and onboarding funnel</div>
                    <p style={{ ...smallText, marginTop: 4 }}>Use this to see who created an account, who completed onboarding, who paid, and who fell off inside the selected time window.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10, marginTop: 10 }}>
                      <div style={subPanel}>
                        <h3 style={h3}>Recent accounts</h3>
                        {(metrics.funnel.recent || []).length ? metrics.funnel.recent.slice(0, 8).map((item) => (
                          <MetricRow
                            key={(item.email || 'user') + item.createdAt}
                            label={[
                              item.onboardingCompleted ? 'Complete' : 'Incomplete',
                              item.lastStage || 'No stage',
                              item.planStatus || 'No plan',
                            ].join(' - ')}
                            value={item.email || 'No email'}
                          />
                        )) : <div style={smallText}>No accounts in this range.</div>}
                      </div>
                      <div style={subPanel}>
                        <h3 style={h3}>Nurture queue</h3>
                        {(metrics.funnel.recent || []).filter(item => !item.onboardingCompleted).length
                          ? metrics.funnel.recent.filter(item => !item.onboardingCompleted).slice(0, 8).map((item) => (
                            <MetricRow key={(item.email || 'user') + item.createdAt + 'nurture'} label={item.lastStage || 'Started, not completed'} value={item.email || 'No email'} />
                          ))
                          : <div style={smallText}>No incomplete onboarding in this range.</div>}
                      </div>
                    </div>
                  </div>
                )}
              </Panel>
            </section>
            )}

            {adminView === 'trust' && (
            <section id="trust-layer" style={{ marginTop: 16 }}>
              <Panel compact>
                <div style={eyebrow}>FAQ, support, terms, and privacy</div>
                <h2 style={h2}>Public trust layer is queued behind owner/legal review.</h2>
                <p style={lead}>The FAQ should explain vendor applications, support requests, feature requests, bug reports, billing disputes, urgent-help limits, and data ownership. Terms and Privacy changes should stay reviewed before production legal claims change.</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
                  <Link href="/faq" style={secondaryLink}>FAQ</Link>
                  <Link href="/trust" style={secondaryLink}>Trust</Link>
                  <Link href="/privacy" style={secondaryLink}>Privacy</Link>
                  <Link href="/terms" style={secondaryLink}>Terms</Link>
                  <Link href="/contact" style={secondaryLink}>Contact intake</Link>
                </div>
              </Panel>
              <Panel compact>
                <div style={eyebrow}>Compliance readiness</div>
                <h2 style={h2}>Check HIPAA/SOC posture before partner conversations.</h2>
                <p style={lead}>This is an engineering readiness snapshot, not a certification. It checks sensitive RLS policy hazards, required production environment flags, notification safety, and the claims Passage should avoid until formal review.</p>
                <button type="button" onClick={loadComplianceSnapshot} disabled={complianceLoading} style={{ ...primaryButton, opacity: complianceLoading ? .6 : 1 }}>
                  {complianceLoading ? 'Checking readiness...' : 'Run compliance readiness check'}
                </button>
                {complianceError && <div style={{ ...smallText, color: C.rose }}>{complianceError}</div>}
                {complianceSnapshot && (
                  <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
                    <div style={{ background: complianceSnapshot.status === 'needs_work' ? C.roseFaint : C.sageFaint, border: '1px solid ' + (complianceSnapshot.status === 'needs_work' ? '#efc7c7' : '#c8deca'), borderRadius: 13, padding: 12 }}>
                      <div style={{ color: complianceSnapshot.status === 'needs_work' ? C.rose : C.sage, fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>{complianceSnapshot.status === 'needs_work' ? 'Needs work' : 'Ready for readiness review'}</div>
                      <p style={{ ...smallText, marginTop: 5 }}>Public claim posture: do not claim HIPAA, SOC 1, or SOC 2 compliance. Use "role-scoped, audit-oriented, review-before-share, preparing for formal compliance review."</p>
                    </div>
                    {(complianceSnapshot.blockers || []).length > 0 && (
                      <div style={subPanel}>
                        <h3 style={h3}>Blockers</h3>
                        {(complianceSnapshot.blockers || []).map(item => <MetricRow key={item} label={item} value="P0" />)}
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                      <div style={subPanel}>
                        <h3 style={h3}>RLS</h3>
                        <MetricRow label="Sensitive allow-all policies" value={(complianceSnapshot.snapshot?.sensitive_allow_all_policies || []).length} />
                        <MetricRow label="RLS disabled tables" value={(complianceSnapshot.snapshot?.rls_disabled || []).length} />
                        <MetricRow label="Zero-policy tables to classify" value={(complianceSnapshot.snapshot?.zero_policy_tables || []).length} />
                      </div>
                      <div style={subPanel}>
                        <h3 style={h3}>Environment</h3>
                        <MetricRow label="Resend" value={complianceSnapshot.env?.resend && complianceSnapshot.env?.resendFrom ? 'Configured' : 'Missing'} />
                        <MetricRow label="Internal smoke secret" value={complianceSnapshot.env?.internalSecret ? 'Configured' : 'Missing'} />
                        <MetricRow label="QA notification override" value={complianceSnapshot.env?.qaNotificationMode && complianceSnapshot.env?.qaNotificationOverride ? 'Enabled' : 'Missing'} />
                        <MetricRow label="SMS live" value={complianceSnapshot.env?.twilioLiveReady ? 'Approved' : 'Dry-run only'} />
                      </div>
                    </div>
                    <div style={subPanel}>
                      <h3 style={h3}>Trust checklist evidence</h3>
                      <p style={{ ...smallText, margin: '2px 0 10px' }}>This maps the public Trust page promises to the current backend proof and the next review step. Use this before pilots so the story and the system stay aligned.</p>
                      <div style={{ display: 'grid', gap: 8 }}>
                        {buildTrustEvidence(complianceSnapshot).map((item) => (
                          <div key={item.label} style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 12, padding: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                              <strong style={{ color: C.ink, fontSize: 13.5 }}>{item.label}</strong>
                              <span style={{ ...countPill, color: item.tone === 'good' ? C.sage : item.tone === 'warn' ? C.amber : C.rose, background: item.tone === 'good' ? C.sageFaint : item.tone === 'warn' ? C.amberFaint : C.roseFaint, border: `1px solid ${(item.tone === 'good' ? C.sage : item.tone === 'warn' ? C.amber : C.rose)}33` }}>{item.status}</span>
                            </div>
                            <MetricRow label="Public promise" value={item.promise} />
                            <MetricRow label="Backend proof" value={item.proof} />
                            <MetricRow label="Next review" value={item.next} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Panel>
              <Panel compact>
                <div style={eyebrow}>Notification dry-run QA</div>
                <h2 style={h2}>Preview routing without sending anything.</h2>
                <p style={lead}>This calls the same delivery endpoints with dryRun enabled. The expected result says no provider was called, no fallback was sent, and no production record changed.</p>
                <div style={{ background: C.amberFaint, border: '1px solid #ead8b8', color: C.amber, borderRadius: 13, padding: 12, marginTop: 12, fontSize: 12.5, lineHeight: 1.45, fontWeight: 800 }}>
                  SMS production reality: email dry-runs can be exercised safely here. Live SMS remains paused until Twilio carrier registration/A2P approval is complete and Passage explicitly enables production texting.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 14 }}>
                  <label style={fieldLabel}>
                    Email recipient
                    <input value={dryRunDraft.email} onChange={event => setDryRunDraft(prev => ({ ...prev, email: event.target.value }))} style={inputStyle} placeholder="qa@example.com" />
                  </label>
                  <label style={fieldLabel}>
                    SMS recipient
                    <input value={dryRunDraft.phone} onChange={event => setDryRunDraft(prev => ({ ...prev, phone: event.target.value }))} style={inputStyle} placeholder="+1..." />
                  </label>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                  <button onClick={() => runNotificationDryRun('email')} disabled={dryRunLoading || !dryRunDraft.email} style={{ ...primaryButton, marginTop: 0, opacity: dryRunLoading || !dryRunDraft.email ? .55 : 1 }}>Dry-run email</button>
                  <button onClick={() => runNotificationDryRun('sms')} disabled={dryRunLoading || !dryRunDraft.phone} style={{ ...secondaryButton, opacity: dryRunLoading || !dryRunDraft.phone ? .55 : 1 }}>Dry-run SMS</button>
                </div>
                {dryRunResult && (
                  <div style={{ background: dryRunResult.ok ? C.sageFaint : C.roseFaint, border: '1px solid ' + (dryRunResult.ok ? '#c8deca' : '#efc7c7'), borderRadius: 13, padding: 12, marginTop: 12 }}>
                    <div style={{ color: dryRunResult.ok ? C.sage : C.rose, fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>{dryRunResult.ok ? 'Dry-run passed' : 'Dry-run failed'} - {dryRunResult.channel}</div>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: '8px 0 0', color: C.mid, fontSize: 12, lineHeight: 1.45, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{JSON.stringify(dryRunResult.json, null, 2)}</pre>
                  </div>
                )}
                {metrics?.notifications && (
                  <div style={{ marginTop: 18 }}>
                    <div style={eyebrow}>Recent delivery truth</div>
                    <p style={{ ...smallText, marginTop: 4 }}>These are the latest logged email/SMS outcomes, masked for safety. Use this after testing invites or task updates with your own address only.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10, marginTop: 10 }}>
                      <div style={subPanel}>
                        <h3 style={h3}>By status</h3>
                        {(metrics.notifications.byStatus || []).length ? metrics.notifications.byStatus.slice(0, 8).map((item) => (
                          <MetricRow key={item.label} label={item.label} value={item.count} />
                        )) : <div style={smallText}>No notification log rows yet.</div>}
                      </div>
                      <div style={subPanel}>
                        <h3 style={h3}>Latest notifications</h3>
                        {(metrics.notifications.recent || []).length ? metrics.notifications.recent.slice(0, 8).map((item) => (
                          <MetricRow
                            key={(item.id || item.channel) + item.sentAt}
                            label={[item.channel || 'message', item.status || 'unknown', item.subject || item.provider || 'Passage'].filter(Boolean).join(' - ')}
                            value={item.error ? 'Failed' : item.recipient}
                          />
                        )) : <div style={smallText}>No recent delivery records.</div>}
                      </div>
                    </div>
                  </div>
                )}
              </Panel>
            </section>
            )}
          </>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}

function Panel({ children, compact = false, tone = 'default' }) {
  return <div style={{ background: tone === 'sage' ? C.sageFaint : C.card, border: '1px solid ' + (tone === 'sage' ? '#c8deca' : C.border), borderRadius: 18, padding: compact ? 18 : 22, boxShadow: '0 4px 20px rgba(0,0,0,.04)', marginTop: compact ? 0 : 18 }}>{children}</div>;
}

function MetricRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, borderTop: '1px solid ' + C.border, padding: '8px 0', alignItems: 'flex-start' }}>
      <span style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.35 }}>{label}</span>
      <strong style={{ color: C.ink, fontSize: 12.5, textAlign: 'right', lineHeight: 1.35 }}>{value}</strong>
    </div>
  );
}

function formatAdminMetricValue(item) {
  if (item?.value == null) return 'N/A';
  if (item?.unit === 'cents') {
    return '$' + (Number(item.value || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return item.value;
}

const eyebrow = { color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 };
const h1 = { fontSize: 52, lineHeight: 1.04, margin: '8px 0 10px', fontWeight: 400, maxWidth: 820 };
const h2 = { fontSize: 28, lineHeight: 1.12, margin: '8px 0 10px', fontWeight: 400 };
const h3 = { fontSize: 22, lineHeight: 1.15, fontWeight: 900 };
const lead = { color: C.mid, fontSize: 16, lineHeight: 1.6, margin: 0, maxWidth: 760 };
const smallText = { color: C.mid, fontSize: 14, lineHeight: 1.5, marginTop: 8 };
const primaryButton = { border: 'none', background: C.sage, color: '#fff', borderRadius: 13, minHeight: 48, padding: '0 18px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer', marginTop: 16 };
const secondaryButton = { border: '1px solid ' + C.border, background: C.card, color: C.sage, borderRadius: 13, minHeight: 48, padding: '0 18px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' };
const secondaryLink = { border: '1px solid ' + C.border, background: C.card, color: C.sage, borderRadius: 13, minHeight: 48, padding: '0 18px', fontFamily: 'Georgia,serif', fontWeight: 900, display: 'inline-flex', alignItems: 'center', textDecoration: 'none', marginTop: 16 };
const primaryLink = { border: 'none', background: C.sage, color: '#fff', borderRadius: 13, minHeight: 44, padding: '0 16px', fontFamily: 'Georgia,serif', fontWeight: 900, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' };
const tabButton = { border: '1px solid ' + C.border, background: C.card, color: C.mid, borderRadius: 999, minHeight: 38, padding: '0 14px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' };
const selectedTab = { ...tabButton, border: '1px solid ' + C.sage, background: C.sage, color: '#fff' };
const toolButton = { border: '1px solid ' + C.border, background: C.card, color: C.ink, borderRadius: 13, minHeight: 42, padding: '8px 10px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', textAlign: 'left' };
const selectedToolButton = { ...toolButton, border: '1px solid ' + C.sage, background: C.sage, color: '#fff' };
const livePill = { background: C.sageFaint, color: C.sage, border: '1px solid #c8deca', borderRadius: 999, padding: '5px 8px', fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap' };
const livePillOnGreen = { background: 'rgba(255,255,255,.16)', color: '#fff', border: '1px solid rgba(255,255,255,.28)', borderRadius: 999, padding: '5px 8px', fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap' };
const plannedPill = { background: C.amberFaint, color: C.amber, border: '1px solid #ead8b8', borderRadius: 999, padding: '5px 8px', fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap' };
const metricCard = { background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 13, padding: 12, color: C.sage, fontWeight: 900, fontSize: 14 };
const unavailableMetricCard = { background: C.amberFaint, border: '1px solid #ead8b8', borderRadius: 13, padding: 12, color: C.amber, fontWeight: 900, fontSize: 14 };
const subPanel = { background: C.bg, border: '1px solid ' + C.border, borderRadius: 14, padding: 14 };
const accordionPanel = { background: C.card, border: '1px solid ' + C.border, borderRadius: 16, padding: 12 };
const accordionSummary = { cursor: 'pointer', color: C.ink, fontSize: 15, fontWeight: 900, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' };
const countPill = { background: C.sageFaint, color: C.sage, border: '1px solid #c8deca', borderRadius: 999, padding: '4px 8px', fontSize: 11, fontWeight: 900, whiteSpace: 'nowrap' };
const previewPanel = { background: C.bg, border: '1px solid ' + C.border, borderRadius: 16, padding: 14 };
const fieldLabel = { display: 'grid', gap: 5, color: C.soft, fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 };
const inputStyle = { border: '1px solid ' + C.border, background: C.bg, borderRadius: 12, padding: '11px 12px', color: C.ink, fontFamily: 'Georgia,serif', fontSize: 14 };
