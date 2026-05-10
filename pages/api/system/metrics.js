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

async function fetchRecentLeads(admin) {
  try {
    const { data, error } = await admin
      .from('leads')
      .select('id,email,first_name,flow_type,source,notes,created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) return { rows: [], error: error.message };
    return { rows: data || [], error: null };
  } catch (error) {
    return { rows: [], error: error.message };
  }
}

async function fetchSubscriptionRows(admin) {
  try {
    const { data, error } = await admin
      .from('subscriptions')
      .select('*')
      .limit(10000);
    if (error) return { rows: [], status: 'unavailable', source: 'subscriptions', error: error.message };
    return { rows: data || [], status: 'real', source: 'subscriptions' };
  } catch (error) {
    return { rows: [], status: 'unavailable', source: 'subscriptions', error: error.message };
  }
}

function centsFromRow(row) {
  const keys = [
    'mrr_cents',
    'monthly_amount_cents',
    'amount_cents',
    'price_cents',
    'unit_amount_cents',
    'unit_amount',
    'plan_amount_cents',
  ];
  for (const key of keys) {
    const value = Number(row?.[key]);
    if (Number.isFinite(value) && value > 0) return value;
  }
  const dollarKeys = ['mrr', 'monthly_amount', 'amount', 'price'];
  for (const key of dollarKeys) {
    const value = Number(row?.[key]);
    if (Number.isFinite(value) && value > 0) return Math.round(value * 100);
  }
  return 0;
}

function intervalForRow(row) {
  return String(row?.interval || row?.billing_interval || row?.plan_interval || row?.recurring_interval || '').toLowerCase();
}

function activeSubscription(row) {
  const status = String(row?.status || row?.subscription_status || row?.plan_status || '').toLowerCase();
  return ['active', 'trialing', 'paid', 'past_due'].includes(status);
}

function summarizeRevenue(subscriptionResult) {
  if (subscriptionResult.status !== 'real') {
    return {
      mrrCents: { value: null, status: 'unavailable', source: subscriptionResult.source, error: subscriptionResult.error },
      arrCents: { value: null, status: 'unavailable', source: subscriptionResult.source, error: subscriptionResult.error },
      activeSubscriptions: { value: null, status: 'unavailable', source: subscriptionResult.source, error: subscriptionResult.error },
      trialSubscriptions: { value: null, status: 'unavailable', source: subscriptionResult.source, error: subscriptionResult.error },
    };
  }
  const activeRows = (subscriptionResult.rows || []).filter(activeSubscription);
  const trialRows = (subscriptionResult.rows || []).filter(row => String(row?.status || row?.subscription_status || '').toLowerCase() === 'trialing');
  const mrr = activeRows.reduce((sum, row) => {
    const cents = centsFromRow(row);
    const interval = intervalForRow(row);
    if (interval.includes('year') || interval.includes('annual')) return sum + Math.round(cents / 12);
    if (interval.includes('week')) return sum + Math.round(cents * 52 / 12);
    return sum + cents;
  }, 0);
  return {
    mrrCents: { value: mrr, status: 'real', source: 'subscriptions' },
    arrCents: { value: mrr * 12, status: 'real', source: 'subscriptions' },
    activeSubscriptions: { value: activeRows.length, status: 'real', source: 'subscriptions.status' },
    trialSubscriptions: { value: trialRows.length, status: 'real', source: 'subscriptions.status' },
  };
}

function parseLeadNotes(notes) {
  try {
    return notes ? JSON.parse(notes) : {};
  } catch {
    return {};
  }
}

function summarizeLeads(rows = []) {
  const byType = {};
  const bySource = {};
  const recent = [];
  rows.forEach((row) => {
    const notes = parseLeadNotes(row.notes);
    const type = notes.category || row.flow_type || 'Unknown';
    const source = row.source || notes.source || 'Unknown';
    byType[type] = (byType[type] || 0) + 1;
    bySource[source] = (bySource[source] || 0) + 1;
    if (recent.length < 12) {
      recent.push({
        email: row.email || '',
        name: row.first_name || '',
        type,
        source,
        urgency: notes.urgency || '',
        createdAt: row.created_at || '',
      });
    }
  });
  return {
    byType: Object.entries(byType).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
    bySource: Object.entries(bySource).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
    recent,
  };
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

function formatMetricValue(item) {
  if (item.value == null) return '';
  if (item.unit === 'cents') return '$' + (Number(item.value || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return item.value;
}

function csvEscape(value) {
  const text = value == null ? '' : String(value);
  return '"' + text.replace(/"/g, '""') + '"';
}

function toRawCsv(metrics, leadSummary) {
  const rows = [['section', 'label', 'value', 'unit', 'status', 'source', 'error']];
  metrics.forEach((item) => rows.push(['metrics', item.label, formatMetricValue(item) || item.value, item.unit, item.status, item.source, item.error]));
  (leadSummary.byType || []).forEach((item) => rows.push(['lead_type', item.label, item.count, '', 'real', 'leads.notes.category', '']));
  (leadSummary.bySource || []).forEach((item) => rows.push(['lead_source', item.label, item.count, '', 'real', 'leads.source', '']));
  (leadSummary.recent || []).forEach((item) => rows.push(['recent_lead', item.type, item.email, item.urgency, 'real', item.source, item.createdAt]));
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
    waitingTasks,
    blockedTasks,
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
    failedNotifications,
    deliveredNotifications,
    leads,
    recentLeads,
    subscriptionRows,
  ] = await Promise.all([
    countRows(auth.admin, 'workflows'),
    countRows(auth.admin, 'workflows', [{ op: 'eq', column: 'path', value: 'red' }]),
    countRows(auth.admin, 'workflows', [{ op: 'eq', column: 'path', value: 'green' }]),
    countRows(auth.admin, 'tasks'),
    countRows(auth.admin, 'tasks', [{ op: 'eq', column: 'status', value: 'done' }]),
    countRows(auth.admin, 'tasks', [{ op: 'eq', column: 'status', value: 'pending' }]),
    countRows(auth.admin, 'tasks', [{ op: 'in', column: 'status', value: ['pending', 'waiting', 'sent', 'assigned'] }]),
    countRows(auth.admin, 'tasks', [{ op: 'in', column: 'status', value: ['blocked', 'failed', 'needs_review'] }]),
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
    countRows(auth.admin, 'notification_log', [{ op: 'eq', column: 'status', value: 'failed' }]),
    countRows(auth.admin, 'notification_log', [{ op: 'eq', column: 'status', value: 'delivered' }]),
    countRows(auth.admin, 'leads'),
    fetchRecentLeads(auth.admin),
    fetchSubscriptionRows(auth.admin),
  ]);
  const leadSummary = summarizeLeads(recentLeads.rows);
  const revenue = summarizeRevenue(subscriptionRows);

  const metrics = [
    metric('MRR', revenue.mrrCents, 'cents'),
    metric('ARR', revenue.arrCents, 'cents'),
    metric('Active subscriptions', revenue.activeSubscriptions),
    metric('Trials / pilots', revenue.trialSubscriptions),
    metric('Total estates', estates),
    metric('Urgent red-path estates', urgentEstates),
    metric('Planning green-path estates', planningEstates),
    metric('Total tasks', tasks),
    metric('Done tasks', doneTasks),
    metric('Pending / waiting tasks', pendingTasks),
    metric('Open waiting tasks', waitingTasks),
    metric('Blocked / needs-review tasks', blockedTasks),
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
    metric('Failed notifications', failedNotifications),
    metric('Delivered notifications', deliveredNotifications),
    metric('Leads and support inquiries', leads),
  ];

  if (req.query.format === 'csv') {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="passage-system-metrics.csv"');
    return res.status(200).send(toRawCsv(metrics, leadSummary));
  }

  return res.status(200).json({
    generatedAt: new Date().toISOString(),
    owner: auth.user.email,
    metrics,
    leads: Object.assign({ error: recentLeads.error || null }, leadSummary),
  });
}
