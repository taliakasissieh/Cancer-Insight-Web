'use client';

import Link from 'next/link';

export default function Error({ reset }) {
  return (
    <section className="pageHead">
      <div className="pageHeadInner">
        <div className="narrow">
          <h1>Something went wrong on this page</h1>
          <p className="lede">
            The page hit an unexpected error. Trying again usually works; if it keeps happening,
            please let us know on the <Link href="/contact">contact page</Link>.
          </p>
          <button type="button" className="btn btnPrimary" onClick={() => reset()}>
            Try again
          </button>
        </div>
      </div>
    </section>
  );
}
