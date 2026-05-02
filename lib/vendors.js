export const VENDOR_CATEGORIES = {
  florist: 'Florist',
  catering: 'Catering',
  memorial_printing: 'Memorial printing',
  travel_lodging: 'Travel / lodging',
  transportation: 'Transportation',
  clergy_officiant: 'Clergy / officiant',
  venue: 'Venue',
  legal_estate_support: 'Legal / estate support',
  cemetery_monument: 'Cemetery / monument',
  grief_support: 'Grief support',
};

export const VENDOR_CATEGORY_VALUES = Object.keys(VENDOR_CATEGORIES);

export function normalizeVendorCategory(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_').replace(/\//g, '_');
  if (VENDOR_CATEGORIES[normalized]) return normalized;
  if (normalized.includes('flower')) return 'florist';
  if (normalized.includes('cater') || normalized.includes('food')) return 'catering';
  if (normalized.includes('print') || normalized.includes('program')) return 'memorial_printing';
  if (normalized.includes('travel') || normalized.includes('hotel') || normalized.includes('lodging')) return 'travel_lodging';
  if (normalized.includes('transport') || normalized.includes('limo')) return 'transportation';
  if (normalized.includes('clergy') || normalized.includes('officiant') || normalized.includes('pastor') || normalized.includes('rabbi') || normalized.includes('priest') || normalized.includes('imam')) return 'clergy_officiant';
  if (normalized.includes('venue') || normalized.includes('hall')) return 'venue';
  if (normalized.includes('attorney') || normalized.includes('legal') || normalized.includes('estate')) return 'legal_estate_support';
  if (normalized.includes('cemetery') || normalized.includes('monument') || normalized.includes('headstone')) return 'cemetery_monument';
  if (normalized.includes('grief') || normalized.includes('counsel')) return 'grief_support';
  return '';
}

export function categoryForTask(taskOrTitle) {
  const title = String(typeof taskOrTitle === 'string' ? taskOrTitle : taskOrTitle?.title || taskOrTitle?.task_title || '').toLowerCase();
  const description = String(typeof taskOrTitle === 'string' ? '' : taskOrTitle?.description || taskOrTitle?.recommended_action || '').toLowerCase();
  const text = `${title} ${description}`;
  if (/flower|florist|arrangement|spray|bouquet/.test(text)) return 'florist';
  if (/cater|food|meal|reception|repast|refreshment/.test(text)) return 'catering';
  if (/program|memorial card|prayer card|printing|print|obituary submission|service booklet/.test(text)) return 'memorial_printing';
  if (/hotel|lodging|travel|flight|out-of-town|out of town/.test(text)) return 'travel_lodging';
  if (/transport|limo|vehicle|shuttle|ride/.test(text)) return 'transportation';
  if (/clergy|officiant|pastor|rabbi|priest|imam|faith leader|service leader/.test(text)) return 'clergy_officiant';
  if (/venue|hall|reception space|event space/.test(text)) return 'venue';
  if (/attorney|lawyer|probate|legal|estate support/.test(text)) return 'legal_estate_support';
  if (/cemetery|headstone|monument|marker|grave|burial plot/.test(text)) return 'cemetery_monument';
  if (/grief|counsel|support group|bereavement/.test(text)) return 'grief_support';
  return '';
}

export function shouldShowVendorSupport(taskOrTitle) {
  return !!categoryForTask(taskOrTitle);
}

export function vendorCategoryLabel(category) {
  return VENDOR_CATEGORIES[category] || 'Local support';
}

export function cleanZipList(input) {
  const raw = Array.isArray(input) ? input.join(',') : String(input || '');
  return Array.from(new Set(raw.split(/[,\s]+/).map((zip) => zip.replace(/\D/g, '').slice(0, 5)).filter((zip) => zip.length === 5)));
}

export function vendorAvailabilityLabel(vendor) {
  const parts = [];
  if (vendor?.rush_supported) parts.push(vendor.rush_window_hours ? `Rush within ${vendor.rush_window_hours}h` : 'Rush available');
  if (vendor?.planned_supported) parts.push('Planned support');
  return parts.length ? parts.join(' · ') : 'Availability not listed';
}
