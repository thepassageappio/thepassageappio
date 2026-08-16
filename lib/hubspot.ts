const HUBSPOT_API_BASE = 'https://api.hubapi.com';

function hubspotToken(): string | null {
  return process.env.HUBSPOT_PRIVATE_APP_TOKEN?.trim() || null;
}

async function hubspotFetch(path: string, init: RequestInit): Promise<Response> {
  const token = hubspotToken();
  if (!token) throw new Error('HubSpot is not configured');
  return fetch(`${HUBSPOT_API_BASE}${path}`, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
}

export type ContactInquiryInput = {
  email: string;
  name: string;
  phone?: string;
  category: string;
  message: string;
};

// Upserts by email so a repeat visitor updates the same Contact instead of
// creating duplicates, then logs the inquiry as a Note rather than writing
// into lifecyclestage/hs_lead_status -- those are hand-managed by sales today
// (see the 5 existing funeral-home leads) and a form submission should never
// silently overwrite that.
export async function recordContactInquiry(input: ContactInquiryInput): Promise<{ contactId: string } | null> {
  if (!hubspotToken()) return null;
  const [firstname, ...rest] = input.name.trim().split(/\s+/).filter(Boolean);
  const lastname = rest.join(' ');

  const upsertResult = await hubspotFetch('/crm/v3/objects/contacts/batch/upsert', {
    method: 'POST',
    body: JSON.stringify({
      inputs: [{
        idProperty: 'email',
        id: input.email,
        properties: {
          email: input.email,
          ...(firstname ? { firstname } : {}),
          ...(lastname ? { lastname } : {}),
          ...(input.phone ? { phone: input.phone } : {}),
        },
      }],
    }),
  });
  if (!upsertResult.ok) return null;
  const upsertBody = await upsertResult.json();
  const contactId: string | undefined = upsertBody?.results?.[0]?.id;
  if (!contactId) return null;

  const noteResult = await hubspotFetch('/crm/v3/objects/notes', {
    method: 'POST',
    body: JSON.stringify({
      properties: {
        hs_note_body: `Website inquiry — ${input.category}\n\n${input.message}`,
        hs_timestamp: Date.now(),
      },
    }),
  });
  if (noteResult.ok) {
    const noteBody = await noteResult.json();
    const noteId: string | undefined = noteBody?.id;
    if (noteId) {
      await hubspotFetch(`/crm/v4/objects/notes/${noteId}/associations/default/contacts/${contactId}`, { method: 'PUT' }).catch(() => null);
    }
  }

  return { contactId };
}
