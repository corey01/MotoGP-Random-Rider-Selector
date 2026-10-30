const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
function createLoader(globals = {}, mocks = {}) {
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
      process, console, Date, Set, URLSearchParams, ...globals }, { filename: full });
    return module.exports;
  }
  return load;
}
const load = createLoader();
const registry = load('consts/series.ts');
const { seriesCategories, preferencesForClassSelection } = load('utils/seriesCategories.ts');
const { championshipOptions } = load('utils/championships.ts');

test('WEC can be explicitly followed under Cars without changing existing or guest choices', () => {
  assert(seriesCategories.find(category => category.key === 'cars').series.includes('wec'));
  assert(!registry.DEFAULT_SERIES_KEYS.includes('wec'));
  assert.equal(registry.DEFAULT_SUB_SERIES_VISIBILITY.wec, false);
  assert.equal(registry.SERIES_CARD_META.wec.subtitle, 'Endurance · Race results & grids');
  const existing = preferencesForClassSelection(new Set(['moto2', 'f1']), ['motogp', 'f1'], ['motogp']);
  assert(!existing.series.includes('wec'));
  assert(existing.disabledSubSeries.includes('wec'));
  const optedIn = preferencesForClassSelection(new Set(['moto2', 'f1', 'wec']));
  assert(optedIn.series.includes('wec'));
  assert(!optedIn.disabledSubSeries.includes('wec'));
  assert(!championshipOptions.some(option => option.series === 'wec'));
});

test('WEC round and session reads keep API IDs, exact year filters, official links and unknown timing', async () => {
  const calls = [];
  const session = { id: '9801', series: 'wec', subSeries: 'wec', type: 'RACE', sessionName: 'Race', start: '2026-06-13', end: null, status: 'UPCOMING', timezone: 'UTC', metadata: { timing: {timeKnown: false} } };
  const round = { id: 700, name: '24 Hours of Le Mans', series: 'wec', subSeries: 'wec', startDate: '2026-06-10', endDate: '2026-06-14', sourceUrl: 'https://www.fiawec.com/en/race/24-hours-of-le-mans-2026', events: [session] };
  const api = createLoader({ fetch: async url => {
    calls.push(String(url));
    return { ok: true, json: async () => ({ ok: true, year: 2026, month: 6, effectiveFilters: { series: ['wec'], subSeries: ['wec'] }, rounds: [round], round }) };
  }})('utils/getCalendarData.ts');
  const month = await api.fetchCalendarMonth({ year: 2026, month: 6, series: ['wec'], subSeries: ['wec'] });
  const query = new URL(calls[0]).searchParams;
  assert.equal(query.get('year'), '2026');
  assert.equal(query.get('series'), 'wec');
  assert.equal(query.get('subSeries'), 'wec');
  assert.equal(month.rounds[0].id, 700);
  const stored = (await api.fetchRoundById(700)).round;
  assert.match(calls[1], /\/rounds\/700$/);
  const mapped = api.toFullCalendarSessionEvent(stored.events[0], stored);
  assert.equal(mapped.className, 'wec-event');
  assert.equal(mapped.title, 'FIA WEC - Race');
  assert.equal(mapped.extendedProps.sessionId, '9801');
  assert.equal(mapped.extendedProps.meta.roundId, 700);
  assert.equal(mapped.extendedProps.meta.sourceUrl, round.sourceUrl);
  assert.equal(mapped.extendedProps.timeKnown, false);
  assert.equal(mapped.end, undefined);
});

test('WEC endurance sessions retain published cross-day end times and test session type', () => {
  const api = load('utils/getCalendarData.ts');
  const round = { id: 701, name: '24 Hours of Le Mans', series: 'wec', subSeries: 'wec', startDate: '2026-06-10', endDate: '2026-06-14', sourceUrl: 'https://www.fiawec.com/en/race/24-hours-of-le-mans-2026' };
  const session = { id: '9802', series: 'wec', subSeries: 'wec', type: 'RACE', sessionName: 'Race', start: '2026-06-13T14:00:00Z', end: '2026-06-14T14:00:00Z' };
  assert.equal(api.toFullCalendarSessionEvent(session, round).end, session.end);
  const prologue = api.toFullCalendarSessionEvent({ ...session, type: 'TEST', sessionName: 'Morning Test' }, round);
  assert.equal(prologue.extendedProps.type, 'TEST');
  assert.equal(prologue.extendedProps.sessionId, session.id);
});

