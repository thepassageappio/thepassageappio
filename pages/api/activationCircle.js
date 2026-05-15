import { createClient } from '@supabase/supabase-js';
import { escapeHtml, passageEmailShell } from '../../lib/brandedEmail';
import { insertNotificationLog, qaAuditFields, routeEmailRecipients } from '../../lib/notificationSafety';
import { verifyDeliveryRequest } from '../../lib/deliveryAuth';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authClient = createClient(url, anon);
const admin = createClient(url, service);
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');

function clean(value, max = 500) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function emailOf(value) {
  return clean(value, 180).toLowerCase();
}

function schemaMissing(error) {
  const message = String(error?.message || '').toLowerCase();
  return error?.code === '42P01' || message.includes('schema cache') || message.includes('could not find the table');
}

async function getUser(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    const internalAuth = await verifyDeliveryRequest(req);
    const actorEmail = emailOf(req.body?.actorEmail || req.query.actorEmail);
    if (internalAuth.ok && internalAuth.source === 'internal' && actorEmail) {
      return {
        id: clean(req.body?.actorUserId || req.query.actorUserId, 120) || null,
        email: actorEmail,
        user_metadata: { full_name: clean(req.body?.actorName || req.query.actorName || actorEmail, 160) },
      };
    }
    return null;
  }
  const { data } = await authClient.auth.getUser(token);
  return data?.user || null;
}

