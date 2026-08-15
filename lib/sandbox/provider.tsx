'use client';

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { applySandboxCommand, createCanonicalSandbox, readSandbox, SANDBOX_STORAGE_KEY, writeSandbox } from './repository';
import type { SandboxCommand, SandboxRecord } from './types';

type SandboxContextValue = {
  record: SandboxRecord;
  hydrated: boolean;
  dispatch: (command: SandboxCommand) => void;
  reset: () => void;
};

const SandboxContext = createContext<SandboxContextValue | null>(null);

export function SandboxProvider({ children }: { children: ReactNode }) {
  const [record, setRecord] = useState<SandboxRecord>(() => createCanonicalSandbox());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setRecord(readSandbox(window.localStorage));
    setHydrated(true);
    const sync = (event: StorageEvent) => {
      if (event.key === SANDBOX_STORAGE_KEY) setRecord(readSandbox(window.localStorage));
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const dispatch = useCallback((command: SandboxCommand) => {
    setRecord((current) => {
      const next = applySandboxCommand(current, command);
      writeSandbox(window.localStorage, next);
      return next;
    });
  }, []);

  const reset = useCallback(() => dispatch({ type: 'reset_sandbox' }), [dispatch]);
  const value = useMemo(() => ({ record, hydrated, dispatch, reset }), [record, hydrated, dispatch, reset]);
  return <SandboxContext.Provider value={value}>{children}</SandboxContext.Provider>;
}

export function useSandbox() {
  const value = useContext(SandboxContext);
  if (!value) throw new Error('useSandbox must be used inside SandboxProvider');
  return value;
}
