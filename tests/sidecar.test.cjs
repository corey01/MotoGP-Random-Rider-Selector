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


const crew = [{ name: 'D.GIBSON' }, { name: 'S.STOKOE' }];
const row = { position: 3, riderExternalId: 'crew-9', riderName: 'D.GIBSON / S.STOKOE', riderNumber: 9,
  crew, category: 'CUP', classPosition: 1, machine: 'Source machine', points: null,
  pictures: { portrait: 'https://example.invalid/individual.jpg' }, bestLapTime: '1:42.123' };
const history = { position: 1, points: 210, crew, machine: 'Source machine',
  rider: { id: 'crew-9', fullName: row.riderName, number: 9, pictures: row.pictures }, team: null, constructor: null };
const warning = 'The official championship header differs from the meeting dates. Showing the published standings after Race 2.';
const payload = { ok: true, series: 'bsb', subSeries: 'bsb-sidecar', roundId: 82, year: 2026,
  results: { 'Race 1': [row], 'Race 2': [row] }, grids: { 'Race 1': [{ ...row, position: 1 }, { ...row, riderExternalId: 'other', position: 3 }] },
  sessions: [], standings: [history], gridPositionKind: 'slot', historicalWarnings: [warning], asOfSession: 'Race 2', asOfDate: '2026-10-18', documents: [] };

test('Sidecar is opt-in in Bikes/BSB and its exact overall crew favourite preserves other choices', () => {
  assert(registry.SERIES_GROUPS.find(group => group.key === 'bsb').children.some(child => child.key === 'bsb-sidecar'));
  assert.equal(registry.DEFAULT_SUB_SERIES_VISIBILITY['bsb-sidecar'], false);
  const existing = categories.preferencesForClassSelection(new Set(['bsb', 'bsb-bmw', 'moto2']), ['bsb', 'motogp'], ['unknown-class']);
  assert(existing.disabledSubSeries.includes('bsb-sidecar'));
  const optedIn = categories.preferencesForClassSelection(new Set(['bsb', 'bsb-bmw', 'moto2', 'bsb-sidecar']), existing.series, existing.disabledSubSeries);
  assert(!optedIn.disabledSubSeries.includes('bsb-sidecar'));
  assert(!optedIn.disabledSubSeries.includes('bsb-bmw'));
  assert(optedIn.disabledSubSeries.includes('unknown-class'));
  assert.equal(choices.championshipOptions.length, 30);
  assert.equal(choices.championshipForValue('bsb:bsb-sidecar').subSeries, 'bsb-sidecar');
  assert(!choices.followedChampionships(['bsb'], ['bsb-sidecar']).some(option => option.value === 'bsb:bsb-sidecar'));
  assert.equal(choices.resolveFavouriteChampionship('bsb:bsb-sidecar', [], []), 'bsb:bsb-sidecar');
});

test('exact-round Sidecar data preserves sparse slots, paired identity, warnings and unknown race awards', async () => {
  const data = await adapter.loadClassification(async () => ({ ok: true, json: async () => payload }), 82, 2026, 'bsb', 'bsb-sidecar', new AbortController().signal);
  assert.equal(data.gridPositionKind, 'slot');
  assert.deepEqual(Array.from(data.grids['Race 1'], entry => entry.position), [1, 3]);
  assert.equal(data.results['Race 1'][0].points, null);
  assert.equal(data.historicalWarnings[0], warning);
  assert.equal(data.warnings.length, 0);
  const sameNumber = { ...history, crew: [{ name: 'K.CLARKE' }, { name: 'R.COPPOCK' }], rider: { ...history.rider, id: 'other-crew-9', fullName: 'K.CLARKE / R.COPPOCK' } };
  const rows = adapter.standingsRows([history, sameNumber]);
  assert.equal(rows[0].crew[1].name, 'S.STOKOE');
  assert.equal(rows[1].crew[1].name, 'R.COPPOCK');
  assert.equal(rows[0].riderNumber, rows[1].riderNumber);
  assert.notEqual(rows[0].riderExternalId, rows[1].riderExternalId);
  for (const args of [[81, 2026, 'bsb', 'bsb-sidecar'], [82, 2025, 'bsb', 'bsb-sidecar'], [82, 2026, 'bsb', 'bsb-bmw']]) {
    await assert.rejects(adapter.loadClassification(async () => ({ ok: true, json: async () => payload }), ...args, new AbortController().signal), /does not match/);
  }
});

