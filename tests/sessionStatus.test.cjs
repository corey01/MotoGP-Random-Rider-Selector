const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// Render production components with CSS modules and Next navigation as boundaries.
const root = path.resolve(__dirname, '..'), cache = new Map();
function load(file) {
  const full = path.resolve(root, file);
  if (cache.has(full)) return cache.get(full).exports;
  const module = { exports: {} }; cache.set(full, module);
  const code = ts.transpileModule(fs.readFileSync(full, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  }}).outputText;
  const localRequire = name => {
    if (/\.(scss|css)$/.test(name)) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (name === 'next/link') return ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children);
    if (name.startsWith('.') || name.startsWith('@/')) {
      let next = name.startsWith('@/') ? path.resolve(root, name.slice(2)) : path.resolve(path.dirname(full), name);
      if (!path.extname(next)) next += fs.existsSync(next + '.tsx') ? '.tsx' : '.ts';
      return load(next);
    }
    return require(name);
  };
  vm.runInNewContext(code, { module, exports: module.exports, require: localRequire, process, console, URLSearchParams, Date, setTimeout, clearTimeout }, { filename: full });
  return module.exports;
}
const { sessionDisruption, strikeSessionTime } = load('utils/sessionStatus.ts');
const { toFullCalendarSessionEvent } = load('utils/getCalendarData.ts');
const { DayDetailPanel } = load('app/_components/Calendar/DayDetailPanel.tsx');
const { EventDetailPanel } = load('app/_components/Calendar/EventDetailPanel.tsx');
const { NextRaceStrip } = load('app/_components/Dashboard/NextRaceStrip.tsx');
const { WeekendFeed } = load('app/_components/Dashboard/WeekendFeed.tsx');
const start = '2026-10-25T05:30:00.000Z';
const session = { id: '1170959', title: 'Grand Prix', sessionName: 'Grand Prix', series: 'motogp', subSeries: 'motogp', type: 'RACE', status: 'CANCELLED', start, end: null, timezone: 'Australia/Melbourne' };
const round = { id: 42, name: 'Australian Grand Prix', series: 'motogp', subSeries: 'motogp', startDate: '2026-10-23', endDate: '2026-10-25', circuit: 'Phillip Island', country: 'AU', number: 19, sourceUrl: null, events: [session] };
const render = (component, props) => renderToStaticMarkup(React.createElement(component, props));

test('cancellation labels do not turn normal sessions or postponements into cancelled races', () => {
  assert.equal(sessionDisruption(' cancelled '), 'Cancelled');
  assert.equal(sessionDisruption('CANCELED'), 'Cancelled');
  assert.equal(sessionDisruption('POSTPONED'), 'Postponed');
  for (const status of ['UPCOMING', 'LIVE', 'COMPLETED', '', null]) assert.equal(sessionDisruption(status), null);
});
test('only a cancelled known time is struck through; Time TBC remains unknown', () => {
  assert.equal(strikeSessionTime('CANCELLED', start), true);
  for (const status of ['COMPLETED', 'LIVE', 'POSTPONED']) assert.equal(strikeSessionTime(status, start), false);
  assert.equal(strikeSessionTime('CANCELLED', '2026-10-25'), false);
  assert.equal(strikeSessionTime('CANCELLED', null), false);
});
test('calendar adapter keeps session identity, original time and cancellation status', () => {
  const event = toFullCalendarSessionEvent(session, round);
  assert.equal(event.extendedProps.sessionId, session.id);
  assert.equal(event.start, start);
  assert.equal(event.extendedProps.status, 'CANCELLED');
  assert.equal(event.extendedProps.timeKnown, true);
  assert.equal(toFullCalendarSessionEvent({ ...session, start: '2026-10-25' }, round).extendedProps.timeKnown, false);
});
test('focused weekend marks each cancelled race, while the completed sprint stays normal', () => {
  const events = ['motogp', 'moto2', 'moto3'].map((subSeries, index) => ({ ...session, id: String(index), subSeries }));
  events.push({ ...session, id: 'sprint', sessionName: 'Sprint', start: '2026-10-24T04:00:00Z', status: 'COMPLETED' });
  const html = render(DayDetailPanel, { date: new Date(start), rounds: [{ ...round, events }], focusedRound: round, focusMode: 'round', sessionView: 'all', onClose() {}, onSessionViewChange() {} });
  assert.equal((html.match(/>Cancelled</g) || []).length, 3);
  assert.equal((html.match(/<s /g) || []).length, 3);
  assert.match(html, /Sprint/);
});
test('session detail retains its time and shows a prominent cancellation label', () => {
  const html = render(EventDetailPanel, { session, round, onClose() {} });
  assert.match(html, /<s /);
  assert.match(html, />Cancelled</);
});
test('cancelled highlight cannot show a countdown or Underway state', () => {
  const html = render(NextRaceStrip, { races: [{ ...session, start: new Date(Date.now() + 3600000).toISOString(), round }] });
  assert.match(html, />Cancelled</);
  assert.match(html, /<s /);
  assert.doesNotMatch(html, /Starts in|Underway/);
});
test('cancelled feed row retains its time without a live banner', () => {
  const html = render(WeekendFeed, { events: [{ ...session, start: new Date().toISOString(), round }] });
  assert.match(html, />Cancelled</);
  assert.match(html, /<s /);
  assert.doesNotMatch(html, />Now<|>Live</);
});
