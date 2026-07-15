import { createClient } from '@supabase/supabase-js';

const CONFIRM_PHRASE = 'RESET PASSAGE DEMO SANDBOX';

const IDS = Object.freeze({
  organization: '10000000-0000-4000-8000-000000000001',
  vendor: '10000000-0000-4000-8000-000000000002',
  workflows: [
    '20000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000004',
  ],
  tasks: [
    '30000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000004',
    '30000000-0000-4000-8000-000000000005',
    '30000000-0000-4000-8000-000000000006',
  ],
  vendorRequest: '40000000-0000-4000-8000-000000000001',
});

function fail(message) {
  throw new Error(`Demo sandbox reset refused: ${message}`);
}

function required(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) fail(`${name} is required.`);
  return value;
}

function projectRef(url) {
  try {
    return new URL(url).hostname.split('.')[0].toLowerCase();
  } catch {
    fail('NEXT_PUBLIC_SUPABASE_URL is not a valid URL.');
  }
}

function assertSandboxContract() {
  if (required('PASSAGE_RUNTIME_ENV') !== 'demo-sandbox') {
    fail('PASSAGE_RUNTIME_ENV must equal demo-sandbox.');
  }
  if (required('PASSAGE_DEMO_SANDBOX') !== '1') {
    fail('PASSAGE_DEMO_SANDBOX must equal 1.');
  }
  if (required('PASSAGE_EXTERNAL_EFFECTS') !== 'blocked') {
    fail('PASSAGE_EXTERNAL_EFFECTS must equal blocked.');
  }

  const url = required('NEXT_PUBLIC_SUPABASE_URL');
  const demoRef = required('PASSAGE_DEMO_SUPABASE_PROJECT_REF').toLowerCase();
  const productionRef =
    required('PASSAGE_PRODUCTION_SUPABASE_PROJECT_REF').toLowerCase();

  if (demoRef === productionRef) {
    fail('demo and production Supabase project refs are identical.');
  }
  if (projectRef(url) !== demoRef) {
    fail('NEXT_PUBLIC_SUPABASE_URL does not match the declared demo project.');
  }

  const siteUrl = String(process.env.NEXT_PUBLIC_SITE_URL || '').toLowerCase();
  if (siteUrl.includes('thepassageapp.io')) {
    fail('NEXT_PUBLIC_SITE_URL points at the production Passage domain.');
  }

  const demoVercelProjectId = required('PASSAGE_DEMO_VERCEL_PROJECT_ID');
  if (
    process.env.VERCEL_PROJECT_ID &&
    process.env.VERCEL_PROJECT_ID !== demoVercelProjectId
  ) {
    fail('VERCEL_PROJECT_ID does not match PASSAGE_DEMO_VERCEL_PROJECT_ID.');
  }

  const prohibited = [
    'RESEND_API_KEY',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER',
    'TWILIO_MESSAGING_SERVICE_SID',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'HUBSPOT_ACCESS_TOKEN',
  ].filter((name) => String(process.env[name] || '').trim());

  if (prohibited.length) {
    fail(`external provider credentials must be absent: ${prohibited.join(', ')}`);
  }

  return {
    url,
    serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
    email: required('PASSAGE_DEMO_DIRECTOR_EMAIL').toLowerCase(),
    password: required('PASSAGE_DEMO_DIRECTOR_PASSWORD'),
  };
}