test('WEC polling status has a readable championship label and retains source failures', () => {
  const PollingSchedule = load('app/admin/PollingSchedule.tsx').default;
  const html = renderToStaticMarkup(React.createElement(PollingSchedule, {
    loading: false, error: '', onRefresh() {}, data: { ok: true, checkedAt: '2026-10-28T10:00:00Z', jobs: [{
      jobName: 'scrape:wec', series: 'wec', year: 2026, calendar: true, mode: 'quiet', intervalMs: 21600000,
      calendarAvailable: true, lastAttemptAt: null, lastSuccessAt: null, lastStatus: 'error', lastError: 'Official calendar unavailable', nextCheckAt: null,
    }] },
  }));
  assert.match(html, /FIA WEC · 2026/);
  assert.match(html, /Official calendar unavailable/);
  assert.match(html, /Last attempt failed/);
});

const crew3 = [{ name: 'First published driver' }, { name: 'Second published driver' }, { name: 'Third published driver' }];
const crew4 = [...crew3, { name: 'Fourth published driver' }];
const car = { position: 8, riderExternalId: 'wec:2026:event:007', riderName: crew3.map(member => member.name).join(' / '),
  riderNumber: 7, entryNumber: '007', crew: crew3, crewLabel: 'Crew', teamName: 'Published team', machine: 'Published car',
  category: 'HYPERCAR', classPosition: null, points: null, totalLaps: 200, bestLapTime: '1:50.123',
  pictures: { portrait: 'https://example.invalid/individual.jpg' }, status: 'CLASSIFIED' };
const gridCar = { ...car, position: 12, crew: [{ name: 'Printed grid driver' }], crewLabel: 'Listed driver', category: null, machine: null, totalLaps: null, bestLapTime: null };
const raceReport = { label: 'Published race report', kind: 'results', session: 'Race', url: 'https://official.example/race.pdf' };
const gridReport = { label: 'Published final report', kind: 'grid', session: 'Race', url: 'https://official.example/grid.pdf' };
const wecPayload = { ok: true, series: 'wec', subSeries: 'wec', year: 2026, roundId: 98101,
  results: { Race: [car, { ...car, riderExternalId: 'wec:2026:event:7', entryNumber: '7', category: 'LMGT3', crew: crew4 }] },
  grids: { Race: [gridCar] }, standings: [], documents: [raceReport, gridReport], asOfDate: '2026-06-14', asOfSession: 'Race' };

test('WEC classifications request one exact round, preserve car numbers and every published crew member without championship reads', async () => {
  const adapter = load('utils/classification.ts'), calls = [];
  const data = await adapter.loadClassification(async request => { calls.push(request); return Response.json(wecPayload); }, 98101, 2026, 'wec', 'wec', new AbortController().signal);
  assert.deepEqual(calls, ['/classifications?roundId=98101&subSeries=wec']);
  assert.equal(data.results.Race[0].entryNumber, '007');
  assert.equal(data.results.Race[1].entryNumber, '7');
  assert.notEqual(data.results.Race[0].riderExternalId, data.results.Race[1].riderExternalId);
  assert.equal(data.results.Race[0].crew.length, 3);
  assert.equal(data.results.Race[1].crew.length, 4);
  assert.equal(data.grids.Race[0].crew.length, 1);
  assert.equal(data.grids.Race[0].crewLabel, 'Listed driver');
  assert.equal(data.results.Race[0].points, null);
  assert.equal(data.results.Race[0].classPosition, null);
  for (const changed of [{ roundId: 98102 }, { year: 2025 }, { series: 'f1' }, { subSeries: 'hypercar' }]) {
    await assert.rejects(adapter.loadClassification(async () => Response.json({ ...wecPayload, ...changed }), 98101, 2026, 'wec', 'wec', new AbortController().signal), /does not match/);
  }
  const partial = await adapter.loadClassification(async () => Response.json({ ...wecPayload, results: {}, stale: true, coverageErrors: ['Race source could not be refreshed'], standings: [{ invented: true }] }), 98101, 2026, 'wec', 'wec', new AbortController().signal);
  assert.equal(partial.grids.Race[0].entryNumber, '007');
  assert.equal(partial.standings.length, 0);
  assert.equal(partial.stale, true);
  assert.match(partial.warnings[0], /could not be refreshed/);
  const warning = 'The official final race classification remains subject to the published parts checks.';
  const withNotice = await adapter.loadClassification(async () => Response.json({ ...wecPayload, sourceWarnings: [warning] }), 98101, 2026, 'wec', 'wec', new AbortController().signal);
  assert.deepEqual(JSON.parse(JSON.stringify(withNotice.warnings)), [warning]);
  assert.equal(Boolean(withNotice.stale), false);
  assert.equal(withNotice.documents.some(document => document.provisional), false);
});

