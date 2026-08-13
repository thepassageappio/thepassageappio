'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { confirmProviderSelection } from '@/app/family/provider-discovery/actions';
import {
  createSearchRequestGate,
  nextActiveOption,
  type SearchRequestGate,
} from '@/lib/provider-discovery/search-controller';
import type {
  FamilyProviderSelection,
  ProviderConfirmationInput,
  ProviderDiscoveryResult,
} from '@/lib/provider-discovery/types';
import styles from './FuneralHomeDiscovery.module.css';

type Props = {
  onSelectionChange: (selection: FamilyProviderSelection | null) => void;
};

type SearchState =
  | 'loading_selection'
  | 'idle'
  | 'loading'
  | 'results'
  | 'empty'
  | 'offline'
  | 'rate_limit'
  | 'unavailable'
  | 'signed_out';

type ManualDraft = {
  displayName: string;
  line1: string;
  line2: string;
  locality: string;
  administrativeArea: string;
  postalCode: string;
  countryCode: string;
};

const emptyManual: ManualDraft = {
  displayName: '',
  line1: '',
  line2: '',
  locality: '',
  administrativeArea: '',
  postalCode: '',
  countryCode: 'US',
};

export default function FuneralHomeDiscovery({ onSelectionChange }: Props) {
  const listboxId = useId();
  const statusId = useId();
  const recoveryRef = useRef<HTMLParagraphElement>(null);
  const gate = useRef<SearchRequestGate | null>(null);
  if (!gate.current) gate.current = createSearchRequestGate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProviderDiscoveryResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchState, setSearchState] =
    useState<SearchState>('loading_selection');
  const [open, setOpen] = useState(false);
  const [candidate, setCandidate] = useState<ProviderDiscoveryResult | null>(
    null,
  );
  const [saved, setSaved] = useState<FamilyProviderSelection | null>(null);
  const [mode, setMode] = useState<'search' | 'manual' | 'review' | 'saved'>(
    'search',
  );
  const [manual, setManual] = useState<ManualDraft>(emptyManual);
  const [saveMessage, setSaveMessage] = useState('');
  const [audience, setAudience] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [pendingInput, setPendingInput] =
    useState<ProviderConfirmationInput | null>(null);
  const [saving, startSaving] = useTransition();

  useEffect(() => {
    if (saveMessage) recoveryRef.current?.focus();
  }, [saveMessage]);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/family/provider-discovery/selection', {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = await response.json() as {
          state?: string;
          selection?: FamilyProviderSelection | null;
          audience?: string;
        };
        if (body.audience) setAudience(body.audience);
        if (body.state === 'ready' && body.selection) {
          setSaved(body.selection);
          setMode('saved');
          onSelectionChange(body.selection);
        } else if (body.state === 'no_space') {
          setSaveMessage(
            'Create your family space in People & access before saving a funeral home.',
          );
        } else if (response.status === 401) {
          setSearchState('signed_out');
        } else if (!response.ok) {
          setSaveMessage(
            'Passage could not load the saved funeral home. Reload before choosing another.',
          );
        } else {
          setSearchState('idle');
        }
      })
      .catch((error: unknown) => {
        if (!isAbort(error)) {
          setSaveMessage(
            'Passage could not load the saved funeral home. Reload before choosing another.',
          );
        }
      });
    return () => controller.abort();
  }, [onSelectionChange]);

  useEffect(() => {
    if (mode !== 'search') return;
    const trimmed = query.trim();
    if (trimmed.replace(/\s/g, '').length < 2) {
      gate.current?.cancel();
      setResults([]);
      setActiveIndex(-1);
      setOpen(false);
      setSearchState('idle');
      return;
    }

    const timer = window.setTimeout(async () => {
      if (!window.navigator.onLine) {
        setResults([]);
        setOpen(false);
        setSearchState('offline');
        return;
      }
      const request = gate.current!.start();
      setSearchState('loading');
      setOpen(true);
      try {
        const response = await fetch('/family/provider-discovery/search', {
          method: 'POST',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: trimmed }),
          signal: request.signal,
        });
        if (!request.isCurrent()) return;
        const body = await response.json() as {
          results?: ProviderDiscoveryResult[];
        };
        if (response.status === 401) {
          setResults([]);
          setOpen(false);
          setSearchState('signed_out');
          return;
        }
        if (response.status === 429) {
          setResults([]);
          setOpen(false);
          setSearchState('rate_limit');
          return;
        }
        if (!response.ok || !Array.isArray(body.results)) {
          setResults([]);
          setOpen(false);
          setSearchState('unavailable');
          return;
        }
        setResults(body.results);
        setActiveIndex(-1);
        setOpen(body.results.length > 0);
        setSearchState(body.results.length > 0 ? 'results' : 'empty');
      } catch (error: unknown) {
        if (!request.isCurrent() || isAbort(error)) return;
        setResults([]);
        setOpen(false);
        setSearchState(window.navigator.onLine ? 'unavailable' : 'offline');
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [mode, query, retryCount]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const activeResult = results[activeIndex];
    if (!activeResult) return;
    document
      .getElementById(`${listboxId}-${activeResult.sourceKey}`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, listboxId, open, results]);

  function chooseResult(result: ProviderDiscoveryResult) {
    gate.current?.cancel();
    setCandidate(result);
    setOpen(false);
    setActiveIndex(-1);
    setSaveMessage('');
    setPendingInput(null);
    setMode('review');
  }

  function handleComboboxKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (results.length === 0) return;
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) =>
        nextActiveOption(
          current,
          results.length,
          event.key === 'ArrowDown' ? 1 : -1,
        ));
      return;
    }
    if (event.key === 'Enter' && open && activeIndex >= 0) {
      event.preventDefault();
      chooseResult(results[activeIndex]);
      return;
    }
    if (event.key === 'Escape') {
      gate.current?.cancel();
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (event.key === 'Tab') {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  function confirmCandidate() {
    if (!candidate) return;
    const input: ProviderConfirmationInput = pendingInput ?? {
      requestId: crypto.randomUUID(),
      expectedSelectionSavedAt: saved?.selectedAt ?? null,
      sourceKind: 'synthetic_directory',
      sourceKey: candidate.sourceKey,
    };
    setPendingInput(input);
    save(input);
  }

  function confirmManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !manual.displayName.trim()
      || ![
        manual.line1,
        manual.locality,
        manual.postalCode,
      ].some((value) => value.trim())
    ) {
      setSaveMessage(
        'Add the funeral-home name and at least a street, city, or postal code.',
      );
      return;
    }
    const input: ProviderConfirmationInput = pendingInput ?? {
      requestId: crypto.randomUUID(),
      expectedSelectionSavedAt: saved?.selectedAt ?? null,
      sourceKind: 'manual',
      displayName: manual.displayName.trim(),
      address: {
        line1: manual.line1.trim(),
        ...(manual.line2.trim() ? { line2: manual.line2.trim() } : {}),
        locality: manual.locality.trim(),
        administrativeArea: manual.administrativeArea.trim(),
        postalCode: manual.postalCode.trim(),
        countryCode: manual.countryCode.trim().toUpperCase(),
      },
    };
    setPendingInput(input);
    save(input);
  }

  function save(input: ProviderConfirmationInput) {
    setSaveMessage('');
    startSaving(async () => {
      try {
        const result = await confirmProviderSelection(input);
        if (!result.ok) {
          setSaveMessage(result.message);
          return;
        }
        setSaved(result.selection);
        setCandidate(null);
        setMode('saved');
        setPendingInput(null);
        setSaveMessage(
          result.selection.replayed
            ? 'This exact choice was already saved. The original receipt is shown.'
            : 'Funeral-home choice saved.',
        );
        onSelectionChange(result.selection);
      } catch {
        setSaveMessage(
          "We couldn't confirm whether it was saved. Reload and check your funeral home before trying again.",
        );
      }
    });
  }

  function startSearch() {
    gate.current?.cancel();
    setMode('search');
    setCandidate(null);
    setQuery('');
    setResults([]);
    setSearchState('idle');
    setPendingInput(null);
    setSaveMessage('');
  }

  function cancelChange() {
    gate.current?.cancel();
    setCandidate(null);
    setPendingInput(null);
    setSaveMessage('');
    setMode(saved ? 'saved' : 'search');
  }

  function startManual() {
    const editSource = candidate ?? saved;
    gate.current?.cancel();
    setMode('manual');
    setCandidate(null);
    setOpen(false);
    setPendingInput(null);
    setSaveMessage('');
    if (editSource) {
      setManual({
        displayName: editSource.displayName,
        line1: editSource.address.line1,
        line2: editSource.address.line2 ?? '',
        locality: editSource.address.locality,
        administrativeArea: editSource.address.administrativeArea,
        postalCode: editSource.address.postalCode,
        countryCode: editSource.address.countryCode,
      });
    }
  }

  if (mode === 'saved' && saved) {
    return (
      <section className={styles.saved} aria-labelledby={`${statusId}-saved`}>
        <div className={styles.savedHeader}>
          <div>
            <p>Saved funeral-home choice</p>
            <h2 id={`${statusId}-saved`}>Funeral home saved</h2>
          </div>
          <span className={styles.savedState}>Saved</span>
        </div>
        <div className={styles.savedProvider}>
          <strong>{saved.displayName}</strong>
          <address>{saved.address.formatted}</address>
        </div>
        <p className={styles.audience}>{saved.audience}</p>
        <div className={styles.truth}>
          <strong>
            {saved.handoffAvailability === 'connected_preview'
              ? 'Ready for the connected Preview step'
              : 'Saved to your plan'}
          </strong>
          <span>
            {saved.handoffAvailability === 'connected_preview'
              ? 'Nothing was sent. Continue below to review what you may share in the connected Preview.'
              : 'Passage has saved these details, but this funeral home is not connected here. Nothing was sent.'}
          </span>
        </div>
        {saved.addressReviewRequired && (
          <p className={styles.reviewNote}>
            Needs address review. Check or finish the address before you rely
            on it.
          </p>
        )}
        <p className={styles.receipt}>
          Saved {formatSavedTime(saved.selectedAt)}. Nothing was sent. Proof is
          kept in your family provider history.
        </p>
        {saveMessage && (
          <p className={styles.notice} ref={recoveryRef} tabIndex={-1}>
            {saveMessage}
          </p>
        )}
        <div className={styles.actions}>
          <button onClick={startSearch} type="button">
            Change funeral home
          </button>
          <button onClick={startManual} type="button">
            Edit details
          </button>
        </div>
      </section>
    );
  }

  if (mode === 'manual') {
    return (
      <form className={styles.manual} onSubmit={confirmManual}>
        <div className={styles.sectionHeading}>
          <p>Manual details</p>
          <h2>Enter funeral home details manually</h2>
          <span>
            Add what you know. You can finish or change it later.
          </span>
        </div>
        <label>
          Funeral-home name
          <input
            autoComplete="organization"
            maxLength={160}
            onChange={(event) => {
              setManual((current) => ({
                ...current,
                displayName: event.target.value,
              }));
              setPendingInput(null);
            }}
            required
            value={manual.displayName}
          />
        </label>
        <label>
          Street address
          <input
            autoComplete="street-address"
            maxLength={160}
            onChange={(event) => {
              setManual((current) => ({
                ...current,
                line1: event.target.value,
              }));
              setPendingInput(null);
            }}
            value={manual.line1}
          />
        </label>
        <label>
          Suite or unit <span>(optional)</span>
          <input
            maxLength={160}
            onChange={(event) => {
              setManual((current) => ({
                ...current,
                line2: event.target.value,
              }));
              setPendingInput(null);
            }}
            value={manual.line2}
          />
        </label>
        <div className={styles.addressGrid}>
          <label>
            City
            <input
              autoComplete="address-level2"
              maxLength={100}
              onChange={(event) => {
                setManual((current) => ({
                  ...current,
                  locality: event.target.value,
                }));
                setPendingInput(null);
              }}
              value={manual.locality}
            />
          </label>
          <label>
            State or region
            <input
              autoComplete="address-level1"
              maxLength={80}
              onChange={(event) => {
                setManual((current) => ({
                  ...current,
                  administrativeArea: event.target.value,
                }));
                setPendingInput(null);
              }}
              value={manual.administrativeArea}
            />
          </label>
          <label>
            Postal code
            <input
              autoComplete="postal-code"
              maxLength={20}
              onChange={(event) => {
                setManual((current) => ({
                  ...current,
                  postalCode: event.target.value,
                }));
                setPendingInput(null);
              }}
              value={manual.postalCode}
            />
          </label>
          <label>
            Country
            <input
              autoComplete="country"
              maxLength={2}
              onChange={(event) => {
                setManual((current) => ({
                  ...current,
                  countryCode: event.target.value.toUpperCase(),
                }));
                setPendingInput(null);
              }}
              required
              value={manual.countryCode}
            />
          </label>
        </div>
        {saveMessage && (
          <p className={styles.error} ref={recoveryRef} role="alert" tabIndex={-1}>{saveMessage}</p>
        )}
        <div className={styles.actions}>
          <button disabled={saving} type="submit">
            {saving ? 'Saving choice...' : 'Use these details'}
          </button>
          <button disabled={saving} onClick={startSearch} type="button">
            Back to search
          </button>
          {saved && (
            <button disabled={saving} onClick={cancelChange} type="button">
              Cancel change
            </button>
          )}
        </div>
      </form>
    );
  }

  if (mode === 'review' && candidate) {
    return (
      <section className={styles.review} aria-labelledby={`${statusId}-review`}>
        <div className={styles.sectionHeading}>
          <p>Review before saving</p>
          <h2 id={`${statusId}-review`}>Check this funeral home</h2>
          <span>Make sure this is the location you mean.</span>
        </div>
        <dl className={styles.addressSummary}>
          <div><dt>Funeral home</dt><dd>{candidate.displayName}</dd></div>
          <div><dt>Street</dt><dd>{candidate.address.line1}{candidate.address.line2 ? `, ${candidate.address.line2}` : ''}</dd></div>
          <div><dt>City, region, and postal code</dt><dd>{candidate.address.locality}, {candidate.address.administrativeArea} {candidate.address.postalCode}</dd></div>
          <div><dt>Country</dt><dd>{candidate.address.countryCode}</dd></div>
        </dl>
        <p className={styles.confirmationBoundary}>
          This saves the funeral home to your family space. Nothing is sent to
          the funeral home.
        </p>
        <p className={styles.audience}>
          {audience ?? 'Passage is checking who can see this choice.'}
        </p>
        <p className={styles.truth}>
          <strong>
            {candidate.handoffAvailability === 'connected_preview'
              ? 'Connected in this Preview'
              : 'Directory choice only'}
          </strong>
          <span>
            Passage has not contacted this funeral home and will not grant
            access when you save it.
          </span>
        </p>
        {saveMessage && (
          <p className={styles.error} ref={recoveryRef} role="alert" tabIndex={-1}>{saveMessage}</p>
        )}
        <div className={styles.actions}>
          <button disabled={saving} onClick={confirmCandidate} type="button">
            {saving ? 'Saving choice...' : 'Use this funeral home'}
          </button>
          <button disabled={saving} onClick={startSearch} type="button">
            Change selection
          </button>
          <button disabled={saving} onClick={startManual} type="button">
            Edit details
          </button>
        </div>
      </section>
    );
  }

  const activeResult = activeIndex >= 0 ? results[activeIndex] : null;
  return (
    <section className={styles.discovery}>
      <div className={styles.sectionHeading}>
        <p>Find the receiver</p>
        <h2>Choose a funeral home</h2>
        <span>
          Search by funeral home name, street, city, or ZIP code.
        </span>
      </div>
      <p className={styles.previewBoundary}>
        Preview search uses a small sample directory and may not include every
        funeral home. Searching does not contact a funeral home.
      </p>
      <div className={styles.combobox}>
        <label htmlFor={`${listboxId}-input`}>Funeral home name or address</label>
        <input
          aria-activedescendant={
            open && activeResult
              ? `${listboxId}-${activeResult.sourceKey}`
              : undefined
          }
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-describedby={statusId}
          aria-expanded={open}
          autoComplete="off"
          id={`${listboxId}-input`}
          onChange={(event) => {
            gate.current?.cancel();
            setResults([]);
            setOpen(false);
            setActiveIndex(-1);
            setQuery(event.target.value);
            setPendingInput(null);
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={handleComboboxKey}
          placeholder="Start typing a name or address."
          role="combobox"
          value={query}
        />
        {open && results.length > 0 && (
          <div className={styles.results} id={listboxId} role="listbox">
            {results.map((result, index) => (
              <div
                aria-selected={activeIndex === index}
                className={
                  activeIndex === index
                    ? styles.resultActive
                    : styles.result
                }
                id={`${listboxId}-${result.sourceKey}`}
                key={result.sourceKey}
                onClick={() => chooseResult(result)}
                onMouseDown={(event) => event.preventDefault()}
                role="option"
              >
                <strong>{result.displayName}</strong>
                <span>{result.address.formatted}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className={styles.searchStatus} id={statusId} role="status">
        {searchMessage(searchState, results.length)}
      </p>
      {['offline', 'rate_limit', 'unavailable'].includes(searchState) && (
        <button
          className={styles.retry}
          onClick={() => setRetryCount((current) => current + 1)}
          type="button"
        >
          Try again
        </button>
      )}
      {saveMessage && (
        <p className={styles.error} ref={recoveryRef} role="alert" tabIndex={-1}>
          {saveMessage}
        </p>
      )}
      <div className={styles.manualFallback}>
        <strong>Cannot find it?</strong>
        <span>You can still save the name and address yourself.</span>
        <button onClick={startManual} type="button">
          Enter funeral home details manually
        </button>
        {saved && (
          <button onClick={() => setMode('saved')} type="button">
            Cancel change
          </button>
        )}
      </div>
    </section>
  );
}

function searchMessage(state: SearchState, resultCount: number) {
  switch (state) {
    case 'loading_selection':
      return 'Checking your saved funeral home...';
    case 'loading':
      return 'Looking for funeral homes...';
    case 'results':
      return `${resultCount} funeral homes found. Use the arrow keys to review them.`;
    case 'empty':
      return 'No matches found. Check the name or address, or enter the details manually.';
    case 'offline':
      return "You're offline, so suggestions aren't available. Enter the details manually, or try again when you're connected.";
    case 'rate_limit':
      return 'Search is temporarily busy. Wait a moment and try again, or enter the details manually.';
    case 'unavailable':
      return "We couldn't search right now. Nothing was saved. Try again or enter the details manually.";
    case 'signed_out':
      return 'Your sign-in could not be verified. Sign in again before searching.';
    default:
      return 'Start typing a name or address.';
  }
}

function isAbort(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

function formatSavedTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return 'with a verified receipt';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
