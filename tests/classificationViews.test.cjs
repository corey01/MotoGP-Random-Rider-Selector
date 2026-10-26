const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
let state;
function load(file) {
  const full = path.resolve(root, file), module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(full, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  }}).outputText;
  const localRequire = name => {
    if (name.endsWith('.scss')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (name === 'react') return { ...React, useState: () => [state.shift(), () => {}], useEffect() {} };
    if (name.includes('ClassificationList')) return { ClassificationList: ({ rows, label }) => React.createElement('div', { 'aria-label': label }, rows.map(row => row.riderName).join(', ')) };
    if (name.startsWith('@/')) return load(name.slice(2) + '.ts');
    return require(name);
  };
  vm.runInNewContext(code, { module, exports: module.exports, require: localRequire, process, Date, Set, console }, { filename: full });
  return module.exports;
}
const { WeekendClassification } = load('app/race/WeekendClassification.tsx');
const { loadClassification } = load('utils/classification.ts');
const row = { position: 1, riderName: 'Verified rider', points: 25 };
const entry = { position: 1, points: 300, rider: { id: 'rider-1', fullName: 'Verified rider' } };
const base = { results: { 'Race 1': [row] }, grids: {}, standings: [], sessions: [], documents: [], errors: {} };
function render(data, tab = 'results', series = 'wsbk') {
  state = [series === 'rookiescup' ? 'rookiescup' : series === 'motoamerica' ? 'superbike' : 'worldsbk', tab, 'Race 1', 0, 'riders', data, ''];
  return renderToStaticMarkup(React.createElement(WeekendClassification, { roundId: 131, year: 2026, series }));
}
test('WorldSBK, Rookies and MotoAmerica expose only verified available classification views', () => {
  for (const series of ['wsbk', 'rookiescup', 'motoamerica']) {
    const html = render(base, 'results', series);
    assert.doesNotMatch(html, /aria-label="Timing view"/);
    assert.match(html, /Verified rider/);
    const extended = render({ ...base, grids: { 'Race 1': [row] }, standings: [entry] }, 'grid', series);
    assert.match(extended, /aria-pressed="true">Grid/);
    assert.match(extended, />Standings</);
  }
});
test('class without grid returns to results instead of leaving a hidden selected view', () => {
  const html = render(base, 'grid');
  assert.match(html, /Verified rider/);
  assert.doesNotMatch(html, /No grid/);
});
test('historical standings link matches their as-of session instead of selected results race', () => {
  const html = render({ ...base, standings: [entry], asOfSession: 'Race 2', documents: [
    { label: 'Championship standings', session: 'Race 1', url: 'https://official.example/race1.pdf' },
    { label: 'Championship standings', session: 'Race 2', url: 'https://official.example/race2.pdf' },
  ] }, 'standings');
  assert.match(html, /Standings after Race 2/);
  assert.match(html, /href="https:\/\/official.example\/race2.pdf"/);
  assert.doesNotMatch(html, /race1.pdf/);
});
test('WorldSBK adapter retains explicit grid, awarded points and exact-round history', async () => {
  const fetcher = async () => ({ ok: true, json: async () => ({ roundId: 131, year: 2026, series: 'wsbk', subSeries: 'worldsbk', ...base, grids: { 'Race 1': [row] }, standings: [entry], asOfSession: 'Race 1' }) });
  const data = await loadClassification(fetcher, 131, 2026, 'wsbk', 'worldsbk', new AbortController().signal);
  assert.equal(data.results['Race 1'][0].points, 25);
  assert.equal(data.grids['Race 1'][0].position, 1);
  assert.equal(data.standings[0].points, 300);
  await assert.rejects(loadClassification(fetcher, 130, 2026, 'wsbk', 'worldsbk', new AbortController().signal), /does not match/);
  await assert.rejects(loadClassification(fetcher, 131, 2025, 'wsbk', 'worldsbk', new AbortController().signal), /does not match/);
});

test('partial official document refresh remains visible while verified results stay usable', () => {
  const html = render({ ...base, warnings: ['Some official data could not be refreshed. Showing verified data where available.'] });
  assert.match(html, /Some official data could not be refreshed/);
  assert.match(html, /Verified rider/);
});
