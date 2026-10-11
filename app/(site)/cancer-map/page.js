import MapPage, { mapMetadata } from '../../_views/MapPage';

export const metadata = mapMetadata('en');

export default function Page() {
  return <MapPage locale="en" />;
}
