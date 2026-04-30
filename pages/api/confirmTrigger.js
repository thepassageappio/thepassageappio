// pages/api/confirmTrigger.js
// The two-person death confirmation system.
//
// GREEN PATH: User set up plan in advance. When they die, 2 designated people
// must independently confirm at thepassageapp.io/confirm?token=XYZ before 
// the waterfall fires. Prevents accidental or malicious activation.
//
// RED PATH: Someone is already dead. Coordinator already going through flow.
// Confirmation still fires the notification waterfall to all assigned people.
//
// Flow:
// 1. POST /api/confirmTrigger with { workflowId, confirmerId, confirmerEmail, confirmerName }
// 2. First confirmation saved — workflow.confirmed_by = [person1]
// 3. Second confirmation received — workflow.confirmed_by = [person1, person2]
// 4. confirmation_count reached → status = 'triggered' → fire all workflow_actions

import { createClient } from '@supabase/supabase-js';
import { internalHeaders } from '../../lib/deliveryAuth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { workflowId, confirmerEmail, confirmerName } = req.body;
  if (!workflowId) return res.status(400).json({ error: 'Missing workflowId' });

  try {
    // 1. Load the workflow
    const { data: workflow, error: wfError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single();

    if (wfError || !workflow) return res.status(404).json({ error: 'Workflow not found' });
    if (workflow.status === 'triggered') return res.status(200).json({ success: true, alreadyTriggered: true });

    // 2. Add this confirmation
    const currentConfirmations = workflow.confirmed_by || [];
    const confirmerKey = confirmerEmail || confirmerName || 'anonymous';
    
    if (currentConfirmations.includes(confirmerKey)) {
      return res.status(200).json({ success: true, message: 'Already confirmed by this person', confirmations: currentConfirmations.length });
    }

    const updatedConfirmations = [...currentConfirmations, confirmerKey];
    const requiredCount = workflow.confirmation_count || 2;
    const isTriggered = updatedConfirmations.length >= requiredCount;

    // 3. Update workflow
    await supabase.from('workflows').update({
      confirmed_by: updatedConfirmations,
      status: isTriggered ? 'triggered' : workflow.status,
      triggered_at: isTriggered ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq('id', workflowId);

    // 4. If triggered — fire all pending workflow_actions
    if (isTriggered) {
      await fireAllActions(workflowId, workflow);
    }

    return res.status(200).json({
      success: true,
      triggered: isTriggered,
      confirmations: updatedConfirmations.length,
      required: requiredCount,
      message: isTriggered
        ? 'Plan activated. All notifications are being sent.'
        : `Confirmation ${updatedConfirmations.length} of ${requiredCount} received. Waiting for one more.`,
    });
  } catch (err) {
    console.error('confirmTrigger error:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function fireAllActions(workflowId, workflow) {
  // Load all pending actions
  const { data: actions } = await supabase
    .from('workflow_actions')
    .select('*')
    .eq('workflow_id', workflowId)
    .eq('status', 'pending');

  if (!actions?.length) return;

  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');
  const deceasedName = workflow.deceased_name || 'your loved one';
  const coordinatorName = workflow.coordinator_name || 'the family coordinator';

  for (const action of actions) {
    try {
      if (action.action_type === 'email' && action.recipient_email) {
        await fetch(`${baseUrl}/api/sendEmail`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...internalHeaders() },
          body: JSON.stringify({
            to: action.recipient_email,
            toName: action.recipient_email,
            subject: `${deceasedName}'s estate plan has been activated`,
            deceasedName,
            coordinatorName,
            workflowId,
            actionType: 'trigger',
          }),
        });
      }

      if (action.action_type === 'sms' && action.recipient_phone) {
        await fetch(`${baseUrl}/api/sendSMS`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...internalHeaders() },
          body: JSON.stringify({
            to: action.recipient_phone,
            deceasedName,
            coordinatorName,
            workflowId,
            actionType: 'trigger',
          }),
        });
      }
    } catch (err) {
      console.error(`Failed to fire action ${action.id}:`, err);
      await supabase.from('workflow_actions')
        .update({ status: 'needs_review', error_message: err.message })
        .eq('id', action.id);
    }
  }
}
