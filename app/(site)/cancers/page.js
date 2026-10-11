import CancersIndexPage, { cancersIndexMetadata } from '../../_views/CancersIndexPage';

export const metadata = cancersIndexMetadata('en');

export default function Page() {
  return <CancersIndexPage locale="en" />;
}
