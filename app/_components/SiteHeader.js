'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Logo from './Logo';
import Icon from './Icon';
import { useSaved } from '../../lib/client/saved';

const NAV = [
  { href: '/explore', label: 'Explore' },
  { href: '/research-gap-atlas', label: 'Gap Atlas' },
  { href: '/methodology', label: 'Methodology' },
  { href: '/about', label: 'About' },
];

export default function SiteHeader() {
  const pathname = usePathname() || '/';
  const [open, setOpen] = useState(false);
  const { items } = useSaved();

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="siteHeader">
      <a className="skipLink" href="#main">
        Skip to content
      </a>
      <div className="siteHeaderInner">
        <Link href="/" className="brand" aria-label="Cancer Insight home">
          <Logo />
          <span className="brandName">Cancer Insight</span>
        </Link>

        <button
          type="button"
          className="menuButton"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen(o => !o)}
        >
          <Icon name={open ? 'close' : 'menu'} />
          <span>Menu</span>
        </button>

        <nav id="site-nav" className={`siteNav ${open ? 'isOpen' : ''}`} aria-label="Main">
          <ul>
            {NAV.map(item => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link href={item.href} aria-current={active ? 'page' : undefined}>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link href="/explore?view=saved" className="savedLink">
            <Icon name="bookmark" size={16} filled={items.length > 0} />
            Saved
            {items.length > 0 && <span className="countBadge">{items.length}</span>}
          </Link>
        </nav>
      </div>
    </header>
  );
}
