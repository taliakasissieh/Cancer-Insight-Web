'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import CancerSearch from '../CancerSearch';
import CountLink from '../CountLink';
import QueryBox from '../QueryBox';
import Icon from '../Icon';
import Overview from './Overview';
import Papers from './Papers';
import Treatments from './Treatments';
import Images from './Images';
import Trials from './Trials';
import Saved from './Saved';
import StartScreen from './StartScreen';
import { cachedPost } from '../../../lib/client/api';
import { useSaved } from '../../../lib/client/saved';
import { track } from '../../../lib/client/track';
import { resolveCancer } from '../../../lib/queries';
import { fmtDateTime } from '../../../lib/format';
import { cancerName, localizeError } from '../../../lib/i18n/labels.js';
import { richText } from '../../../lib/i18n/rich.js';
import { useI18n } from '../I18n';

const VIEWS = [
  { id: 'overview' },
  { id: 'papers' },
  { id: 'treatments' },
  { id: 'trials' },
  { id: 'images' },
  { id: 'saved' },
];
const VIEW_IDS = VIEWS.map(v => v.id);
/* Views that do not depend on the research-feed search finishing. */
const INDEPENDENT_VIEWS = ['saved', 'trials'];

function hrefFor({ cancer, view, treatment }, base = '/explore') {
  const params = new URLSearchParams();
  if (cancer) params.set('cancer', cancer);
  if (view && view !== 'overview') params.set('view', view);
  if (view === 'treatments' && treatment) params.set('treatment', treatment);
  const qs = params.toString();
  return `${base}${qs ? `?${qs}` : ''}`;
}

function readLocation() {
  const p = new URLSearchParams(window.location.search);
  const view = p.get('view');
  return {
    cancer: (p.get('cancer') || '').slice(0, 60),
    view: VIEW_IDS.includes(view) ? view : 'overview',
    treatment: (p.get('treatment') || '').slice(0, 50),
  };
}

const IDLE = { status: 'idle', data: null, error: '' };

