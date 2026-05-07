import { createClient } from '@supabase/supabase-js';
import { isPassageAdmin } from '../../../lib/adminAccess';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

function configuredClients() {
  if (!url || !anon || !service) {
    return { error: 'System metrics are not configured. Supabase URL, anon key, and service role key are required.' };
  }
  return {
    authClient: createClient(url, anon),
    admin: createClient(url, service),
  };
}

async function requireSystemAdmin(req) {
  const configured = configuredClients();
  if (configured.error) return { ok: false, status: 500, error: configured.error };
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return { ok: false, status: 401, error: 'Please sign in first.' };
  const { data, error } = await configured.authClient.auth.getUser(token);
  const email = data?.user?.email?.toLowerCase();
  if (error || !email) return { ok: false, status: 401, error: 'Session could not be verified.' };
  if (!isPassageAdmin(email)) return { ok: false, status: 403, error: 'System admin access required.' };
  return { ok: true, user: data.user, admin: configured.admin };
}

async function countRows(admin, table, filters = []) {
  try {
    let query = admin.from(table).select('id', { count: 'exact', head: true });
    filters.forEach((filter) => {
      query = query[filter.op](filter.column, filter.value);
    });
    const { count, error } = await query;
    if (error) return { value: null, status: 'unavailable', source: table, error: error.message };
    return { value: count || 0, status: 'real', source: table };
  } catch (error) {
    return { value: null, status: 'unavailable', source: table, error: error.message };
  }
}

async function sumColumn(admin, table, column, filters = []) {
  try {
    let query = admin.from(table).select(column);
    filters.forEach((filter) => {
      query = query[filter.op](filter.column, filter.value);
    });
    const { data, error } = await query.limit(10000);
    if (error) return { value: null, status: 'unavailable', source: table, error: error.message };
    const value = (data || []).reduce((sum, row) => sum + (Number(row[column]) || 0), 0);
    return { value, status: 'real', source: table };
  } catch (error) {
    return { value: null, status: 'unavailable', source: table, error: error.message };
  }
}

function metric(label, result, unit = '') {
  return {
    label,
    value: result.value,
    unit,
    status: result.status,
    source: result.source,
    error: result.error || null,
  };
}

function csvEscape(value) {
  const text = value == null ? '' : String(value);
  return '"' + text.replace(/"/g, '""') + '"';
}

function toCsv(metrics) {
  const rows = [['label', 'value', 'unit', 'status', 'source', 'error']];
  metrics.forEach((item) => rows.push([item.label, item.value, item.unit, item.status, item.source, item.error]));
  return rows.map((row) => row.map(csvEscape).join(',')).join('\n');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const auth = await requireSystemAdmin(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const [
    estates,
    urgentEstates,
    planningEstates,
    tasks,
    doneTasks,
    pendingTasks,
    estateParticipants,
    vendors,
    activeVendors,
    vendorRequests,
    marketplaceValue,
    subscriptions,
    accounts,
    funeralHomePartners,
    organizations,
    notifications,
  ] = await Promise.all([
    countRows(auth.admin, 'workflows'),
    countRows(auth.admin, 'workflows', [{ op: 'eq', column: 'path', value: 'red' }]),
    countRows(auth.admin, 'workflows', [{ op: 'eq', column: 'path', value: 'green' }]),
    countRows(auth.admin, 'tasks'),
    countRows(auth.admin, 'tasks', [{ op: 'eq', column: 'status', value: 'done' }]),
    countRows(auth.admin, 'tasks', [{ op: 'eq', column: 'status', value: 'pending' }]),
    countRows(auth.admin, 'estate_participants'),
    countRows(auth.admin, 'vendors'),
    countRows(auth.admin, 'vendors', [{ op: 'eq', column: 'status', value: 'active' }]),
    countRows(auth.admin, 'vendor_requests'),
    sumColumn(auth.admin, 'vendor_requests', 'final_value_cents'),
    countRows(auth.admin, 'subscriptions'),
    countRows(auth.admin, 'accounts'),
    countRows(auth.admin, 'funeral_home_partners'),
    countRows(auth.admin, 'organizations'),
    countRows(auth.admin, 'notification_log'),
  ]);

  const metrics = [
    metric('Total estates', estates),
    metric('Urgent red-path estates', urgentEstates),
    metric('Planning green-path estates', planningEstates),
    metric('Total tasks', tasks),
    metric('Done tasks', doneTasks),
    metric('Pending / waiting tasks', pendingTasks),
    metric('Estate participants', estateParticipants),
    metric('Vendors', vendors),
    metric('Active vendors', activeVendors),
    metric('Vendor requests', vendorRequests),
    metric('Marketplace final value', marketplaceValue, 'cents'),
    metric('Subscriptions', subscriptions),
    metric('Accounts', accounts),
    metric('Funeral-home partners', funeralHomePartners),
    metric('Organizations', organizations),
    metric('Notifications logged', notifications),
  ];

  if (req.query.format === 'csv') {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="passage-system-metrics.csv"');
    return res.status(200).send(toCsv(metrics));
  }

  return res.status(200).json({
    generatedAt: new Date().toISOString(),
    owner: auth.user.email,
    metrics,
  });
}
