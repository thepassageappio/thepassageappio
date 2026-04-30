// pages/api/sendEmail.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const {
    to, toName, subject, taskTitle, deceasedName,
    coordinatorName, workflowId, actionType, events, messageText, cc
  } = req.body;

  if (!to) return res.status(400).json({ error: 'Missing recipient' });

  const KEY = process.env.RESEND_API_KEY;
  if (!KEY) return res.status(200).json({ success: true, skipped: true });

  try {
    const name = toName || to;
    const deceased = deceasedName || 'your loved one';
    const coordinator = coordinatorName || 'the family';

    // Build service block from events
    let serviceRows = '';
    if (events && events.length > 0) {
      events.forEach(function(e) {
        if (!e.date) return;
        const label = e.event_type === 'funeral' ? 'Funeral Service' :
                      e.event_type === 'visitation' ? 'Visitation' :
                      e.event_type === 'burial' ? 'Burial' :
                      e.event_type === 'reception' ? 'Reception' : 'Service';
        const dt = new Date(e.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        const time = e.time ? ' at ' + e.time : '';
        const loc = e.location_name ? ' at ' + e.location_name : '';
        const addr = e.location_address ? '<br><span style="color:#a09890;font-size:12px;">' + e.location_address + '</span>' : '';
        serviceRows += '<tr><td style="padding:6px 0;color:#6a6560;font-size:14px;border-bottom:1px solid #f0ece5;"><strong style="color:#1a1916;">' + label + '</strong><br>' + dt + time + loc + addr + '</td></tr>';
      });
    }

    const serviceBlock = serviceRows ? '<table style="width:100%;border-collapse:collapse;margin:20px 0;background:#f0f5f1;border-radius:12px;padding:4px 16px;"><tbody>' + serviceRows + '</tbody></table>' : '';

    let html;
    if (actionType === 'trigger') {
      html = triggerEmail(name, deceased, coordinator, serviceBlock);
    } else if (actionType === 'invite') {
      html = inviteEmail(name, deceased, coordinator, req.body.confirmUrl);
    } else if (actionType === 'execution') {
      html = executionEmail(name, taskTitle, deceased, coordinator, messageText);
    } else {
      html = assignmentEmail(name, taskTitle, deceased, coordinator, serviceBlock);
    }

    const emailSubject = subject ||
      (actionType === 'trigger' ? deceased + "'s estate plan has been activated" :
       actionType === 'invite' ? 'You have been designated as a confirmation contact' :
       'You have been asked to help — ' + deceased);

    const from = process.env.RESEND_FROM_EMAIL || 'Passage <notifications@thepassageapp.io>';

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], cc: cc ? [cc] : undefined, subject: emailSubject, html }),
    });
    const data = await r.json();

    console.log('Resend response:', JSON.stringify(data));

    if (r.ok && data.id) {
      await supabase.from('notification_log').insert([{
        workflow_id: workflowId || null,
        channel: 'email',
        recipient_email: to,
        recipient_name: name,
        subject: emailSubject,
        provider: 'resend',
        provider_id: data.id,
        status: 'sent',
        sent_at: new Date().toISOString(),
      }]).catch(() => {});
      if (workflowId) {
        await supabase.from('workflow_actions')
          .update({ status: 'sent', sent_at: new Date().toISOString(), delivery_status: 'sent', provider_message_id: data.id })
          .eq('workflow_id', workflowId).eq('action_type', 'email').eq('recipient_email', to)
          .catch(() => {});
      }
      return res.status(200).json({ success: true, id: data.id, from });
    }

    console.error('Resend failed:', JSON.stringify(data));
    return res.status(500).json({ error: data });
  } catch (err) {
    console.error('sendEmail error:', err);
    return res.status(500).json({ error: err.message });
  }
}

