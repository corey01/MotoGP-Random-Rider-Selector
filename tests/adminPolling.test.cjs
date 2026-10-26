const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const file = path.resolve(__dirname, '../app/admin/PollingSchedule.tsx');
const moduleUnderTest = { exports: {} };
const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
}}).outputText;
vm.runInNewContext(code, { module: moduleUnderTest, exports: moduleUnderTest.exports,
  require: name => name.endsWith('.scss') ? { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) } : require(name), Date,
}, { filename: file });
const PollingSchedule = moduleUnderTest.exports.default;
const job = { jobName: 'scrape:wsbk', series: 'wsbk', year: 2026, calendar: true,
  mode: 'race-weekend', intervalMs: 900000, effectiveIntervalMs: 900000,
  calendarAvailable: true, lastAttemptAt: '2026-10-26T10:00:00Z',
  lastSuccessAt: '2026-10-26T09:30:00Z', lastStatus: 'success', lastError: null,
  nextCheckAt: '2026-10-26T10:15:00Z', isRunning: false, isStalled: false };
const render = (props = {}) => renderToStaticMarkup(React.createElement(PollingSchedule, {
  data: { ok: true, checkedAt: '2026-10-26T10:05:00Z', jobs: [job] },
  error: '', loading: false, onRefresh() {}, ...props,
}));

test('automatic schedule identifies season, calendar cadence, status and retrieval time', () => {
  const html = render();
  assert.match(html, /WorldSBK \/ Support · 2026/);
  assert.match(html, /Calendar · Race weekend · every 15 minutes/);
  assert.match(html, /Last attempt succeeded/);
  assert.match(html, /Status retrieved:/);
  assert.match(html, /times are local to your device/);
});
test('running import does not present an expired next-check timestamp', () => {
  const html = render({ data: { ok: true, checkedAt: job.lastAttemptAt, jobs: [{ ...job, isRunning: true, lastStatus: 'running', nextCheckAt: null }] } });
  assert.match(html, /After the current import finishes/);
  assert.doesNotMatch(html, /Invalid Date/);
});
test('failed calendar import shows actual retry interval rather than assuming hourly', () => {
  const html = render({ data: { ok: true, checkedAt: job.lastAttemptAt, jobs: [{ ...job, lastStatus: 'error', lastError: 'Source unavailable' }] } });
  assert.match(html, /Last attempt failed/);
  assert.match(html, /Source unavailable/);
  assert.match(html, /Failed imports retry every 15 minutes/);
});
test('interrupted persisted run is distinct from an active import', () => {
  const html = render({ data: { ok: true, checkedAt: job.lastAttemptAt, jobs: [{ ...job, isStalled: true, lastStatus: 'running' }] } });
  assert.match(html, /Previous import interrupted/);
  assert.doesNotMatch(html, /After the current import finishes/);
});
test('failed refresh explicitly identifies retained schedule and first load has a loading state', () => {
  const html = render({ error: 'Unable to load planned sync times.' });
  assert.match(html, /role="alert"/);
  assert.match(html, /last retrieved status/);
  assert.match(render({ data: null, loading: true }), /Loading automatic sync schedule/);
  assert.match(render({ data: { ok: true, checkedAt: job.lastAttemptAt, jobs: [] } }), /No automatic sync jobs reported/);
});
