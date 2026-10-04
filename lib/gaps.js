import {
  buildProfile,
  cleanResearchText,
  getField,
  removeDuplicates,
  treatmentCounts,
} from './relevance.js';

const TOPIC_DEFINITIONS = [
  {
    id: 'quality-of-life',
    label: 'Quality of life',
    terms: ['quality of life', 'health-related quality of life', 'hrqol', 'patient reported outcome', 'patient-reported outcome'],
  },
  {
    id: 'toxicity-safety',
    label: 'Toxicity & safety',
    terms: ['toxicity', 'adverse event', 'adverse effect', 'safety', 'tolerability', 'side effect'],
  },
  {
    id: 'recurrence',
    label: 'Recurrence & relapse',
    terms: ['recurrence', 'recurrent', 'relapse', 'relapsed'],
  },
  {
    id: 'resistance',
    label: 'Treatment resistance',
    terms: ['resistance', 'resistant', 'refractory', 'drug resistance', 'treatment resistance'],
  },
  {
    id: 'biomarkers',
    label: 'Biomarkers',
    terms: ['biomarker', 'biomarkers', 'molecular marker', 'predictive marker', 'prognostic marker'],
  },
  {
    id: 'pediatric',
    label: 'Pediatric populations',
    terms: ['pediatric', 'paediatric', 'child', 'children', 'adolescent', 'adolescents', 'young patient'],
  },
  {
    id: 'older-adults',
    label: 'Older adults',
    terms: ['older adult', 'older adults', 'elderly', 'geriatric', 'aged 65', 'aged 70', 'older patient'],
  },
  {
    id: 'survivorship',
    label: 'Survivorship & long-term outcomes',
    terms: ['survivorship', 'survivor', 'long-term outcome', 'long term outcome', 'late effect', 'long-term survival', 'long term survival'],
  },
  {
    id: 'disparities',
    label: 'Access & disparities',
    terms: ['disparity', 'disparities', 'inequity', 'inequities', 'access to care', 'underserved', 'socioeconomic'],
  },
];

function percent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 1000) / 10;
}

function yearOf(paper) {
  const date = String(getField(paper, 'pubmed_date', 'publicationDate') || '');
  const match = date.match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : null;
}

function publicationTypeText(paper) {
  return (Array.isArray(paper?.publication_types)
    ? paper.publication_types.join(' ')
    : paper?.publication_types || ''
  ).toLowerCase();
}

function paperText(paper) {
  const mesh = Array.isArray(paper?.mesh_terms)
    ? paper.mesh_terms.join(' ')
    : paper?.mesh_terms || '';
  const keywords = Array.isArray(paper?.keywords)
    ? paper.keywords.join(' ')
    : paper?.keywords || '';

  return cleanResearchText([
    getField(paper, 'pubmed_title', 'title'),
    getField(paper, 'pubmed_abstract', 'abstract'),
    mesh,
    keywords,
  ].join(' '));
}

function topicCoverage(papers) {
  const total = papers.length;

  return TOPIC_DEFINITIONS.map(topic => {
    const matches = papers.filter(paper => {
      const text = paperText(paper);
      return topic.terms.some(term => text.includes(term));
    });

    return {
      id: topic.id,
      label: topic.label,
      count: matches.length,
      total,
      percent: percent(matches.length, total),
      paperIds: matches
        .map(p => p?.pubmedId || p?.pmid || p?.doi)
        .filter(Boolean)
        .slice(0, 12),
    };
  });
}

function studyDesignCoverage(papers) {
  const total = papers.length;
  const categories = [
    {
      id: 'clinical-trials',
      label: 'Clinical trials',
      test: text => text.includes('clinical trial'),
    },
    {
      id: 'randomized-trials',
      label: 'Randomized controlled trials',
      test: text => text.includes('randomized controlled trial') || text.includes('randomised controlled trial'),
    },
    {
      id: 'systematic-reviews',
      label: 'Systematic reviews',
      test: text => text.includes('systematic review'),
    },
    {
      id: 'meta-analyses',
      label: 'Meta-analyses',
      test: text => text.includes('meta-analysis') || text.includes('meta analysis'),
    },
  ];

  return categories.map(category => {
    const count = papers.filter(paper => category.test(publicationTypeText(paper))).length;
    return {
      id: category.id,
      label: category.label,
      count,
      total,
      percent: percent(count, total),
    };
  });
}

