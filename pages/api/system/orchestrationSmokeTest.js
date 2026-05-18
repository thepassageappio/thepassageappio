import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { isPassageAdmin } from '../../../lib/adminAccess';
import { verifyDeliveryRequest, internalHeaders } from '../../../lib/deliveryAuth';
import { calculateVendorEconomics } from '../../../lib/vendorEconomics';
import { recordTaskCommunicationEvent } from '../../../lib/communicationEvents';
import { transferGroupForVendorOrder } from '../../../lib/stripeFinancialSpine';
import { summarizePersonaContracts } from '../../../lib/personaOrchestrationContracts';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = url && service ? createClient(url, service) : null;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');
const STEVE_EMAIL = 'steventurrisi@gmail.com';

function clean(value) {
  return String(value || '').trim();
}

async function findAdminUserId() {
  if (!admin) return null;
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const users = data?.users || [];
  return users.find((user) => String(user.email || '').toLowerCase() === STEVE_EMAIL)?.id || users[0]?.id || null;
}

async function safeDelete(table, column, value) {
  if (!admin || !value) return;
  await admin.from(table).delete().eq(column, value).then(() => {}, () => {});
}

async function cleanupCreated(created) {
  if (!admin) return;
  if (created.activationWorkflowId) {
    await safeDelete('notification_log', 'workflow_id', created.activationWorkflowId);
    await safeDelete('task_status_events', 'workflow_id', created.activationWorkflowId);
    await safeDelete('estate_events', 'estate_id', created.activationWorkflowId);
    await safeDelete('orchestration_events', 'workflow_id', created.activationWorkflowId);
    await safeDelete('activation_confirmations', 'workflow_id', created.activationWorkflowId);
    await safeDelete('activation_requests', 'workflow_id', created.activationWorkflowId);
    await safeDelete('activation_witnesses', 'workflow_id', created.activationWorkflowId);
    await safeDelete('tasks', 'workflow_id', created.activationWorkflowId);
    await safeDelete('workflows', 'id', created.activationWorkflowId);
  }
  if (created.workflowId) {
    await safeDelete('vendor_payments', 'workflow_id', created.workflowId);
    await safeDelete('vendor_orders', 'workflow_id', created.workflowId);
    await safeDelete('vendor_requests', 'workflow_id', created.workflowId);
    await safeDelete('notification_log', 'workflow_id', created.workflowId);
    await safeDelete('task_status_events', 'workflow_id', created.workflowId);
    await safeDelete('estate_events', 'estate_id', created.workflowId);
    await safeDelete('orchestration_events', 'workflow_id', created.workflowId);
    await safeDelete('announcements', 'estate_id', created.workflowId);
    await safeDelete('tasks', 'workflow_id', created.workflowId);
    await safeDelete('workflows', 'id', created.workflowId);
  }
  if (created.vendorId) await safeDelete('vendors', 'id', created.vendorId);
  if (created.organizationId) {
    await safeDelete('organization_members', 'organization_id', created.organizationId);
    await safeDelete('organizations', 'id', created.organizationId);
  }
}

