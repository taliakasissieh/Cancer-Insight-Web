/*
  Cancer Insight — PubMed XML parsing (pure; no network, no Next.js imports).

  Scientific text is never "repaired": tokens such as mRNA, lncRNA, siRNA or MiniGPT are kept
  exactly as published. Only whitespace, punctuation spacing and XML entities are normalised.
*/

import { XMLParser } from 'fast-xml-parser';

/* -------------------------------------------------------------------------
   TEXT HANDLING
   ------------------------------------------------------------------------- */

const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  plusmn: '±',
  times: '×',
  deg: '°',
  micro: 'µ',
};

export function decodeEntities(value) {
  return String(value ?? '')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => safeCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => safeCodePoint(parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (m, name) => NAMED_ENTITIES[name.toLowerCase()] ?? m);
}

function safeCodePoint(n) {
  try {
    return String.fromCodePoint(n);
  } catch {
    return '';
  }
}

/**
 * Conservative clean-up: whitespace and punctuation spacing only.
 * Scientific tokens such as mRNA, lncRNA or siRNA are never split.
 */
export function cleanText(value) {
  return decodeEntities(value)
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t\r\f\v]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/ +([,.;:!?%])/g, '$1')
    .trim();
}

/*
  Superscripts carry meaning that plain text loses (KRAS<sup>G12D</sup>, CD8<sup>+</sup>,
  10<sup>-6</sup>). They are rendered as KRAS(G12D), CD8+ and 10^-6 instead of being glued
  onto the preceding word. Subscripts (IC<sub>50</sub>, CO<sub>2</sub>) are joined.
*/
function renderSuperscript(prefixChar, content) {
  const c = String(content || '').replace(/<[^>]+>/g, '').trim();
  if (!c) return '';
  if (/^[+\-\u2212\u2013]+$/.test(c)) return c;
  if (/^[\-\u2212]?\d+(\.\d+)?$/.test(c)) return /[0-9a-z)]/i.test(prefixChar) ? `^${c}` : c;
  if (/^[\d,\u2013-]+$/.test(c)) return ''; // citation markers
  return /[A-Za-z0-9]/.test(prefixChar) ? `(${c})` : c;
}

function inlineXmlToText(value) {
  const s = String(value || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p\s*>/gi, ' ')
    .replace(/(.?)<sup\b[^>]*>([\s\S]*?)<\/sup>/gi, (_, prev, content) => {
      return prev + renderSuperscript(prev, content);
    })
    .replace(/<[^>]+>/g, '');
  return cleanText(s).replace(/\n+/g, ' ');
}

/* Title and abstract are taken from the raw XML so inline markup (<i>, <sup>, <sub>)
   cannot reorder or drop scientific text. */
function extractRawText(xml) {
  const out = {};
  const blocks = xml.match(/<PubmedArticle\b[\s\S]*?<\/PubmedArticle>/gi) || [];

  for (const block of blocks) {
    const pmidMatch = block.match(/<PMID\b[^>]*>([\s\S]*?)<\/PMID>/i);
    const pmid = pmidMatch ? inlineXmlToText(pmidMatch[1]) : '';
    if (!pmid) continue;

    const titleMatch = block.match(/<ArticleTitle\b[^>]*>([\s\S]*?)<\/ArticleTitle>/i);
    const title = titleMatch ? inlineXmlToText(titleMatch[1]) : '';

    const sections = [];
    const re = /<AbstractText\b([^>]*)>([\s\S]*?)<\/AbstractText>/gi;
    let m;
    while ((m = re.exec(block)) !== null) {
      const labelMatch = (m[1] || '').match(/\bLabel\s*=\s*["']([^"']+)["']/i);
      const label = labelMatch ? cleanText(labelMatch[1]).toUpperCase() : '';
      const content = inlineXmlToText(m[2]);
      if (!content) continue;
      sections.push(
        label && !content.toUpperCase().startsWith(`${label}:`) ? `${label}: ${content}` : content
      );
    }

    out[pmid] = { title, abstract: sections.join('\n') };
  }

  return out;
}

const arr = x => (x == null ? [] : Array.isArray(x) ? x : [x]);

