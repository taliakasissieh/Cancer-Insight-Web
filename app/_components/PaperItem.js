'use client';

import { useState } from 'react';
import Icon from './Icon';
import {
  classifyEvidence,
  paperAbstract,
  paperAuthors,
  paperDate,
  paperJournal,
  paperTitle,
  treatmentTags,
} from '../../lib/evidence';
import { citation, copyText } from '../../lib/client/exports';
import { track } from '../../lib/client/track';
import { evidenceLabel } from '../../lib/i18n/labels.js';
import { useI18n } from './I18n';

const SECTION = /^([A-Z][A-Z0-9 ,&/()'-]{2,60}):\s+/;

function AbstractText({ text }) {
  const parts = text
    .split(/\n+/)
    .map(s => s.trim())
    .filter(Boolean);
  return (
    <div className="abstract">
      {parts.map((part, i) => {
        const m = part.match(SECTION);
        if (!m) return <p key={i}>{part}</p>;
        const label = m[1].charAt(0) + m[1].slice(1).toLowerCase();
        return (
          <p key={i}>
            <span className="abstractLabel">{label}.</span> {part.slice(m[0].length)}
          </p>
        );
      })}
    </div>
  );
}

function whyText(p, t, locale) {
  const r = p.relevance;
  const parts = [];
  if (r?.matchedIn?.length) {
    const where = r.matchedIn.filter(w => w !== 'feed tag');
    if (where.length) {
      const names = where.map(w => {
        const key = `paper.where.${w}`;
        const v = t(key);
        return v === key ? w : v;
      });
      const list = new Intl.ListFormat(locale === 'ar' ? 'ar' : 'en', {
        style: 'long',
        type: 'conjunction',
      }).format(names);
      parts.push(
        t('paper.whyIn', { what: r.phrase ? `“${r.phrase}”` : t('paper.whyCancer'), where: list })
      );
    }
    if (r.matchedIn.includes('feed tag')) parts.push(t('paper.whyFeed'));
  } else if (p.evidenceSource?.startsWith('pubmed')) {
    parts.push(t('paper.whyQuery'));
  }
  return parts.length ? `${parts.join(locale === 'ar' ? '؛ ' : '; ')}.` : '';
}

export default function PaperItem({
  paper: p,
  saved = false,
  onToggleSave,
  showWhy = true,
  showSource = true,
  headingLevel = 3,
}) {
  const { t, locale } = useI18n();
  const [copied, setCopied] = useState(false);
  const c = classifyEvidence(p.publication_types);
  const title = paperTitle(p) || t('paper.untitled');
  const abstract = paperAbstract(p);
  const authors = paperAuthors(p);
  const authorText = authors.length
    ? authors.length > 3
      ? t('paper.moreAuthors', { names: authors.slice(0, 3).join(', '), n: authors.length - 3 })
      : authors.join(', ')
    : '';
  const tags = treatmentTags(p);
  const why = showWhy ? whyText(p, t, locale) : '';
  const H = `h${headingLevel}`;
  const pmid = p.pubmedId || '';

  const trackSource = type => track('research_source_click', { source_type: type, paper_id: pmid });

  return (
    <article className="paperItem" data-family={c.family}>
      <div className="paperTypeLine">
        <span className="typeTag">{evidenceLabel(t, c)}</span>
        {c.tags.map(tag => (
          <span key={tag} className="flag flagSoft">
            {t(`evidence.tags.${tag}`)}
          </span>
        ))}
        {c.retracted && (
          <span className="flag flagRetracted">
            <Icon name="alert" size={14} />
            {t('paper.retracted')}
          </span>
        )}
        {p.pmc_url && <span className="flag flagFree">{t('paper.freeFullText')}</span>}
        {showSource && p.evidenceSource && t(`sources.${p.evidenceSource}`) !== `sources.${p.evidenceSource}` && (
          <span className="muted">{t(`sources.${p.evidenceSource}`)}</span>
        )}
      </div>

      <H className="paperTitle" lang="en" dir="ltr">
        {p.pubmed_url ? (
          <a
            href={p.pubmed_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackSource('pubmed_title')}
          >
            {title}
          </a>
        ) : (
          title
        )}
      </H>

      <div className="paperMeta" dir="ltr" lang="en">
        {paperJournal(p) && <span className="journal">{paperJournal(p)}</span>}
        {paperDate(p) && <span>{paperDate(p)}</span>}
        {authorText && <span>{authorText}</span>}
      </div>

      {c.retracted && (
        <p className="notice noticeError small" style={{ margin: '0 0 10px' }}>
          {t('paper.retractedNotice')}
        </p>
      )}

      {why && (
        <p className="paperWhy">
          <strong>{t('paper.why')}</strong> {why}
        </p>
      )}
      {tags.length > 0 && (
        <p className="paperWhy">
          <strong>{t('paper.treatmentTags')}</strong>{' '}
          <span className="tagList">
            {tags.map(tag => (
              <span key={tag} className="tag">
                {t(`treatments.${tag}`) === `treatments.${tag}` ? tag : t(`treatments.${tag}`)}
              </span>
            ))}
          </span>
        </p>
      )}

      {abstract && (
        <details
          className="abstractToggle"
          onToggle={e => e.currentTarget.open && track('abstract_expand', { paper_id: pmid })}
        >
          <summary>
            {t('paper.abstract')}
            <Icon name="chevron" size={16} />
          </summary>
          <div lang="en" dir="ltr">
            <AbstractText text={abstract} />
          </div>
        </details>
      )}

      <div className="paperActions">
        {p.pubmed_url && (
          <a
            className="btn btnSecondary"
            href={p.pubmed_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackSource('pubmed')}
          >
            PubMed
            <Icon name="external" size={14} />
          </a>
        )}
        {p.pmc_url && (
          <a
            className="btn btnSecondary"
            href={p.pmc_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackSource('pmc')}
          >
            {t('paper.freeFullText')}
            <Icon name="external" size={14} />
          </a>
        )}
        {p.doi && (
          <a
            className="btn btnQuiet"
            href={`https://doi.org/${p.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackSource('doi')}
          >
            DOI
            <Icon name="external" size={14} />
          </a>
        )}
        {onToggleSave && (
          <button
            type="button"
            className="btn btnQuiet saveButton"
            aria-pressed={saved}
            onClick={() => onToggleSave(p)}
          >
            <Icon name="bookmark" size={16} filled={saved} />
            {saved ? t('paper.saved') : t('paper.save')}
          </button>
        )}
        <button
          type="button"
          className="btn btnQuiet"
          onClick={async () => {
            const ok = await copyText(citation(p));
            setCopied(ok);
            track('citation_copy', { paper_id: pmid });
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          <Icon name={copied ? 'check' : 'quote'} size={16} />
          {copied ? t('paper.citationCopied') : t('paper.copyCitation')}
        </button>
        <span className="visuallyHidden" aria-live="polite">
          {copied ? t('paper.citationCopiedLive') : ''}
        </span>
      </div>
    </article>
  );
}
