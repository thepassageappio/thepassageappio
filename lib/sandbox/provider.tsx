'use client';

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { applySandboxCommand, createCanonicalSandbox, readSandboxResult, SANDBOX_STORAGE_KEY, writeSandbox, type SandboxStorageResult } from './repository';
import type { SandboxCommand, SandboxRecord } from './types';

type SandboxContextValue = {
  record: SandboxRecord;
  hydrated: boolean;
  persistenceIssue: string | null;
  dispatch: (command: SandboxCommand) => SandboxStorageResult;
  dispatchAtomic: (command: SandboxCommand) => SandboxStorageResult;
  reset: () => SandboxStorageResult;
};

const SandboxContext = createContext<SandboxContextValue | null>(null);

export function SandboxProvider({ children }: { children: ReactNode }) {
  const [record, setRecord] = useState<SandboxRecord>(() => createCanonicalSandbox());
  const [hydrated, setHydrated] = useState(false);
  const [persistenceIssue, setPersistenceIssue] = useState<string | null>(null);
  const recordRef = useRef(record);

  useEffect(() => {
    const result = readSandboxResult(window.localStorage);
    recordRef.current = result.record;
    setRecord(result.record);
    setPersistenceIssue(result.persisted ? null : result.detail ?? 'Saved example information is unavailable.');
    setHydrated(true);
    const sync = (event: StorageEvent) => {
      if (event.key === SANDBOX_STORAGE_KEY) {
        const synced = readSandboxResult(window.localStorage);
        recordRef.current = synced.record;
        setRecord(synced.record);
        setPersistenceIssue(synced.persisted ? null : synced.detail ?? 'Saved example information is unavailable.');
      }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const dispatch = useCallback((command: SandboxCommand) => {
    const next = applySandboxCommand(recordRef.current, command);
    recordRef.current = next;
    setRecord(next);
    const result = writeSandbox(window.localStorage, next);
    setPersistenceIssue(result.persisted ? null : result.detail ?? 'This change is available for this visit only.');
    return result;
  }, []);

  const dispatchAtomic = useCallback((command: SandboxCommand) => {
    const next = applySandboxCommand(recordRef.current, command);
    const result = writeSandbox(window.localStorage, next);
    if (!result.persisted) {
      setPersistenceIssue(result.detail ?? 'This change was not saved.');
      return result;
    }
    recordRef.current = next;
    setRecord(next);
    setPersistenceIssue(null);
    return result;
  }, []);

  const reset = useCallback(() => dispatch({ type: 'reset_sandbox' }), [dispatch]);
  const value = useMemo(() => ({ record, hydrated, persistenceIssue, dispatch, dispatchAtomic, reset }), [record, hydrated, persistenceIssue, dispatch, dispatchAtomic, reset]);
  return <SandboxContext.Provider value={value}>{children}</SandboxContext.Provider>;
}

export function useSandbox() {
  const value = useContext(SandboxContext);
  if (!value) throw new Error('useSandbox must be used inside SandboxProvider');
  return value;
}
