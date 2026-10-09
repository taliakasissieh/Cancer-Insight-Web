'use client';

import Link from 'next/link';
import CancerSearch from '../CancerSearch';
import { CANCERS } from '../../../lib/queries';

const FEED_COVERED = Object.entries(CANCERS)
  .filter(([id, c]) => c.feed === id)
  .map(([id, c]) => ({ id, label: c.label }));

export default function StartScreen({ onSearch, savedCount }) {
  return (
    <section className="pageHead">
      <div className="pageHeadInner">
        <div className="narrow">
          <h1>Explore cancer research</h1>
          <p className="lede">
            Choose a cancer type. You’ll see its most recent research papers, how large its PubMed
            literature is, which study designs it contains, treatment evidence and scientific
            images.
          </p>
          <CancerSearch onSearch={onSearch} autoFocus />
          <p className="small muted" style={{ marginTop: 24 }}>
            A recent-research feed with treatment tags is available for:{' '}
            {FEED_COVERED.map((c, i) => (
              <span key={c.id}>
                <button
                  type="button"
                  className="btn btnQuiet btnSmall"
                  style={{ padding: '0 4px', minHeight: 0 }}
                  onClick={() => onSearch(c.id)}
                >
                  {c.label}
                </button>
                {i < FEED_COVERED.length - 1 ? ', ' : '.'}
              </span>
            ))}{' '}
            Every other cancer is searched directly in PubMed.
          </p>
          {savedCount > 0 && (
            <p className="small">
              <Link href="/explore?view=saved">Open your {savedCount} saved papers</Link>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
