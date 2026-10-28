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
  assert.equal(registry.SERIES_CARD_META.wec.subtitle, 'Endurance · Calendar only');
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