async function loadWorkflow(workflowId) {
  const { data, error } = await admin
    .from('workflows')
    .select('id,user_id,name,estate_name,deceased_name,path,mode,status,activation_status,coordinator_name,coordinator_email,organization_id,triggered_at')
    .eq('id', workflowId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function userAccess(user, workflow) {
  if (!user?.id || !workflow?.id) return { canView: false, canManage: false, canWitness: false, role: '' };
  const email = emailOf(user.email);
  const owner = workflow.user_id === user.id;
  const coordinator = email && emailOf(workflow.coordinator_email) === email;
  const [{ data: accessByUser }, { data: accessByEmail }, { data: memberByUser }, { data: memberByEmail }, { data: witness }] = await Promise.all([
    admin.from('estate_access').select('id,role,status').eq('workflow_id', workflow.id).eq('user_id', user.id).neq('status', 'revoked').limit(1).maybeSingle(),
    admin.from('estate_access').select('id,role,status').eq('workflow_id', workflow.id).ilike('email', email).neq('status', 'revoked').limit(1).maybeSingle(),
    workflow.organization_id
      ? admin.from('organization_members').select('id,role,status').eq('organization_id', workflow.organization_id).eq('user_id', user.id).eq('status', 'active').limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
    workflow.organization_id
      ? admin.from('organization_members').select('id,role,status').eq('organization_id', workflow.organization_id).ilike('email', email).eq('status', 'active').limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
    admin.from('activation_witnesses').select('id,role,status').eq('workflow_id', workflow.id).ilike('email', email).eq('status', 'active').limit(1).maybeSingle(),
  ]);
  const access = accessByUser || accessByEmail;
  const member = memberByUser || memberByEmail;
  const role = access?.role || member?.role || witness?.role || (coordinator ? 'coordinator' : owner ? 'owner' : '');
  const privilegedRole = ['owner', 'coordinator', 'executor', 'healthcare_proxy', 'activation_witness', 'trusted_contact', 'director', 'staff', 'location_manager'].includes(String(role || '').toLowerCase());
  return {
    canView: Boolean(owner || coordinator || access?.id || member?.id || witness?.id),
    canManage: Boolean(owner || coordinator),
    canWitness: Boolean(owner || coordinator || witness?.id || privilegedRole),
    witnessId: witness?.id || null,
    role,
  };
}

async function loadCircle(workflowId) {
  const [{ data: witnesses, error: witnessError }, { data: requests, error: requestError }, { data: participants }, { data: people }] = await Promise.all([
    admin.from('activation_witnesses').select('*').eq('workflow_id', workflowId).eq('status', 'active').order('created_at', { ascending: true }),
    admin.from('activation_requests').select('*').eq('workflow_id', workflowId).order('created_at', { ascending: false }).limit(3),
    admin.from('estate_participants').select('id,email,name,phone,role,invite_status,accepted_at,created_at').eq('workflow_id', workflowId).order('created_at', { ascending: false }).limit(80),
    admin.from('people').select('id,email,first_name,last_name,name,relationship,estate_role_label,created_at').eq('estate_id', workflowId).order('created_at', { ascending: false }).limit(80),
  ]);
  if (witnessError && schemaMissing(witnessError)) return { unavailable: true };
  if (requestError && schemaMissing(requestError)) return { unavailable: true };
  if (witnessError) throw witnessError;
  if (requestError) throw requestError;
  const activeRequest = (requests || []).find(row => row.status === 'pending') || (requests || [])[0] || null;
  let confirmations = [];
  if (activeRequest?.id) {
    const result = await admin
      .from('activation_confirmations')
      .select('*')
      .eq('request_id', activeRequest.id)
      .order('created_at', { ascending: true });
    if (result.error && !schemaMissing(result.error)) throw result.error;
    confirmations = result.data || [];
  }
  return {
    witnesses: witnesses || [],
    requests: requests || [],
    activeRequest,
    confirmations,
    candidates: buildCandidates(participants || [], people || []),
  };
}

function buildCandidates(participants, people) {
  const seen = new Set();
  const rows = [];
  function push(row, source) {
    const email = emailOf(row.email);
    if (!email || seen.has(email)) return;
    seen.add(email);
    const name = clean(row.name || [row.first_name, row.last_name].filter(Boolean).join(' ') || email, 160);
    const role = clean(row.role || row.estate_role_label || row.relationship || 'Participant', 80);
    const eligible = /trusted|executor|proxy|health|spouse|partner|child|daughter|son|coordinator|decision|participant|helper/i.test(role);
    rows.push({ id: row.id, email, name, role, source, eligible });
  }
  participants.forEach(row => push(row, 'participant'));
  people.forEach(row => push(row, 'person'));
  return rows;
}

async function notifyWitness({ workflow, request, witness }) {
  if (!process.env.RESEND_API_KEY || !witness.email) return { skipped: true };
  const route = routeEmailRecipients([witness.email]);
  if (!route.actual.length) return { skipped: true, qaOverride: route.qaOverride };
  const href = `${SITE_URL}/participating?estate=${encodeURIComponent(workflow.id)}&activation=${encodeURIComponent(request.id)}`;
  const titleName = workflow.deceased_name || workflow.estate_name || workflow.name || 'this planning record';
  const html = passageEmailShell({
    eyebrow: 'Activation review needed',
    title: `Please review whether ${titleName} should become active.`,
    intro: 'Someone in the activation circle started the review. Passage requires a second trusted confirmation before this planning record becomes an active urgent record.',
    sections: [
      {
        label: 'Your role',
        html: `You are listed as <strong style="color:#1a1916;">${escapeHtml(witness.role || 'activation witness')}</strong>. Confirm only if you believe the record should be activated now.`,
      },
      request.reason ? { label: 'Reason shared', text: request.reason, tone: 'soft' } : null,
    ].filter(Boolean),
    ctaLabel: 'Review activation request',
    ctaUrl: href,
  });
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || 'Passage <notifications@thepassageapp.io>',
      to: route.actual,
      subject: `Passage activation review: ${titleName}`,
      html,
    }),
  }).catch(() => null);
  const json = response ? await response.json().catch(() => ({})) : {};
  await insertNotificationLog(admin, {
    workflow_id: workflow.id,
    channel: 'email',
    recipient_email: witness.email,
    recipient_name: witness.name || witness.email,
    subject: `Passage activation review: ${titleName}`,
    provider: 'resend',
    provider_id: response?.ok ? json.id || null : null,
    status: response?.ok ? 'sent' : 'failed',
    sent_at: response?.ok ? new Date().toISOString() : null,
    error_message: response?.ok ? null : (json?.message || json?.error || 'Activation review email failed'),
    source: 'activation_circle',
    ...qaAuditFields(route),
  });
  return { sent: response?.ok, qaOverride: route.qaOverride };
}

