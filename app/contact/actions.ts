'use server';

import { recordContactInquiry } from '@/lib/hubspot';

export type ContactCommandState = { status: 'idle' | 'sent' | 'validation' | 'unavailable'; message?: string };

export async function submitContactInquiry(_previous: ContactCommandState, formData: FormData): Promise<ContactCommandState> {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const category = String(formData.get('category') ?? '').trim();
  const message = String(formData.get('message') ?? '').trim();

  if (!email || !message || !category) {
    return { status: 'validation', message: 'Please fill in an email, category, and message before sending.' };
  }

  const result = await recordContactInquiry({ email, name, category, message });
  if (!result) {
    return { status: 'unavailable', message: 'Passage could not send this right now. Please email steventurrisi@gmail.com directly instead.' };
  }
  return { status: 'sent' };
}
