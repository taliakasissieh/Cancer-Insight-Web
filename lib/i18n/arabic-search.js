/*
  Arabic cancer names → catalogue ids, so the Arabic site can be searched in Arabic.
  Matching ignores diacritics, tatweel and common letter variants (أ/إ/آ → ا, ى → ي, ة → ه),
  and prefers the longest matching name ("عنق الرحم" before "الرحم").
*/

const NAMES = {
  lung: ['الرئة', 'رئة'],
  nsclc: ['الرئة غير صغير الخلايا', 'الرئة ذو الخلايا غير الصغيرة', 'الخلايا غير الصغيرة'],
  breast: ['الثدي'],
  brain: ['الدماغ', 'المخ', 'أورام الدماغ'],
  glioblastoma: ['الأرومي الدبقي', 'الورم الأرومي الدبقي', 'غليوبلاستوما', 'جليوبلاستوما'],
  colorectal: ['القولون والمستقيم', 'القولون', 'المستقيم'],
  prostate: ['البروستاتا', 'البروستات'],
  pancreatic: ['البنكرياس'],
  liver: ['الكبد'],
  hepatocellular: ['الخلايا الكبدية'],
  kidney: ['الكلى', 'الكلية'],
  'renal-cell': ['الخلايا الكلوية'],
  melanoma: ['الميلانيني', 'الميلانوما', 'ميلانوما', 'الورم الميلانيني'],
  skin: ['الجلد'],
  ovarian: ['المبيض', 'المبايض'],
  cervical: ['عنق الرحم'],
  bladder: ['المثانة'],
  stomach: ['المعدة'],
  esophageal: ['المريء', 'المرئ'],
  leukemia: ['اللوكيميا', 'لوكيميا', 'ابيضاض الدم', 'سرطان الدم'],
  lymphoma: ['اللمفوما', 'الليمفوما', 'لمفوما', 'الغدد اللمفاوية', 'الغدد الليمفاوية'],
  myeloma: ['الورم النقوي', 'النقوي المتعدد', 'المايلوما', 'الورم النخاعي المتعدد'],
  thyroid: ['الغدة الدرقية', 'الدرقية'],
  endometrial: ['بطانة الرحم', 'الرحم'],
  'head-and-neck': ['الرأس والعنق', 'الفم', 'الحنجرة', 'البلعوم'],
  sarcoma: ['الساركوما', 'ساركوما', 'الأورام اللحمية'],
  mesothelioma: ['الميزوثيليوما', 'الظهارة المتوسطة', 'ورم المتوسطة'],
  neuroblastoma: ['الأرومي العصبي', 'الورم الأرومي العصبي', 'نيوروبلاستوما'],
  testicular: ['الخصية', 'الخصيتين'],
};

export function normalizeArabic(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[ً-ٰٟ]/g, '')
    .replace(/ـ/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/[^؀-ۿa-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const ENTRIES = Object.entries(NAMES)
  .flatMap(([id, names]) =>
    names.flatMap(name => {
      const n = normalizeArabic(name);
      const bare = n.replace(/(^|\s)ال/g, '$1').trim();
      return bare && bare !== n ? [[id, n], [id, bare]] : [[id, n]];
    })
  )
  .sort((a, b) => b[1].length - a[1].length);

export function hasArabic(value) {
  return /[؀-ۿ]/.test(String(value || ''));
}

/** Returns a catalogue id ("pancreatic") for an Arabic cancer name, or null. */
export function resolveArabicCancer(raw) {
  const text = normalizeArabic(raw);
  if (!text) return null;
  const padded = ` ${text} `;
  for (const [id, name] of ENTRIES) {
    if (padded.includes(` ${name} `) || padded.includes(` ${name}`)) return id;
  }
  return null;
}