async function activateWorkflow({ workflow, request, actorEmail }) {
  const now = new Date().toISOString();
  await admin.from('activation_requests').update({ status: 'confirmed', confirmed_at: now, updated_at: now }).eq('id', request.id);
  await admin.from('workflows').update({
    path: 'red',
    mode: 'red',
    status: 'triggered',
    activation_status: 'activated',
    triggered_at: now,
    updated_at: now,
  }).eq('id', workflow.id);
  await admin.from('estate_events').insert([{
    estate_id: workflow.id,
    event_type: 'green_to_red_activated',
    title: 'Planning record activated',
    description: 'Two trusted confirmations moved this planning record into active urgent coordination.',
    actor: actorEmail || 'Activation circle',
  }]).then(() => {}, () => {});
  await admin.from('orchestration_events').insert([{
    workflow_id: workflow.id,
    event_type: 'green_to_red_activated',
    status: 'done',
    payload: { activation_request_id: request.id, actorEmail },
    processed_at: now,
  }]).then(() => {}, () => {});
}

export default async function handler(req, res) {
  if (!service) return res.status(500).json({ error: 'Supabase service role is not configured.' });
  const user = await getUser(req);
  if (!user?.id || !user.email) return res.status(401).json({ error: 'Sign in to manage activation.' });

  const workflowId = clean(req.query.workflowId || req.body?.workflowId || req.body?.estateId, 80);
  if (!workflowId) return res.status(400).json({ error: 'Missing estate.' });

  try {
    const workflow = await loadWorkflow(workflowId);
    if (!workflow) return res.status(404).json({ error: 'Estate not found.' });
    const access = await userAccess(user, workflow);
    if (!access.canView) return res.status(403).json({ error: 'You do not have access to this activation circle.' });

    if (req.method === 'GET') {
      const circle = await loadCircle(workflowId);
      return res.status(200).json({ workflow, access, ...circle });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const action = clean(req.body?.action, 40);
    if (action === 'set_witnesses') {
      if (!access.canManage) return res.status(403).json({ error: 'Only the estate owner or coordinator can set activation witnesses.' });
      const selected = Array.isArray(req.body?.witnesses) ? req.body.witnesses : [];
      const normalized = selected
        .map(row => ({
          workflow_id: workflowId,
          email: emailOf(row.email),
          name: clean(row.name || row.email, 160),
          role: clean(row.role || 'activation_witness', 80),
          source: clean(row.source || 'manual', 50),
          source_id: clean(row.sourceId || row.source_id || '', 120) || null,
          status: 'active',
          created_by: user.id,
          updated_at: new Date().toISOString(),
        }))
        .filter(row => row.email);
      if (!normalized.length) return res.status(400).json({ error: 'Choose at least one activation witness.' });
      await admin.from('activation_witnesses').update({ status: 'removed', updated_at: new Date().toISOString() }).eq('workflow_id', workflowId);
      const { data, error } = await admin.from('activation_witnesses').upsert(normalized, { onConflict: 'workflow_id,email' }).select('*');
      if (error) throw error;
      await admin.from('estate_events').insert([{
        estate_id: workflowId,
        event_type: 'activation_circle_updated',
        title: 'Activation circle updated',
        description: `${normalized.length} trusted confirmation contact${normalized.length === 1 ? '' : 's'} saved.`,
        actor: user.email,
      }]).then(() => {}, () => {});
      return res.status(200).json({ success: true, witnesses: data || [] });
    }

    if (action === 'request') {
      if (!access.canWitness) return res.status(403).json({ error: 'You are not listed as someone who can start activation.' });
      const circle = await loadCircle(workflowId);
      if (circle.unavailable) return res.status(409).json({ error: 'Activation tables are not available yet.' });
      const userEmail = emailOf(user.email);
      const witnesses = circle.witnesses || [];
      const otherWitnesses = witnesses.filter(w => emailOf(w.email) !== userEmail);
      if (otherWitnesses.length < 1) return res.status(400).json({ error: 'Add at least one other trusted confirmation contact before starting activation.' });
      if (circle.activeRequest?.status === 'pending') return res.status(200).json({ success: true, request: circle.activeRequest, confirmations: circle.confirmations, alreadyPending: true });
      const { data: request, error } = await admin.from('activation_requests').insert([{
        workflow_id: workflowId,
        requested_by_user_id: user.id,
        requested_by_email: userEmail,
        requested_by_name: clean(user.user_metadata?.full_name || userEmail, 160),
        reason: clean(req.body?.reason, 900) || null,
        proof_source: clean(req.body?.proofSource, 120) || null,
      }]).select('*').single();
      if (error) throw error;
      await admin.from('activation_confirmations').insert([{
        request_id: request.id,
        workflow_id: workflowId,
        witness_id: access.witnessId,
        confirmed_by_user_id: user.id,
        confirmed_by_email: userEmail,
        confirmed_by_name: clean(user.user_metadata?.full_name || userEmail, 160),
        confirmation_role: access.role || 'initiator',
        note: clean(req.body?.reason, 900) || 'Activation review started.',
      }]);
      await Promise.all(otherWitnesses.map(witness => notifyWitness({ workflow, request, witness })));
      await admin.from('estate_events').insert([{
        estate_id: workflowId,
        event_type: 'activation_review_started',
        title: 'Activation review started',
        description: `${user.email} started activation review. Waiting for one more trusted confirmation.`,
        actor: user.email,
      }]).then(() => {}, () => {});
      return res.status(200).json({ success: true, request, notified: otherWitnesses.length });
    }

    if (action === 'confirm') {
      if (!access.canWitness) return res.status(403).json({ error: 'You are not listed as an activation witness for this record.' });
      const requestId = clean(req.body?.requestId, 80);
      const circle = await loadCircle(workflowId);
      const request = requestId
        ? (circle.requests || []).find(row => row.id === requestId)
        : circle.activeRequest;
      if (!request || request.status !== 'pending') return res.status(404).json({ error: 'No pending activation request is waiting for confirmation.' });
      const userEmail = emailOf(user.email);
      if (emailOf(request.requested_by_email) === userEmail) return res.status(409).json({ error: 'A second trusted person must confirm this activation.' });
      const existing = (circle.confirmations || []).find(row => emailOf(row.confirmed_by_email) === userEmail);
      if (!existing) {
        const { error } = await admin.from('activation_confirmations').insert([{
          request_id: request.id,
          workflow_id: workflowId,
          witness_id: access.witnessId,
          confirmed_by_user_id: user.id,
          confirmed_by_email: userEmail,
          confirmed_by_name: clean(user.user_metadata?.full_name || userEmail, 160),
          confirmation_role: access.role || 'activation_witness',
          note: clean(req.body?.note, 900) || null,
        }]);
        if (error) throw error;
      }
      const { data: confirmations } = await admin.from('activation_confirmations').select('*').eq('request_id', request.id);
      const distinct = new Set((confirmations || []).map(row => emailOf(row.confirmed_by_email)).filter(Boolean));
      if (distinct.size >= 2) {
        await activateWorkflow({ workflow, request, actorEmail: userEmail });
      }
      return res.status(200).json({ success: true, activated: distinct.size >= 2, confirmations: confirmations || [] });
    }

    if (action === 'cancel') {
      if (!access.canManage) return res.status(403).json({ error: 'Only the estate owner or coordinator can cancel activation review.' });
      const requestId = clean(req.body?.requestId, 80);
      if (!requestId) return res.status(400).json({ error: 'Missing activation request.' });
      const { data, error } = await admin.from('activation_requests').update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', requestId).eq('workflow_id', workflowId).select('*').maybeSingle();
      if (error) throw error;
      return res.status(200).json({ success: true, request: data });
    }

    return res.status(400).json({ error: 'Choose a valid activation action.' });
  } catch (error) {
    if (schemaMissing(error)) return res.status(409).json({ error: 'Activation tables are not available yet.', unavailable: true });
    return res.status(500).json({ error: error.message || 'Activation circle could not be updated.' });
  }
}
