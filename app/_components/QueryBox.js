'use client';

import { useState } from 'react';
import Icon from './Icon';
import { copyText } from '../../lib/client/exports';
import { pubmedSearchUrl } from '../../lib/queries';

export default function QueryBox({ term, title = 'PubMed query', defaultOpen = false, note }) {
  const [copied, setCopied] = useState(false);
  if (!term) return null;
  return (
    <details className="queryBox" open={defaultOpen}>
      <summary>
        <Icon name="search" size={16} />
        {title}
        <Icon name="chevron" size={16} />
      </summary>
      <div className="queryBody">
        <code>{term}</code>
        {note ? (
          <p className="small muted" style={{ margin: '8px 0 0' }}>
            {note}
          </p>
        ) : null}
        <div className="btnRow">
          <a
            className="btn btnSecondary btnSmall"
            href={pubmedSearchUrl(term)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="external" size={16} />
            Run on PubMed
          </a>
          <button
            type="button"
            className="btn btnQuiet btnSmall"
            onClick={async () => {
              setCopied(await copyText(term));
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            <Icon name={copied ? 'check' : 'copy'} size={16} />
            {copied ? 'Copied' : 'Copy query'}
          </button>
        </div>
      </div>
    </details>
  );
}
