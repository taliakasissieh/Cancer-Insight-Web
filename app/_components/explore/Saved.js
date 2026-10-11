'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PaperItem from '../PaperItem';
import Icon from '../Icon';
import { postJson } from '../../../lib/client/api';
import { clearLegacyIds, readLegacyIds, snapshot } from '../../../lib/client/saved';
import { download, fileStem, papersCsv, papersRis } from '../../../lib/client/exports';
import { fmtDate } from '../../../lib/format';
import { paperKey } from '../../../lib/evidence';

export default function Saved({ saved }) {
  const [legacy, setLegacy] = useState({ status: 'idle', count: 0 });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const ids = readLegacyIds();
    if (!ids.length) return;
    setLegacy({ status: 'loading', count: ids.length });
    postJson('/api/records', { ids: ids.slice(0, 100) })
      .then(({ papers }) => {
        saved.addMany(
          papers.map(p => ({
            key: paperKey(p),
            savedAt: new Date().toISOString(),
            cancer: '',
            paper: { ...snapshot(p), evidenceSource: 'saved' },
          }))
        );
        clearLegacyIds(papers.map(p => p.pubmedId));
        setLegacy({ status: 'done', count: papers.length });
      })
      .catch(() => setLegacy({ status: 'error', count: ids.length }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const papers = useMemo(
    () => saved.items.map(i => ({ ...i.paper, evidenceSource: 'saved', _saved: i })),
    [saved.items]
  );

  async function exportAs(kind) {
    const stem = fileStem('saved', 'papers');
    if (kind === 'csv')
      download(
        `${stem}.csv`,
        papersCsv(papers, { source: 'Saved papers (this browser)' }),
        'text/csv'
      );
    if (kind === 'ris')
      download(`${stem}.ris`, papersRis(papers), 'application/x-research-info-systems');
    if (kind === 'pdf') {
      setBusy(true);
      try {
        const { downloadReport } = await import('../../../lib/client/report');
        await downloadReport({
          cancerLabel: 'Saved papers',
          papers,
          context: { source: 'Saved papers (this browser)' },
        });
      } finally {
        setBusy(false);
      }
    }
  }

  return (
    <div>
      <div className="viewIntro">
        <h2>Your reading list</h2>
        <p>
          Saved papers stay in this browser only — they are not sent to Cancer Insight. Clearing
          browser data or switching device removes them, so export anything you want to keep.
        </p>
      </div>

      {legacy.status === 'loading' && (
        <p className="loadingLine">
          <span className="spinner" aria-hidden="true" />
          Restoring {legacy.count} papers saved with the previous version of Cancer Insight…
        </p>
      )}
      {legacy.status === 'done' && legacy.count > 0 && (
        <p className="notice small">
          Restored {legacy.count} papers saved with the previous version.
        </p>
      )}
      {legacy.status === 'error' && (
        <p className="notice noticeWarn small">
          {legacy.count} papers saved with the previous version could not be restored right now.
          They are kept and will be retried next time.
        </p>
      )}

      {!papers.length ? (
        <div className="emptyState">
          <h3>No saved papers yet</h3>
          <p>Use “Save” on any paper to build a reading list you can export as CSV, RIS or PDF.</p>
          <Link className="btn btnPrimary" href="/explore">
            Explore research
          </Link>
        </div>
      ) : (
        <>
          <div className="listToolbar">
            <p>
              <strong>{papers.length}</strong> saved papers
            </p>
            <div className="btnRow">
              <button
                type="button"
                className="btn btnSecondary btnSmall"
                onClick={() => exportAs('csv')}
              >
                <Icon name="download" size={16} />
                CSV
              </button>
              <button
                type="button"
                className="btn btnSecondary btnSmall"
                onClick={() => exportAs('ris')}
              >
                <Icon name="download" size={16} />
                RIS citations
              </button>
              <button
                type="button"
                className="btn btnSecondary btnSmall"
                disabled={busy}
                onClick={() => exportAs('pdf')}
              >
                <Icon name="doc" size={16} />
                {busy ? 'Preparing PDF…' : 'PDF report'}
              </button>
            </div>
          </div>
          <ol className="paperList">
            {papers.map(p => (
              <li key={p._saved.key}>
                <p className="small muted" style={{ margin: '14px 0 -12px 20px' }}>
                  Saved {fmtDate(p._saved.savedAt)}
                  {p._saved.cancer ? ` while exploring ${p._saved.cancer}` : ''}
                </p>
                <PaperItem
                  paper={p}
                  showWhy={false}
                  showSource={false}
                  saved
                  onToggleSave={() => saved.remove(p._saved.key)}
                />
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
