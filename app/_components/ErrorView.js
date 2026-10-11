'use client';

import Link from 'next/link';
import { useI18n } from './I18n';

export default function ErrorView({ reset }) {
  const { t, rich, path } = useI18n();
  return (
    <section className="pageHead">
      <div className="pageHeadInner">
        <div className="narrow">
          <h1>{t('error.title')}</h1>
          <p className="lede">
            {rich('error.body', { contact: <Link href={path('/contact')}>{t('error.contact')}</Link> })}
          </p>
          <button type="button" className="btn btnPrimary" onClick={() => reset()}>
            {t('common.retry')}
          </button>
        </div>
      </div>
    </section>
  );
}
