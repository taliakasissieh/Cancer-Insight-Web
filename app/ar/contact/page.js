import Link from 'next/link';
import DocPage from '../../_components/DocPage';
import { languageAlternates } from '../../../lib/i18n/index.js';

export const metadata = {
  title: 'التواصل',
  description:
    'تواصل مع Cancer Insight بشأن معلومات بحثية غير صحيحة أو روابط معطّلة أو نسبة الصور أو الخصوصية أو المنهجية.',
  alternates: { canonical: '/ar/contact', languages: languageAlternates('/contact') },
};

export default function Contact() {
  return (
    <DocPage
      locale="ar"
      title="التواصل"
      intro="نرحّب بالتصحيحات والإبلاغ عن الروابط المعطّلة والأسئلة عن الموقع."
    >
      <div className="contactCard">
        <p style={{ margin: '0 0 4px' }}>البريد الإلكتروني</p>
        <a className="contactEmail" href="mailto:cancerinsight.contact@gmail.com" dir="ltr">
          cancerinsight.contact@gmail.com
        </a>
      </div>

      <h2>الإبلاغ عن مشكلة في المعلومات البحثية</h2>
      <p>أرسل أكبر قدر ممكن مما يلي، فهو يساعدنا على إعادة إنتاج المشكلة:</p>
      <ul>
        <li>
          نوع السرطان الذي بحثت عنه والصفحة (النظرة العامة، الأوراق، العلاجات، التجارب، أطلس
          الفجوات، خريطة السرطان، البحث مقابل العبء…)؛
        </li>
        <li>عنوان الورقة ورقمها في PubMed أو معرّف DOI، أو رقم التجربة (NCT)؛</li>
        <li>ما الذي يبدو خاطئًا، وما الذي كنت تتوقعه.</li>
      </ul>
      <p>
        بعض المعلومات تأتي من PubMed أو ClinicalTrials.gov أو GLOBOCAN أو الموجز البحثي؛ يمكننا
        شرحها، لكن تصحيح السجلات نفسها لا يتم إلا لدى المصدر.
      </p>

      <h2>الصور ونسبتها</h2>
      <p>
        إذا كانت المشكلة في صورة، فاذكر عنوانها أو رابطها في ويكيميديا كومنز. يحدّد الرافع الأصلي
        ترخيص الصورة.
      </p>

      <h2>الخصوصية</h2>
      <p>
        تُرسل أسئلة الخصوصية وطلباتها إلى العنوان نفسه. راجع{' '}
        <Link href="/ar/privacy-policy">سياسة الخصوصية</Link> لمعرفة ما يجمعه الموقع.
      </p>

      <h2>الأسئلة الطبية</h2>
      <p>
        لا يستطيع Cancer Insight الإجابة عن أسئلة طبية شخصية أو مراجعة سجلات طبية. يُرجى عدم إرسال
        تفاصيل صحية بالبريد الإلكتروني، واسأل طبيبًا مختصًا بدلًا من ذلك.
      </p>

      <p className="muted">
        يُدار Cancer Insight بشكل مستقل؛ الرد غير مضمون، لكن كل بلاغ يُقرأ.
      </p>
    </DocPage>
  );
}