export default function Explorer({
  initialCancer = '',
  initialView = 'overview',
  initialTreatment = '',
}) {
  const [route, setRoute] = useState({
    cancer: initialCancer,
    view: initialView,
    treatment: initialTreatment,
  });
  const routeRef = useRef(route);
  const [search, setSearch] = useState(initialCancer ? { ...IDLE, status: 'loading' } : IDLE);
  const [footprint, setFootprint] = useState(initialCancer ? { ...IDLE, status: 'loading' } : IDLE);
  const [retryKey, setRetryKey] = useState(0);
  const token = useRef(0);
  const saved = useSaved();
  const { t, locale, path } = useI18n();
  const base = path('/explore');

  const navigate = useCallback((next, { replace = false } = {}) => {
    const merged = { ...routeRef.current, ...next };
    routeRef.current = merged;
    const url = hrefFor(merged, base);
    if (url !== window.location.pathname + window.location.search) {
      window.history[replace ? 'replaceState' : 'pushState'](null, '', url);
    }
    setRoute(merged);
    if (next.view) window.scrollTo({ top: 0 });
  }, [base]);

  useEffect(() => {
    const onPop = () => {
      const loc = readLocation();
      routeRef.current = loc;
      setRoute(loc);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const resolved = route.cancer ? resolveCancer(route.cancer) : null;

  useEffect(() => {
    const cancer = route.cancer;
    if (!cancer) {
      setSearch(IDLE);
      setFootprint(IDLE);
      document.title = `${t('explorer.docTitleStart')} | Cancer Insight`;
      return;
    }
    const my = ++token.current;
    setSearch({ ...IDLE, status: 'loading' });
    setFootprint({ ...IDLE, status: 'loading' });
    track('cancer_search', { cancer_type: cancer });

    cachedPost('/api/search', { cancer })
      .then(data => {
        if (token.current !== my) return;
        setSearch({ status: 'ok', data, error: '' });
        document.title = `${t('explorer.docTitle', { cancer: cancerName(t, data.cancer) })} | Cancer Insight`;
        track('cancer_search_success', { cancer_type: cancer, result_count: data.papers.length });
      })
      .catch(error => {
        if (token.current !== my) return;
        setSearch({ status: 'error', data: null, error: localizeError(t, locale, error.message) });
        track('cancer_search_error', { cancer_type: cancer, status: error.status || 0 });
      });

    cachedPost('/api/footprint', { cancer })
      .then(data => token.current === my && setFootprint({ status: 'ok', data, error: '' }))
      .catch(
        error =>
          token.current === my &&
          setFootprint({ status: 'error', data: null, error: error.message })
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.cancer, retryKey]);

  const data = search.data;
  const label = cancerName(t, data?.cancer || resolved || route.cancer) || route.cancer;
  const view = route.view;

  function tabClick(e, id) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    navigate({ view: id });
    track('navigation_click', { section_name: id });
  }

  if (!route.cancer && view !== 'saved') {
    return (
      <StartScreen
        onSearch={c => navigate({ cancer: c, view: 'overview' })}
        savedCount={saved.items.length}
      />
    );
  }

  return (
    <>
      <section className="workspaceHead" aria-labelledby="workspace-title">
        <div className="workspaceHeadInner">
          <div className="workspaceTop">
            <div>
              <h1 id="workspace-title">{route.cancer ? label : t('saved.headerTitle')}</h1>
              {route.cancer ? (
                <WorkspaceSummary search={search} footprint={footprint} />
              ) : (
                <p className="workspaceSummary">{t('saved.headerNote')}</p>
              )}
              {resolved && (
                <QueryBox
                  term={resolved.term}
                  title={t('explorer.queryTitle')}
                  note={t('explorer.queryNote')}
                />
              )}
            </div>
            <div>
              <CancerSearch
                compact
                showExamples={false}
                buttonLabel={t('search.search')}
                initialValue={route.cancer}
                onSearch={c =>
                  navigate({ cancer: c, view: view === 'saved' ? 'overview' : view, treatment: '' })
                }
              />
            </div>
          </div>
        </div>
      </section>

      <nav className="tabBar" aria-label={t('explorer.viewsLabel')}>
        <div className="tabBarInner">
          {VIEWS.filter(v => route.cancer || v.id === 'saved').map(v => (
            <a
              key={v.id}
              href={hrefFor({ cancer: route.cancer, view: v.id }, base)}
              aria-current={view === v.id ? 'page' : undefined}
              onClick={e => tabClick(e, v.id)}
            >
              {t(`explorer.views.${v.id}`)}
              {v.id === 'papers' && data ? (
                <span className="chipCount muted">{data.papers.length}</span>
              ) : null}
              {v.id === 'saved' && saved.items.length ? (
                <span className="countBadge">{saved.items.length}</span>
              ) : null}
            </a>
          ))}
          <span className="tabSpacer" />
          {route.cancer && (
            <Link
              className="tabExternal"
              href={path(`/research-gap-atlas?cancer=${encodeURIComponent(route.cancer)}`)}
              onClick={() =>
                track('gap_atlas_open', { cancer_type: route.cancer, location: 'explorer_tabs' })
              }
            >
              {t('explorer.atlasFor', { cancer: label })}
            </Link>
          )}
        </div>
      </nav>

      <div className="viewBody">
        {!INDEPENDENT_VIEWS.includes(view) && search.status === 'loading' && (
          <LoadingState label={label} />
        )}
        {!INDEPENDENT_VIEWS.includes(view) && search.status === 'error' && (
          <ErrorState message={search.error} onRetry={() => setRetryKey(k => k + 1)} />
        )}
        {search.status === 'ok' && view === 'overview' && (
          <Overview data={data} footprint={footprint} onNavigate={navigate} />
        )}
        {search.status === 'ok' && view === 'papers' && (
          <Papers data={data} saved={saved} footprint={footprint.data} />
        )}
        {search.status === 'ok' && view === 'treatments' && (
          <Treatments
            data={data}
            saved={saved}
            treatment={route.treatment}
            onTreatmentChange={t => navigate({ treatment: t }, { replace: true })}
          />
        )}
        {search.status === 'ok' && view === 'images' && (
          <Images cancer={route.cancer} label={label} />
        )}
        {view === 'trials' && route.cancer && <Trials cancer={route.cancer} />}
        {view === 'saved' && <Saved saved={saved} />}
      </div>
    </>
  );
}

function WorkspaceSummary({ search, footprint }) {
  const { t, locale } = useI18n();
  const data = search.data;
  const fp = footprint.data;
  return (
    <p className="workspaceSummary" aria-live="polite">
      {fp?.total?.count != null ? (
        <>
          {richText(t('explorer.summaryCount'), {
            count: <CountLink count={fp.total.count} url={fp.total.url} />,
          })}{' '}
        </>
      ) : footprint.status === 'loading' ? (
        <>{t('explorer.summaryCounting')} </>
      ) : null}
      {data &&
        t('explorer.summaryBelow', {
          n: data.papers.length,
          date: fmtDateTime(data.provenance.retrievedAt, locale),
        })}
    </p>
  );
}

function LoadingState({ label }) {
  const { t } = useI18n();
  return (
    <div aria-busy="true" aria-live="polite">
      <p className="loadingLine">
        <span className="spinner" aria-hidden="true" />
        {t('explorer.loading', { cancer: label })}
      </p>
      <div className="overviewGrid" style={{ marginTop: 20 }}>
        <div className="stack">
          <div className="skeleton" style={{ height: 260 }} />
          <div className="skeleton" style={{ height: 180 }} />
        </div>
        <div className="skeleton" style={{ height: 380 }} />
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  const { t, path } = useI18n();
  return (
    <div className="emptyState" role="alert">
      <h2>{t('explorer.errorTitle')}</h2>
      <p>{message}</p>
      <div className="btnRow">
        <button type="button" className="btn btnPrimary" onClick={onRetry}>
          {t('common.retry')}
        </button>
        <Link className="btn btnSecondary" href={path('/methodology#sources')}>
          <Icon name="info" size={16} />
          {t('explorer.whichCancers')}
        </Link>
      </div>
    </div>
  );
}
