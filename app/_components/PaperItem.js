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
import { SOURCE_LABELS } from '../../lib/format';
import { citation, copyText } from '../../lib/client/exports';
import { track } from '../../lib/client/track';

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

function whyText(p) {
  const r = p.relevance;
  const parts = [];
  if (r?.matchedIn?.length) {
    const where = r.matchedIn.filter(w => w !== 'feed tag');
    if (where.length) {
      parts.push(
        `${r.phrase ? `“${r.phrase}”` : 'The cancer'} appears in the ${where.join(', ').replace(/, ([^,]*)$/, ' and $1')}`
      );
    }
    if (r.matchedIn.includes('feed tag')) parts.push('the research feed tags it with this cancer');
  } else if (p.evidenceSource?.startsWith('pubmed')) {
    parts.push('it matches the PubMed query for this cancer');
  }
  return parts.length ? `${parts.join('; ')}.` : '';
}

export default function PaperItem({
  paper: p,
  saved = false,
  onToggleSave,
  showWhy = true,
  showSource = true,
  headingLevel = 3,
}) {
  const [copied, setCopied] = useState(false);
  const c = classifyEvidence(p.publication_types);
  const title = paperTitle(p) || 'Untitled record';
  const abstract = paperAbstract(p);
  const authors = paperAuthors(p);
  const authorText = authors.length
    ? authors.slice(0, 3).join(', ') + (authors.length > 3 ? ` and ${authors.length - 3} more` : '')
    : '';
  const tags = treatmentTags(p);
  const why = showWhy ? whyText(p) : '';
  const H = `h${headingLevel}`;
  const pmid = p.pubmedId || '';

  const trackSource = type => track('research_source_click', { source_type: type, paper_id: pmid });

  return (
    <article className="paperItem" data-family={c.family}>
      <div className="paperTypeLine">
        <span className="typeTag">{c.label}</span>
        {c.tags.map(t => (
          <span key={t} className="flag flagSoft">
            {t}
          </span>
        ))}
        {c.retracted && (
          <span className="flag flagRetracted">
            <Icon name="alert" size={14} />
            Retracted
          </span>
        )}
        {p.pmc_url && <span className="flag flagFree">Free full text</span>}
        {showSource && SOURCE_LABELS[p.evidenceSource] && (
          <span className="muted">{SOURCE_LABELS[p.evidenceSource]}</span>
        )}
      </div>

      <H className="paperTitle">
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

      <div className="paperMeta">
        {paperJournal(p) && <span className="journal">{paperJournal(p)}</span>}
        {paperDate(p) && <span>{paperDate(p)}</span>}
        {authorText && <span>{authorText}</span>}
      </div>

      {c.retracted && (
        <p className="notice noticeError small" style={{ margin: '0 0 10px' }}>
          PubMed marks this paper as retracted. Read the retraction notice before relying on any of
          its findings.
        </p>
      )}

      {why && (
        <p className="paperWhy">
          <strong>Why it’s here:</strong> {why}
        </p>
      )}
      {tags.length > 0 && (
        <p className="paperWhy">
          <strong>Treatment tags:</strong>{' '}
          <span className="tagList">
            {tags.map(t => (
              <span key={t} className="tag">
                {t}
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
            Abstract
            <Icon name="chevron" size={16} />
          </summary>
          <AbstractText text={abstract} />
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
            Free full text
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
            {saved ? 'Saved' : 'Save'}
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
          {copied ? 'Citation copied' : 'Copy citation'}
        </button>
        <span className="visuallyHidden" aria-live="polite">
          {copied ? 'Citation copied to clipboard' : ''}
        </span>
      </div>
    </article>
  );
}
