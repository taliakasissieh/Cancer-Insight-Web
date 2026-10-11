'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '../I18n';

function Thumb({ src, alt }) {
  const { t } = useI18n();
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        className="frame"
        style={{ display: 'grid', placeItems: 'center', color: '#b8cfdb', fontSize: '0.9rem' }}
      >
        {t('images.previewUnavailable')}
      </div>
    );
  }
  return (
    <div className="frame">
      <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />
    </div>
  );
}
import Icon from '../Icon';
import { cachedPost } from '../../../lib/client/api';
import { track } from '../../../lib/client/track';
import { lowerFirst } from '../../../lib/format';
import { localizeError } from '../../../lib/i18n/labels.js';
import { resolveCancer } from '../../../lib/queries';

export default function Images({ cancer, label }) {
  const { t, locale } = useI18n();
  const [state, setState] = useState({ status: 'loading', images: [], error: '' });

  useEffect(() => {
    let live = true;
    setState({ status: 'loading', images: [], error: '' });
    track('cancer_images_view', { cancer_type: cancer });
    cachedPost('/api/images', { cancer })
      .then(d => live && setState({ status: 'ok', images: d.images || [], error: '' }))
      .catch(e => live && setState({ status: 'error', images: [], error: e.message }));
    return () => {
      live = false;
    };
  }, [cancer]);

  return (
    <div>
      <div className="viewIntro">
        <h2>{t('images.title')}</h2>
        <p>{t('images.intro', { cancer: locale === 'ar' ? label : lowerFirst(label) })}</p>
        {locale === 'ar' && <p className="small muted">{t('images.englishNote')}</p>}
      </div>

      {state.status === 'loading' && (
        <div aria-busy="true">
          <p className="loadingLine">
            <span className="spinner" aria-hidden="true" />
            {t('images.loading')}
          </p>
          <div className="imageGrid" style={{ marginTop: 16 }}>
            {[0, 1, 2].map(i => (
              <div key={i} className="skeleton" style={{ aspectRatio: '4 / 3' }} />
            ))}
          </div>
        </div>
      )}

      {state.status === 'error' && (
        <p className="notice noticeError">{localizeError(t, locale, state.error)}</p>
      )}

      {state.status === 'ok' && !state.images.length && (
        <div className="emptyState">
          <h3>{t('images.noneTitle')}</h3>
          <p>{t('images.none')}</p>
          <a
            className="btn btnSecondary"
            href={`https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(resolveCancer(cancer)?.label || cancer)}&title=Special:MediaSearch&type=image`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('images.searchCommons')}
            <Icon name="external" size={14} />
          </a>
        </div>
      )}

      {state.images.length > 0 && (
        <ul className="imageGrid">
          {state.images.map(img => (
            <li key={img.file} className="imageItem">
              <figure>
                <Thumb src={img.thumbnail} alt={img.description || img.title} />
                <figcaption lang="en" dir="ltr">
                  <strong>{img.title}</strong>
                  {img.description && <span>{img.description}</span>}
                  <div className="attribution">
                    {img.artist ? `${img.artist}, ` : ''}
                    {img.license ? (
                      img.licenseUrl ? (
                        <a href={img.licenseUrl} target="_blank" rel="noopener noreferrer license">
                          {img.license}
                        </a>
                      ) : (
                        img.license
                      )
                    ) : (
                      t('images.noLicence')
                    )}
                    {`, ${t('images.via')} `}
                    <a
                      href={img.page || img.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        track('scientific_image_source_click', { cancer_type: cancer })
                      }
                    >
                      Wikimedia Commons
                    </a>
                  </div>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
