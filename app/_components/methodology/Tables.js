/*
  Methodology tables, generated from the code that runs the site so the documentation cannot
  drift from the queries. Used by the English and Arabic methodology pages; query strings stay
  in English (they are what PubMed and ClinicalTrials.gov receive).
*/

import { makeT } from '../../../lib/i18n/index.js';
import {
  ATLAS_DESIGN_IDS,
  ATLAS_THRESHOLDS,
  CANCERS,
  DESIGN_BY_ID,
  DESIGNS,
  FREE_FULL_TEXT,
  THEMES,
  TREATMENTS,
} from '../../../lib/queries';
import { BURDEN_EXCLUDED, BURDEN_MAP } from '../../../lib/burden';
import { STATUS_GROUPS, conditionFor } from '../../../lib/trials';

/* [evidence id, PubMed publication types, family id] — order is the classifier's precedence. */
const EVIDENCE_ROWS = [
  ['meta-analysis', 'Meta-Analysis', 'synthesis'],
  ['systematic-review', 'Systematic Review', 'synthesis'],
  ['rct', 'Randomized Controlled Trial (with phase when indexed)', 'primary'],
  [
    'trial',
    'Clinical Trial; Phase I–IV; Controlled, Pragmatic, Equivalence or Adaptive Clinical Trial',
    'primary',
  ],
  ['guideline', 'Guideline; Practice Guideline; Consensus Development Conference', 'guidance'],
  ['review', 'Review; Scoping Review', 'synthesis'],
  ['observational', 'Observational Study', 'primary'],
  ['case-report', 'Case Reports', 'primary'],
  ['protocol', 'Clinical Trial Protocol', 'other'],
  ['commentary', 'Editorial; Comment; Letter; News', 'commentary'],
  ['article', 'Journal Article only', 'unclassified'],
];

