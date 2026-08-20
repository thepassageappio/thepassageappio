// TEMPORARY: diagnosing the contact-form "could not send" failure. Deleted
// immediately after use.
export async function GET() {
  const hasToken = !!process.env.HUBSPOT_PRIVATE_APP_TOKEN?.trim();
  if (!hasToken) return Response.json({ ok: false, step: 'env', detail: 'HUBSPOT_PRIVATE_APP_TOKEN is not set' });

  const upsertResult = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.HUBSPOT_PRIVATE_APP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inputs: [{ idProperty: 'email', id: 'smtp-verify-test@thepassageapp.io', properties: { email: 'smtp-verify-test@thepassageapp.io' } }],
    }),
  });
  const body = await upsertResult.text();
  return Response.json({ ok: upsertResult.ok, step: 'upsert', status: upsertResult.status, detail: body.slice(0, 500) });
}
