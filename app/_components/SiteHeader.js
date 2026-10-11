'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Logo from './Logo';
import Icon from './Icon';
import { useI18n } from './I18n';
import { useSaved } from '../../lib/client/saved';
import { localePath, stripLocale } from '../../lib/i18n/index.js';

const NAV = [
  { href: '/explore', key: 'nav.explore' },
  { href: '/cancers', key: 'nav.cancers' },
  { href: '/research-gap-atlas', key: 'nav.atlas', exact: true },
  { href: '/cancer-map', key: 'nav.map' },
  { href: '/research-vs-burden', key: 'nav.burden' },
  { href: '/methodology', key: 'nav.methodology' },
];

export default function SiteHeader() {
  const { t, path, locale } = useI18n();
  const pathname = usePathname() || '/';
  const basePath = stripLocale(pathname);
  const [open, setOpen] = useState(false);
  const { items } = useSaved();
  const otherLocale = locale === 'ar' ? 'en' : 'ar';
  const otherHref = localePath(otherLocale, basePath);

  useEffect(() => setOpen(false), [pathname]);

  /* Keep the current search (cancer, view, treatment) when switching language. The explorer
     updates the address without a navigation, so the query is read when the link is used —
     including middle-click and copy-link, which read the link on mouse down or focus. */
  const keepQuery = e => {
    e.currentTarget.href = otherHref + window.location.search + window.location.hash;
  };

  return (
    <header className="siteHeader">
      <a className="skipLink" href="#main">
        {t('common.skipToContent')}
      </a>
      <div className="siteHeaderInner">
        <Link href={path('/')} className="brand" aria-label={t('common.homeLabel')}>
          <Logo />
          <span className="brandName">{t('meta.siteName')}</span>
        </Link>

        <button
          type="button"
          className="menuButton"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen(o => !o)}
        >
          <Icon name={open ? 'close' : 'menu'} />
          <span>{t('common.menu')}</span>
        </button>

        <nav
          id="site-nav"
          className={`siteNav ${open ? 'isOpen' : ''}`}
          aria-label={t('nav.main')}
        >
          <ul>
            {NAV.map(item => {
              const active = item.exact
                ? basePath === item.href
                : basePath === item.href || basePath.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link href={path(item.href)} aria-current={active ? 'page' : undefined}>
                    {t(item.key)}
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link href={path('/explore?view=saved')} className="savedLink">
            <Icon name="bookmark" size={16} filled={items.length > 0} />
            {t('common.saved')}
            {items.length > 0 && <span className="countBadge">{items.length}</span>}
          </Link>
          <a
            href={otherHref}
            className="langLink"
            hrefLang={otherLocale}
            lang={otherLocale}
            title={t('meta.otherLanguageLabel')}
            onClick={keepQuery}
            onMouseDown={keepQuery}
            onFocus={keepQuery}
          >
            {t('meta.otherLanguageName')}
          </a>
        </nav>
      </div>
    </header>
  );
}