function Table({ head, children }) {
  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>
            {head.map(h => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Code({ children }) {
  return (
    <code dir="ltr" className="ltrData">
      {children}
    </code>
  );
}

function cancerLabel(t, id) {
  const key = `cancers.${id}`;
  const v = t(key);
  return v === key ? CANCERS[id]?.label || id : v;
}

export function EvidenceTable({ locale = 'en' }) {
  const t = makeT(locale);
  return (
    <Table head={[t('doc.tableLabel'), t('doc.tablePubmedTypes'), t('doc.tableFamily')]}>
      {EVIDENCE_ROWS.map(([id, types, family]) => (
        <tr key={id}>
          <td>{t(`evidence.types.${id}`)}</td>
          <td>
            <span dir="ltr" className="ltrData">
              {types}
            </span>
          </td>
          <td>{t(`evidence.families.${family}`)}</td>
        </tr>
      ))}
    </Table>
  );
}

export function FootprintTable({ locale = 'en' }) {
  const t = makeT(locale);
  return (
    <Table head={[t('doc.tableMeasure'), t('doc.tableAdded')]}>
      {DESIGNS.map(d => (
        <tr key={d.id}>
          <td>{t(`measures.label.${d.id}`)}</td>
          <td>
            <Code>AND {d.term}</Code>
          </td>
        </tr>
      ))}
      <tr>
        <td>{t('measures.label.free-full-text')}</td>
        <td>
          <Code>AND {FREE_FULL_TEXT.term}</Code>
        </td>
      </tr>
      <tr>
        <td>{t('doc.yearExample')}</td>
        <td>
          <Code>AND (&quot;2024&quot;[dp] : &quot;2024&quot;[dp])</Code>
        </td>
      </tr>
    </Table>
  );
}

export function TreatmentTable({ locale = 'en' }) {
  const t = makeT(locale);
  return (
    <Table head={[t('doc.tableCategory'), t('doc.tableTerms')]}>
      {Object.entries(TREATMENTS).map(([id, tr]) => {
        const key = `treatments.${id}`;
        const label = t(key) === key ? tr.label : t(key);
        return (
          <tr key={id}>
            <td>{label}</td>
            <td>
              <Code>{tr.term}</Code>
            </td>
          </tr>
        );
      })}
    </Table>
  );
}

export function AtlasMeasuresTable({ locale = 'en' }) {
  const t = makeT(locale);
  return (
    <Table head={[t('doc.tableMeasure'), t('doc.tableTerms')]}>
      {ATLAS_DESIGN_IDS.map(id => (
        <tr key={id}>
          <td>{t(`measures.label.${id}`)}</td>
          <td>
            <Code>{DESIGN_BY_ID[id].term}</Code>
          </td>
        </tr>
      ))}
      {THEMES.map(th => (
        <tr key={th.id}>
          <td>
            {t(`measures.label.${th.id}`)}
            {th.kind === 'population' ? t('doc.titleAbstractOnly') : ''}
          </td>
          <td>
            <Code>{th.term}</Code>
          </td>
        </tr>
      ))}
      <tr>
        <td>{t('measures.label.free-full-text')}</td>
        <td>
          <Code>{FREE_FULL_TEXT.term}</Code>
        </td>
      </tr>
      <tr>
        <td>{t('doc.lastThreeYears')}</td>
        <td>
          <Code>(&quot;YYYY−2&quot;[dp] : &quot;YYYY&quot;[dp])</Code>
        </td>
      </tr>
    </Table>
  );
}

export function AtlasRulesTable({ locale = 'en', rows }) {
  const t = makeT(locale);
  return (
    <Table head={[t('doc.tableReading'), t('doc.tableRule')]}>
      {rows.map(([reading, rule]) => (
        <tr key={reading}>
          <td>{reading}</td>
          <td>{rule}</td>
        </tr>
      ))}
    </Table>
  );
}

export const THRESHOLDS = ATLAS_THRESHOLDS;

export function TrialStatusTable({ locale = 'en' }) {
  const t = makeT(locale);
  const groups = {};
  for (const [status, group] of Object.entries(STATUS_GROUPS)) {
    (groups[group] ||= []).push(status);
  }
  return (
    <Table head={[t('doc.tableMeasure'), t('doc.tableDefinition')]}>
      {Object.entries(groups).map(([group, statuses]) => (
        <tr key={group}>
          <td>{t(`trials.groups.${group}`)}</td>
          <td>{statuses.map(s => t(`trials.status.${s}`)).join(locale === 'ar' ? '، ' : '; ')}</td>
        </tr>
      ))}
    </Table>
  );
}

export function TrialConditionsTable({ locale = 'en' }) {
  const t = makeT(locale);
  const rows = Object.entries(CANCERS)
    .map(([id, c]) => [id, conditionFor({ id, label: c.label })])
    .filter(([id, cond]) => cond !== CANCERS[id].label);
  return (
    <Table head={[t('doc.tableCancer'), t('doc.tableCondition')]}>
      {rows.map(([id, cond]) => (
        <tr key={id}>
          <td>{cancerLabel(t, id)}</td>
          <td>
            <Code>{cond}</Code>
          </td>
        </tr>
      ))}
    </Table>
  );
}

export function BurdenMapTable({ locale = 'en' }) {
  const t = makeT(locale);
  return (
    <Table head={[t('doc.tableCancer'), t('doc.tableSites')]}>
      {Object.entries(BURDEN_MAP).map(([id, sites]) => (
        <tr key={id}>
          <td>{cancerLabel(t, id)}</td>
          <td>
            <span dir="ltr" className="ltrData">
              {sites.join(' + ')}
            </span>
          </td>
        </tr>
      ))}
    </Table>
  );
}

export function BurdenExcludedTable({ locale = 'en' }) {
  const t = makeT(locale);
  return (
    <Table head={[t('doc.tableCancer'), t('doc.tableReason')]}>
      {Object.entries(BURDEN_EXCLUDED).map(([id, reason]) => (
        <tr key={id}>
          <td>{cancerLabel(t, id)}</td>
          <td>{t(`burden.excludedReason.${reason}`)}</td>
        </tr>
      ))}
    </Table>
  );
}
