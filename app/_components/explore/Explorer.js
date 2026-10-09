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
import Saved from './Saved';
import StartScreen from './StartScreen';
import { cachedPost } from '../../../lib/client/api';
import { useSaved } from '../../../lib/client/saved';
import { track } from '../../../lib/client/track';
import { resolveCancer } from '../../../lib/queries';
import { fmtDateTime } from '../../../lib/format';

const VIEWS = [
  { id: 'overview', label: 'Overview' },
  { id: 'papers', label: 'Papers' },
  { id: 'treatments', label: 'Treatments' },
  { id: 'images', label: 'Images' },
  { id: 'saved', label: 'Saved' },
];
const VIEW_IDS = VIEWS.map(v => v.id);

function hrefFor({ cancer, view, treatment }) {
  const params = new URLSearchParams();
  if (cancer) params.set('cancer', cancer);
  if (view && view !== 'overview') params.set('view', view);
  if (view === 'treatments' && treatment) params.set('treatment', treatment);
  const qs = params.toString();
  return `/explore${qs ? `?${qs}` : ''}`;
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

  const navigate = useCallback((next, { replace = false } = {}) => {
    const merged = { ...routeRef.current, ...next };
    routeRef.current = merged;
    const url = hrefFor(merged);
    if (url !== window.location.pathname + window.location.search) {
      window.history[replace ? 'replaceState' : 'pushState'](null, '', url);
    }
    setRoute(merged);
    if (next.view) window.scrollTo({ top: 0 });
  }, []);

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
      document.title = 'Explore cancer research | Cancer Insight';
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
        document.title = `${data.cancer.label} research | Cancer Insight`;
        track('cancer_search_success', { cancer_type: cancer, result_count: data.papers.length });
      })
      .catch(error => {
        if (token.current !== my) return;
        setSearch({ status: 'error', data: null, error: error.message });
        track('cancer_search_error', { cancer_type: cancer, status: error.status || 0 });
      });

    cachedPost('/api/footprint', { cancer })
      .then(data => token.current === my && setFootprint({ status: 'ok', data, error: '' }))
      .catch(
        error =>
          token.current === my &&
          setFootprint({ status: 'error', data: null, error: error.message })
      );
  }, [route.cancer, retryKey]);

  const data = search.data;
  const label = data?.cancer?.label || resolved?.label || route.cancer;
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
              <h1 id="workspace-title">{route.cancer ? label : 'Saved papers'}</h1>
              {route.cancer ? (
                <WorkspaceSummary search={search} footprint={footprint} />
              ) : (
                <p className="workspaceSummary">
                  Papers you saved in this browser, across all searches.
                </p>
              )}
              {resolved && (
                <QueryBox
                  term={resolved.term}
                  title="PubMed query used for counts"
                  note="The same query drives every PubMed count on this page. Opening it on PubMed reproduces the numbers (they can differ slightly as PubMed updates)."
                />
              )}
            </div>
            <div>
              <CancerSearch
                compact
                showExamples={false}
                buttonLabel="Search"
                initialValue={route.cancer}
                onSearch={c =>
                  navigate({ cancer: c, view: view === 'saved' ? 'overview' : view, treatment: '' })
                }
              />
            </div>
          </div>
        </div>
      </section>

      <nav className="tabBar" aria-label="Explorer views">
        <div className="tabBarInner">
          {VIEWS.filter(v => route.cancer || v.id === 'saved').map(v => (
            <a
              key={v.id}
              href={hrefFor({ cancer: route.cancer, view: v.id })}
              aria-current={view === v.id ? 'page' : undefined}
              onClick={e => tabClick(e, v.id)}
            >
              {v.label}
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
              href={`/research-gap-atlas?cancer=${encodeURIComponent(route.cancer)}`}
              onClick={() =>
                track('gap_atlas_open', { cancer_type: route.cancer, location: 'explorer_tabs' })
              }
            >
              Gap Atlas for {label}
            </Link>
          )}
        </div>
      </nav>

      <div className="viewBody">
        {view !== 'saved' && search.status === 'loading' && <LoadingState label={label} />}
        {view !== 'saved' && search.status === 'error' && (
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
        {view === 'saved' && <Saved saved={saved} />}
      </div>
    </>
  );
}

function WorkspaceSummary({ search, footprint }) {
  const data = search.data;
  const fp = footprint.data;
  return (
    <p className="workspaceSummary" aria-live="polite">
      {fp?.total?.count != null ? (
        <>
          PubMed indexes <CountLink count={fp.total.count} url={fp.total.url} /> records matching
          this cancer.{' '}
        </>
      ) : footprint.status === 'loading' ? (
        <>Counting PubMed records… </>
      ) : null}
      {data && (
        <>
          Below: the {data.papers.length} most recent relevant records, retrieved{' '}
          {fmtDateTime(data.provenance.retrievedAt)}.
        </>
      )}
    </p>
  );
}

function LoadingState({ label }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <p className="loadingLine">
        <span className="spinner" aria-hidden="true" />
        Retrieving recent {label} research and enriching it with PubMed metadata…
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
  return (
    <div className="emptyState" role="alert">
      <h2>The search did not complete</h2>
      <p>{message}</p>
      <div className="btnRow">
        <button type="button" className="btn btnPrimary" onClick={onRetry}>
          Try again
        </button>
        <Link className="btn btnSecondary" href="/methodology#sources">
          <Icon name="info" size={16} />
          Which cancers are covered?
        </Link>
      </div>
    </div>
  );
}
