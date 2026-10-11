/*
  GET /api/burden             → research vs burden for every mapped cancer (JSON)
  GET /api/burden?format=csv  → the same table as CSV
*/

import { researchVsBurden } from '../../../lib/burden-server';
import { toCsv } from '../../../lib/csv';
import { csvResponse, errorResponse, publicJson, queryParams } from '../../../lib/http';

export const maxDuration = 60;

export async function GET(request) {
  const params = queryParams(request);
  try {
    const data = await researchVsBurden();
    if (params.format === 'csv') {
      const header = [
        'cancer',
        'globocan_sites',
        'new_cases_2024',
        'share_of_new_cases',
        'deaths_2024',
        'share_of_deaths',
        `pubmed_records_${data.years.start}_${data.years.end}`,
        'share_of_oncology_records',
        'research_share_to_death_share',
        'research_share_to_case_share',
        'pubmed_query_url',
      ];
      const rows = data.rows.map(r => [
        r.label,
        r.sites.join(' + '),
        r.cases,
        r.caseShare?.toFixed(5),
        r.deaths,
        r.deathShare?.toFixed(5),
        r.records,
        r.researchShare?.toFixed(5),
        r.ratioDeaths?.toFixed(3),
        r.ratioCases?.toFixed(3),
        r.recordsUrl,
      ]);
      const provenance = [
        ['# Burden', `${data.burden.edition} — ${data.burden.scope}`, data.burden.citation],
        ['# Research', `PubMed records published ${data.years.start}–${data.years.end}`],
        ['# Oncology baseline records', String(data.baseline.count), data.baseline.url],
        ['# Generated', data.generatedAt],
      ];
      const date = data.generatedAt.slice(0, 10);
      return csvResponse(toCsv([...provenance, header, ...rows]), `cancer-insight_research_vs_burden_${date}.csv`);
    }
    return publicJson(data);
  } catch (error) {
    return errorResponse(error, 'burden');
  }
}
