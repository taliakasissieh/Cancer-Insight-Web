import { notFound } from 'next/navigation';

/* Any unknown address under /ar shows the Arabic "not found" page inside the Arabic layout. */
export default function UnknownArabicPage() {
  notFound();
}
