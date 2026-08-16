// Shared between server (lib/partner/hosted.ts, actions.ts) and client
// (VendorStartForm.tsx) code -- deliberately has no 'server-only' import so
// it can be used from either.
export const VENDOR_CATEGORIES = ['florist', 'caterer', 'restaurant', 'cemetery', 'transport', 'printer_stationery', 'memorial_products', 'other'] as const;
export type VendorCategory = (typeof VENDOR_CATEGORIES)[number];

export const VENDOR_CATEGORY_LABELS: Record<VendorCategory, string> = {
  florist: 'Florist',
  caterer: 'Caterer',
  restaurant: 'Restaurant',
  cemetery: 'Cemetery',
  transport: 'Transport',
  printer_stationery: 'Printer / Stationery',
  memorial_products: 'Memorial products',
  other: 'Other',
};
