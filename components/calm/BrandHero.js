// Passage Calm Guided OS — animated brand hero (Cycle 5 library).
// Canonical slogan, tastefully animated: staggered word rise + a soft underline
// draw on the key phrase. Respects prefers-reduced-motion. Built on designSystem.
import { DS, SANS } from '../../lib/designSystem';
import { PASSAGE_BRAND } from '../../lib/brand';

export default function BrandHero({
  slogan = PASSAGE_BRAND.slogan || "The operating system for life's hardest logistics.",
  subhead = 'When someone dies, Passage shows you the next step, prepares the hard parts, and keeps everyone on the same page.',
  children,
}) {
  const words = String(slogan).split(' ');
  return (
    <div style={{ maxWidth: 620, margin: '0 auto', textAlign: 'center', fontFamily: SANS, padding: '8px 0' }}>
      <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.015em', lineHeight: 1.16, color: DS.color.ink, margin: '0 0 14px' }}>
        {words.map((w, i) => (
          <span key={i} className="bh-w" style={{ animationDelay: (0.06 * i).toFixed(2) + 's' }}>
            {w === 'logistics' || w === 'logistics.'
              ? <span className="bh-key">{w}</span>
              : w}{' '}
          </span>
        ))}
      </h1>
      <p className="bh-sub" style={{ fontSize: 16, color: DS.color.mid, lineHeight: 1.6, margin: '0 0 22px' }}>{subhead}</p>
      <div className="bh-cta">{children}</div>
      <style jsx>{`
        .bh-w { display: inline-block; opacity: 0; transform: translateY(12px); animation: bhRise 0.6s cubic-bezier(.4, 0, .2, 1) forwards; }
        .bh-key { position: relative; white-space: nowrap; }
        .bh-key::after { content: ''; position: absolute; left: 0; bottom: 2px; height: 2px; width: 0; background: ${DS.color.sage}; border-radius: 2px; animation: bhDraw 0.7s cubic-bezier(.4, 0, .2, 1) forwards; animation-delay: ${(0.06 * words.length + 0.15).toFixed(2)}s; }
        .bh-sub, .bh-cta { opacity: 0; animation: bhFade 0.7s ease forwards; animation-delay: ${(0.06 * words.length + 0.25).toFixed(2)}s; }
        @keyframes bhRise { to { opacity: 1; transform: none; } }
        @keyframes bhDraw { to { width: 100%; } }
        @keyframes bhFade { to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          .bh-w, .bh-sub, .bh-cta { opacity: 1 !important; transform: none !important; animation: none !important; }
          .bh-key::after { width: 100%; animation: none; }
        }
      `}</style>
    </div>
  );
}
