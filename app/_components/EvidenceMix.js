'use client';

import { useI18n } from './I18n';

const ORDER = ['primary', 'synthesis', 'guidance', 'commentary', 'other', 'unclassified'];
const COLOR = {
  primary: 'var(--fam-primary)',
  synthesis: 'var(--fam-synthesis)',
  guidance: 'var(--fam-guidance)',
  commentary: 'var(--fam-commentary)',
  other: 'var(--fam-other)',
  unclassified: 'var(--fam-unclassified)',
};

/** Composition of a set of records by evidence family (from PubMed publication types). */
export default function EvidenceMix({ byFamily = {}, total = 0 }) {
  const { t } = useI18n();
  if (!total) return null;
  const parts = ORDER.filter(f => byFamily[f]).map(f => ({ f, n: byFamily[f] }));
  return (
    <div>
      <div
        className="mixBar"
        role="img"
        aria-label={parts
          .map(p => t('evidence.mixOf', { label: t(`evidence.families.${p.f}`), n: p.n, total }))
          .join('; ')}
      >
        {parts.map(p => (
          <span key={p.f} style={{ width: `${(p.n / total) * 100}%`, background: COLOR[p.f] }} />
        ))}
      </div>
      <ul className="mixLegend">
        {parts.map(p => (
          <li key={p.f} title={t(`evidence.familyNotes.${p.f}`)}>
            <span className="swatch" style={{ background: COLOR[p.f] }} />
            {t(`evidence.families.${p.f}`)}
            <span className="num">{t('common.of', { a: p.n, b: total })}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
