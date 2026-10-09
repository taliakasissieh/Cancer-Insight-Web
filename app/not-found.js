import Link from 'next/link';
import CancerSearch from './_components/CancerSearch';

export default function NotFound() {
  return (
    <section className="pageHead">
      <div className="pageHeadInner">
        <div className="narrow">
          <h1>This page does not exist</h1>
          <p className="lede">
            The link may be out of date. Search for a cancer type, or go to the{' '}
            <Link href="/">home page</Link>.
          </p>
          <CancerSearch />
        </div>
      </div>
    </section>
  );
}
