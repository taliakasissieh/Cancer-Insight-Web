/*
  Cancer Insight — research compared with disease burden.

  Burden: GLOBOCAN 2024 estimates (Global Cancer Observatory, IARC/WHO), worldwide, both sexes,
  all ages — new cases and deaths per cancer site, transcribed from the World fact sheet
  (“Statistics at a glance, 2024”, published September 2026) and checked twice against it.
  Percentages follow GLOBOCAN: shares of all cancers including non-melanoma skin cancer.

  Research: PubMed records about each cancer published in the last five complete years, as a
  share of all oncology records published in the same years (the same oncology baseline as the
  Research Gap Atlas).

    research share   = records(cancer, years) / records(oncology, years)
    burden share     = deaths(cancer) / deaths(all cancers)     (or new cases)
    ratio            = research share / burden share

  A ratio above 1 means the cancer's share of recent research is larger than its share of
  deaths; below 1, smaller. Burden is one reason among many to study a cancer (survival,
  curability, prevalence, research opportunity all matter), so the ratio describes attention,
  never what research "should" receive. Research shares overlap (a paper can cover several
  cancers), so they are compared one cancer at a time and do not add up to 100%.
*/

export const GLOBOCAN = {
  edition: 'GLOBOCAN 2024',
  product: 'Cancer Today (2024 estimates, version 1.0)',
  publisher: 'International Agency for Research on Cancer (IARC), World Health Organization',
  released: '2026-09',
  transcribed: '2026-10-11',
  url: 'https://gco.iarc.who.int/today',
  factSheetUrl:
    'https://gco.iarc.who.int/media/globocan/factsheets/populations/900-world-fact-sheet.pdf',
  citation:
    'Ervik M, Laversanne M, Lam F, Colombet M, Ferlay J, Filho AM, Bray F (2026). Global Cancer Observatory: Cancer Today (2024 estimates, version 1.0). Lyon, France: International Agency for Research on Cancer. Available from: https://gco.iarc.who.int/today',
  scope: 'World, both sexes, all ages',
  totals: {
    cases: 20636441,
    deaths: 9762507,
    casesExclNmsc: 19498127,
    deathsExclNmsc: 9703786,
  },
};

/* GLOBOCAN site rows used here (new cases, deaths). */
export const GLOBOCAN_SITES = {
  Lung: [2637005, 1861839],
  Breast: [2434087, 693660],
  Colorectum: [2041007, 917895],
  Prostate: [1546112, 419849],
  Stomach: [980286, 641554],
  Thyroid: [959281, 48070],
  Liver: [843045, 732489],
  Bladder: [635264, 227626],
  'Cervix uteri': [604196, 279583],
  'Non-Hodgkin lymphoma': [562793, 234903],
  Pancreas: [531318, 490786],
  Leukaemia: [495113, 292234],
  Oesophagus: [494320, 441994],
  Kidney: [442570, 144871],
  'Corpus uteri': [434620, 100680],
  Melanoma: [337969, 58398],
  Ovary: [330731, 203850],
  'Brain, central nervous system': [324095, 248964],
  'Multiple myeloma': [196157, 119029],
  'Hodgkin lymphoma': [84495, 19515],
  Testis: [70714, 9240],
  Mesothelioma: [27350, 22715],
  'Lip, oral cavity': [452205, 194108],
  Larynx: [193937, 96619],
  Nasopharynx: [119750, 62060],
  Oropharynx: [107887, 51823],
  Hypopharynx: [91464, 49748],
  'Salivary glands': [55229, 20707],
};

/* Catalogue cancer → GLOBOCAN site(s). */
export const BURDEN_MAP = {
  lung: ['Lung'],
  breast: ['Breast'],
  colorectal: ['Colorectum'],
  prostate: ['Prostate'],
  stomach: ['Stomach'],
  thyroid: ['Thyroid'],
  liver: ['Liver'],
  bladder: ['Bladder'],
  cervical: ['Cervix uteri'],
  lymphoma: ['Non-Hodgkin lymphoma', 'Hodgkin lymphoma'],
  pancreatic: ['Pancreas'],
  leukemia: ['Leukaemia'],
  esophageal: ['Oesophagus'],
  kidney: ['Kidney'],
  endometrial: ['Corpus uteri'],
  melanoma: ['Melanoma'],
  ovarian: ['Ovary'],
  brain: ['Brain, central nervous system'],
  myeloma: ['Multiple myeloma'],
  testicular: ['Testis'],
  mesothelioma: ['Mesothelioma'],
  'head-and-neck': [
    'Lip, oral cavity',
    'Larynx',
    'Nasopharynx',
    'Oropharynx',
    'Hypopharynx',
    'Salivary glands',
  ],
};

/* Catalogue entries without a matching GLOBOCAN row, and why (shown on the page). */
export const BURDEN_EXCLUDED = {
  nsclc: 'subtype',
  hepatocellular: 'subtype',
  'renal-cell': 'subtype',
  glioblastoma: 'subtype',
  skin: 'definition',
  sarcoma: 'not-reported',
  neuroblastoma: 'not-reported',
};

export function burdenFor(id) {
  const sites = BURDEN_MAP[id];
  if (!sites) return null;
  let cases = 0;
  let deaths = 0;
  for (const s of sites) {
    const row = GLOBOCAN_SITES[s];
    if (!row) return null;
    cases += row[0];
    deaths += row[1];
  }
  return {
    sites,
    cases,
    deaths,
    caseShare: cases / GLOBOCAN.totals.cases,
    deathShare: deaths / GLOBOCAN.totals.deaths,
  };
}

/** The five most recent complete publication years. */
export function researchYears(today = new Date()) {
  const end = today.getUTCFullYear() - 1;
  return { start: end - 4, end };
}

/**
 * Combine burden with research counts.
 * @param {Array<{id, label, count, url}>} research per-cancer record counts for the years
 * @param {{count, url}} baseline oncology records for the same years
 */
export function compareResearchWithBurden(research, baseline) {
  const rows = research
    .map(r => {
      const b = burdenFor(r.id);
      if (!b) return null;
      const researchShare =
        r.count != null && baseline?.count ? r.count / baseline.count : null;
      return {
        id: r.id,
        label: r.label,
        sites: b.sites,
        cases: b.cases,
        deaths: b.deaths,
        caseShare: b.caseShare,
        deathShare: b.deathShare,
        records: r.count,
        recordsUrl: r.url,
        researchShare,
        ratioDeaths: researchShare != null ? researchShare / b.deathShare : null,
        ratioCases: researchShare != null ? researchShare / b.caseShare : null,
        recordsPer1000Deaths:
          r.count != null ? ((r.count / 5) * 1000) / b.deaths : null,
      };
    })
    .filter(Boolean);
  return rows.sort((a, b) => (a.ratioDeaths ?? Infinity) - (b.ratioDeaths ?? Infinity));
}
