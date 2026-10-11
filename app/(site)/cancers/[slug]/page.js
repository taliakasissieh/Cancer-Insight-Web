import ProfilePage, { PROFILE_IDS, profileMetadata } from '../../../_views/ProfilePage';

export const dynamicParams = false;

export function generateStaticParams() {
  return PROFILE_IDS.map(slug => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return profileMetadata('en', slug);
}

export default async function Page({ params }) {
  const { slug } = await params;
  return <ProfilePage locale="en" id={slug} />;
}
