import DataPage, { dataMetadata } from '../../_views/DataPage';

export const revalidate = 86400;
export const metadata = dataMetadata('ar');

export default function Page() {
  return <DataPage locale="ar" />;
}
