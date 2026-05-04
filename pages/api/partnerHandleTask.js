import { createClient } from '@supabase/supabase-js';
import { recordStatusEvent } from '../../lib/taskStatus';
import { isPassageAdmin } from '../../lib/adminAccess';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authClient = createClient(url, anon);
const admin = createClient(url, service);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Please sign in first.' });

  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user?.email) return res.status(401).json({ error: 'Session could not be verified.' });

    const { taskId, note } = req.body || {};
    if (!taskId) return res.status(400).json({ error: 'Missing task.' });
    const cleanNote = String(note || '').trim();
    if (!cleanNote) return res.status(400).json({ error: 'Add what was handled before notifying the family.' });

  try {
    const { data: task, error: taskError } = await admin
      .from('tasks')
      .select('id,workflow_id,title')
      .eq('id', taskId)
      .maybeSingle();
    if (taskError) throw taskError;
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    const { data: workflow, error: workflowError } = await admin
      .from('workflows')
      .select('id,estate_name,deceased_name,coordinator_name,coordinator_email,organization_id')
      .eq('id', task.workflow_id)
      .maybeSingle();
    if (workflowError) throw workflowError;
    if (!workflow?.organization_id) return res.status(403).json({ error: 'This is not a partner case.' });

    const { data: member } = await admin
      .from('organization_members')
      .select('id')
      .eq('organization_id', workflow.organization_id)
      .ilike('email', user.email)
      .eq('status', 'active')
      .limit(1);
    if (!member?.length && !isPassageAdmin(user.email)) return res.status(403).json({ error: 'You do not have access to this partner case.' });

    const { data: organization } = await admin
      .from('organizations')
      .select('name,from_name,support_email')
      .eq('id', workflow.organization_id)
      .maybeSingle();

    const orgName = organization?.from_name || organization?.name || 'The funeral home';
    const subjectName = workflow.deceased_name || workflow.estate_name || 'this family case';
    const detail = cleanNote;

    const statusResult = await recordStatusEvent({
      workflowId: workflow.id,
      taskId: task.id,
      status: 'handled',
      actor: user.email,
      channel: 'record',
      recipient: workflow.coordinator_name || workflow.coordinator_email || 'Family coordinator',
      detail,
    });

    let emailSent = false;
    if (workflow.coordinator_email && process.env.RESEND_API_KEY) {
      const from = process.env.RESEND_FROM_EMAIL || 'Passage <notifications@thepassageapp.io>';
      const html = `
        <div style="font-family:Georgia,serif;background:#f6f3ee;padding:24px">
          <div style="max-width:560px;margin:auto;background:#fffdf9;border:1px solid #e4ddd4;border-radius:16px;padding:26px">
            <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#6b8f71;font-weight:700">Passage update</div>
            <h1 style="font-weight:400;color:#1a1916;font-size:24px;line-height:1.25">Handled for the family</h1>
            <p style="color:#6a6560;line-height:1.7">${escapeHtml(orgName)} recorded a completed update for ${escapeHtml(subjectName)}.</p>
            <div style="background:#f0f5f1;border:1px solid #c8deca;border-radius:12px;padding:14px;color:#1a1916"><strong>${escapeHtml(task.title)}</strong><br><span style="color:#6a6560">${escapeHtml(detail)}</span></div>
            <p style="color:#6a6560;line-height:1.7">This update is saved in the Passage case record.</p>
          </div>
        </div>`;
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to: [workflow.coordinator_email],
          subject: `${orgName} handled: ${task.title}`,
          html,
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (response.ok && json.id) {
        emailSent = true;
        await admin.from('notification_log').insert([{
          workflow_id: workflow.id,
          channel: 'email',
          recipient_email: workflow.coordinator_email,
          recipient_name: workflow.coordinator_name || workflow.coordinator_email,
          subject: `${orgName} handled: ${task.title}`,
          provider: 'resend',
          provider_id: json.id,
          status: 'sent',
          sent_at: new Date().toISOString(),
        }]).then(() => {}, () => {});
      } else {
        await admin.from('notification_log').insert([{
          workflow_id: workflow.id,
          channel: 'email',
          recipient_email: workflow.coordinator_email,
          recipient_name: workflow.coordinator_name || workflow.coordinator_email,
          subject: `${orgName} handled: ${task.title}`,
          provider: 'resend',
          provider_id: null,
          status: 'failed',
          error_message: json?.message || json?.error || 'Family notification failed after partner action.',
        }]).then(() => {}, () => {});
      }
    }

    return res.status(200).json({ success: true, emailSent, statusResult });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Could not handle this task for the family.' });
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
