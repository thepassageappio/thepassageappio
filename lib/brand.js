export const PASSAGE_BRAND = {
  name: 'Passage',
  tagline: 'Family coordination record',
  slogan: "The operating system for life's hardest logistics.",
  siteUrl: 'https://www.thepassageapp.io',
  supportEmail: '',
  assets: {
    markLight: '/brand/passage-held-light.svg',
    markAnimated: '/brand/passage-held-animated.svg',
    markForest: '/brand/passage-held-forest.svg',
    markDark: '/brand/passage-held-dark.svg',
    markBare: '/brand/passage-held-bare.svg',
    socialImage: '/brand/passage-held-1024.png',
    appleTouchIcon: '/brand/passage-held-192.png',
    favicon: '/favicon.svg',
  },
};

export function brandSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || PASSAGE_BRAND.siteUrl).replace(/\/$/, '');
}

export function brandAssetUrl(path) {
  if (!path) return brandSiteUrl();
  if (/^https?:\/\//i.test(path)) return path;
  return `${brandSiteUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}

export function brandMarkUrl(variant = 'light', absolute = false) {
  const key = variant === 'animated'
    ? 'markAnimated'
    : variant === 'forest'
      ? 'markForest'
      : variant === 'dark'
        ? 'markDark'
        : variant === 'bare'
          ? 'markBare'
          : 'markLight';
  const path = PASSAGE_BRAND.assets[key] || PASSAGE_BRAND.assets.markLight;
  return absolute ? brandAssetUrl(path) : path;
}
