import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dictionaryKeys, localePath, makeT, stripLocale, translate } from '../lib/i18n/index.js';
import { CANCERS } from '../lib/queries.js';

test('English and Arabic dictionaries define the same keys', () => {
  const en = new Set(dictionaryKeys('en'));
  const ar = new Set(dictionaryKeys('ar'));
  const missingInAr = [...en].filter(k => !ar.has(k));
  const missingInEn = [...ar].filter(k => !en.has(k));
  assert.deepEqual(missingInAr, [], `missing in Arabic: ${missingInAr.join(', ')}`);
  assert.deepEqual(missingInEn, [], `missing in English: ${missingInEn.join(', ')}`);
});

test('every catalogue cancer has a name in both languages, and English names match the catalogue', () => {
  const en = makeT('en');
  const ar = makeT('ar');
  for (const [id, c] of Object.entries(CANCERS)) {
    assert.equal(en(`cancers.${id}`), c.label, id);
    assert.ok(/[؀-ۿ]/.test(ar(`cancers.${id}`)), `${id} has no Arabic name`);
    assert.ok(ar(`cancersShort.${id}`) !== `cancersShort.${id}`, `${id} has no short Arabic name`);
  }
});

test('templates fill numbers in the language of the page', () => {
  assert.equal(translate('en', 'common.of', { a: 1234, b: 5678 }), '1,234 of 5,678');
  assert.equal(translate('ar', 'common.of', { a: 1234, b: 5678 }), '1,234 من 5,678');
  assert.equal(translate('ar', 'no.such.key'), 'no.such.key');
});

test('Arabic paths live under /ar', () => {
  assert.equal(localePath('ar', '/'), '/ar');
  assert.equal(localePath('ar', '/explore?cancer=breast'), '/ar/explore?cancer=breast');
  assert.equal(localePath('en', '/explore'), '/explore');
  assert.equal(stripLocale('/ar/explore'), '/explore');
  assert.equal(stripLocale('/ar'), '/');
  assert.equal(stripLocale('/arabic-page'), '/arabic-page');
});
