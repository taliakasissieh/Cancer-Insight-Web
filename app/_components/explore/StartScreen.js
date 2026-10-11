'use client';

import Link from 'next/link';
import CancerSearch from '../CancerSearch';
import { useI18n } from '../I18n';
import { CANCERS } from '../../../lib/queries';

const FEED_COVERED = Object.entries(CANCERS)
  .filter(([id, c]) => c.feed === id)
  .map(([id, c]) => ({ id, label: c.label }));

export default function StartScreen({ onSearch, savedCount }) {
  const { t, path, locale } = useI18n();
  return (
    <section className="pageHead">
      <div className="pageHeadInner">
        <div className="narrow">
          <h1>{t('start.title')}</h1>
          <p className="lede">{t('start.lede')}</p>
          <CancerSearch onSearch={onSearch} autoFocus />
          <p className="small muted" style={{ marginTop: 24 }}>
            {t('start.feed')}{' '}
            {FEED_COVERED.map((c, i) => (
              <span key={c.id}>
                <button
                  type="button"
                  className="btn btnQuiet btnSmall"
                  style={{ padding: '0 4px', minHeight: 0 }}
                  onClick={() => onSearch(c.id)}
                >
                  {t(`cancers.${c.id}`)}
                </button>
                {i < FEED_COVERED.length - 1 ? (locale === 'ar' ? '، ' : ', ') : '.'}
              </span>
            ))}{' '}
            {t('start.feedRest')}
          </p>
          {savedCount > 0 && (
            <p className="small">
              <Link href={path('/explore?view=saved')}>{t('start.openSaved', { n: savedCount })}</Link>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
