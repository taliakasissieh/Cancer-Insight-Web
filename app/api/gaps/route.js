import { NextResponse } from 'next/server';
import { searchCancer, treatmentEvidence, gapAtlasPubMedSample } from '../../../lib/research';
import {
  normalizeCancer,
  getRelevantPapers,
  removeDuplicates,
  treatmentCounts,
} from '../../../lib/relevance';
import { analyzeResearchGaps } from '../../../lib/gaps';

export async function POST(req) {
  try {
    const { cancer } = await req.json();
    const normalizedCancer = normalizeCancer(cancer);

    if (!normalizedCancer) {
      return NextResponse.json(
        { error: 'Enter a cancer type to analyze.' },
        { status: 400 }
      );
    }

    const baseResult = await searchCancer(normalizedCancer);
    const rawPapers = Array.isArray(baseResult?.papers)
      ? baseResult.papers
      : [];

    const relevantBase = getRelevantPapers(
      rawPapers,
      normalizedCancer,
      60
    );

    const yearDiversePapers = await gapAtlasPubMedSample(normalizedCancer, 18);

    const topTreatments = treatmentCounts(relevantBase)
      .slice(0, 5)
      .map(([name]) => name);

    const treatmentSets = await Promise.all(
      topTreatments.map(async treatment => {
        try {
          const papers = await treatmentEvidence(
            normalizedCancer,
            treatment,
            10
          );

          return papers.map(paper => ({
            ...paper,
            treatmentTypes: [
              ...(Array.isArray(paper?.treatmentTypes)
                ? paper.treatmentTypes
                : paper?.treatmentTypes
                  ? [paper.treatmentTypes]
                  : []),
              treatment,
            ],
          }));
        } catch {
          return [];
        }
      })
    );

    const combined = removeDuplicates([
      ...relevantBase.map(paper => ({ ...paper, evidenceSource: paper?.evidenceSource || 'Cancer Research API + PubMed enrichment', retrievalMethod: paper?.retrievalMethod || 'relevance-ranked-base' })),
      ...yearDiversePapers,
      ...treatmentSets.flat().map(paper => ({ ...paper, evidenceSource: paper?.evidenceSource || 'PubMed', retrievalMethod: paper?.retrievalMethod || 'treatment-focused-query' })),
    ]).slice(0, 100);

    const analysis = analyzeResearchGaps(
      normalizedCancer,
      combined
    );

    return NextResponse.json({
      ...analysis,
      retrieval: {
        baseRelevantPapers: relevantBase.length,
        treatmentQueries: topTreatments,
        yearDiversePubMedPapers: yearDiversePapers.length,
        enrichedPaperCount: combined.length,
        samplingMethod: 'relevance-ranked base + four PubMed publication-year windows + treatment-focused PubMed queries',
      },
    });
  } catch (e) {
    console.error('Cancer Insight gap atlas error:', e);

    return NextResponse.json(
      { error: e?.message || 'Gap analysis failed.' },
      { status: 400 }
    );
  }
}
