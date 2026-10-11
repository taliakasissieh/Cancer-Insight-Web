'use client';

import { useEffect, useState } from 'react';

function Thumb({ src, alt }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        className="frame"
        style={{ display: 'grid', placeItems: 'center', color: '#b8cfdb', fontSize: '0.9rem' }}
      >
        Preview unavailable — open the source page
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

export default function Images({ cancer, label }) {
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
        <h2>Scientific images</h2>
        <p>
          Openly licensed images of {lowerFirst(label)} from Wikimedia Commons, prioritising
          histopathology, microscopy and medical imaging. They are educational illustrations, not
          diagnostic references. Check each image’s licence on its source page before reuse.
        </p>
      </div>

      {state.status === 'loading' && (
        <div aria-busy="true">
          <p className="loadingLine">
            <span className="spinner" aria-hidden="true" />
            Searching Wikimedia Commons…
          </p>
          <div className="imageGrid" style={{ marginTop: 16 }}>
            {[0, 1, 2].map(i => (
              <div key={i} className="skeleton" style={{ aspectRatio: '4 / 3' }} />
            ))}
          </div>
        </div>
      )}

      {state.status === 'error' && <p className="notice noticeError">{state.error}</p>}

      {state.status === 'ok' && !state.images.length && (
        <div className="emptyState">
          <h3>No suitable images found</h3>
          <p>
            Wikimedia Commons has no openly licensed images that pass Cancer Insight’s relevance
            filters for this search.
          </p>
          <a
            className="btn btnSecondary"
            href={`https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(label)}&title=Special:MediaSearch&type=image`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Search Wikimedia Commons
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
                <figcaption>
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
                      'licence not stated'
                    )}
                    {', via '}
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
