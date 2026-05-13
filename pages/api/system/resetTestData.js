import { createClient } from '@supabase/supabase-js';
import { isPassageAdmin, passageAdminEmails } from '../../../lib/adminAccess';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CONFIRM_PHRASE = 'RESET PASSAGE TEST DATA';

const RESET_TABLES = [
  'document_packets',
  'workflow_actions',
  'workflow_events',
  'workflow_announcements',
  'task_status_events',
  'orchestration_events',
  'estate_events',
  'communication_events',
  'task_communications',
  'notification_log',
  'scheduled_deliveries',
  'message_deliveries',
  'vendor_payments',
  'vendor_requests',
  'funeral_home_requests',
  'announcements',
  'estate_files',
  'estate_access',
  'estate_participants',
  'task_assignments',
  'tasks',
  'outcomes',
  'people',
  'documents',
  'workflows',
  'vendor_team_members',
  'funeral_home_preferred_vendors',
  'vendors',
  'partner_locations',
  'organization_members',
  'organizations',
  'subscriptions',
  'account_entitlements',
  'impact_commitments',
  'crm_sync_events',
  'webhook_events',
  'leads',
  'support_inquiries',
  'profiles',
  'users',
];

function clients() {
  if (!url || !anon || !service) {
    return { error: 'Production reset is not configured. Supabase URL, anon key, and service role key are required.' };
  }
  return {
    authClient: createClient(url, anon),
    admin: createClient(url, service),
  };
}

async function requireAdmin(req) {
  const configured = clients();
  if (configured.error) return { ok: false, status: 500, error: configured.error };
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return { ok: false, status: 401, error: 'Please sign in first.' };
  const { data, error } = await configured.authClient.auth.getUser(token);
  const email = data?.user?.email?.toLowerCase();
  if (error || !email) return { ok: false, status: 401, error: 'Session could not be verified.' };
  if (!isPassageAdmin(email)) return { ok: false, status: 403, error: 'System admin access required.' };
  return { ok: true, user: data.user, admin: configured.admin };
}

async function countTable(admin, table) {
  try {
    const { count, error } = await admin.from(table).select('id', { count: 'exact', head: true });
    if (error) return { table, count: null, skipped: true, error: error.message };
    return { table, count: count || 0 };
  } catch (error) {
    return { table, count: null, skipped: true, error: error.message };
  }
}

async function deleteTable(admin, table) {
  try {
    const before = await countTable(admin, table);
    if (before.skipped) return { ...before, deleted: 0 };
    if (!before.count) return { table, count: 0, deleted: 0 };
    const { error } = await admin.from(table).delete().not('id', 'is', null);
    if (error) return { table, count: before.count, deleted: 0, error: error.message };
    const after = await countTable(admin, table);
    return { table, count: before.count, deleted: Math.max((before.count || 0) - (after.count || 0), 0), remaining: after.count || 0 };
  } catch (error) {
    return { table, count: null, deleted: 0, error: error.message };
  }
}

async function deletePublicUsers(admin) {
  const keep = new Set(passageAdminEmails());
  const before = await countTable(admin, 'users');
  if (before.skipped) return { ...before, deleted: 0 };
  const deleted = [];
  const kept = [];
  const errors = [];

  try {
    for (let from = 0; from < 10000; from += 1000) {
      const { data, error } = await admin
        .from('users')
        .select('id,email')
        .range(from, from + 999);
      if (error) {
        errors.push(error.message);
        break;
      }
      const rows = data || [];
      for (const row of rows) {
        const email = String(row.email || '').toLowerCase();
        if (email && keep.has(email)) {
          kept.push(email);
          continue;
        }
        if (!row.id) continue;
        const { error: deleteError } = await admin.from('users').delete().eq('id', row.id);
        if (deleteError) errors.push(`${email || row.id}: ${deleteError.message}`);
        else deleted.push(email || row.id);
      }
      if (rows.length < 1000) break;
    }
  } catch (error) {
    errors.push(error.message);
  }

  const after = await countTable(admin, 'users');
  return {
    table: 'users',
    count: before.count || 0,
    deleted: deleted.length,
    remaining: after.count || 0,
    kept: kept.length,
    errors,
  };
}

async function deleteNonAdminAuthUsers(admin) {
  const keep = new Set(passageAdminEmails());
  const deleted = [];
  const kept = [];
  const errors = [];
  try {
    for (let page = 1; page <= 10; page += 1) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) {
        errors.push(error.message);
        break;
      }
      const users = data?.users || [];
      for (const user of users) {
        const email = String(user.email || '').toLowerCase();
        if (keep.has(email)) {
          kept.push(email || user.id);
        } else {
          const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
          if (deleteError) errors.push(`${email || user.id}: ${deleteError.message}`);
          else deleted.push(email || user.id);
        }
      }
      if (users.length < 1000) break;
    }
  } catch (error) {
    errors.push(error.message);
  }
  return { deleted: deleted.length, kept: kept.length, errors };
}

export default async function handler(req, res) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  if (req.method === 'GET') {
    const counts = await Promise.all(RESET_TABLES.map((table) => countTable(auth.admin, table)));
    return res.status(200).json({
      mode: 'dry_run',
      confirmPhrase: CONFIRM_PHRASE,
      tables: counts,
      totalRows: counts.reduce((sum, row) => sum + (Number(row.count) || 0), 0),
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { confirmPhrase, includeAuthUsers = true } = req.body || {};
  if (confirmPhrase !== CONFIRM_PHRASE) {
    return res.status(400).json({ error: `Type ${CONFIRM_PHRASE} to reset production test data.` });
  }

  const tableResults = [];
  for (const table of RESET_TABLES) {
    tableResults.push(table === 'users' ? await deletePublicUsers(auth.admin) : await deleteTable(auth.admin, table));
  }
  const authResult = includeAuthUsers ? await deleteNonAdminAuthUsers(auth.admin) : { deleted: 0, kept: 0, errors: [] };

  return res.status(200).json({
    success: true,
    tables: tableResults,
    totalDeletedRows: tableResults.reduce((sum, row) => sum + (Number(row.deleted) || 0), 0),
    authUsers: authResult,
    preservedAdminEmails: passageAdminEmails(),
  });
}
