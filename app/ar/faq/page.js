import FaqPage, { faqMetadata } from '../../_views/FaqPage';

export const metadata = faqMetadata('ar');

export default function Page() {
  return <FaqPage locale="ar" />;
}
