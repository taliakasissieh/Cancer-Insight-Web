/*
  FAQ answers in both languages. Plain text: the same strings feed the page and the FAQPage
  structured data. Links are [site path, label]; the page adds the /ar prefix where needed.
*/

export const FAQ = {
  en: {
    metaTitle: 'Frequently asked questions',
    metaDescription:
      'Answers about Cancer Insight: where its data come from, what evidence types, trial figures and burden comparisons mean, how the Research Gap Atlas works, saving and exporting, Arabic and privacy.',
    title: 'Frequently asked questions',
    intro: 'Short answers, with links to the methodology where the detail lives.',
    more: 'Still have a question?',
    contact: 'Contact Cancer Insight',
    groups: [
      {
        id: 'about',
        title: 'About Cancer Insight',
        items: [
          {
            q: 'What is Cancer Insight?',
            a: 'An independent, free, educational explorer of cancer research. It shows recent papers, the size and make-up of a cancer’s PubMed literature, treatment literature, registered clinical trials and research coverage, with every count linked to the search that produced it.',
          },
          {
            q: 'Can Cancer Insight tell me which treatment is best?',
            a: 'No. It describes published research; it does not evaluate treatments, diagnose or give medical advice. Discuss personal medical decisions with a qualified clinician.',
          },
          {
            q: 'Who is it for?',
            a: 'Students, researchers, journalists and anyone who wants to understand what research exists on a cancer and where the evidence comes from.',
          },
          {
            q: 'Is the site available in Arabic?',
            a: 'Yes. The whole site is available in Arabic, laid out right to left. You can search with Arabic cancer names; the same English queries are sent to the sources, so the numbers are identical in both languages. Paper titles and abstracts stay in their original language, and exported files stay in English.',
            link: ['/ar', 'العربية'],
          },
        ],
      },
      {
        id: 'numbers',
        title: 'Sources and numbers',
        items: [
          {
            q: 'Where does the research come from?',
            a: 'From NCBI PubMed and PubMed Central (U.S. National Library of Medicine), ClinicalTrials.gov for trials, a third-party research feed (the Cure Cancer With AI research API) for recent records and treatment tags, and Wikimedia Commons for images. Burden figures come from GLOBOCAN 2024 (International Agency for Research on Cancer).',
            link: ['/methodology#sources', 'Sources in detail'],
          },
          {
            q: 'Why does every number link to PubMed?',
            a: 'So you can check it. Each count is a PubMed search; the link runs the identical query on pubmed.ncbi.nlm.nih.gov.',
          },
          {
            q: 'Why is a number slightly different on PubMed?',
            a: 'Cancer Insight caches counts for up to 24 hours and PubMed adds and re-indexes records daily, so small differences are expected.',
          },
          {
            q: 'Why are the papers in “Recent research” all so new?',
            a: 'Because that list is the newest relevant records — a view of what is new, not a sample of the whole literature. Switch the Papers view to PubMed Best Match to see the most relevant records across all years.',
          },
          {
            q: 'Which cancers have treatment tags?',
            a: 'The research feed covers lung, breast, brain, colorectal, prostate, pancreatic, liver, kidney, melanoma, ovarian, cervical, bladder, gastric and esophageal cancers, leukemia and lymphoma. Other cancers are searched directly in PubMed, without treatment tags.',
          },
          {
            q: 'Can I use the data?',
            a: 'Yes. Every analysis is available as JSON or CSV from stable addresses listed on the open data page, together with the searches that produced it. Cite Cancer Insight and the original sources when you reuse it.',
            link: ['/data', 'Open data'],
          },
        ],
      },
      {
        id: 'papers',
        title: 'Papers and evidence types',
        items: [
          {
            q: 'What do the evidence types mean?',
            a: 'They come from PubMed publication types: for example randomized controlled trial, observational study, systematic review or case report. They describe what kind of record a paper is, not how good it is.',
            link: ['/methodology#evidence-types', 'How evidence types are assigned'],
          },
          {
            q: 'What does “Design not indexed” mean?',
            a: 'The paper is indexed only as a generic “Journal Article”. Many original studies are indexed this way, so it is not a judgement about the paper.',
          },
          {
            q: 'Why do some papers carry a retraction warning?',
            a: 'PubMed marks them as retracted publications. Read the retraction notice before relying on anything in them. Each cancer profile also counts the cancer’s retracted records.',
          },
          {
            q: 'Can I reuse a paper marked “Free full text”?',
            a: 'Not necessarily. Free to read is not the same as free to reuse; check the licence on the publisher or PMC page.',
          },
        ],
      },
      {
        id: 'treatments',
        title: 'Treatment literature',
        items: [
          {
            q: 'If one treatment has more papers or trials, is it better?',
            a: 'No. More records, more trials or more recent records reflect research attention, history and funding — not effectiveness, safety or suitability for anyone.',
          },
          {
            q: 'Why are the example papers on each side of a comparison different?',
            a: 'Each side is a separate PubMed Best Match search. The papers are examples of each literature and are not paired.',
          },
        ],
      },
      {
        id: 'trials',
        title: 'Clinical trials',
        items: [
          {
            q: 'Where do the trial figures come from?',
            a: 'From ClinicalTrials.gov. For each cancer one condition search is sent, every matching study is downloaded, and every figure is counted from that single list — which you can download as CSV to check any number.',
            link: ['/methodology#trials', 'How trials are counted'],
          },
          {
            q: 'Does “completed without results posted” mean results were hidden?',
            a: 'No. These are interventional trials that finished at least 24 months ago and have no results section on ClinicalTrials.gov. Many trials publish in journals instead, and many — such as phase 1 trials or trials outside U.S. law — are not required to post results there.',
          },
          {
            q: 'Can Cancer Insight help me find a trial to join?',
            a: 'It lists open trials with links to their registry pages, but it does not check eligibility or recommend any trial. Discuss trials with your care team; each registry page lists its eligibility criteria and contacts.',
          },
        ],
      },
      {
        id: 'burden',
        title: 'Research and burden',
        items: [
          {
            q: 'What does the research-to-burden ratio mean?',
            a: 'It is a cancer’s share of PubMed research from the last five complete years divided by its share of deaths (or new cases) worldwide in GLOBOCAN 2024. Above 1, its share of research is larger than its share of deaths; below 1, smaller.',
            link: ['/research-vs-burden', 'Research vs burden'],
          },
          {
            q: 'Does a low ratio mean a cancer deserves more research?',
            a: 'Not by itself. Burden is one reason among many to study a cancer: survival, curability, how many people live with the disease and scientific opportunity matter too. The ratio describes where attention goes, not how much research each cancer should get.',
          },
          {
            q: 'Why are some cancers missing from the comparison?',
            a: 'GLOBOCAN does not report them as a separate site (sarcoma, neuroblastoma), they are a subtype of a cancer that is listed, or GLOBOCAN defines them differently (skin cancer).',
          },
        ],
      },
      {
        id: 'atlas',
        title: 'Research Gap Atlas and cancer map',
        items: [
          {
            q: 'Does a signal prove a research gap?',
            a: 'No. A signal means a design or theme makes up less than half the share it has across oncology. That can reflect biology, epidemiology, terminology or indexing, so it is a prompt for investigation, not proof of a gap.',
            link: ['/methodology#gap-atlas', 'The method in full'],
          },
          {
            q: 'Why isn’t “children and adolescents” flagged for some cancers?',
            a: 'Cancers that occur mainly in adults are expected to have few pediatric studies, so that measure is shown but not treated as a signal.',
          },
          {
            q: 'Why are treatments never flagged?',
            a: 'Whether a treatment is relevant depends on the biology of each cancer, so a low count cannot be read as a gap.',
          },
          {
            q: 'What do the colours on the cancer map mean?',
            a: 'Each cell is the same ratio as in the atlas. Brown means lower representation than across oncology, blue higher, and the pale neutral colour similar. Every cell shows its value, and only ratios below 0.5 are signals.',
            link: ['/cancer-map', 'Cancer map'],
          },
          {
            q: 'What changed from the earlier version?',
            a: 'Earlier versions measured coverage inside a small, recent sample of papers, which could, for example, report zero clinical trials for a cancer with thousands. Method 3.0 compares shares across the whole PubMed index with oncology overall, and keeps a sample only to make the queries inspectable.',
          },
        ],
      },
      {
        id: 'saving',
        title: 'Saving and exporting',
        items: [
          {
            q: 'Where are saved papers stored?',
            a: 'Only in your browser. Clearing browser data, private browsing or another device will not show them, so export anything you want to keep.',
          },
          {
            q: 'What can I export?',
            a: 'CSV files with a provenance header, RIS citations for Zotero, EndNote or Mendeley, PDF reports, the full Gap Atlas evidence as JSON, and trial lists, the burden table and the cancer map as CSV.',
          },
        ],
      },
      {
        id: 'privacy',
        title: 'Privacy',
        items: [
          {
            q: 'Is what I search private?',
            a: 'Search terms are sent from Cancer Insight’s server to the research sources listed above and are recorded in Google Analytics events unless your browser sends Global Privacy Control or Do Not Track. Search for cancer types, never personal health details.',
            link: ['/privacy-policy', 'Privacy policy'],
          },
        ],
      },
    ],
  },
  ar: {
    metaTitle: 'الأسئلة الشائعة',
    metaDescription:
      'إجابات عن Cancer Insight: مصادر بياناته، ومعنى أنواع الأدلة وأرقام التجارب ومقارنات العبء، وطريقة عمل أطلس الفجوات البحثية، والحفظ والتصدير، والنسخة العربية، والخصوصية.',
    title: 'الأسئلة الشائعة',
    intro: 'إجابات قصيرة، مع روابط إلى صفحة المنهجية حيث التفاصيل.',
    more: 'هل لديك سؤال آخر؟',
    contact: 'تواصل مع Cancer Insight',
    groups: [
      {
        id: 'about',
        title: 'عن Cancer Insight',
        items: [
          {
            q: 'ما هو Cancer Insight؟',
            a: 'مستكشف مستقل ومجاني وتعليمي لأبحاث السرطان. يعرض أحدث الأوراق البحثية، وحجم أدبيات كل سرطان في PubMed وتركيبتها، وأدبيات العلاجات، والتجارب السريرية المسجّلة، وتغطية البحث، مع ربط كل رقم بعملية البحث التي أنتجته.',
          },
          {
            q: 'هل يستطيع Cancer Insight أن يخبرني بأفضل علاج؟',
            a: 'لا. فهو يصف الأبحاث المنشورة، ولا يقيّم العلاجات ولا يشخّص ولا يقدّم نصيحة طبية. ناقش قراراتك الطبية الشخصية مع طبيب مختص.',
          },
          {
            q: 'لمن هذا الموقع؟',
            a: 'للطلاب والباحثين والصحفيين وكل من يريد أن يفهم ما الأبحاث الموجودة عن نوع من السرطان، ومن أين تأتي الأدلة.',
          },
          {
            q: 'هل الموقع متاح بالعربية؟',
            a: 'نعم، الموقع كله متاح بالعربية ومن اليمين إلى اليسار. يمكنك البحث بأسماء السرطان العربية، وتُرسَل إلى المصادر الاستعلامات الإنجليزية نفسها، فتكون الأرقام متطابقة في اللغتين. تبقى عناوين الأوراق وملخصاتها بلغتها الأصلية، وتبقى الملفات المصدَّرة بالإنجليزية.',
          },
        ],
      },
      {
        id: 'numbers',
        title: 'المصادر والأرقام',
        items: [
          {
            q: 'من أين تأتي الأبحاث؟',
            a: 'من قاعدتَي PubMed وPubMed Central (المكتبة الوطنية للطب في الولايات المتحدة)، ومن ClinicalTrials.gov للتجارب السريرية، ومن موجز بحثي خارجي (واجهة Cure Cancer With AI البرمجية) للسجلات الحديثة ووسوم العلاجات، ومن ويكيميديا كومنز للصور. أما أرقام العبء فمن GLOBOCAN 2024 الصادرة عن الوكالة الدولية لأبحاث السرطان.',
            link: ['/methodology#sources', 'المصادر بالتفصيل'],
          },
          {
            q: 'لماذا يرتبط كل رقم بـ PubMed؟',
            a: 'لتتمكن من التحقق منه. كل عدد هو عملية بحث في PubMed، والرابط يشغّل الاستعلام نفسه على pubmed.ncbi.nlm.nih.gov.',
          },
          {
            q: 'لماذا يختلف رقم ما قليلًا على PubMed؟',
            a: 'يحتفظ Cancer Insight بالأعداد مؤقتًا لمدة تصل إلى 24 ساعة، ويضيف PubMed السجلات ويعيد فهرستها يوميًا، لذا فالفروق الصغيرة متوقعة.',
          },
          {
            q: 'لماذا كل الأوراق في «الأبحاث الحديثة» جديدة جدًا؟',
            a: 'لأن تلك القائمة هي أحدث السجلات ذات الصلة، أي نظرة على الجديد لا عيّنة من الأدبيات كلها. اختر في عرض الأوراق «PubMed، الأفضل مطابقة» لترى أكثر السجلات صلةً عبر كل السنوات.',
          },
          {
            q: 'ما أنواع السرطان التي لها وسوم علاجية؟',
            a: 'يغطي الموجز البحثي سرطانات الرئة والثدي والدماغ والقولون والمستقيم والبروستاتا والبنكرياس والكبد والكلى والميلانوما والمبيض وعنق الرحم والمثانة والمعدة والمريء، إضافةً إلى ابيضاض الدم والأورام اللمفاوية. أما الأنواع الأخرى فيُبحث عنها مباشرةً في PubMed من دون وسوم علاجية.',
          },
          {
            q: 'هل يمكنني استخدام البيانات؟',
            a: 'نعم. كل تحليل متاح بصيغة JSON أو CSV من عناوين ثابتة مذكورة في صفحة البيانات المفتوحة، مع عمليات البحث التي أنتجته. اذكر Cancer Insight والمصادر الأصلية عند إعادة الاستخدام.',
            link: ['/data', 'البيانات المفتوحة'],
          },
        ],
      },
      {
        id: 'papers',
        title: 'الأوراق وأنواع الأدلة',
        items: [
          {
            q: 'ماذا تعني أنواع الأدلة؟',
            a: 'هي مأخوذة من أنواع النشر في PubMed، مثل التجربة المعشّاة ذات الشواهد أو الدراسة الرصدية أو المراجعة المنهجية أو تقرير الحالة. وهي تصف نوع السجل، لا جودته.',
            link: ['/methodology#evidence-types', 'كيف تُحدَّد أنواع الأدلة'],
          },
          {
            q: 'ماذا يعني «التصميم غير مفهرس»؟',
            a: 'أن الورقة مفهرسة فقط بوصفها «مقالًا في مجلة» بشكل عام. كثير من الدراسات الأصلية مفهرسة بهذه الطريقة، فليس في ذلك حكم على الورقة.',
          },
          {
            q: 'لماذا تحمل بعض الأوراق تحذيرًا بالسحب؟',
            a: 'لأن PubMed يصنّفها منشورات مسحوبة. اقرأ إشعار السحب قبل الاعتماد على أي شيء فيها. كما تعرض صفحة كل سرطان عدد سجلاته المسحوبة.',
          },
          {
            q: 'هل يمكنني إعادة استخدام ورقة موسومة «نص كامل مجاني»؟',
            a: 'ليس بالضرورة. إتاحة القراءة مجانًا لا تعني إتاحة إعادة الاستخدام؛ تحقّق من الترخيص في صفحة الناشر أو PMC.',
          },
        ],
      },
      {
        id: 'treatments',
        title: 'أدبيات العلاجات',
        items: [
          {
            q: 'إذا كان لعلاج ما أوراق أو تجارب أكثر، فهل هو أفضل؟',
            a: 'لا. كثرة السجلات أو التجارب أو حداثتها تعكس الاهتمام البحثي والتاريخ والتمويل، لا الفعالية ولا الأمان ولا الملاءمة لأي شخص.',
          },
          {
            q: 'لماذا تختلف الأوراق المعروضة أمثلةً في جانبي المقارنة؟',
            a: 'كل جانب عملية بحث مستقلة بترتيب «الأفضل مطابقة» في PubMed. الأوراق أمثلة على أدبيات كل علاج، وليست أزواجًا متقابلة.',
          },
        ],
      },
      {
        id: 'trials',
        title: 'التجارب السريرية',
        items: [
          {
            q: 'من أين تأتي أرقام التجارب؟',
            a: 'من ClinicalTrials.gov. لكل سرطان يُرسَل بحث واحد عن الحالة، وتُنزَّل كل الدراسات المطابقة، وتُحسب كل الأرقام من تلك القائمة الواحدة، ويمكنك تنزيلها بصيغة CSV للتحقق من أي رقم.',
            link: ['/methodology#trials', 'كيف تُحسب التجارب'],
          },
          {
            q: 'هل تعني «مكتملة دون نتائج منشورة» أن النتائج أُخفيت؟',
            a: 'لا. هي تجارب تدخلية اكتملت قبل 24 شهرًا على الأقل وليس لها قسم نتائج في ClinicalTrials.gov. كثير من التجارب تنشر نتائجها في المجلات بدلًا من ذلك، وكثير منها، كتجارب المرحلة الأولى أو التجارب خارج نطاق القانون الأمريكي، غير مُلزَم بنشر النتائج هناك.',
          },
          {
            q: 'هل يساعدني Cancer Insight على إيجاد تجربة أشارك فيها؟',
            a: 'يعرض التجارب المفتوحة مع روابط إلى صفحاتها في السجل، لكنه لا يتحقق من شروط الأهلية ولا يوصي بأي تجربة. ناقش المشاركة في التجارب مع فريق رعايتك؛ وتذكر صفحة كل تجربة شروطها وجهات الاتصال.',
          },
        ],
      },
      {
        id: 'burden',
        title: 'البحث مقارنةً بالعبء',
        items: [
          {
            q: 'ماذا تعني نسبة البحث إلى العبء؟',
            a: 'هي حصة السرطان من أبحاث PubMed في السنوات الخمس الكاملة الأخيرة مقسومةً على حصته من الوفيات (أو الحالات الجديدة) في العالم حسب GLOBOCAN 2024. إذا زادت على 1 فحصته من البحث أكبر من حصته من الوفيات، وإذا قلّت عنه فأصغر.',
            link: ['/research-vs-burden', 'البحث مقابل العبء'],
          },
          {
            q: 'هل تعني النسبة المنخفضة أن السرطان يستحق بحثًا أكثر؟',
            a: 'ليس وحدها. العبء سبب واحد من أسباب كثيرة لدراسة سرطان ما؛ فمعدلات النجاة وإمكانية الشفاء وعدد المتعايشين مع المرض والفرص العلمية مهمة أيضًا. تصف النسبة أين يتجه الاهتمام، لا مقدار ما ينبغي أن يحظى به كل سرطان.',
          },
          {
            q: 'لماذا لا تظهر بعض أنواع السرطان في المقارنة؟',
            a: 'لأن GLOBOCAN لا يذكرها موقعًا مستقلًا (الساركوما والورم الأرومي العصبي)، أو لأنها نوع فرعي من سرطان مذكور، أو لأن GLOBOCAN يعرّفها تعريفًا مختلفًا (سرطان الجلد).',
          },
        ],
      },
      {
        id: 'atlas',
        title: 'أطلس الفجوات البحثية وخريطة السرطان',
        items: [
          {
            q: 'هل تثبت الإشارة وجود فجوة بحثية؟',
            a: 'لا. تعني الإشارة أن تصميمًا أو محورًا يمثّل أقل من نصف الحصة التي يمثلها في مجال الأورام كله. وقد يعكس ذلك طبيعة المرض أو وبائياته أو المصطلحات أو الفهرسة، فهي دعوة إلى التمعّن لا دليل على فجوة.',
            link: ['/methodology#gap-atlas', 'المنهجية كاملة'],
          },
          {
            q: 'لماذا لا يُعدّ مقياس «الأطفال والمراهقون» إشارةً في بعض أنواع السرطان؟',
            a: 'يُتوقع أن تكون الدراسات على الأطفال قليلة في السرطانات التي تصيب البالغين أساسًا، لذا يُعرض المقياس لكنه لا يُعدّ إشارة.',
          },
          {
            q: 'لماذا لا تُعدّ العلاجات إشارات أبدًا؟',
            a: 'لأن صلة العلاج بالمرض تعتمد على بيولوجيا كل سرطان، فلا يمكن قراءة العدد المنخفض على أنه فجوة.',
          },
          {
            q: 'ماذا تعني الألوان في خريطة السرطان؟',
            a: 'كل خلية هي النسبة نفسها المستخدمة في الأطلس. البني يعني تمثيلًا أقل مما في مجال الأورام كله، والأزرق تمثيلًا أعلى، واللون الفاتح المحايد تمثيلًا مشابهًا. تُكتب القيمة في كل خلية، ولا تُعدّ إشارةً إلا النسب الأقل من 0.5.',
            link: ['/cancer-map', 'خريطة السرطان'],
          },
          {
            q: 'ما الذي تغيّر عن الإصدار السابق؟',
            a: 'كانت الإصدارات السابقة تقيس التغطية داخل عيّنة صغيرة وحديثة من الأوراق، ما قد يؤدي مثلًا إلى الإبلاغ عن صفر تجارب سريرية لسرطان له الآلاف منها. أما المنهجية 3.0 فتقارن الحصص عبر فهرس PubMed كله مع مجال الأورام عمومًا، وتحتفظ بعيّنة فقط لجعل الاستعلامات قابلة للفحص.',
          },
        ],
      },
      {
        id: 'saving',
        title: 'الحفظ والتصدير',
        items: [
          {
            q: 'أين تُخزَّن الأوراق المحفوظة؟',
            a: 'في متصفحك فقط. لن تظهر بعد مسح بيانات المتصفح أو في التصفح الخاص أو على جهاز آخر، لذا صدّر ما تريد الاحتفاظ به.',
          },
          {
            q: 'ماذا يمكنني أن أصدّر؟',
            a: 'ملفات CSV تبدأ بأسطر توضّح مصدر البيانات، واستشهادات RIS لبرامج Zotero وEndNote وMendeley، وتقارير PDF، وأدلة أطلس الفجوات كاملةً بصيغة JSON، وقوائم التجارب وجدول العبء وخريطة السرطان بصيغة CSV. تبقى الملفات المصدَّرة بالإنجليزية.',
          },
        ],
      },
      {
        id: 'privacy',
        title: 'الخصوصية',
        items: [
          {
            q: 'هل ما أبحث عنه خاص؟',
            a: 'تُرسَل عبارات البحث من خادم Cancer Insight إلى مصادر البحث المذكورة أعلاه، وتُسجَّل في أحداث Google Analytics ما لم يرسل متصفحك إشارة «التحكم العالمي في الخصوصية» (Global Privacy Control) أو «عدم التتبع» (Do Not Track). ابحث عن أنواع السرطان، لا عن تفاصيل صحية شخصية.',
            link: ['/privacy-policy', 'سياسة الخصوصية'],
          },
        ],
      },
    ],
  },
};
