export type SearchRequestHandle = {
  id: number;
  signal: AbortSignal;
  isCurrent: () => boolean;
};

export type SearchRequestGate = {
  start: () => SearchRequestHandle;
  cancel: () => void;
};

export function createSearchRequestGate(): SearchRequestGate {
  let sequence = 0;
  let active: AbortController | null = null;

  return {
    start() {
      active?.abort(new DOMException('Superseded by a newer search', 'AbortError'));
      active = new AbortController();
      const controller = active;
      const id = ++sequence;
      return {
        id,
        signal: controller.signal,
        isCurrent: () => active === controller && sequence === id,
      };
    },
    cancel() {
      active?.abort(new DOMException('Search canceled', 'AbortError'));
      active = null;
      sequence += 1;
    },
  };
}

export function nextActiveOption(
  current: number,
  resultCount: number,
  direction: 1 | -1,
) {
  if (resultCount <= 0) return -1;
  if (current < 0) return direction === 1 ? 0 : resultCount - 1;
  return (current + direction + resultCount) % resultCount;
}
