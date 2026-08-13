export type ProviderAddress = {
  line1: string;
  line2?: string;
  locality: string;
  administrativeArea: string;
  postalCode: string;
  countryCode: string;
  formatted: string;
};

export type HandoffAvailability = 'connected_preview' | 'save_only';

export type ProviderDiscoveryResult = {
  sourceKey: string;
  datasetVersion: string;
  displayName: string;
  address: ProviderAddress;
  handoffAvailability: HandoffAvailability;
};

export type ProviderSourceKind = 'synthetic_directory' | 'manual';

export type ProviderSelectionSummary = {
  displayName: string;
  address: ProviderAddress;
  addressReviewRequired: boolean;
  handoffAvailability: HandoffAvailability;
  selectedAt: string;
  audience: string;
};

export type FamilyProviderSelection = ProviderSelectionSummary & {
  replayed: boolean;
};

export type BrowserDemoProviderSelection = ProviderSelectionSummary & {
  demoSelectionId: string;
  persistence: 'page_only';
};

export type ProviderConfirmationInput =
  | {
      requestId: string;
      expectedSelectionSavedAt: string | null;
      sourceKind: 'synthetic_directory';
      sourceKey: string;
    }
  | {
      requestId: string;
      expectedSelectionSavedAt: string | null;
      sourceKind: 'manual';
      displayName: string;
      address: Omit<ProviderAddress, 'formatted'>;
    };
export type ProviderConfirmationResult =
  | { ok: true; selection: FamilyProviderSelection }
  | {
      ok: false;
      reason:
        | 'conflict'
        | 'known_failure'
        | 'signed_out'
        | 'unavailable'
        | 'validation';
      message: string;
    };
