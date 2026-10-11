import FaqPage, { faqMetadata } from '../../_views/FaqPage';

export const metadata = faqMetadata('en');

export default function Page() {
  return <FaqPage locale="en" />;
}
