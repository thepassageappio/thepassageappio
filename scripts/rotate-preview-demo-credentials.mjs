import { createClient } from '@supabase/supabase-js';

const ISOLATED_PROJECT_REF = 'uyacxqtsiwlvtmhxvoxr';
const PRODUCTION_PROJECT_REF = 'qsveqfchwylsbncsfgxe';
const personas = ['FAMILY', 'DIRECTOR', 'STAFF', 'VENDOR'];

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required server environment value: ${name}`);
  return value;
}

function assertIsolatedPreview() {
  const projectRef = required('PASSAGE_SUPABASE_PROJECT_REF');
  const productionRef = required('PASSAGE_PRODUCTION_SUPABASE_PROJECT_REF');
  const url = new URL(required('NEXT_PUBLIC_SUPABASE_URL'));
  if (
    process.env.PASSAGE_RUNTIME !== 'preview'
    || process.env.VERCEL_ENV !== 'preview'
    || process.env.PASSAGE_PREVIEW_DEMO_CREDENTIAL_ROTATION_APPROVED !== 'true'
    || projectRef !== ISOLATED_PROJECT_REF
    || productionRef !== PRODUCTION_PROJECT_REF
    || projectRef === productionRef
    || url.hostname !== `${ISOLATED_PROJECT_REF}.supabase.co`
  ) {
    throw new Error('Credential rotation refused: exact isolated Preview attestation is required.');
  }
  return url.toString();
}

function credential(persona) {
  const email = required(`PASSAGE_PREVIEW_DEMO_${persona}_EMAIL`).toLowerCase();
  const password = required(`PASSAGE_PREVIEW_DEMO_${persona}_PASSWORD`);
  if (password.length < 24 || password.toLowerCase().includes(email.split('@')[0].toLowerCase())) {
    throw new Error(`${persona} demo password must be at least 24 characters and unrelated to the email.`);
  }
  return { email, password };
}

async function main() {
  const supabaseUrl = assertIsolatedPreview();
  const credentials = personas.map((persona) => ({ persona, ...credential(persona) }));
  if (new Set(credentials.map(({ email }) => email)).size !== credentials.length
      || new Set(credentials.map(({ password }) => password)).size !== credentials.length) {
    throw new Error('Each demo persona requires a distinct email and password.');
  }

  const client = createClient(supabaseUrl, required('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
  const list = await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (list.error) throw list.error;

  for (const item of credentials) {
    const user = list.data.users.find((candidate) => candidate.email?.toLowerCase() === item.email);
    if (!user) throw new Error(`${item.persona} demo user does not exist in the isolated project.`);
    const update = await client.auth.admin.updateUserById(user.id, {
      password: item.password,
      email_confirm: true,
    });
    if (update.error) throw update.error;
  }
  console.log(`Rotated ${credentials.length} isolated Preview demo credentials without printing secret values.`);
}

await main();
