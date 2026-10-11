import Link from 'next/link';
import CancerSearch from './CancerSearch';
import { localePath, makeT } from '../../lib/i18n/index.js';
import { richText } from '../../lib/i18n/rich.js';

export default function NotFoundView({ locale = 'en' }) {
  const t = makeT(locale);
  return (
    <section className="pageHead">
      <div className="pageHeadInner">
        <div className="narrow">
          <h1>{t('notFound.title')}</h1>
          <p className="lede">
            {richText(t('notFound.body'), {
              home: <Link href={localePath(locale, '/')}>{t('notFound.home')}</Link>,
            })}
          </p>
          <CancerSearch />
        </div>
      </div>
    </section>
  );
}
