import { NextResponse } from 'next/server';
import { searchCancer } from '../../../lib/research';
import {
  normalizeCancer,
  getRelevantPapers,
  treatmentCounts,
  buildProfile,
} from '../../../lib/relevance';

export async function POST(req) {
  try {
    const { cancer } = await req.json();
    const normalizedCancer = normalizeCancer(cancer);

    if (!normalizedCancer) {
      return NextResponse.json(
        { error: 'Enter a cancer type to search.' },
        { status: 400 }
      );
    }

    const result = await searchCancer(normalizedCancer);
    const rawPapers = Array.isArray(result?.papers) ? result.papers : [];
    const relevantPapers = getRelevantPapers(
      rawPapers,
      normalizedCancer,
      20
    );

    const treatments = treatmentCounts(relevantPapers);
    const profile = buildProfile(relevantPapers);

    return NextResponse.json({
      ...result,
      cancer: normalizedCancer,
      papers: relevantPapers,
      treatments,
      profile,
    });
  } catch (e) {
    console.error('Cancer Insight search error:', e);

    return NextResponse.json(
      { error: e?.message || 'Search failed.' },
      { status: 400 }
    );
  }
}
