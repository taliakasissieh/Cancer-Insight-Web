import test from 'node:test';
import assert from 'node:assert/strict';
import { supportedTreatmentTags } from '../lib/tags.js';

test('radiation tag dropped for a photodynamic-therapy paper', () => {
  const p = {
    title:
      'Bioinspired membrane-fusogenic nanomicelles for synergistic chemotherapy, photodynamic therapy, and gas therapy of breast cancer.',
    abstract: 'Nanomicelles released doxorubicin and generated reactive oxygen species under laser light.',
    treatmentTypes: ['Chemotherapy', 'Radiation therapy'],
  };
  assert.deepEqual(supportedTreatmentTags(p), ['chemotherapy']);
});

test('radiation tag kept when the text describes radiotherapy', () => {
  for (const text of [
    'Hypofractionated radiotherapy after breast-conserving surgery.',
    'Patients received 40 Gy in 15 fractions.',
    'Stereotactic body radiation therapy for oligometastases.',
    'Concurrent chemoradiation in locally advanced disease.',
    'Proton therapy versus photon IMRT.',
  ]) {
    assert.deepEqual(
      supportedTreatmentTags({ title: text, treatmentTypes: ['radiation therapy'] }),
      ['radiation therapy'],
      text
    );
  }
});

test('radiation tag kept when only MeSH supports it', () => {
  const p = {
    title: 'Outcomes after breast-conserving surgery.',
    mesh_terms: ['Breast Neoplasms', 'Radiotherapy, Adjuvant'],
    treatmentTypes: ['radiotherapy'],
  };
  assert.deepEqual(supportedTreatmentTags(p), ['radiotherapy']);
});

test('stem cell transplant tag needs a transplant, not cancer stem cells', () => {
  assert.deepEqual(
    supportedTreatmentTags({
      title: 'Targeting breast cancer stem cells with a novel inhibitor.',
      treatmentTypes: ['stem cell transplant', 'targeted therapy'],
    }),
    ['targeted therapy']
  );
  assert.deepEqual(
    supportedTreatmentTags({
      title: 'Allogeneic hematopoietic stem cell transplantation in AML.',
      treatmentTypes: ['stem_cell_transplant'],
    }),
    ['stem cell transplant']
  );
});

test('other tags pass through unchanged', () => {
  assert.deepEqual(
    supportedTreatmentTags({ title: 'A study.', treatmentTypes: ['Surgery', 'Immunotherapy'] }),
    ['surgery', 'immunotherapy']
  );
});
