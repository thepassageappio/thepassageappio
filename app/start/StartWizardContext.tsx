'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { SituationCategory } from '@/lib/urgent/situations';

export type StartDraft = {
  situationCategory: SituationCategory | '';
  personName: string;
  personLocation: string;
  personTiming: string;
  coordinatorName: string;
  coordinatorPhone: string;
  coordinatorEmail: string;
  callbackNotes: string;
};

const EMPTY_DRAFT: StartDraft = {
  situationCategory: '',
  personName: '',
  personLocation: '',
  personTiming: '',
  coordinatorName: '',
  coordinatorPhone: '',
  coordinatorEmail: '',
  callbackNotes: '',
};

const STORAGE_KEY = 'passage-start-draft';

type StartWizardValue = {
  draft: StartDraft;
  update: (patch: Partial<StartDraft>) => void;
  reset: () => void;
};

const StartWizardContextInstance = createContext<StartWizardValue | null>(null);

export function StartWizardProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<StartDraft>(EMPTY_DRAFT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) setDraft({ ...EMPTY_DRAFT, ...JSON.parse(raw) });
    } catch {
      // Ignore malformed or unavailable storage; the wizard just starts fresh.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Storage may be unavailable (private browsing); the wizard still works within this page.
    }
  }, [draft, hydrated]);

  const update = useCallback((patch: Partial<StartDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setDraft(EMPTY_DRAFT);
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore.
    }
  }, []);

  const value = useMemo(() => ({ draft, update, reset }), [draft, update, reset]);
  return <StartWizardContextInstance.Provider value={value}>{children}</StartWizardContextInstance.Provider>;
}

export function useStartWizard(): StartWizardValue {
  const context = useContext(StartWizardContextInstance);
  if (!context) throw new Error('useStartWizard must be used within StartWizardProvider');
  return context;
}
