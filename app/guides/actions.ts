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

  await recordContactInquiry({
    email,
    name,
    category: 'Guide lead',
    message: `Unlocked guide: ${guideTitle || 'Unknown guide'}`,
  });

  return { status: 'unlocked' };
}
