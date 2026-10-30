const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
function createLoader(mocks = {}) {
  const cache = new Map();
  function load(file) {
    const full = path.resolve(root, file);
    if (cache.has(full)) return cache.get(full).exports;
    const module = { exports: {} }; cache.set(full, module);
    const code = ts.transpileModule(fs.readFileSync(full, 'utf8'), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    }}).outputText;
    const localRequire = name => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (/\.(scss|css)$/.test(name)) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
      if (name.startsWith('.') || name.startsWith('@/')) {
        let next = name.startsWith('@/') ? path.resolve(root, name.slice(2)) : path.resolve(path.dirname(full), name);
        if (!path.extname(next)) next += fs.existsSync(next + '.tsx') ? '.tsx' : '.ts';
        return load(next);
      }
      return require(name);
    };
    vm.runInNewContext(code, { module, exports: module.exports, require: localRequire,
      process, console, Date, Set, URLSearchParams, AbortController }, { filename: full });
    return module.exports;
  }
  return load;
}
const load = createLoader();
const registry = load('consts/series.ts');
const categories = load('utils/seriesCategories.ts');
const choices = load('utils/championships.ts');
const adapter = load('utils/classification.ts');

test('BMW is an optional BSB class under Bikes and explicit selection preserves prior choices', () => {
  assert(categories.seriesCategories.find(category => category.key === 'motorcycles').series.includes('bsb'));
  assert(registry.SERIES_GROUPS.find(group => group.key === 'bsb').children.some(child => child.key === 'bsb-bmw' && child.label === 'BMW F 900 R Cup'));
  assert.equal(registry.DEFAULT_SUB_SERIES_VISIBILITY['bsb-bmw'], false);
  const existing = categories.preferencesForClassSelection(new Set(['bsb', 'moto2']), ['bsb', 'motogp', 'unknown-series'], ['motogp', 'unknown-class']);
  assert(existing.disabledSubSeries.includes('bsb-bmw'));
  assert(existing.disabledSubSeries.includes('unknown-class'));
  assert(existing.series.includes('unknown-series'));
  const optedIn = categories.preferencesForClassSelection(new Set(['bsb', 'moto2', 'bsb-bmw']), existing.series, existing.disabledSubSeries);
  assert(!optedIn.disabledSubSeries.includes('bsb-bmw'));
  assert(optedIn.disabledSubSeries.includes('motogp'));
  assert(optedIn.disabledSubSeries.includes('bsb-superstock'));
});

test('BMW favourite is available only when followed and an unfollowed saved choice remains explicit', () => {
  assert.equal(choices.championshipOptions.length, 30);
  assert.equal(choices.championshipForValue('bsb:bsb-bmw').label, 'BMW F 900 R Cup');
  assert(choices.followedChampionships(['bsb'], []).some(option => option.value === 'bsb:bsb-bmw'));
  assert(!choices.followedChampionships(['bsb'], ['bsb-bmw']).some(option => option.value === 'bsb:bsb-bmw'));
  assert.equal(choices.resolveFavouriteChampionship('bsb:bsb-bmw', [], ['bsb-bmw']), 'bsb:bsb-bmw');
  assert.equal(choices.resolveFavouriteChampionship(undefined, ['bsb'], []), null);
});

test('explicit BMW phase scope takes precedence over numbered report labels and prevents cross-phase links', () => {
  for (const session of ['Heat 1', 'Heat 2', 'LCQ', 'Sprint', 'Main']) {
    const result = { label: 'Race 1 Result', session, url: `https://official.example/${session}.pdf` };
    const grid = { ...result, label: 'Race 1 Grid' };
    assert.equal(adapter.documentForView(result, 'results', session), true);
    assert.equal(adapter.documentForView(grid, 'grid', session), true);
    assert.equal(adapter.documentForView(grid, 'results', session), false);
    assert.equal(adapter.documentForView(result, 'grid', session), false);
    for (const other of ['Heat 1', 'Heat 2', 'LCQ', 'Sprint', 'Main'].filter(value => value !== session)) {
      assert.equal(adapter.documentForView(result, 'results', other), false);
      assert.equal(adapter.documentForView(grid, 'grid', other), false);
    }
  }
  const championship = { label: 'Championship standings - CORRECTED', session: 'Main', url: 'https://official.example/points.pdf' };
  assert.equal(adapter.documentForView(championship, 'standings', 'Main'), true);
  assert.equal(adapter.documentForView(championship, 'standings', 'Sprint'), false);
  assert.equal(adapter.documentForView(championship, 'results', 'Main'), false);
  assert.equal(adapter.documentForView({ label: 'Sprint-result' }, 'results', 'Race'), false);
  assert.equal(adapter.documentForView({ label: 'Sprint-championship' }, 'standings', 'Race'), false);
  assert.equal(adapter.documentForView({ label: 'Sprint-championship' }, 'standings', 'Sprint'), true);
});

