'use client';

import Link from 'next/link';
import CountLink from '../CountLink';
import EvidenceMix from '../EvidenceMix';
import ShareList from '../ShareList';
import YearChart from '../YearChart';
import Icon from '../Icon';
import { useI18n } from '../I18n';
import { fmtDateTime, fmtShare } from '../../../lib/format';
import { resolveTreatment } from '../../../lib/queries';
import { localizeError } from '../../../lib/i18n/labels.js';
import { richText } from '../../../lib/i18n/rich.js';

const DESIGN_ORDER = [
  'clinical-trial',
  'rct',
  'observational',
  'case-report',
  'review',
  'systematic-review',
  'meta-analysis',
  'guideline',
];

function FeedStatus({ provenance }) {
  const { t } = useI18n();
  const { feed, pubmed } = provenance;
  const feedLink = (
    <a href={feed.url} target="_blank" rel="noopener noreferrer" lang="en" dir="ltr">
      {feed.name}
    </a>
  );
  if (feed.status === 'ok' && !pubmed.used) {
    return richText(t('overview.feedOk', { kept: feed.kept, candidates: feed.candidates }), {
      feed: feedLink,
    });
  }
  if (feed.status === 'ok' && pubmed.used) {
    return richText(t('overview.feedPlusPubmed', { kept: feed.kept, pubmed: pubmed.kept }), {
      feed: feedLink,
    });
  }
  const reasonKey = `overview.feedReason.${feed.status}`;
  const reason = t(reasonKey) === reasonKey ? t('overview.feedReason.other') : t(reasonKey);
  return t('overview.feedFallback', { reason });
}

