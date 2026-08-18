'use server';

import { recordContactInquiry } from '@/lib/hubspot';

export type GuideUnlockState = { status: 'idle' | 'unlocked' | 'validation' | 'unavailable'; message?: string };

export async function unlockGuide(_previous: GuideUnlockState, formData: FormData): Promise<GuideUnlockState> {
  const email = String(formData.get('email') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const guideTitle = String(formData.get('guideTitle') ?? '').trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: 'validation', message: 'Enter a valid email to unlock this guide.' };
  }

  const result = await recordContactInquiry({
    email,
    name,
    category: 'Guide lead',
    message: `Unlocked guide: ${guideTitle || 'Unknown guide'}`,
  });
  if (!result) return { status: 'unavailable', message: 'We could not save your details right now. Try again in a moment.' };

  return { status: 'unlocked' };
}
