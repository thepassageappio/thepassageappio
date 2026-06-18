import { createClient } from '@supabase/supabase-js';
import { syncLeadToHubSpot } from '../../lib/hubspot';
import { getRequestIp, durableRateLimit } from '../../lib/inMemoryRateLimit';
import { getRateLimitPolicy } from '../../lib/rateLimitPolicy';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // service role for server-side writes
);

function clean(value, max = 500) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function isRealEmail(value) {
  const email = clean(value, 180).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return false;
  const domain = email.split('@')[1] || '';
  if (!domain || domain.includes('..')) return false;
  if (['example.com', 'test.com', 'fake.com', 'none.com', 'noemail.com'].includes(domain)) return false;
  if (/^(test|fake|none|asdf|na|noreply|no-reply)@/.test(email)) return false;
  return true;
}

function intakeKey(req, email) {
  return ['saveLead', getRequestIp(req), clean(email, 180).toLowerCase() || 'no-email'].join(':');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const {
      email,
      your_email,
      name,
      your_name,
      first_name,
      flow_type,
      mode,
      deceased_name,
      relationship,
      executor_name,
      executor_email,
      disposition,
      service_type,
      timestamp,
    } = body;

    // Resolve email and name from either field name
    const resolvedEmail = clean(email || your_email || executor_email, 180).toLowerCase();
    const resolvedName = clean(name || your_name || first_name || executor_name, 160) || null;

    if (!isRealEmail(resolvedEmail)) {
      return res.status(400).json({ error: 'Please enter a real email address.' });
    }

    const contactPolicy = getRateLimitPolicy('contactIntake');
    const limit = await durableRateLimit(supabase, {
      key: intakeKey(req, resolvedEmail),
      windowSeconds: contactPolicy.windowSeconds,
      maxRequests: contactPolicy.maxRequests,
    });
    if (!limit.allowed) {
      res.setHeader('Retry-After', String(limit.retryAfterSeconds || contactPolicy.windowSeconds));
      return res.status(200).json({ success: true, throttled: true, reason: 'lead_intake_rate_limited' });
    }


    // Write to Supabase leads table
    const { error } = await supabase.from('leads').insert([{
      email: resolvedEmail,
      first_name: resolvedName,
      flow_type: clean(flow_type, 80) || 'unknown',
      source: 'web',
      notes: JSON.stringify({
        mode: clean(mode, 80),
        deceased_name: clean(deceased_name, 160),
        relationship: clean(relationship, 120),
        executor_name: clean(executor_name, 160),
        executor_email: clean(executor_email, 180),
        disposition: clean(disposition, 120),
        service_type: clean(service_type, 120),
        timestamp: timestamp || new Date().toISOString(),
      }),
    }]);

    if (error) {
      console.error('Lead save error:', error);
      // Don't fail the request: lead capture is non-critical.
    }

    await syncLeadToHubSpot({
      admin: supabase,
      eventType: 'web_lead',
      source: 'web',
      contact: {
        email: resolvedEmail,
        name: resolvedName,
        persona: flow_type === 'red' || mode === 'urgent' ? 'red_path_family' : flow_type === 'green' ? 'green_path_family' : 'family',
        lifecycleStage: 'lead',
      },
      deal: flow_type === 'red' || mode === 'urgent' ? {
        name: `Urgent help lead: ${resolvedName || resolvedEmail || 'New family'}`,
        amount: 79,
        persona: 'red_path_family',
        description: `Urgent family lead from Passage. Loved one: ${clean(deceased_name, 160) || 'Not provided'}. Relationship: ${clean(relationship, 120) || 'Not provided'}.`,
      } : {},
      payload: {
        mode: clean(mode, 80),
        flow_type: clean(flow_type, 80),
        deceased_name: clean(deceased_name, 160),
        relationship: clean(relationship, 120),
        executor_name: clean(executor_name, 160),
        disposition: clean(disposition, 120),
        service_type: clean(service_type, 120),
      },
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('saveLead handler error:', err);
    return res.status(200).json({ success: true }); // still 200: never block the flow
  }
}