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
  vm.runInNewContext(code, { module, exports: module.exports, require: localRequire, process, Date, Set, console }, { filename: full });
  return module.exports;
}
const { SERIES_GROUPS } = load('consts/series.ts');
const categories = load('utils/seriesCategories.ts');
const [motorcycles, cars] = categories.seriesCategories;

test('every selectable series and class occurs in exactly one category', () => {
  const series = categories.seriesCategories.flatMap(category => category.series);
  assert.equal(new Set(series).size, series.length);
  assert.deepEqual([...series].sort(), [...SERIES_GROUPS.map(group => group.key)].sort());
  const classes = categories.seriesCategories.flatMap(categories.categorySubSeries);
  assert.equal(new Set(classes).size, classes.length);
  assert.equal(classes.length, SERIES_GROUPS.flatMap(group => group.children).length);
});

test('category summary distinguishes no, partial and complete selection', () => {
  assert.equal(categories.categorySelection(motorcycles, new Set()).state, 'none');
  const some = categories.categorySelection(motorcycles, new Set(['motogp']));
  assert.equal(some.state, 'some');
  assert.equal(some.selected, 1);
  assert.equal(categories.categorySelection(motorcycles, new Set(categories.categorySubSeries(motorcycles))).state, 'all');
});

test('category bulk actions affect only their known classes and retain another category', () => {
  const initial = new Set(['f1', 'motogp', 'newer-client-class']);
  const all = categories.toggleCategorySelection(motorcycles, initial);
  assert(all.has('f1'));
  assert(all.has('newer-client-class'));
  assert(all.has('moto2'));
  assert(all.has('superbike'));
  assert(!initial.has('moto2'));
  const none = categories.toggleCategorySelection(motorcycles, all);
  assert(none.has('f1'));
  assert(none.has('newer-client-class'));
  assert(!none.has('motogp'));
  assert(!none.has('superbike'));
  assert.equal(categories.categorySelection(cars, none).selected, 1);
});

test('converting draft class choices preserves exclusions and unrecognised preferences', () => {
  const next = categories.preferencesForClassSelection(new Set(['moto2', 'f1']), ['motogp', 'unknown-series'], ['bsb-superstock', 'unknown-class']);
  assert(next.series.includes('motogp'));
  assert(next.series.includes('f1'));
  assert(next.series.includes('unknown-series'));
  assert(!next.series.includes('bsb'));
  assert(next.disabledSubSeries.includes('motogp'));
  assert(next.disabledSubSeries.includes('moto3'));
  assert(next.disabledSubSeries.includes('bsb-superstock'));
  assert(next.disabledSubSeries.includes('unknown-class'));
  assert(!next.disabledSubSeries.includes('moto2'));
  assert(!next.disabledSubSeries.includes('f1'));
});

function renderSelector(selected) {
  const stateUpdates = [], selections = [];
  const { SeriesCategorySelection } = load('app/_components/SeriesCategorySelection.tsx', {
    react: { ...React, useState: initial => [typeof initial === 'function' ? initial() : initial, value => stateUpdates.push(value)] },
  });
  const element = SeriesCategorySelection({ selected, onChange: value => selections.push(value) });
  return { element, html: renderToStaticMarkup(element), stateUpdates, selections };
}
function findElements(element, predicate, result = []) {
  if (!element || typeof element !== 'object') return result;
  if (predicate(element)) result.push(element);
  React.Children.forEach(element.props?.children, child => findElements(child, predicate, result));
  return result;
}

test('Bikes and Cars start collapsed even with saved follows, with explicit bulk actions', () => {
  const { html } = renderSelector(new Set(['motogp', 'f1']));
  assert.match(html, /aria-label="Bikes"/);
  assert.match(html, /aria-label="Cars"/);
  assert.match(html, /aria-checked="mixed"/);
  assert.match(html, /aria-label="Follow all bikes"/);
  assert.equal((html.match(/aria-expanded="false"/g) ?? []).length, 2);
  assert.match(html, /id="category-motorcycles" hidden=""/);
  assert.match(html, /id="category-cars" hidden=""/);
  assert.match(html, /<h3 class="groupLabel">MotoGP<\/h3>/);
});

test('expanding a category changes no preferences; follow-all remains an explicit action', () => {
  const rendered = renderSelector(new Set(['motogp']));
  const expand = findElements(rendered.element, element => element.type === 'button' && element.props['aria-controls'] === 'category-cars')[0];
  expand.props.onClick();
  assert.equal(rendered.stateUpdates.length, 1);
  assert.equal(rendered.selections.length, 0);
  const follow = findElements(rendered.element, element => element.type === 'button' && element.props['aria-label'] === 'Follow all cars')[0];
  follow.props.onClick();
  assert.equal(rendered.selections.length, 1);
  assert(rendered.selections[0].has('motogp'));
  assert(rendered.selections[0].has('f1'));
  assert(rendered.selections[0].has('nls'));
});
