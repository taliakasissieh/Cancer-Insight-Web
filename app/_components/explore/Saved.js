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
import { useI18n } from '../I18n';

export default function Saved({ saved }) {
  const { t, locale, path } = useI18n();
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
        <h2>{t('saved.title')}</h2>
        <p>{t('saved.intro')}</p>
      </div>

      {legacy.status === 'loading' && (
        <p className="loadingLine">
          <span className="spinner" aria-hidden="true" />
          {t('saved.restoring', { n: legacy.count })}
        </p>
      )}
      {legacy.status === 'done' && legacy.count > 0 && (
        <p className="notice small">
          {t('saved.restored', { n: legacy.count })}
        </p>
      )}
      {legacy.status === 'error' && (
        <p className="notice noticeWarn small">
          {t('saved.restoreError', { n: legacy.count })}
        </p>
      )}

      {!papers.length ? (
        <div className="emptyState">
          <h3>{t('saved.emptyTitle')}</h3>
          <p>{t('saved.empty')}</p>
          <Link className="btn btnPrimary" href={path('/explore')}>
            {t('search.explore')}
          </Link>
        </div>
      ) : (
        <>
          <div className="listToolbar">
            <p>
              <strong>{t('saved.count', { n: papers.length })}</strong>
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
                {t('papers.risCitations')}
              </button>
              <button
                type="button"
                className="btn btnSecondary btnSmall"
                disabled={busy}
                onClick={() => exportAs('pdf')}
              >
                <Icon name="doc" size={16} />
                {busy ? t('papers.preparingPdf') : t('papers.pdfReport')}
              </button>
            </div>
          </div>
          <ol className="paperList">
            {papers.map(p => (
              <li key={p._saved.key}>
                <p className="small muted savedOn">
                  {t('saved.savedOn', { date: fmtDate(p._saved.savedAt, locale) })}
                  {p._saved.cancer ? t('saved.while', { cancer: p._saved.cancer }) : ''}
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