async function expect(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

async function findAuthUser(admin, email) {
  for (let page = 1; page <= 10; page += 1) {
    const data = await expect(
      await admin.auth.admin.listUsers({ page, perPage: 1000 }),
      'List demo Auth users',
    );
    const match = (data?.users || []).find(
      (user) => String(user.email || '').toLowerCase() === email,
    );
    if (match) return match;
    if ((data?.users || []).length < 1000) return null;
  }
  return null;
}

async function ensureDirector(admin, email, password) {
  const current = await findAuthUser(admin, email);
  const attributes = {
    password,
    email_confirm: true,
    user_metadata: {
      ...(current?.user_metadata || {}),
      display_name: 'Elena Rivera',
      passage_environment: 'demo-sandbox',
    },
  };

  const data = current
    ? await expect(
        await admin.auth.admin.updateUserById(current.id, attributes),
        'Refresh demo director',
      )
    : await expect(
        await admin.auth.admin.createUser({ email, ...attributes }),
        'Create demo director',
      );

  if (!data?.user?.id) throw new Error('Demo director Auth user has no id.');
  return data.user;
}

async function removeSeed(admin) {
  await expect(
    await admin.from('vendor_requests').delete().eq('id', IDS.vendorRequest),
    'Delete demo vendor request',
  );
  await expect(
    await admin.from('tasks').delete().in('id', IDS.tasks),
    'Delete demo tasks',
  );
  await expect(
    await admin.from('workflows').delete().in('id', IDS.workflows),
    'Delete demo workflows',
  );
  await expect(
    await admin.from('organization_members').delete().eq('organization_id', IDS.organization),
    'Delete demo organization members',
  );
  await expect(
    await admin.from('organizations').delete().eq('id', IDS.organization),
    'Delete demo organization',
  );
  await expect(
    await admin.from('vendors').delete().eq('id', IDS.vendor),
    'Delete demo vendor',
  );
}

async function insertSeed(admin, director) {
  await expect(
    await admin.from('organizations').insert({
      id: IDS.organization,
      type: 'funeral_home',
      name: 'Harbor & Pine Funeral Home — Demo',
      slug: 'harbor-pine-demo',
      support_email: 'demo-support@example.invalid',
      from_name: 'Harbor & Pine',
      created_by: director.id,
      white_label_enabled: true,
      marketplace_enabled: true,
      partner_plan: 'enterprise_demo',
    }),
    'Insert demo organization',
  );

  await expect(
    await admin.from('organization_members').insert({
      organization_id: IDS.organization,
      user_id: director.id,
      email: director.email,
      role: 'director',
      status: 'active',
    }),
    'Insert demo director membership',
  );

  await expect(
    await admin.from('vendors').insert({
      id: IDS.vendor,
      business_name: 'Willow & Stem Floral Studio — Demo',
      category: 'florist',
      short_description: 'Synthetic sales-demo vendor',
      zip_codes_served: ['97205'],
      rush_supported: true,
      rush_window_hours: 4,
      planned_supported: true,
      contact_email: 'willow@example.invalid',
      status: 'active',
      estimated_value: 425,
      review_count: 38,
      average_rating: 4.9,
    }),
    'Insert demo vendor',
  );

  const cases = [
    ['Evelyn Rivera', 'Maya Rivera', 'maya@example.invalid', '2026-07-13', 'arriving', 'HP-2401', 'active'],
    ['Walter Chen', 'Daniel Chen', 'daniel@example.invalid', '2026-07-11', 'arranging', 'HP-2402', 'active'],
    ['Lillian Brooks', 'Avery Brooks', 'avery@example.invalid', '2026-07-08', 'ready', 'HP-2403', 'active'],
    ['Arthur Morgan', 'Claire Morgan', 'claire@example.invalid', '2026-06-29', 'aftercare', 'HP-2404', 'completed'],
  ].map(([deceasedName, coordinatorName, coordinatorEmail, dateOfDeath, funeralHomeStatus, reference, status], index) => ({
    id: IDS.workflows[index],
    user_id: director.id,
    organization_id: IDS.organization,
    name: `${deceasedName} — Passage`,
    deceased_name: deceasedName,
    coordinator_name: coordinatorName,
    coordinator_email: coordinatorEmail,
    date_of_death: dateOfDeath,
    status,
    trigger_type: 'manual',
    requires_confirmation: false,
    mode: 'red',
    path: 'red',
    setup_stage: status === 'completed' ? 'completed' : 'active',
    activation_status: status === 'completed' ? 'completed' : 'activated',
    funeral_home_status: funeralHomeStatus,
    organization_case_reference: reference,
  }));

  await expect(await admin.from('workflows').insert(cases), 'Insert demo cases');

  const tasks = [
    ['Confirm Friday service venue', 'logistics', 'urgent', 'blocked', 'family', 0],
    ['Review transfer record', 'medical', 'high', 'waiting', 'family', 0],
    ['Prepare arrangement conference', 'service', 'high', 'in_progress', null, 1],
    ['Confirm floral quote', 'memorial', 'normal', 'waiting', 'vendor', 1],
    ['Share final service details', 'notifications', 'normal', 'done', null, 2],
    ['Schedule thirty-day family check-in', 'personal', 'low', 'pending', null, 3],
  ].map(([title, category, priority, status, waitingOn, workflowIndex], index) => ({
    id: IDS.tasks[index],
    workflow_id: IDS.workflows[workflowIndex],
    organization_id: IDS.organization,
    user_id: director.id,
    title,
    category,
    priority,
    status,
    owner_kind: waitingOn === 'vendor' ? 'vendor' : 'person',
    assigned_to_name: waitingOn === 'vendor' ? null : 'Elena Rivera',
    assigned_to_email: waitingOn === 'vendor' ? null : director.email,
    waiting_on: waitingOn,
    funeral_home_eligible: true,
  }));

  await expect(await admin.from('tasks').insert(tasks), 'Insert demo tasks');

  await expect(
    await admin.from('vendor_requests').insert({
      id: IDS.vendorRequest,
      vendor_id: IDS.vendor,
      workflow_id: IDS.workflows[1],
      task_id: IDS.tasks[3],
      task_title: 'Confirm floral quote',
      organization_id: IDS.organization,
      requested_by_user_id: director.id,
      requested_by_email: director.email,
      requested_by_name: 'Elena Rivera',
      status: 'quoted',
      urgency: 'planned',
      referral_source: 'funeral_home',
      request_note: 'Synthetic demo request; no fulfillment required.',
      vendor_note: 'White seasonal arrangement; demo quote only.',
      estimated_value: 425,
      payment_collection_status: 'quote_ready',
    }),
    'Insert demo vendor request',
  );
}

async function verify(admin) {
  const checks = [
    ['organizations', 'id', [IDS.organization], 1],
    ['organization_members', 'organization_id', [IDS.organization], 1],
    ['workflows', 'id', IDS.workflows, 4],
    ['tasks', 'id', IDS.tasks, 6],
    ['vendors', 'id', [IDS.vendor], 1],
    ['vendor_requests', 'id', [IDS.vendorRequest], 1],
  ];
  const verification = [];

  for (const [table, column, values, expected] of checks) {
    const result = values.length === 1
      ? await admin.from(table).select('id', { count: 'exact' }).eq(column, values[0])
      : await admin.from(table).select('id', { count: 'exact' }).in(column, values);

    if (result.error) throw new Error(`Verify ${table}: ${result.error.message}`);
    const actual = result.count ?? result.data?.length ?? 0;
    if (actual !== expected) {
      throw new Error(`Verify ${table}: expected ${expected}, received ${actual}`);
    }
    verification.push({ table, expected, actual });
  }

  return verification;
}

async function main() {
  const config = assertSandboxContract();
  const confirmation = process.argv.find((arg) => arg.startsWith('--confirm='));
  if (confirmation !== `--confirm=${CONFIRM_PHRASE}`) {
    fail(`pass --confirm="${CONFIRM_PHRASE}".`);
  }

  const admin = createClient(config.url, config.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const director = await ensureDirector(admin, config.email, config.password);

  await removeSeed(admin);
  await insertSeed(admin, director);
  const verification = await verify(admin);

  console.log(JSON.stringify({
    success: true,
    environment: 'demo-sandbox',
    organizationId: IDS.organization,
    directorEmail: config.email,
    verification,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
