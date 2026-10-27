const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
function load(file, mocks = {}) {
  const full = path.resolve(root, file), module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(full, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  }}).outputText;
  const localRequire = name => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name.endsWith('.scss')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (name.startsWith('@/')) return load(name.slice(2) + '.ts', mocks);
    return require(name);
  };
  vm.runInNewContext(code, { module, exports: module.exports, require: localRequire, process, Date, Set, console, URLSearchParams, AbortController }, { filename: full });
  return module.exports;
}
const choices = load('utils/championships.ts');

test('favourite options respect followed classes and keep F1 constructors attached to F1', () => {
  const options = choices.followedChampionships(['motogp', 'f1', 'bsb'], ['moto2', 'bsb-superstock']);
  assert(options.some(option => option.value === 'f1:f1-constructors'));
  assert(options.some(option => option.value === 'motogp:moto3:teams'));
  assert(!options.some(option => option.value.startsWith('motogp:moto2')));
  assert(!options.some(option => option.value === 'bsb:bsb-superstock'));
  assert(!options.some(option => option.value.startsWith('wsbk:')));
  assert.equal(choices.followedChampionships(['speedway', 'nls', 'gtwce', 'iomtt'], []).length, 0);
  assert(!choices.followedChampionships(['f1'], ['f1']).length);
});

test('legacy defaults preserve hiding and explicit favourite choices without silently switching championships', () => {
  assert.equal(choices.resolveFavouriteChampionship(undefined, ['motogp'], []), 'motogp:motogp');
  assert.equal(choices.resolveFavouriteChampionship(undefined, ['motogp'], ['motogp']), null);
  assert.equal(choices.resolveFavouriteChampionship(undefined, ['f1'], []), null);
  assert.equal(choices.resolveFavouriteChampionship(null, ['motogp'], []), null);
  assert.equal(choices.resolveFavouriteChampionship('wsbk:worldwcr', [], []), 'wsbk:worldwcr');
  assert.equal(choices.resolveFavouriteChampionship('f1:moto2', ['f1'], []), null);
});

test('standings request carries the favourite exact class, competition, season and cancellation signal', async () => {
  const signal = new AbortController().signal;
  let request;
  const { getStandings } = load('utils/getStandings.ts', { './auth': { fetchWithAuth: async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ ok: true, year: 2026, subSeries: 'moto2', competition: 'teams', standings: [] }) };
  }}});
  assert.equal((await getStandings('motogp', 2026, 'moto2', 'teams', signal)).ok, true);
  const params = new URL(request.url, 'https://racecal.example').searchParams;
  assert.equal(params.get('series'), 'motogp');
  assert.equal(params.get('subSeries'), 'moto2');
  assert.equal(params.get('competition'), 'teams');
  assert.equal(params.get('year'), '2026');
  assert.equal(request.options.signal, signal);
});

test('wrong championship/year/competition and provider errors remain unavailable', async () => {
  const valid = { ok: true, year: 2026, series: 'motogp', subSeries: 'moto2', competition: 'teams', standings: [] };
  for (const mismatch of [{ year: 2025 }, { subSeries: 'motogp' }, { series: 'wsbk' }, { competition: 'constructors' }]) {
    const { getStandings } = load('utils/getStandings.ts', { './auth': { fetchWithAuth: async () => ({ ok: true, json: async () => ({ ...valid, ...mismatch }) }) }});
    const result = await getStandings('motogp', 2026, 'moto2', 'teams');
    assert.equal(result.ok, false);
    assert.match(result.error, /do not match/);
  }
  const { getStandings } = load('utils/getStandings.ts', { './auth': { fetchWithAuth: async () => ({ ok: false, json: async () => ({ error: 'Official standings are unavailable' }) }) }});
  const result = await getStandings('motoamerica', 2026, 'super-hooligan');
  assert.equal(result.ok, false);
  assert.equal(result.error, 'Official standings are unavailable');
});

function componentMocks(subscriptions, data, effects = []) {
  return {
    react: { ...React, useState: () => [data, () => {}], useEffect: effect => effects.push(effect) },
    'next/link': { __esModule: true, default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children) },
    '@/utils/SubscriptionsContext': { useSubscriptions: () => subscriptions },
    '@/utils/getStandings': { getStandings: async () => data },
    '../Classification/ClassificationList': { ClassificationList: ({ rows, label }) => React.createElement('div', { 'aria-label': label }, rows.map(row => `${row.riderName}:${row.teamName ?? ''}`).join(', ')) },
  };
}

test('home card keeps an unfollowed favourite labelled and asks for an explicit choice', () => {
  const { ChampionshipStandings } = load('app/_components/Dashboard/ChampionshipStandings.tsx', componentMocks({ isLoaded: true, subscribedSeries: ['motogp'], disabledSubSeries: [] }, null));
  const html = renderToStaticMarkup(React.createElement(ChampionshipStandings, { championship: 'f1:f1-constructors' }));
  assert.match(html, /F1 Constructors/);
  assert.match(html, /You no longer follow this class/);
  assert.doesNotMatch(html, /Loading standings/);
  assert.doesNotMatch(html, /MotoGP/);
});

test('home card renders team competition with no duplicate secondary team name', () => {
  const data = { ok: true, year: 2026, standings: [{ position: 1, points: 300, rider: { id: 'team', fullName: 'Official team' }, team: 'Official team' }] };
  const { ChampionshipStandings } = load('app/_components/Dashboard/ChampionshipStandings.tsx', componentMocks({ isLoaded: true, subscribedSeries: ['motogp'], disabledSubSeries: [] }, data));
  const html = renderToStaticMarkup(React.createElement(ChampionshipStandings, { championship: 'motogp:moto2:teams' }));
  assert.match(html, /Moto2 Teams/);
  assert.match(html, /Official team:/);
  assert.doesNotMatch(html, /Official team:Official team/);
});

test('a superseded favourite request cannot update the card after cleanup', async () => {
  const effects = [], updates = [];
  let finish, signal;
  const mocks = componentMocks({ isLoaded: true, subscribedSeries: ['f1'], disabledSubSeries: [] }, null, effects);
  mocks.react = { ...mocks.react, useState: () => [null, value => updates.push(value)] };
  mocks['@/utils/getStandings'] = { getStandings: (...args) => { signal = args[4]; return new Promise(resolve => { finish = resolve; }); } };
  const { ChampionshipStandings } = load('app/_components/Dashboard/ChampionshipStandings.tsx', mocks);
  renderToStaticMarkup(React.createElement(ChampionshipStandings, { championship: 'f1:f1' }));
  const cleanup = effects[0]();
  cleanup();
  finish({ ok: true, year: 2026, standings: [] });
  await Promise.resolve();
  assert.equal(signal.aborted, true);
  assert.equal(updates.length, 1);
  assert.equal(updates[0], null);
});

test('settings picker preserves an unfollowed favourite and exposes only followed alternatives', () => {
  const { FavouriteChampionshipPreference } = load('app/_components/FavouriteChampionshipPreference.tsx');
  const html = renderToStaticMarkup(React.createElement(FavouriteChampionshipPreference, { value: 'wsbk:worldwcr', options: choices.followedChampionships(['f1'], []), onChange() {} }));
  assert.match(html, /WorldWCR — no longer followed/);
  assert.match(html, /F1 Constructors/);
  assert.match(html, /No favourite championship/);
  assert.doesNotMatch(html, /MotoGP Riders/);
});
