import { PASSAGE_BRAND, brandMarkUrl } from '../lib/brand';
import { PASSAGE_FONT, PASSAGE_TYPE } from '../lib/typography';

const BRAND = {
  ink: '#1a1916',
  forest: '#214b37',
  mid: '#6a6560',
};

export const PASSAGE_MARK = {
  light: PASSAGE_BRAND.assets.markLight,
  animated: PASSAGE_BRAND.assets.markAnimated,
  forest: PASSAGE_BRAND.assets.markForest,
  dark: PASSAGE_BRAND.assets.markDark,
  bare: PASSAGE_BRAND.assets.markBare,
};

export function PassageLogo({
  animated = false,
  compact = false,
  tone = 'light',
  showTagline = false,
  markOnly = false,
  size = 34,
}) {
  const src = animated ? brandMarkUrl('animated') : brandMarkUrl(tone);
  if (markOnly) {
    return (
      <img
        src={src}
        alt="Passage"
        width={size}
        height={size}
        style={{ display: 'block', width: size, height: size, borderRadius: Math.round(size * 0.22), objectFit: 'contain' }}
      />
    );
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: compact ? 8 : 10, color: BRAND.forest, minWidth: 0, fontFamily: PASSAGE_FONT.family }}>
      <img
        src={src}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        style={{ display: 'block', width: size, height: size, borderRadius: Math.round(size * 0.22), objectFit: 'contain', flex: '0 0 auto' }}
      />
      <span style={{ display: 'grid', gap: showTagline ? 1 : 0, minWidth: 0 }}>
        <span style={compact ? PASSAGE_TYPE.logoCompact : PASSAGE_TYPE.logo}>{PASSAGE_BRAND.name}</span>
        {showTagline && (
          <span style={{ ...PASSAGE_TYPE.caption, color: BRAND.mid, fontSize: 11, lineHeight: 1.1, whiteSpace: 'nowrap' }}>{PASSAGE_BRAND.tagline}</span>
        )}
      </span>
    </span>
  );
}
