import { ExplorePage, exploreMetadata } from '../../_views/ExplorePage';

export const metadata = exploreMetadata('ar');

export default async function Page({ searchParams }) {
  return <ExplorePage searchParams={searchParams} />;
}
