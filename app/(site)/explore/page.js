import { ExplorePage, exploreMetadata } from '../../_views/ExplorePage';

export const metadata = exploreMetadata('en');

export default async function Page({ searchParams }) {
  return <ExplorePage searchParams={searchParams} />;
}