function deepText(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(deepText).filter(Boolean).join(' ');
  if (typeof value === 'object') {
    return Object.entries(value)
      .filter(([k]) => !k.startsWith('@_'))
      .map(([, v]) => deepText(v))
      .filter(Boolean)
      .join(' ');
  }
  return '';
}

const text = v => cleanText(deepText(v)).replace(/\n+/g, ' ');

function joinDate(node) {
  if (!node) return '';
  return [text(node.Year), text(node.Month), text(node.Day)].filter(Boolean).join(' ');
}

function parseArticle(article, raw = {}) {
  const mc = article?.MedlineCitation || {};
  const art = mc.Article || {};
  const journal = art.Journal || {};
  const pmid = text(mc.PMID);

  const authorList = arr(art.AuthorList?.Author)
    .map(a => {
      const collective = text(a?.CollectiveName);
      if (collective) return collective;
      return [text(a?.ForeName) || text(a?.Initials), text(a?.LastName)].filter(Boolean).join(' ');
    })
    .filter(Boolean);

  const publicationTypes = arr(art.PublicationTypeList?.PublicationType)
    .map(text)
    .filter(Boolean);

  const ids = arr(article?.PubmedData?.ArticleIdList?.ArticleId);
  const doi = text(ids.find(x => x?.['@_IdType'] === 'doi'));
  const pmc = text(ids.find(x => x?.['@_IdType'] === 'pmc'));

  const pubDate = journal.JournalIssue?.PubDate || {};
  const history = arr(article?.PubmedData?.History?.PubMedPubDate);
  const historyDate =
    history.find(x =>
      ['pubmed', 'medline', 'entrez'].includes(String(x?.['@_PubStatus'] || '').toLowerCase())
    ) || history[0];

  const date =
    joinDate(pubDate) ||
    text(pubDate.MedlineDate) ||
    joinDate(arr(art.ArticleDate)[0]) ||
    joinDate(historyDate);

  const yearMatch = date.match(/\b(1[89]|20)\d{2}\b/);

  const mesh = arr(mc.MeshHeadingList?.MeshHeading)
    .map(h => text(h?.DescriptorName))
    .filter(Boolean);

  const keywords = arr(mc.KeywordList)
    .flatMap(list => arr(list?.Keyword))
    .map(text)
    .filter(Boolean);

  const title =
    raw.title ||
    text(art.ArticleTitle) ||
    text(art.VernacularTitle) ||
    '';

  const abstract =
    raw.abstract ||
    arr(art.Abstract?.AbstractText)
      .map(text)
      .filter(Boolean)
      .join('\n');

  return {
    pubmedId: pmid,
    pubmed_title: title,
    pubmed_abstract: abstract,
    pubmed_journal: text(journal.Title) || text(journal.ISOAbbreviation),
    pubmed_journal_abbrev: text(journal.ISOAbbreviation),
    pubmed_date: date,
    pubmed_year: yearMatch ? Number(yearMatch[0]) : null,
    pubmed_volume: text(journal.JournalIssue?.Volume),
    pubmed_issue: text(journal.JournalIssue?.Issue),
    pubmed_pages: text(art.Pagination?.MedlinePgn),
    pubmed_authors: authorList.join(', '),
    author_list: authorList,
    publication_types: publicationTypes,
    mesh_terms: mesh,
    keywords,
    doi,
    doi_url: doi ? `https://doi.org/${doi}` : '',
    pmc_id: pmc,
    pmc_url: pmc ? `https://pmc.ncbi.nlm.nih.gov/articles/${pmc}/` : '',
    pubmed_url: pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : '',
  };
}

const parser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
  parseTagValue: false,
  parseAttributeValue: false,
  processEntities: false,
  htmlEntities: false,
});

export function parsePubmedXml(xml) {
  const raw = extractRawText(xml);
  const parsed = parser.parse(xml);
  const articles = arr(parsed?.PubmedArticleSet?.PubmedArticle);
  const out = {};
  for (const article of articles) {
    const pmid = text(article?.MedlineCitation?.PMID);
    if (!pmid) continue;
    out[pmid] = parseArticle(article, raw[pmid] || {});
  }
  return out;
}

