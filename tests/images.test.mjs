import { test } from 'node:test';
import assert from 'node:assert/strict';
import { imageMatchContext, scoreImage } from '../lib/images.js';
import { aliasesFor, resolveCancer } from '../lib/queries.js';

function contextFor(input) {
  const r = resolveCancer(input);
  return imageMatchContext([...r.phrases, ...r.mesh.map(m => m.toLowerCase())], aliasesFor(r.id));
}

const pancreatic = contextFor('pancreatic');
const breast = contextFor('breast');

/* The source article cited in a Commons "credit" field often names a cancer the picture
   does not show. These are the files reported on the live site in October 2026. */
const CITED_PANCREATIC = 'Case report of a patient with pancreatic cancer. Surgical Case Reports.';

test('a hernia CT is not shown just because its source article mentions pancreatic cancer', () => {
  const item = {
    title: 'Abdominal-computed-tomography-showing-right-inguinal-hernia-with-an-extended-sac.jpg',
    description:
      'abdominal computed tomography of a 67-year-old man showing right inguinal hernia with an extended sac (arrow).',
    credit: CITED_PANCREATIC,
    license: 'CC BY 4.0',
  };
  assert.equal(scoreImage(item, pancreatic), null);
});

test('a head-and-neck cancer PET is not shown for pancreatic cancer', () => {
  const item = {
    title: 'Ga-68-Trivehexin Head-and-Neck Cancer with Brain Metastasis EJNMMI 2024.png',
    description:
      'The grayscale image shows a Ga-68-Trivehexin PET. The black spots are the brain metastasis and the recurrent tonsil carcinoma. The tracer was first evaluated in pancreatic ductal adenocarcinoma.',
    credit: 'EJNMMI Research',
    license: 'CC BY 4.0',
  };
  assert.equal(scoreImage(item, pancreatic), null);
});

test('pancreatic tuberculosis is not shown as pancreatic cancer', () => {
  const item = {
    title: 'Pancreas+spleen-tuberculosis.jpg',
    description:
      'Figure 1. CT scans of the pancreas. CT scan of pancreas demonstrating a mass in the pancreatic tail and metastasizes in the spleen.',
    credit: 'Isolated pancreatic tuberculosis mimicking pancreatic cancer',
    license: 'CC BY 2.0',
  };
  assert.equal(scoreImage(item, pancreatic), null);
});

test('a title built around a mimic is rejected even when it names the cancer', () => {
  const item = {
    title: 'Pancreatic tuberculosis mimicking pancreatic cancer CT.jpg',
    description: 'Computed tomography of a pancreatic head mass.',
    license: 'CC BY 4.0',
  };
  assert.equal(scoreImage(item, pancreatic), null);
});

test('a catheter image is not shown just because the patient had the cancer', () => {
  const item = {
    title: 'CT of port-a-cath in azygos vein.jpg',
    description:
      'CT scan in the median plane of a 66 year old man who received a port for chemotherapy for a pancreatic cancer. It shows that the tip of the port is placed in the azygos vein.',
    license: 'CC0',
  };
  assert.equal(scoreImage(item, pancreatic), null);
});

test('real pancreatic cancer images are kept', () => {
  const kept = [
    {
      title: 'Histopathology of pancreatic adenocarcinoma with treatment effect.jpg',
      description:
        'Histopathology of pancreatic adenocarcinoma with treatment effect after chemotherapy.',
      license: 'CC0',
    },
    {
      title: 'Ultrasonography of pancreatic cancer.jpg',
      description:
        'An 86 year old man with known pancreatic cancer, abdominal ultrasonography with Doppler.',
      license: 'CC0',
    },
    {
      title: 'Ga-68-Trivehexin PDAC Liver Metastases EJNMMI 2022.png',
      description:
        'Ga-68-Trivehexin PET of a female patient with pancreatic ductal adenocarcinoma (PDAC, denoted Primary) and liver metastases.',
      license: 'CC BY 4.0',
    },
    {
      title: 'Pankreas-Ca im CT - Coeliacusblockade 001.jpg',
      description:
        'Celiac Plexus Blockade in computertomography in a patient suffering from back-pain caused by pancreatic cancer.',
      license: 'CC BY-SA 3.0',
    },
  ];
  for (const item of kept) assert.ok(scoreImage(item, pancreatic), item.title);
});

test('images naming the cancer in the title rank above description-only matches', () => {
  const titled = scoreImage(
    {
      title: 'Ultrasonography of pancreatic cancer.jpg',
      description: 'Abdominal ultrasonography.',
      license: 'CC0',
    },
    pancreatic
  );
  const described = scoreImage(
    {
      title: 'Pankreas-Ca im CT.jpg',
      description: 'Computed tomography of pancreatic cancer.',
      license: 'CC0',
    },
    pancreatic
  );
  assert.ok(titled > described);
});

test('organ names and abbreviations come from the catalogue aliases', () => {
  assert.ok(pancreatic.organ.test('ct of the pancreas'));
  assert.ok(pancreatic.disease.test('pdac liver metastases'));
  assert.ok(!pancreatic.disease.test('pancreas'));
  assert.ok(breast.disease.test('breast-cancer mammography'));
});

test('awareness material stays blocked even when the credit is the only place it appears', () => {
  const item = {
    title: 'Breast cancer mammography.jpg',
    description: 'Mammography of a breast cancer.',
    credit: 'Breast cancer awareness campaign',
    license: 'CC BY 4.0',
  };
  assert.equal(scoreImage(item, breast), null);
});