export default function Overview({ data, footprint, onNavigate }) {
  const { t, locale, path } = useI18n();
  const fp = footprint.data;
  const p = data.profile;
  const designs = fp
    ? DESIGN_ORDER.map(id => fp.designs.find(d => d.id === id))
        .filter(Boolean)
        .map(d => ({ ...d, label: t(`measures.label.${d.id}`) }))
    : [];
  const years =
    p.earliestYear && p.latestYear
      ? p.earliestYear === p.latestYear
        ? `${p.latestYear}`
        : `${p.earliestYear}–${p.latestYear}`
      : '—';
  const currentYear = fp?.years?.at(-1)?.year;
  const tagName = tag => {
    const id = resolveTreatment(tag)?.id || tag;
    const v = t(`treatments.${id}`);
    return v === `treatments.${id}` ? resolveTreatment(tag)?.label || tag : v;
  };
  const q = encodeURIComponent(data.cancer.input);

  return (
    <div className="overviewGrid">
      <div className="stack">
        <section className="panel" aria-labelledby="footprint-h">
          <h2 id="footprint-h">{t('overview.literatureTitle')}</h2>
          {footprint.status === 'loading' && (
            <>
              <p className="loadingLine" aria-live="polite">
                <span className="spinner" aria-hidden="true" />
                {t('overview.counting')}
              </p>
              <div className="skeleton" style={{ height: 200, marginTop: 12 }} />
            </>
          )}
          {footprint.status === 'error' && (
            <p className="notice noticeWarn">
              {t('overview.countsUnavailable', {
                error: localizeError(t, locale, footprint.error),
              })}
            </p>
          )}
          {fp && (
            <>
              <p className="footprintLead">
                {richText(t('overview.lead'), {
                  count: <CountLink count={fp.total.count} url={fp.total.url} />,
                })}
              </p>
              <p className="panelNote">
                {t('overview.yearsNote', {
                  from: String(fp.years[0].year),
                  to: String(fp.years.at(-1).year),
                })}
              </p>
              <YearChart years={fp.years} />
              <details className="small" style={{ marginTop: 8 }}>
                <summary>{t('overview.meaning')}</summary>
                <ul className="cautionList">
                  <li>{t('overview.note1')}</li>
                  <li>{t('overview.note2')}</li>
                  <li>{t('overview.note3', { year: String(currentYear ?? '') })}</li>
                  <li>{t('overview.note4')}</li>
                  <li>{t('overview.note5')}</li>
                </ul>
              </details>
            </>
          )}
        </section>

        {fp && (
          <section className="panel" aria-labelledby="designs-h">
            <h2 id="designs-h">{t('overview.designsTitle')}</h2>
            <p className="panelNote">{t('overview.designsNote', { n: fp.total.count })}</p>
            <ShareList rows={designs} />
            {fp.freeFullText?.count != null && (
              <p className="small" style={{ margin: '16px 0 0' }}>
                {richText(
                  t('overview.freeText', {
                    share: fmtShare(fp.freeFullText.share, undefined, locale),
                  }),
                  { count: <CountLink count={fp.freeFullText.count} url={fp.freeFullText.url} /> }
                )}
              </p>
            )}
            {fp.retracted?.count > 0 && (
              <p className="small" style={{ margin: '8px 0 0' }}>
                {richText(t('overview.retractedLine'), {
                  count: <CountLink count={fp.retracted.count} url={fp.retracted.url} />,
                })}
              </p>
            )}
          </section>
        )}
      </div>

      <div className="stack">
        <section className="panel" aria-labelledby="feed-h">
          <h2 id="feed-h">{t('overview.recentTitle')}</h2>
          <p className="panelNote">
            <FeedStatus provenance={data.provenance} />{' '}
            {t('overview.retrieved', { date: fmtDateTime(data.provenance.retrievedAt, locale) })}
          </p>
          <h3 className="groupHeading">{t('overview.kinds')}</h3>
          <EvidenceMix byFamily={p.byFamily} total={p.total} />
          <dl className="factList" style={{ marginTop: 16 }}>
            <dt>{t('overview.published')}</dt>
            <dd className="num">{years}</dd>
            <dt>{t('overview.withAbstract')}</dt>
            <dd className="num">{t('common.of', { a: p.withAbstract, b: p.total })}</dd>
            <dt>{t('overview.freeFullText')}</dt>
            <dd className="num">{t('common.of', { a: p.withPmc, b: p.total })}</dd>
            <dt>{t('overview.journals')}</dt>
            <dd className="num">{p.journalCount}</dd>
            {p.retracted > 0 && (
              <>
                <dt>{t('overview.retracted')}</dt>
                <dd className="num" style={{ color: 'var(--rose)', fontWeight: 700 }}>
                  {p.retracted}
                </dd>
              </>
            )}
          </dl>
          {data.treatments.length > 0 && (
            <>
              <h3 className="groupHeading" style={{ marginTop: 18 }}>
                {t('overview.tagsTitle')}
              </h3>
              <div className="treatmentPicker">
                {data.treatments.map(([tag, n]) => (
                  <a
                    key={tag}
                    className="chip"
                    href={path(`/explore?cancer=${q}&view=treatments&treatment=${encodeURIComponent(tag)}`)}
                    onClick={e => {
                      e.preventDefault();
                      onNavigate({ view: 'treatments', treatment: tag });
                    }}
                  >
                    {tagName(tag)}
                    <span className="chipCount">{n}</span>
                  </a>
                ))}
              </div>
              <p className="small muted" style={{ margin: 0 }}>
                {t('overview.tagsNote', { n: p.total })}
              </p>
            </>
          )}
          <div className="btnRow" style={{ marginTop: 18 }}>
            <button
              type="button"
              className="btn btnPrimary"
              onClick={() => onNavigate({ view: 'papers' })}
            >
              {t('overview.readPapers')}
            </button>
          </div>
        </section>

        <section aria-labelledby="next-h">
          <h2 id="next-h" className="visuallyHidden">
            {t('overview.goFurther')}
          </h2>
          <div className="nextSteps">
            <Link className="nextStep" href={path(`/research-gap-atlas?cancer=${q}`)}>
              <strong>{t('overview.nextAtlas')}</strong>
              <span>{t('overview.nextAtlasNote')}</span>
            </Link>
            <button
              type="button"
              className="nextStep nextStepButton"
              onClick={() => onNavigate({ view: 'treatments' })}
            >
              <strong>{t('overview.nextTreatments')}</strong>
              <span>{t('overview.nextTreatmentsNote')}</span>
            </button>
            <button
              type="button"
              className="nextStep nextStepButton"
              onClick={() => onNavigate({ view: 'trials' })}
            >
              <strong>{t('overview.nextTrials')}</strong>
              <span>{t('overview.nextTrialsNote')}</span>
            </button>
            {data.cancer.known && data.cancer.id && (
              <Link className="nextStep" href={path(`/cancers/${data.cancer.id}`)}>
                <strong>{t('overview.nextProfile')}</strong>
                <span>{t('overview.nextProfileNote')}</span>
              </Link>
            )}
          </div>
        </section>

        <p className="notice small">
          <Icon name="info" size={16} /> {t('overview.disclaimer')}
        </p>
      </div>
    </div>
  );
}