function timeline(papers) {
  const counts = {};
  for (const paper of papers) {
    const year = yearOf(paper);
    if (!year) continue;
    counts[year] = (counts[year] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([year, count]) => [Number(year), count])
    .sort((a, b) => a[0] - b[0]);
}

function datasetConfidence(total) {
  if (total >= 60) return 'stronger';
  if (total >= 30) return 'moderate';
  return 'limited';
}

function signalStrength(ratio, zero = false) {
  if (zero) return 'strong';
  if (ratio <= 0.03) return 'strong';
  if (ratio <= 0.08) return 'moderate';
  return 'watch';
}

function buildSignals({ papers, topics, studyDesign, treatments, profile }) {
  const signals = [];
  const total = papers.length;
  const currentYear = new Date().getUTCFullYear();
  const recentStart = currentYear - 2;
  const recentCount = papers.filter(p => {
    const year = yearOf(p);
    return year && year >= recentStart;
  }).length;
  const recentRatio = total ? recentCount / total : 0;

  for (const item of studyDesign) {
    const ratio = total ? item.count / total : 0;
    let threshold = 0.05;

    if (item.id === 'clinical-trials') threshold = 0.1;
    if (item.id === 'randomized-trials') threshold = 0.05;
    if (item.id === 'systematic-reviews') threshold = 0.05;
    if (item.id === 'meta-analyses') threshold = 0.04;

    if (ratio < threshold) {
      signals.push({
        id: `design-${item.id}`,
        category: 'Study design coverage',
        title: `Limited ${item.label.toLowerCase()} in the retrieved dataset`,
        summary:
          item.count === 0
            ? `No records in this dataset were labeled as ${item.label.toLowerCase()}.`
            : `Only ${item.count} of ${total} analyzed papers (${item.percent}%) were labeled as ${item.label.toLowerCase()}.`,
        strength: signalStrength(ratio, item.count === 0),
        basis: {
          matched: item.count,
          total,
          percent: item.percent,
          thresholdPercent: Math.round(threshold * 100),
        },
        caution:
          'Publication-type metadata can be incomplete. This signal identifies low representation in the retrieved dataset, not a proven unmet clinical need.',
      });
    }
  }

  for (const item of topics) {
    const ratio = total ? item.count / total : 0;
    const threshold = 0.06;

    if (ratio < threshold) {
      signals.push({
        id: `topic-${item.id}`,
        category: 'Topic coverage',
        title: `Low visible coverage of ${item.label.toLowerCase()}`,
        summary:
          item.count === 0
            ? `No analyzed title, abstract, keyword, or MeSH text matched the predefined ${item.label.toLowerCase()} terms.`
            : `${item.count} of ${total} papers (${item.percent}%) matched the predefined ${item.label.toLowerCase()} terms.`,
        strength: signalStrength(ratio, item.count === 0),
        basis: {
          matched: item.count,
          total,
          percent: item.percent,
          thresholdPercent: 6,
        },
        caution:
          'Keyword matching can miss synonyms and context. The signal means the topic is not prominent in this retrieved text set; it does not prove the topic is absent from the wider literature.',
      });
    }
  }

  if (total >= 12 && recentRatio < 0.2) {
    signals.push({
      id: 'temporal-recent-literature',
      category: 'Research recency',
      title: 'Relatively little recent literature in the retrieved dataset',
      summary: `${recentCount} of ${total} papers (${percent(recentCount, total)}%) were dated ${recentStart}-${currentYear}.`,
      strength: recentRatio < 0.1 ? 'strong' : 'moderate',
      basis: {
        matched: recentCount,
        total,
        percent: percent(recentCount, total),
        period: `${recentStart}-${currentYear}`,
      },
      caution:
        'This reflects the retrieved dataset and publication dates available to Cancer Insight. It is not evidence that research activity has stopped.',
    });
  }

  if (treatments.length >= 3) {
    const maxCount = treatments[0]?.[1] || 0;
    const lowerCoverage = treatments
      .filter(([, count]) => maxCount > 0 && count <= Math.max(2, Math.floor(maxCount * 0.25)))
      .slice(0, 4);

    for (const [name, count] of lowerCoverage) {
      signals.push({
        id: `treatment-${name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`,
        category: 'Treatment research distribution',
        title: `Lower retrieved literature volume for ${name}`,
        summary: `${count} analyzed papers were tagged with ${name}, compared with ${maxCount} for the most represented treatment category in this dataset.`,
        strength: count <= 1 ? 'strong' : 'moderate',
        basis: {
          matched: count,
          benchmark: maxCount,
          benchmarkTreatment: treatments[0]?.[0] || '',
        },
        caution:
          'Treatment tags come from available source data. Lower paper volume does not mean a treatment is less effective, less important, or underfunded.',
      });
    }
  }

  const freeRatio = total ? profile.free_full_text_count / total : 0;
  if (total >= 10 && freeRatio < 0.25) {
    signals.push({
      id: 'access-free-full-text',
      category: 'Research accessibility',
      title: 'Limited free full-text availability',
      summary: `${profile.free_full_text_count} of ${total} papers (${percent(profile.free_full_text_count, total)}%) had a PubMed Central free-full-text indicator.`,
      strength: freeRatio < 0.1 ? 'strong' : 'moderate',
      basis: {
        matched: profile.free_full_text_count,
        total,
        percent: percent(profile.free_full_text_count, total),
      },
      caution:
        'This is an access signal, not a scientific evidence gap. Papers may be available freely elsewhere even when Cancer Insight does not identify a PMC copy.',
    });
  }

  const missingAbstract = papers.filter(p => !getField(p, 'pubmed_abstract', 'abstract')).length;
  if (total >= 10 && missingAbstract / total > 0.3) {
    signals.push({
      id: 'metadata-abstract-completeness',
      category: 'Metadata completeness',
      title: 'Many records have no abstract available to Cancer Insight',
      summary: `${missingAbstract} of ${total} papers (${percent(missingAbstract, total)}%) lacked an abstract in the retrieved metadata.`,
      strength: missingAbstract / total > 0.5 ? 'strong' : 'moderate',
      basis: {
        matched: missingAbstract,
        total,
        percent: percent(missingAbstract, total),
      },
      caution:
        'This is a metadata limitation. It reduces how much text Cancer Insight can analyze and can make topic-coverage signals less reliable.',
    });
  }

  const priority = { strong: 0, moderate: 1, watch: 2 };
  return signals
    .sort((a, b) => (priority[a.strength] ?? 9) - (priority[b.strength] ?? 9))
    .slice(0, 14);
}

export function analyzeResearchGaps(cancer, inputPapers) {
  const papers = removeDuplicates(inputPapers || []);
  const profile = buildProfile(papers);
  const treatments = treatmentCounts(papers).slice(0, 12);
  const topics = topicCoverage(papers);
  const studyDesign = studyDesignCoverage(papers);
  const years = timeline(papers);
  const currentYear = new Date().getUTCFullYear();
  const recentStart = currentYear - 2;
  const recentCount = papers.filter(p => {
    const year = yearOf(p);
    return year && year >= recentStart;
  }).length;

  const validYears = papers.map(yearOf).filter(Boolean);
  const signals = buildSignals({ papers, topics, studyDesign, treatments, profile });

  return {
    cancer,
    generatedAt: new Date().toISOString(),
    methodVersion: '2.0',
    dataset: {
      paperCount: papers.length,
      journalCount: profile.journal_count,
      treatmentCount: treatments.length,
      freeFullTextCount: profile.free_full_text_count,
      earliestYear: validYears.length ? Math.min(...validYears) : null,
      latestYear: validYears.length ? Math.max(...validYears) : null,
      recentPaperCount: recentCount,
      recentStartYear: recentStart,
      recentPercent: percent(recentCount, papers.length),
      confidence: datasetConfidence(papers.length),
      datedPaperCount: validYears.length,
      undatedPaperCount: papers.length - validYears.length,
    },
    signals,
    studyDesign,
    topics,
    treatments: treatments.map(([name, count]) => ({ name, count })),
    timeline: years.map(([year, count]) => ({ year, count })),
    methodology: {
      description:
        'Cancer Insight Research Gap Atlas V2 detects low-coverage signals inside a retrieved literature dataset using transparent publication-type, topic-keyword, treatment-distribution, recency, access, and metadata-completeness rules. The evidence set combines relevance-ranked records with PubMed records sampled across multiple publication-year windows and treatment-focused PubMed queries.',
      interpretation:
        'A signal is a starting point for investigation. It is not proof that the wider scientific literature contains a true research gap and is not a statement about treatment effectiveness or clinical need.',
      datasetNote:
        'Results depend on the papers retrieved, their metadata, treatment tags, publication-type labels, and available abstracts. V2 deliberately samples PubMed across multiple publication-year windows to reduce recent-publication concentration, but it is still a sample rather than an exhaustive systematic review. Different searches or future database updates can change the signals.',
    },
  };
}
