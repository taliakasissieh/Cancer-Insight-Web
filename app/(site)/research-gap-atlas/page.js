import AtlasPage, { atlasMetadata } from '../../_views/AtlasPage';

export const metadata = atlasMetadata('en');

export default function Page() {
  return <AtlasPage locale="en" />;
}
