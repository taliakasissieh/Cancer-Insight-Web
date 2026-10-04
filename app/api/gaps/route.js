import { NextResponse } from 'next/server';
import { searchCancer, treatmentEvidence } from '../../../lib/research';
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
      ...relevantBase,
      ...treatmentSets.flat(),
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
        enrichedPaperCount: combined.length,
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
