import BurdenPage, { burdenMetadata } from '../../_views/BurdenPage';

export const revalidate = 86400;
export const metadata = burdenMetadata('en');

export default function Page() {
  return <BurdenPage locale="en" />;
}
