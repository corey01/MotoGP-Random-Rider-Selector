import { SERIES_GROUPS, type SeriesKey, type SubSeriesKey } from "@/consts/series";

export interface SeriesCategory {
  key: "motorcycles" | "cars";
  label: string;
  series: SeriesKey[];
}

export const seriesCategories: SeriesCategory[] = [
  { key: "motorcycles", label: "Motorcycles", series: ["motogp", "wsbk", "bsb", "speedway", "iomtt", "rookiescup", "motoamerica"] },
  { key: "cars", label: "Cars", series: ["f1", "gtwce", "nls"] },
];

export function categorySubSeries(category: SeriesCategory): SubSeriesKey[] {
  return category.series.flatMap((key) => SERIES_GROUPS.find((group) => group.key === key)?.children.map((child) => child.key) ?? []);
}

export function categorySelection(category: SeriesCategory, selectedSubSeries: ReadonlySet<SubSeriesKey>) {
  const keys = categorySubSeries(category);
  const selected = keys.filter((key) => selectedSubSeries.has(key)).length;
  return { selected, total: keys.length, state: selected === 0 ? "none" as const : selected === keys.length ? "all" as const : "some" as const };
}

export function toggleCategorySelection(category: SeriesCategory, selectedSubSeries: ReadonlySet<SubSeriesKey>) {
  const next = new Set(selectedSubSeries);
  const remove = categorySelection(category, selectedSubSeries).state === "all";
  categorySubSeries(category).forEach((key) => remove ? next.delete(key) : next.add(key));
  return next;
}

export function preferencesForClassSelection(selected: ReadonlySet<SubSeriesKey>, currentSeries: readonly SeriesKey[] = [], currentDisabled: readonly SubSeriesKey[] = []) {
  const knownSeries = new Set(SERIES_GROUPS.map((group) => group.key));
  const knownClasses = new Set(SERIES_GROUPS.flatMap((group) => group.children.map((child) => child.key)));
  return {
    // Keep values outside the rendered registry, including preferences written
    // by a newer client. Changing a category only controls its known classes.
    series: [...currentSeries.filter((key) => !knownSeries.has(key)), ...SERIES_GROUPS.filter((group) => group.children.some((child) => selected.has(child.key))).map((group) => group.key)],
    disabledSubSeries: [...currentDisabled.filter((key) => !knownClasses.has(key)), ...[...knownClasses].filter((key) => !selected.has(key))],
  };
}
