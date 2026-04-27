// pages/api/sendEmail.js
// Sends task assignment emails via Resend
// Called when a task is assigned OR when trigger fires

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { 
    to,           // email address
    toName,       // recipient name
    subject,      // email subject
    taskTitle,    // specific task being assigned
    deceasedName, // name of the deceased
    coordinatorName, // who is coordinating
    workflowId,   // for tracking
    actionType = 'assignment', // 'assignment' | 'trigger'
  } = req.body;

  if (!to) return res.status(400).json({ error: 'Missing recipient email' });

  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not set — email not sent');
      return res.status(200).json({ success: true, skipped: true });
    }

    const emailBody = actionType === 'trigger' ? buildTriggerEmail(toName, deceasedName, coordinatorName) : buildAssignmentEmail(toName, taskTitle, deceasedName, coordinatorName);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Passage <notifications@thepassageapp.io>',
        to: [to],
        subject: subject || `You've been asked to help — ${deceasedName || 'estate coordination'}`,
        html: emailBody,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend error:', data);
      return res.status(500).json({ error: data });
    }

    // Mark workflow_action as sent
    if (workflowId) {
      await supabase.from('workflow_actions')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('workflow_id', workflowId)
        .eq('action_type', 'email')
        .eq('recipient_email', to);
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    console.error('sendEmail error:', err);
    return res.status(500).json({ error: err.message });
  }
}

function buildAssignmentEmail(toName, taskTitle, deceasedName, coordinatorName) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: Georgia, serif; background: #f6f3ee; margin: 0; padding: 40px 20px; }
  .card { background: white; border-radius: 16px; padding: 40px; max-width: 520px; margin: 0 auto; }
  .logo { font-size: 22px; color: #1a1916; margin-bottom: 32px; }
  .dove { font-size: 28px; margin-bottom: 16px; }
  h1 { font-size: 22px; color: #1a1916; font-weight: 400; margin: 0 0 16px; line-height: 1.3; }
  p { color: #6a6560; font-size: 15px; line-height: 1.7; margin: 0 0 16px; }
  .task-box { background: #f0f5f1; border: 1px solid #c8deca; border-radius: 12px; padding: 16px 20px; margin: 24px 0; }
  .task-label { font-size: 10px; color: #6b8f71; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 6px; }
  .task-title { font-size: 15px; color: #1a1916; font-weight: 600; }
  .footer { font-size: 12px; color: #a09890; margin-top: 32px; border-top: 1px solid #e4ddd4; padding-top: 20px; }
  a { color: #6b8f71; }
</style></head>
<body>
  <div class="card">
    <div class="logo">🕊️ Passage</div>
    <div class="dove"></div>
    <h1>You've been asked to help${deceasedName ? ` with ${deceasedName}'s estate` : ''}.</h1>
    <p>${coordinatorName || 'A family member'} is coordinating an estate plan through Passage and has assigned you a task.</p>

    <div class="task-box">
      <div class="task-label">Your assigned task</div>
      <div class="task-title">${taskTitle || 'Estate coordination task'}</div>
    </div>

    <p>You'll receive more details, including any deadlines and instructions, when the full plan is activated. You don't need to do anything right now.</p>
    <p>If you have questions, reach out to ${coordinatorName || 'the person coordinating'} directly.</p>

    <div class="footer">
      This message was sent by Passage on behalf of ${coordinatorName || 'a family member'}. 
      Passage helps families coordinate everything before, during, and after a death.<br><br>
      <a href="https://thepassageapp.io">thepassageapp.io</a>
    </div>
  </div>
</body>
</html>`;
}

function buildTriggerEmail(toName, deceasedName, coordinatorName) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: Georgia, serif; background: #f6f3ee; margin: 0; padding: 40px 20px; }
  .card { background: white; border-radius: 16px; padding: 40px; max-width: 520px; margin: 0 auto; }
  .logo { font-size: 22px; color: #1a1916; margin-bottom: 32px; }
  h1 { font-size: 22px; color: #1a1916; font-weight: 400; margin: 0 0 16px; line-height: 1.3; }
  p { color: #6a6560; font-size: 15px; line-height: 1.7; margin: 0 0 16px; }
  .cta { display: inline-block; background: #6b8f71; color: white; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-size: 15px; font-weight: 700; margin: 16px 0; }
  .footer { font-size: 12px; color: #a09890; margin-top: 32px; border-top: 1px solid #e4ddd4; padding-top: 20px; }
  a { color: #6b8f71; }
</style></head>
<body>
  <div class="card">
    <div class="logo">🕊️ Passage</div>
    <h1>${deceasedName ? `${deceasedName}'s` : 'The'} estate plan has been activated.</h1>
    <p>We're so sorry for your loss.</p>
    <p>${toName ? `${toName}, you` : 'You'} have been designated to help coordinate the estate of ${deceasedName || 'your loved one'}. Your full task list is ready.</p>
    <p>Passage has organized everything that needs to happen — from the next 24 hours through the next 60 days. Nothing will be missed.</p>
    
    <a href="https://thepassageapp.io" class="cta">View your task list →</a>

    <p style="margin-top: 24px;">If you have questions, reach out to ${coordinatorName || 'the family coordinator'} directly.</p>
    
    <div class="footer">
      This message was sent by Passage. Two family members confirmed this event before this message was sent.<br><br>
      <a href="https://thepassageapp.io">thepassageapp.io</a> · <a href="https://thepassageapp.io">Manage notifications</a>
    </div>
  </div>
</body>
</html>`;
}