test('BMW exact-round adapter retains named phases, unknown printed rank, fractions and partial errors', async () => {
  const unknownRank = { position: null, riderName: 'Source rider', points: null };
  const payload = { ok: true, series: 'bsb', subSeries: 'bsb-bmw', year: 2026, roundId: 200,
    results: { LCQ: [unknownRank], Main: [unknownRank], 'Heat 1': [unknownRank], 'Heat 2': [unknownRank], Sprint: [unknownRank] }, grids: { Main: [{ ...unknownRank, position: 1 }], 'Heat 1': [unknownRank] },
    standings: [{ position: 1, points: 216.5, rider: { id: 'source-rider', fullName: 'Source rider' } }],
    asOfSession: 'Main', asOfDate: '2026-10-18', coverageErrors: ['Official grid unavailable'], historicalError: 'Official championship unavailable', stale: true };
  let request;
  const fetcher = async (url, options) => { request = { url, options }; return { ok: true, json: async () => payload }; };
  const signal = new AbortController().signal;
  const data = await adapter.loadClassification(fetcher, 200, 2026, 'bsb', 'bsb-bmw', signal);
  assert.equal(request.url, '/classifications?roundId=200&subSeries=bsb-bmw');
  assert.equal(request.options.signal, signal);
  assert.deepEqual(Array.from(Object.keys(data.results)), ['Heat 1', 'Heat 2', 'LCQ', 'Sprint', 'Main']);
  assert.deepEqual(Array.from(Object.keys(data.grids)), ['Heat 1', 'Main']);
  assert.equal(data.results.Main[0].position, null);
  assert.equal(data.results.Main[0].points, null);
  assert.equal(data.standings[0].points, 216.5);
  assert.equal(data.asOfSession, 'Main');
  assert(data.warnings.length);
  assert.match(data.errors.standings, /could not be refreshed/);
  assert.equal(data.stale, true);
  for (const args of [[201, 2026, 'bsb', 'bsb-bmw'], [200, 2025, 'bsb', 'bsb-bmw'], [200, 2026, 'bsb', 'bsb'], [200, 2026, 'wsbk', 'bsb-bmw']]) {
    await assert.rejects(adapter.loadClassification(fetcher, ...args, signal), /does not match/);
  }
});

test('published blank ranks and fractional totals render without inventing a position or race score', () => {
  const { ClassificationList } = load('app/_components/Classification/ClassificationList.tsx');
  const html = renderToStaticMarkup(React.createElement(ClassificationList, {
    rows: [{ position: null, riderName: 'Unranked source rider', points: null }], mode: 'results', label: 'Main classification',
  }));
  assert.match(html, />—<\/span>/);
  assert.match(html, /Unranked source rider/);
  assert.doesNotMatch(html, / pts/);
  assert.doesNotMatch(html, />8<\/span>/);
  const standings = renderToStaticMarkup(React.createElement(ClassificationList, {
    rows: adapter.standingsRows([{ position: 1, points: 216.5, rider: { id: 'source-rider', fullName: 'Source rider' } }]), mode: 'standings', label: 'Championship standings',
  }));
  assert.match(standings, /216\.5 pts/);
});

test('BMW home standings request keeps the selected championship and season', async () => {
  let request;
  const { getStandings } = createLoader({ './auth': { fetchWithAuth: async url => {
    request = url;
    return { ok: true, json: async () => ({ ok: true, series: 'bsb', year: 2026, subSeries: 'bsb-bmw', standings: [] }) };
  }}})('utils/getStandings.ts');
  assert.equal((await getStandings('bsb', 2026, 'bsb-bmw')).ok, true);
  const params = new URL(request, 'https://racecal.example').searchParams;
  assert.equal(params.get('series'), 'bsb');
  assert.equal(params.get('subSeries'), 'bsb-bmw');
  assert.equal(params.get('year'), '2026');
});
