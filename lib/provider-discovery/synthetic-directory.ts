import type {
  ProviderDiscoveryResult,
  ProviderAddress,
} from './types';

export const SYNTHETIC_DIRECTORY_DATASET_VERSION = '2026-07-a16-v1';

const directory: readonly ProviderDiscoveryResult[] = [
  entry(
    'northstar-portland',
    'Northstar Funeral Home',
    {
      line1: '7421 SE Division Street',
      locality: 'Portland',
      administrativeArea: 'OR',
      postalCode: '97206',
      countryCode: 'US',
    },
    'connected_preview',
  ),
  entry('northstar-beaverton', 'Northstar Funeral Home', {
    line1: '12600 SW Crescent Street',
    locality: 'Beaverton',
    administrativeArea: 'OR',
    postalCode: '97005',
    countryCode: 'US',
  }),
  entry('cedar-stone-beaverton', 'Cedar & Stone Memorial', {
    line1: '4800 SW Watson Avenue',
    locality: 'Beaverton',
    administrativeArea: 'OR',
    postalCode: '97005',
    countryCode: 'US',
  }),
  entry('riverbend-salem', 'Riverbend Funeral Care', {
    line1: '955 Liberty Street SE',
    locality: 'Salem',
    administrativeArea: 'OR',
    postalCode: '97302',
    countryCode: 'US',
  }),
  entry('evergold-eugene', 'Evergold Memorial Home', {
    line1: '2125 Willamette Street',
    locality: 'Eugene',
    administrativeArea: 'OR',
    postalCode: '97405',
    countryCode: 'US',
  }),
  entry('harbor-light-astoria', 'Harbor Light Funeral Home', {
    line1: '1145 Marine Drive',
    locality: 'Astoria',
    administrativeArea: 'OR',
    postalCode: '97103',
    countryCode: 'US',
  }),
  entry('main-street-new-york', 'Main Street Memorial Home', {
    line1: '10 Main Street',
    locality: 'New York',
    administrativeArea: 'NY',
    postalCode: '10001',
    countryCode: 'US',
  }),
];

type FailureMode = 'unavailable' | 'rate_limit';

export class ProviderDiscoveryError extends Error {
  constructor(public readonly kind: FailureMode) {
    super(kind);
    this.name = 'ProviderDiscoveryError';
  }
}
export type ProviderDiscoveryAdapter = {
  search(
    query: string,
    limit: number,
    signal?: AbortSignal,
  ): Promise<ProviderDiscoveryResult[]>;
};

type AdapterOptions = {
  delayMs?: number;
  failure?: FailureMode;
};

export function createSyntheticProviderDiscoveryAdapter(
  options: AdapterOptions = {},
): ProviderDiscoveryAdapter {
  return {
    async search(query, limit, signal) {
      signal?.throwIfAborted();
      if (options.delayMs) await abortableDelay(options.delayMs, signal);
      signal?.throwIfAborted();
      if (options.failure) throw new ProviderDiscoveryError(options.failure);
      return rankSyntheticProviders(query, limit);
    },
  };
}

export function rankSyntheticProviders(
  query: string,
  limit = 6,
): ProviderDiscoveryResult[] {
  const normalizedQuery = normalize(query);
  if (normalizedQuery.length < 2 || limit <= 0) return [];
  const queryTokens = tokenize(normalizedQuery);

  return directory
    .map((provider) => ({
      provider,
      score: score(provider, normalizedQuery, queryTokens),
    }))
    .filter(
      (
        candidate,
      ): candidate is { provider: ProviderDiscoveryResult; score: number } =>
        candidate.score !== null,
    )
    .sort(
      (left, right) =>
        left.score - right.score ||
        normalize(left.provider.displayName).localeCompare(
          normalize(right.provider.displayName),
        ) ||
        normalize(left.provider.address.locality).localeCompare(
          normalize(right.provider.address.locality),
        ) ||
        left.provider.sourceKey.localeCompare(right.provider.sourceKey),
    )
    .slice(0, Math.min(6, limit))
    .map(({ provider }) => provider);
}

export function getSyntheticDirectoryForTests() {
  return directory.map((provider) => ({
    ...provider,
    address: { ...provider.address },
  }));
}

function entry(
  sourceKey: string,
  displayName: string,
  addressInput: Omit<ProviderAddress, 'formatted'>,
  handoffAvailability: ProviderDiscoveryResult['handoffAvailability'] = 'save_only',
): ProviderDiscoveryResult {
  const address = {
    ...addressInput,
    formatted: formatAddress(addressInput),
  };
  return {
    sourceKey,
    datasetVersion: SYNTHETIC_DIRECTORY_DATASET_VERSION,
    displayName,
    address,
    handoffAvailability,
  };
}

function formatAddress(address: Omit<ProviderAddress, 'formatted'>) {
  return [
    address.line1,
    address.line2,
    [address.locality, address.administrativeArea]
      .filter(Boolean)
      .join(', '),
    address.postalCode,
    address.countryCode,
  ]
    .filter(Boolean)
    .join(' ');
}

function score(
  provider: ProviderDiscoveryResult,
  query: string,
  queryTokens: readonly string[],
) {
  const name = normalize(provider.displayName);
  const line1 = normalize(provider.address.line1);
  const locality = normalize(provider.address.locality);
  const administrativeArea = normalize(provider.address.administrativeArea);
  const postalCode = normalize(provider.address.postalCode);
  const formatted = normalize(provider.address.formatted);

  if (name === query) return 0;
  if (name.startsWith(query)) return 1;

  const rankedFields = [
    { rank: 0, tokens: tokenize(name) },
    { rank: 10, tokens: tokenize(line1) },
    { rank: 20, tokens: tokenize(locality) },
    { rank: 30, tokens: tokenize(administrativeArea) },
    { rank: 40, tokens: tokenize(postalCode) },
    { rank: 50, tokens: tokenize(formatted) },
  ];

  let total = 100;
  for (const queryToken of queryTokens) {
    const matches = rankedFields.flatMap((field) =>
      field.tokens
        .filter((candidateToken) => candidateToken.startsWith(queryToken))
        .map((candidateToken) =>
          field.rank + (candidateToken === queryToken ? 0 : 1),
        ),
    );
    if (matches.length === 0) return null;
    total += Math.min(...matches);
  }
  return total;
}

function tokenize(value: string) {
  return value.split(' ').filter(Boolean);
}

function normalize(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function abortableDelay(delayMs: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const timer = windowlessTimeout(resolve, delayMs);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

function windowlessTimeout(callback: () => void, delayMs: number) {
  return setTimeout(callback, delayMs);
}