function wrap(body) {
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{font-family:Georgia,serif;background:#f6f3ee;margin:0;padding:32px 16px}.card{background:#fff;border-radius:16px;padding:36px 32px;max-width:520px;margin:0 auto;box-shadow:0 2px 16px rgba(0,0,0,0.06)}.logo{font-size:11px;color:#a09890;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:24px}.h1{font-size:22px;color:#1a1916;font-weight:400;line-height:1.35;margin:0 0 14px}.p{color:#6a6560;font-size:14px;line-height:1.75;margin:0 0 12px}.tag{display:inline-block;background:#f0f5f1;border:1px solid #c8deca;border-radius:8px;padding:3px 10px;font-size:11px;color:#6b8f71;font-weight:600;letter-spacing:0.05em;margin-bottom:20px}.task{background:#f6f3ee;border-radius:10px;padding:14px 16px;margin:18px 0}.task-label{font-size:10px;font-weight:700;color:#a09890;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:5px}.task-title{font-size:15px;color:#1a1916;font-weight:600}.btn{display:inline-block;background:#6b8f71;color:#fff;text-decoration:none;padding:13px 26px;border-radius:11px;font-size:15px;font-family:Georgia,serif;font-weight:700;margin:20px 0}.footer{font-size:11px;color:#a09890;margin-top:28px;padding-top:20px;border-top:1px solid #f0ece5;line-height:1.6}</style></head><body><div class="card"><div class="logo">Passage</div>' + body + '<div class="footer">Passage helps families coordinate everything before, during, and after a death.<br><a href="' + SITE_URL + '" style="color:#6b8f71;">thepassageapp.io</a></div></div></body></html>';
}

function assignmentEmail(name, task, deceased, coordinator, serviceBlock) {
  return wrap(
    '<div class="tag">Task assignment</div>' +
    '<div class="h1">You have been asked to help.</div>' +
    '<p class="p">' + coordinator + ' is coordinating the estate of ' + deceased + ' and has designated you for the following task:</p>' +
    '<div class="task"><div class="task-label">Your task</div><div class="task-title">' + (task || 'Estate coordination') + '</div></div>' +
    serviceBlock +
    '<p class="p">You will receive full details when the plan activates. Nothing is required from you right now.</p>' +
    '<a href="' + SITE_URL + '/participating" class="btn">View my Passage role</a>' +
    '<p class="p" style="font-size:12px;color:#a09890;">You can see estates where you have a role, complete assigned tasks, and start your own plan with participant pricing when available.</p>' +
    '<p class="p">Questions? Reach out to ' + coordinator + ' directly.</p>'
  );
}

function executionEmail(name, task, deceased, coordinator, messageText) {
  return wrap(
    '<div class="tag">Prepared next step</div>' +
    '<div class="h1">A Passage task is ready to handle.</div>' +
    '<p class="p">' + coordinator + ' is coordinating next steps for ' + deceased + '.</p>' +
    '<div class="task"><div class="task-label">Task</div><div class="task-title">' + (task || 'Estate coordination') + '</div></div>' +
    '<p class="p" style="white-space:pre-wrap;">' + String(messageText || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p>'
  );
}

function triggerEmail(name, deceased, coordinator, serviceBlock) {
  return wrap(
    '<div class="tag">Plan activated</div>' +
    '<div class="h1">' + deceased + "'s estate plan has been activated.</div>" +
    '<p class="p">We are so sorry for your loss.</p>' +
    '<p class="p">' + name + ', you have been designated to help coordinate the estate of ' + deceased + '. Your full task list is ready.</p>' +
    serviceBlock +
    '<a href="' + SITE_URL + '/participating" class="btn">View your task list</a>' +
    '<p class="p" style="font-size:12px;color:#a09890;">Once you create an account, Passage can show every estate where you have a role in one place.</p>' +
    '<p class="p" style="margin-top:16px;">Questions? Reach out to ' + coordinator + ' directly.</p>'
  );
}

function inviteEmail(name, deceased, coordinator, confirmUrl) {
  return wrap(
    '<div class="tag">Confirmation request</div>' +
    '<div class="h1">You have been designated as a confirmation contact.</div>' +
    '<p class="p">' + coordinator + ' has set up an advance estate plan through Passage for ' + deceased + '.</p>' +
    '<p class="p">When the time comes, you will receive a secure link to confirm. Once two people confirm, the plan activates and all assigned contacts are notified automatically.</p>' +
    (confirmUrl ? '<a href="' + confirmUrl + '" class="btn">View confirmation page</a>' : '') +
    '<p class="p">You can also create your own Passage account to see estate roles assigned to you and start a plan for your own family.</p>' +
    '<a href="' + SITE_URL + '/participating" class="btn">Create my Passage account</a>' +
    '<p class="p" style="color:#a09890;font-size:12px;margin-top:16px;">You do not need to do anything right now.</p>'
  );
}