test('crew cards retain separate names and class position without individual photos or invented points/roles', () => {
  const { ClassificationList } = load('app/_components/Classification/ClassificationList.tsx');
  const html = renderToStaticMarkup(React.createElement(ClassificationList, { rows: [row], mode: 'grid', gridPositionKind: 'slot', label: 'Race 1 grid slots' }));
  assert.match(html, /Grid slot 3/);
  assert.match(html, /D.GIBSON/);
  assert.match(html, /S.STOKOE/);
  assert.match(html, /Crew/);
  assert.match(html, /CUP · Class position 1/);
  assert.match(html, /Time 1:42.123/);
  assert.doesNotMatch(html, /Qualifying|individual.jpg|<img| pts|Driver|Passenger/);
  const { StandingsTable } = load('app/standings/StandingsTable.tsx');
  const table = renderToStaticMarkup(React.createElement(StandingsTable, { entries: [history], competitorLabel: 'Crew' }));
  assert.match(table, />Crew<\/th>/);
  assert.match(table, /D.GIBSON/);
  assert.match(table, /S.STOKOE/);
  assert.doesNotMatch(table, /individual.jpg|<img/);
});

test('weekend view calls sparse grids Grid slots and limits the source-date warning to standings', () => {
  function render(tab) {
    const states = ['bsb-sidecar', tab, 'Race 1', 0, 'riders', { ...payload, errors: {} }, ''];
    const { WeekendClassification } = createLoader({ react: { ...React, useEffect() {}, useState: initial => [states.length ? states.shift() : typeof initial === 'function' ? initial() : initial, () => {}] } })('app/race/WeekendClassification.tsx');
    return renderToStaticMarkup(React.createElement(WeekendClassification, { roundId: 82, year: 2026, series: 'bsb' }));
  }
  const grid = render('grid');
  assert.match(grid, /Grid slots/);
  assert.match(grid, /Grid slot 3/);
  assert.match(grid, /cumulative totals, including other meetings/);
  assert.match(grid, /shared BSB meeting schedule/);
  assert.doesNotMatch(grid, /The official championship header differs/);
  assert.match(render('standings'), /The official championship header differs/);
});

test('current and home championship views show source warnings and exact Sidecar scope', async () => {
  const states = [{ historicalWarnings: [warning] }, [history], false];
  const { ClassStandings } = createLoader({ react: { ...React, useEffect() {}, useState: initial => [states.length ? states.shift() : initial, () => {}] } })('app/race/ClassStandings.tsx');
  const current = renderToStaticMarkup(React.createElement(ClassStandings, { year: 2026, series: 'bsb', subSeries: 'bsb-sidecar', standalone: true }));
  assert.match(current, /The official championship header differs/);
  assert.match(current, />Crew<\/th>/);
  const data = { ...payload, count: 1 };
  const { ChampionshipStandings } = createLoader({
    react: { ...React, useEffect() {}, useState: () => [data, () => {}] },
    'next/link': { __esModule: true, default: ({ children, href, ...props }) => React.createElement('a', { href, ...props }, children) },
    '@/utils/SubscriptionsContext': { useSubscriptions: () => ({ isLoaded: true, subscribedSeries: ['bsb'], disabledSubSeries: [] }) },
  })('app/_components/Dashboard/ChampionshipStandings.tsx');
  const home = renderToStaticMarkup(React.createElement(ChampionshipStandings, { championship: 'bsb:bsb-sidecar', year: 2026 }));
  assert.match(home, /The official championship header differs/);
  assert.match(home, /Overall crew standings/);
  let response = data;
  const { getStandings } = createLoader({ './auth': { fetchWithAuth: async () => ({ ok: true, json: async () => response }) } })('utils/getStandings.ts');
  assert.equal((await getStandings('bsb', 2026, 'bsb-sidecar')).ok, true);
  for (const mismatch of [{ year: 2025 }, { subSeries: 'bsb-bmw' }, { series: 'wsbk' }]) {
    response = { ...data, ...mismatch };
    assert.equal((await getStandings('bsb', 2026, 'bsb-sidecar')).ok, false);
  }
});