async function apiPost(path, body, bearerToken = '') {
  const response = await fetch(`${SITE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...internalHeaders(),
      ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, json };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!admin) return res.status(500).json({ error: 'Supabase service role is not configured.' });

  const auth = await verifyDeliveryRequest(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
  const requestBearerToken = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const actorEmail = String(auth.user?.email || req.body?.actorEmail || '').toLowerCase();
  if (auth.source !== 'internal' && !isPassageAdmin(actorEmail)) {
    return res.status(403).json({ error: 'Passage admin access is required.' });
  }

  const keepRecords = req.body?.keepRecords === true;
  const recipientEmail = clean(req.body?.recipientEmail) || STEVE_EMAIL;
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const created = { organizationId: null, workflowId: null, taskId: null, participantTaskId: null, vendorTaskId: null, vendorId: null, vendorRequestId: null, vendorOrderId: null, vendorPaymentId: null, activationWorkflowId: null, activationRequestId: null };
  const checks = [];

  try {
    const adminUserId = await findAdminUserId();
    if (!adminUserId) return res.status(500).json({ error: 'No admin auth user was available for the simulation.' });

    const { data: organization, error: orgError } = await admin.from('organizations').insert([{
      type: 'funeral_home',
      name: `QA Coordination FH ${stamp}`,
      slug: `qa-coordination-fh-${stamp}-${randomUUID().slice(0, 6)}`,
      support_email: recipientEmail,
      from_name: 'QA Coordination Funeral Home',
      white_label_enabled: true,
      created_by: adminUserId,
    }]).select('id').single();
    if (orgError) throw orgError;
    created.organizationId = organization.id;

    await admin.from('organization_members').insert([{
      organization_id: organization.id,
      user_id: adminUserId,
      email: recipientEmail,
      role: 'owner',
      status: 'active',
    }]).then(() => {}, () => {});

    const { data: workflow, error: workflowError } = await admin.from('workflows').insert([{
      user_id: adminUserId,
      organization_id: organization.id,
      name: `QA coordination simulation ${stamp}`,
      estate_name: `QA coordination simulation ${stamp}`,
      deceased_name: `QA Loved One ${stamp}`,
      coordinator_name: 'Passage QA',
      coordinator_email: recipientEmail,
      status: 'active',
      activation_status: 'activated',
      trigger_type: 'death_confirmed',
      path: 'red',
      mode: 'red',
      setup_stage: 'active',
      orchestration_summary: {
        qa_smoke_test: true,
        purpose: 'Temporary coordination, communication, and notification spine simulation.',
        chaplain_context: {
          deathContext: 'hospice',
          withPersonNow: 'family',
          pronouncementStatus: 'needed',
          authorityStatus: 'someone_else',
          funeralHomeHandoffIntent: 'request_help',
        },
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }]).select('id,deceased_name,coordinator_name,coordinator_email').single();
    if (workflowError) throw workflowError;
    created.workflowId = workflow.id;

    const { data: task, error: taskError } = await admin.from('tasks').insert([{
      workflow_id: workflow.id,
      user_id: adminUserId,
      title: 'QA confirm family coordination proof',
      description: 'Temporary smoke-test task for coordination and notification verification.',
      category: 'service',
      priority: 'urgent',
      status: 'assigned',
      assigned_to_name: 'QA Funeral Home Director',
      assigned_to_email: recipientEmail,
      recipient: recipientEmail,
      channel: 'email',
      automation_level: 'SEND_TRACK',
      execution_kind: 'message',
      waiting_on: 'funeral home proof',
      funeral_home_eligible: true,
      proof_required: 'QA proof recorded',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }]).select('id,title').single();
    if (taskError) throw taskError;
    created.taskId = task.id;

    checks.push({
      name: 'temporary_case_created',
      ok: true,
      workflowId: workflow.id,
      taskId: task.id,
    });

    const assignmentSaved = await apiPost(`/api/tasks/${task.id}/assign`, {
      name: 'QA Funeral Home Director',
      email: recipientEmail,
      role: 'funeral_home_director',
      phone: '+18455797644',
      actor: 'Passage QA Coordinator',
    }, requestBearerToken);
    checks.push({ name: 'task_owner_assignment_saved', ...assignmentSaved });

    const partnerProof = await apiPost('/api/partnerHandleTask', {
      taskId: task.id,
      note: 'QA proof: funeral-home staff recorded proof, family notification requested, and the case spine should update.',
      sendFamilyEmail: true,
      actor: recipientEmail,
    }, requestBearerToken);
    checks.push({ name: 'funeral_home_close_with_proof', ...partnerProof });

    const assignmentEmail = await apiPost('/api/sendEmail', {
      to: recipientEmail,
      toName: 'Passage QA',
      subject: 'QA Passage task assignment',
      taskTitle: task.title,
      taskId: task.id,
      deceasedName: workflow.deceased_name,
      coordinatorName: workflow.coordinator_name,
      workflowId: workflow.id,
      actionType: 'assignment',
    }, requestBearerToken);
    checks.push({ name: 'participant_assignment_email', ...assignmentEmail });

    const familyUpdate = await apiPost('/api/familyUpdate', {
      actorEmail: recipientEmail,
      workflowId: workflow.id,
      audience: 'immediate_family',
      tone: 'simple',
      subject: 'QA Passage family update',
      message: 'QA family update: this is a temporary reviewed update proving Passage can send and record communication status on the family spine.',
      channel: 'email',
      recipients: [recipientEmail],
      reviewedBy: 'Passage QA',
    }, requestBearerToken);
    checks.push({ name: 'reviewed_family_update_email', ...familyUpdate });

    const smsDryRun = await apiPost('/api/sendSMS', {
      to: '+18455797644',
      toName: 'Passage QA',
      toEmail: recipientEmail,
      taskTitle: task.title,
      taskId: task.id,
      deceasedName: workflow.deceased_name,
      coordinatorName: workflow.coordinator_name,
      workflowId: workflow.id,
      actionType: 'assignment',
      dryRun: true,
    }, requestBearerToken);
    checks.push({ name: 'sms_dry_run_no_send', ...smsDryRun });

    const { data: participantTask, error: participantTaskError } = await admin.from('tasks').insert([{
      workflow_id: workflow.id,
      user_id: adminUserId,
      title: 'QA participant confirms cemetery details',
      description: 'Temporary participant task proving scoped helper actions write back to the same case spine.',
      category: 'personal',
      priority: 'normal',
      status: 'assigned',
      assigned_to_name: 'QA Participant',
      assigned_to_email: recipientEmail,
      recipient: recipientEmail,
      channel: 'participant',
      automation_level: 'SEND_TRACK',
      execution_kind: 'message',
      waiting_on: 'family helper',
      proof_required: 'Participant waiting point or proof recorded',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }]).select('id,title').single();
    if (participantTaskError) throw participantTaskError;
    created.participantTaskId = participantTask.id;

    const participantWaiting = await apiPost('/api/participantAction', {
      kind: 'task',
      id: participantTask.id,
      action: 'waiting',
      actorUserId: adminUserId,
      actorEmail: recipientEmail,
      actorName: 'Passage QA Participant',
      notes: 'QA participant update: waiting for cemetery office confirmation and keeping the coordinator informed.',
    }, requestBearerToken);
    checks.push({ name: 'participant_scoped_waiting_update', ...participantWaiting });

    const { data: vendorTask, error: vendorTaskError } = await admin.from('tasks').insert([{
      workflow_id: workflow.id,
      user_id: adminUserId,
      title: 'QA order memorial flowers',
      description: 'Temporary vendor task proving a scoped vendor request can be created and quoted.',
      category: 'logistics',
      priority: 'normal',
      status: 'pending',
      assigned_to_name: 'Unassigned',
      channel: 'vendor',
      automation_level: 'SEND_TRACK',
      execution_kind: 'vendor_request',
      waiting_on: 'vendor quote',
      proof_required: 'Vendor quote and family-visible status recorded',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }]).select('id,title').single();
    if (vendorTaskError) throw vendorTaskError;
    created.vendorTaskId = vendorTask.id;

    const { data: vendor, error: vendorError } = await admin.from('vendors').insert([{
      business_name: `QA Florist ${stamp}`,
      category: 'florist',
      short_description: 'Temporary QA vendor for scoped request verification.',
      zip_codes_served: ['12508'],
      rush_supported: true,
      rush_window_hours: 24,
      planned_supported: true,
      contact_email: recipientEmail,
      contact_phone: '+18455797644',
      website: 'https://www.thepassageapp.io',
      status: 'active',
      marketplace_fee_percent: 12,
      passage_rev_share_percent: 12,
      funeral_home_rev_share_percent: 0,
      estimated_transaction_value: 475,
      estimated_value: 475,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }]).select('id,business_name,category').single();
    if (vendorError) throw vendorError;
    created.vendorId = vendor.id;

    const vendorRequest = await apiPost('/api/vendorRequests/create', {
      workflowId: workflow.id,
      workflow_id: workflow.id,
      estateId: workflow.id,
      estate_id: workflow.id,
      taskId: vendorTask.id,
      task_id: vendorTask.id,
      taskTitle: vendorTask.title,
      task_title: vendorTask.title,
      vendorId: vendor.id,
      vendor_id: vendor.id,
      actorUserId: adminUserId,
      actorEmail: recipientEmail,
      actorName: 'Passage QA Coordinator',
      qaSmokeTest: true,
      urgency: 'planned',
      requestNote: 'QA request: please quote memorial flowers for the service.',
    }, requestBearerToken);
    created.vendorRequestId = vendorRequest.json?.request?.id || null;
    checks.push({ name: 'vendor_scoped_request_created', ...vendorRequest });

    if (vendorRequest.json?.request?.response_token) {
      const vendorQuote = await apiPost('/api/vendorRequests/respond', {
        token: vendorRequest.json.request.response_token,
        status: 'accepted',
        finalValue: 475,
      }, requestBearerToken);
      checks.push({ name: 'vendor_quote_status_recorded', ...vendorQuote });
    } else {
      checks.push({ name: 'vendor_quote_status_recorded', ok: false, error: 'Vendor request did not return a response token.' });
    }

    if (created.vendorRequestId) {
      const grossAmount = 475;
      const economics = calculateVendorEconomics({
        value: grossAmount,
        marketplaceFeePercent: 12,
        funeralHomeSharePercent: 0,
        hasFuneralHome: false,
      });
      const passageFee = economics.passageShareAmount;
      const vendorNet = Math.round((grossAmount - passageFee) * 100) / 100;
      const now = new Date().toISOString();
      const dryRunSessionId = `cs_dryrun_${stamp}_${randomUUID().slice(0, 12)}`;

      const { data: vendorOrder, error: vendorOrderError } = await admin.from('vendor_orders').insert([{
        vendor_request_id: created.vendorRequestId,
        vendor_id: vendor.id,
        workflow_id: workflow.id,
        task_id: vendorTask.id,
        total_amount: grossAmount,
        platform_fee: passageFee,
        platform_fee_percent: 12,
        net_vendor_amount: vendorNet,
        payment_status: 'checkout_created',
        payout_status: 'automatic_transfer',
        stripe_account_id: 'acct_dry_run_vendor_connect',
        stripe_checkout_session_id: dryRunSessionId,
        stripe_transfer_group: null,
        description: 'QA dry-run vendor invoice. No money moved.',
        metadata: { qa_smoke_test: true, no_money_moved: true, source: 'orchestrationSmokeTest' },
        created_by: adminUserId,
        created_at: now,
        updated_at: now,
      }]).select('id,total_amount,platform_fee,net_vendor_amount,payment_status,payout_status').single();
      if (vendorOrderError) throw vendorOrderError;
      created.vendorOrderId = vendorOrder.id;
      const transferGroup = transferGroupForVendorOrder(vendorOrder.id);
      await admin.from('vendor_orders').update({ stripe_transfer_group: transferGroup }).eq('id', vendorOrder.id);

      const { data: vendorPayment, error: vendorPaymentError } = await admin.from('vendor_payments').insert([{
        vendor_request_id: created.vendorRequestId,
        vendor_id: vendor.id,
        workflow_id: workflow.id,
        task_id: vendorTask.id,
        gross_amount: grossAmount,
        application_fee_amount: passageFee,
        vendor_net_amount: vendorNet,
        stripe_checkout_session_id: dryRunSessionId,
        stripe_transfer_destination: 'acct_dry_run_vendor_connect',
        status: 'checkout_created',
        payout_status: 'pending',
        created_at: now,
        updated_at: now,
      }]).select('id,gross_amount,application_fee_amount,vendor_net_amount,status,payout_status').single();
      if (vendorPaymentError) throw vendorPaymentError;
      created.vendorPaymentId = vendorPayment.id;

      await admin.from('vendor_requests').update({
        status: 'payment_pending',
        payment_collection_status: 'checkout_created',
        family_accepted_at: now,
        payment_url_created_at: now,
        stripe_checkout_session_id: dryRunSessionId,
        stripe_connected_account_id: 'acct_dry_run_vendor_connect',
        gross_amount: grossAmount,
        passage_fee_percent: 12,
        passage_fee_amount: passageFee,
        platform_fee_amount: passageFee,
        passage_share_amount: passageFee,
        vendor_net_amount: vendorNet,
        payout_amount: vendorNet,
        payout_status: 'pending',
        updated_at: now,
      }).eq('id', created.vendorRequestId);

      await recordTaskCommunicationEvent({
        verb: 'update',
        workflowId: workflow.id,
        taskId: vendorTask.id,
        taskTitle: vendorTask.title,
        status: 'waiting',
        actor: 'Passage QA Coordinator',
        actorRole: 'family_coordinator',
        channel: 'vendor_payment',
        recipient: vendor.business_name,
        recipientRole: 'vendor',
        detail: `QA dry run: vendor invoice created for $${grossAmount.toFixed(2)}; Passage fee $${passageFee.toFixed(2)}; vendor net $${vendorNet.toFixed(2)}. No money moved.`,
        visibility: 'family_funeral_home',
      });

      await admin.from('vendor_orders').update({
        payment_status: 'paid',
        payout_status: 'automatic_transfer',
        paid_at: now,
        updated_at: now,
      }).eq('id', vendorOrder.id);
      await admin.from('vendor_payments').update({
        status: 'paid',
        payout_status: 'available',
        paid_at: now,
        payout_available_at: now,
        updated_at: now,
      }).eq('id', vendorPayment.id);
      await admin.from('vendor_requests').update({
        status: 'paid',
        payment_collection_status: 'paid',
        paid_at: now,
        payout_status: 'available',
        updated_at: now,
      }).eq('id', created.vendorRequestId);

      await recordTaskCommunicationEvent({
        verb: 'prove',
        workflowId: workflow.id,
        taskId: vendorTask.id,
        taskTitle: vendorTask.title,
        status: 'handled',
        actor: 'Passage QA Stripe webhook simulation',
        actorRole: 'system',
        channel: 'vendor_payment',
        recipient: vendor.business_name,
        recipientRole: 'vendor',
        detail: `QA dry run: payment state recorded as paid and vendor payout available for $${vendorNet.toFixed(2)}. No money moved.`,
        visibility: 'family_funeral_home',
      });

      const [{ data: paidOrder }, { data: paidPayment }, { data: paidRequest }] = await Promise.all([
        admin.from('vendor_orders').select('id,total_amount,platform_fee,net_vendor_amount,payment_status,payout_status,stripe_transfer_group').eq('id', vendorOrder.id).maybeSingle(),
        admin.from('vendor_payments').select('id,gross_amount,application_fee_amount,vendor_net_amount,status,payout_status').eq('id', vendorPayment.id).maybeSingle(),
        admin.from('vendor_requests').select('id,status,payment_collection_status,gross_amount,passage_fee_amount,vendor_net_amount,payout_status').eq('id', created.vendorRequestId).maybeSingle(),
      ]);
      checks.push({
        name: 'vendor_commerce_no_money_dry_run',
        ok: paidOrder?.payment_status === 'paid'
          && paidPayment?.status === 'paid'
          && paidRequest?.status === 'paid'
          && Number(paidRequest?.gross_amount) === grossAmount
          && Number(paidRequest?.passage_fee_amount) === passageFee
          && Number(paidRequest?.vendor_net_amount) === vendorNet
          && Boolean(paidOrder?.stripe_transfer_group),
        grossAmount,
        passageFee,
        vendorNet,
        orderStatus: paidOrder?.payment_status || null,
        paymentStatus: paidPayment?.status || null,
        requestStatus: paidRequest?.status || null,
        payoutStatus: paidRequest?.payout_status || null,
      });
    } else {
      checks.push({ name: 'vendor_commerce_no_money_dry_run', ok: false, error: 'Vendor request was not created, so payment dry run could not run.' });
    }

    const activationTables = await Promise.all([
      admin.from('activation_witnesses').select('id').limit(1),
      admin.from('activation_requests').select('id').limit(1),
      admin.from('activation_confirmations').select('id').limit(1),
    ]);
    checks.push({
      name: 'green_red_activation_tables_available',
      ok: activationTables.every((result) => !result.error),
      errors: activationTables.map((result) => result.error?.message).filter(Boolean),
    });

    const { data: activationWorkflow, error: activationWorkflowError } = await admin.from('workflows').insert([{
      user_id: adminUserId,
      name: `QA planning activation ${stamp}`,
      estate_name: `QA planning activation ${stamp}`,
      deceased_name: `QA Planning Person ${stamp}`,
      coordinator_name: 'Passage QA',
      coordinator_email: recipientEmail,
      status: 'planning_active',
      activation_status: 'ready',
      trigger_type: 'death_confirmed',
      path: 'green',
      mode: 'green',
      setup_stage: 'ready',
      orchestration_summary: {
        qa_smoke_test: true,
        purpose: 'Temporary two-person activation circle simulation.',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }]).select('id,deceased_name').single();
    if (activationWorkflowError) throw activationWorkflowError;
    created.activationWorkflowId = activationWorkflow.id;

    await admin.from('activation_witnesses').upsert([
      {
        workflow_id: activationWorkflow.id,
        email: recipientEmail,
        name: 'Passage QA initiator',
        role: 'primary_activation_contact',
        source: 'qa_smoke_test',
        status: 'active',
        created_by: adminUserId,
        updated_at: new Date().toISOString(),
      },
      {
        workflow_id: activationWorkflow.id,
        email: `qa-second-${stamp}@example.com`,
        name: 'Passage QA second witness',
        role: 'second_activation_contact',
        source: 'qa_smoke_test',
        status: 'active',
        created_by: adminUserId,
        updated_at: new Date().toISOString(),
      },
    ], { onConflict: 'workflow_id,email' });

    const activationRequest = await apiPost('/api/activationCircle', {
      workflowId: activationWorkflow.id,
      action: 'request',
      actorUserId: adminUserId,
      actorEmail: recipientEmail,
      actorName: 'Passage QA initiator',
      reason: 'QA activation review: one trusted person started, a different trusted person must confirm.',
    }, requestBearerToken);
    created.activationRequestId = activationRequest.json?.request?.id || null;
    checks.push({ name: 'green_red_activation_review_started', ...activationRequest });

    const selfConfirmBlocked = created.activationRequestId
      ? await apiPost('/api/activationCircle', {
        workflowId: activationWorkflow.id,
        action: 'confirm',
        requestId: created.activationRequestId,
        actorUserId: adminUserId,
        actorEmail: recipientEmail,
        actorName: 'Passage QA initiator',
        note: 'QA should not allow same-person activation.',
      }, requestBearerToken)
      : { ok: false, status: 0, json: { error: 'No activation request was created.' } };
    checks.push({
      name: 'green_red_same_person_confirmation_blocked',
      ok: selfConfirmBlocked.status === 409,
      status: selfConfirmBlocked.status,
      json: selfConfirmBlocked.json,
    });

    if (created.activationRequestId) {
      await admin.from('activation_confirmations').insert([{
        request_id: created.activationRequestId,
        workflow_id: activationWorkflow.id,
        confirmed_by_email: `qa-second-${stamp}@example.com`,
        confirmed_by_name: 'Passage QA second witness',
        confirmation_role: 'second_activation_contact',
        note: 'QA simulated second trusted confirmation.',
      }]);
      const now = new Date().toISOString();
      await admin.from('activation_requests').update({ status: 'confirmed', confirmed_at: now, updated_at: now }).eq('id', created.activationRequestId);
      await admin.from('workflows').update({
        path: 'red',
        mode: 'red',
        status: 'triggered',
        activation_status: 'activated',
        triggered_at: now,
        updated_at: now,
      }).eq('id', activationWorkflow.id);
      await admin.from('estate_events').insert([{
        estate_id: activationWorkflow.id,
        event_type: 'green_to_red_activated',
        title: 'Planning record activated',
        description: 'QA simulated the second trusted confirmation and verified the planning record can become active.',
        actor: 'Passage QA',
      }]);
      await admin.from('orchestration_events').insert([{
        workflow_id: activationWorkflow.id,
        event_type: 'green_to_red_activated',
        status: 'done',
        payload: { activation_request_id: created.activationRequestId, qa_smoke_test: true },
        processed_at: now,
      }]).then(() => {}, () => {});

      const [{ data: activatedRecord }, { data: activationConfirmations }, { data: activationEvents }] = await Promise.all([
        admin.from('workflows').select('id,status,activation_status,path,mode').eq('id', activationWorkflow.id).maybeSingle(),
        admin.from('activation_confirmations').select('id,confirmed_by_email').eq('request_id', created.activationRequestId),
        admin.from('estate_events').select('id,event_type').eq('estate_id', activationWorkflow.id).eq('event_type', 'green_to_red_activated'),
      ]);
      checks.push({
        name: 'green_red_second_confirmation_activates_record',
        ok: activatedRecord?.activation_status === 'activated' && (activationConfirmations || []).length >= 2 && (activationEvents || []).length >= 1,
        activationStatus: activatedRecord?.activation_status || null,
        confirmationCount: (activationConfirmations || []).length,
        activationEventCount: (activationEvents || []).length,
      });
    }

    const [{ data: taskAfter }, { data: participantTaskAfter }, { data: vendorTaskAfter }, { data: workflowAfter }, { data: notificationRows }, { data: statusEvents }, { data: estateEvents }, { data: vendorRequestRows }, { data: vendorOrderRows }, { data: vendorPaymentRows }, { data: announcementRows }] = await Promise.all([
      admin.from('tasks').select('id,status,last_actor,last_action_at,completed_at,completed_by_email,notes,assigned_to_email').eq('id', task.id).maybeSingle(),
      admin.from('tasks').select('id,status,last_actor,last_action_at,completed_at,completed_by_email,notes,assigned_to_email').eq('id', participantTask.id).maybeSingle(),
      admin.from('tasks').select('id,status,last_actor,last_action_at,completed_at,completed_by_email,notes,assigned_to_email').eq('id', vendorTask.id).maybeSingle(),
      admin.from('workflows').select('id,orchestration_summary').eq('id', workflow.id).maybeSingle(),
      admin.from('notification_log').select('*').eq('workflow_id', workflow.id),
      admin.from('task_status_events').select('*').eq('workflow_id', workflow.id),
      admin.from('estate_events').select('*').eq('estate_id', workflow.id),
      admin.from('vendor_requests').select('id,status,payment_collection_status,gross_amount,passage_fee_amount,vendor_net_amount').eq('workflow_id', workflow.id),
      admin.from('vendor_orders').select('id,payment_status,payout_status,total_amount,platform_fee,net_vendor_amount').eq('workflow_id', workflow.id),
      admin.from('vendor_payments').select('id,status,payout_status,gross_amount,application_fee_amount,vendor_net_amount').eq('workflow_id', workflow.id),
      admin.from('announcements').select('id,status,audience,channel').eq('estate_id', workflow.id),
    ]);

    const smokeContext = workflowAfter?.orchestration_summary?.chaplain_context || {};
    checks.push({
      name: 'urgent_stabilization_context_visible_in_spine',
      ok: smokeContext.deathContext === 'hospice' && smokeContext.withPersonNow === 'family' && smokeContext.pronouncementStatus === 'needed' && smokeContext.funeralHomeHandoffIntent === 'request_help',
      deathContext: smokeContext.deathContext || null,
      withPersonNow: smokeContext.withPersonNow || null,
      pronouncementStatus: smokeContext.pronouncementStatus || null,
      funeralHomeHandoffIntent: smokeContext.funeralHomeHandoffIntent || null,
    });

    const eventText = (row) => `${row.event_type || ''} ${row.status || ''} ${row.actor || ''} ${row.recipient || ''} ${row.detail || ''} ${row.description || ''}`.toLowerCase();
    const hasEventFor = (needle) => (statusEvents || []).some((row) => eventText(row).includes(String(needle || '').toLowerCase()));
    const notificationText = (row) => `${row.source || ''} ${row.status || ''} ${row.channel || ''} ${row.subject || ''} ${row.recipient_email || ''} ${row.to_email || ''} ${row.intended_recipient || ''} ${row.actual_recipient || ''}`.toLowerCase();
    const hasNotificationFor = (needle) => (notificationRows || []).some((row) => notificationText(row).includes(String(needle || '').toLowerCase()));

    checks.push({
      name: 'task_assignment_spine_contract',
      ok: hasEventFor('task assigned') || hasEventFor('assigned to'),
      assignedTo: taskAfter?.assigned_to_email || null,
      eventMatches: (statusEvents || []).filter((row) => eventText(row).includes('assigned')).length,
    });

    checks.push({
      name: 'participant_action_spine_contract',
      ok: participantTaskAfter?.status === 'waiting'
        && /cemetery office confirmation/i.test(String(participantTaskAfter?.notes || ''))
        && hasEventFor('participant')
        && (hasNotificationFor('participant') || hasNotificationFor('task')),
      participantStatus: participantTaskAfter?.status || null,
      participantNoteSaved: /cemetery office confirmation/i.test(String(participantTaskAfter?.notes || '')),
      coordinatorNotificationRows: (notificationRows || []).filter((row) => notificationText(row).includes('participant') || notificationText(row).includes('task')).length,
    });

    checks.push({
      name: 'funeral_home_proof_spine_contract',
      ok: taskAfter?.status === 'handled'
        && Boolean(taskAfter?.completed_at)
        && (hasEventFor('proof saved') || hasEventFor('completed') || hasEventFor('funeral-home staff recorded proof'))
        && hasNotificationFor('funeral'),
      taskStatus: taskAfter?.status || null,
      completedAt: taskAfter?.completed_at || null,
      proofEvents: (statusEvents || []).filter((row) => /proof|completed|funeral-home/i.test(eventText(row))).length,
      familyNotificationRows: (notificationRows || []).filter((row) => notificationText(row).includes('funeral')).length,
    });

    checks.push({
      name: 'vendor_request_spine_contract',
      ok: vendorTaskAfter?.id === vendorTask.id
        && (vendorRequestRows || []).some((row) => row.status === 'paid' && row.payment_collection_status === 'paid')
        && (vendorOrderRows || []).some((row) => row.payment_status === 'paid')
        && (vendorPaymentRows || []).some((row) => row.status === 'paid')
        && hasEventFor('vendor invoice')
        && hasEventFor('vendor payout'),
      vendorTaskStatus: vendorTaskAfter?.status || null,
      vendorStatuses: Array.from(new Set((vendorRequestRows || []).map((row) => row.status).filter(Boolean))),
      paymentStatuses: Array.from(new Set((vendorPaymentRows || []).map((row) => row.status).filter(Boolean))),
      orderStatuses: Array.from(new Set((vendorOrderRows || []).map((row) => row.payment_status).filter(Boolean))),
    });

    checks.push({
      name: 'spine_rows_recorded',
      ok: Boolean((notificationRows || []).length && (statusEvents || []).length && (estateEvents || []).length && (vendorRequestRows || []).length && (vendorOrderRows || []).length && (vendorPaymentRows || []).length && (announcementRows || []).some((row) => row.status === 'sent')),
      taskStatus: taskAfter?.status || null,
      notificationCount: (notificationRows || []).length,
      statusEventCount: (statusEvents || []).length,
      estateEventCount: (estateEvents || []).length,
      vendorRequestCount: (vendorRequestRows || []).length,
      vendorOrderCount: (vendorOrderRows || []).length,
      vendorPaymentCount: (vendorPaymentRows || []).length,
      announcementCount: (announcementRows || []).length,
      notificationStatuses: Array.from(new Set((notificationRows || []).map((row) => row.status).filter(Boolean))),
      notificationSources: Array.from(new Set((notificationRows || []).map((row) => row.source).filter(Boolean))),
      vendorStatuses: Array.from(new Set((vendorRequestRows || []).map((row) => row.status).filter(Boolean))),
      vendorPaymentStatuses: Array.from(new Set((vendorPaymentRows || []).map((row) => row.status).filter(Boolean))),
      announcementStatuses: Array.from(new Set((announcementRows || []).map((row) => row.status).filter(Boolean))),
    });

    if (!keepRecords) {
      await cleanupCreated(created);
    }

    const passed = checks.every((check) => {
      if (check.ok === true) return true;
      if (check.ok === false) return false;
      if (typeof check.status === 'number' && check.status >= 400) return false;
      return true;
    });
    return res.status(passed ? 200 : 207).json({
      success: passed,
      keepRecords,
      recipientEmail,
      cleanedUp: !keepRecords,
      checks,
      personaContracts: summarizePersonaContracts(checks),
    });
  } catch (error) {
    if (!keepRecords) {
      await cleanupCreated(created);
    }
    return res.status(500).json({
      success: false,
      cleanedUp: !keepRecords,
      error: error.message || 'Coordination smoke test failed.',
      created,
      checks,
      personaContracts: summarizePersonaContracts(checks),
    });
  }
}