test('WEC report links follow explicit source kind and session rather than filename or label inference', () => {
  const adapter = load('utils/classification.ts');
  assert.equal(adapter.documentForView(gridReport, 'grid', 'Race'), true);
  assert.equal(adapter.documentForView(gridReport, 'results', 'Race'), false);
  assert.equal(adapter.documentForView(raceReport, 'results', 'Race'), true);
  assert.equal(adapter.documentForView({ ...gridReport, session: 'Qualifying' }, 'grid', 'Race'), false);
  assert.equal(adapter.documentForView(gridReport, 'standings', 'Race'), false);
});

test('car cards show original zero-prefixed number, all crew names and a source-specific grid driver without inventing portraits or class ranks', () => {
  const { ClassificationList } = load('app/_components/Classification/ClassificationList.tsx');
  for (const crew of [crew3, crew4]) {
    const html = renderToStaticMarkup(React.createElement(ClassificationList, { rows: [{ ...car, crew }], mode: 'results', label: 'Race classification' }));
    for (const member of crew) assert(html.includes(member.name));
    assert.match(html, new RegExp(crew.length + '×'));
    assert.match(html, /#007/);
    assert.match(html, /HYPERCAR/);
    assert.doesNotMatch(html, /individual.jpg|<img|Class position| pts|Driver 1|Passenger/);
  }
  const grid = renderToStaticMarkup(React.createElement(ClassificationList, { rows: [gridCar], mode: 'grid', label: 'Race starting grid' }));
  assert.match(grid, /Listed driver/);
  assert.match(grid, /Printed grid driver/);
  assert.match(grid, /1×/);
  assert.doesNotMatch(grid, /First published driver|HYPERCAR|Published car|Qualifying|Class position/);
});

function renderWecWeekend({ tab = 'results', data = { ...wecPayload, sessions: [], errors: {} }, events = [], error = '', captureEffects = false } = {}) {
  const states = ['wec', tab, 'Race', 0, 'riders', data, error], effects = [];
  const component = createLoader({ AbortController }, { react: { ...React,
    useState: initial => [states.length ? states.shift() : typeof initial === 'function' ? initial() : initial, () => {}],
    useEffect: effect => { if (captureEffects) effects.push(effect); },
  } })('app/race/WeekendClassification.tsx');
  const html = renderToStaticMarkup(React.createElement(component.WeekendClassification, { roundId: 98101, year: 2026, series: 'wec', events }));
  return { html, effects };
}

test('WEC weekend views contain only Results and Grid, retain partial/stale states and scope each source link', () => {
  const results = renderWecWeekend().html, grid = renderWecWeekend({ tab: 'grid' }).html;
  assert.match(results, /Results, grid/);
  assert.match(results, /Published race report/);
  assert.doesNotMatch(results, /href="https:\/\/official.example\/grid.pdf"|>Standings<\/button>/);
  assert.match(grid, /Listed driver/);
  assert.match(grid, /href="https:\/\/official.example\/grid.pdf"/);
  assert.doesNotMatch(grid, /href="https:\/\/official.example\/race.pdf"|>Standings<\/button>/);
  assert.match(renderWecWeekend({ tab: 'standings' }).html, /Published race report/);
  const provisionalGrid = { ...wecPayload, sessions: [], errors: {}, provisional: true, documents: [{ ...gridReport, provisional: true }, { ...raceReport, provisional: false }] };
  assert.match(renderWecWeekend({ tab: 'grid', data: provisionalGrid }).html, /Provisional ·/);
  assert.doesNotMatch(renderWecWeekend({ tab: 'results', data: provisionalGrid }).html, /Provisional ·/);
  const delayed = renderWecWeekend({ data: { ...wecPayload, sessions: [], results: {}, warnings: ['Some official data could not be refreshed.'], stale: true, errors: {} } }).html;
  assert.match(delayed, /could not be refreshed/);
  assert.match(delayed, /Refresh delayed/);
  assert.match(delayed, /No results are available for this session/);
  assert.match(renderWecWeekend({ data: null, error: 'No published race report is available' }).html, /No published race report is available/);
});

test('WEC Prologue TEST-only pages skip classification loading and make their limited scope explicit', () => {
  const rendered = renderWecWeekend({ data: null, events: [{ type: 'TEST', name: 'Morning test' }, { type: 'TEST', name: 'Afternoon test' }], captureEffects: true });
  assert.match(rendered.html, /Test event/);
  assert.match(rendered.html, /Race results and grids are not available for this test event/);
  assert.doesNotMatch(rendered.html, /Loading classifications|Timing view|>Standings<\/button>/);
  assert.equal(rendered.effects.length, 1);
  assert.doesNotThrow(() => rendered.effects[0]());
});
