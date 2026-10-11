import Explorer from '../../_components/explore/Explorer';

export const metadata = {
  title: 'Explore cancer research',
  description:
    'Search a cancer type to see recent research papers, the size and study-design mix of its PubMed literature, treatment evidence and scientific images — each count linked to its PubMed query.',
  alternates: { canonical: '/explore' },
};

const VIEWS = ['overview', 'papers', 'treatments', 'images', 'saved'];

export default async function ExplorePage({ searchParams }) {
  const sp = (await searchParams) || {};
  const cancer = typeof sp.cancer === 'string' ? sp.cancer.slice(0, 60) : '';
  const view = VIEWS.includes(sp.view) ? sp.view : 'overview';
  const treatment = typeof sp.treatment === 'string' ? sp.treatment.slice(0, 50) : '';
  return <Explorer initialCancer={cancer} initialView={view} initialTreatment={treatment} />;
}
