import type { SeriesKey } from "@/consts/series";

export interface ChampionshipOption {
  value: string;
  label: string;
  series: SeriesKey;
  subSeries: string;
  classKey?: string;
  competition: "riders" | "teams" | "constructors";
}

const option = (series: SeriesKey, subSeries: string, label: string,
  competition: ChampionshipOption["competition"] = "riders", classKey?: string): ChampionshipOption => ({
  value: `${series}:${subSeries}${competition === "riders" ? "" : `:${competition}`}`,
  label, series, subSeries, competition, ...(classKey ? { classKey } : {}),
});

// Only championships supported by /standings belong here. Calendar coverage alone
// does not make a championship available as a home-screen favourite.
export const championshipOptions: ChampionshipOption[] = [
  ...["motogp", "moto2", "moto3"].flatMap((cls, index) => {
    const label = ["MotoGP", "Moto2", "Moto3"][index];
    return [option("motogp", cls, `${label} Riders`), option("motogp", cls, `${label} Teams`, "teams"), option("motogp", cls, `${label} Constructors`, "constructors")];
  }),
  option("f1", "f1", "F1 Drivers"),
  option("f1", "f1-constructors", "F1 Constructors", "riders", "f1"),
  ...[["worldsbk", "WorldSBK"], ["worldssp", "WorldSSP"], ["worldspb", "WorldSPB"], ["worldwcr", "WorldWCR"]].map(([cls, label]) => option("wsbk", cls, label)),
  ...[["bsb", "British Superbike"], ["bsb-supersport", "British Supersport"], ["bsb-superstock", "National Superstock"], ["bsb-sportbike", "British Sportbike"]].map(([cls, label]) => option("bsb", cls, label)),
  option("rookiescup", "rookiescup", "Red Bull Rookies Cup"),
  ...[["superbike", "Superbike"], ["superbike-cup", "Superbike Cup"], ["supersport", "Supersport"], ["talent-cup", "Talent Cup"], ["king-of-the-baggers", "King of the Baggers"], ["twins-cup", "Twins Cup"], ["super-hooligan", "Super Hooligan"], ["build-train-race", "Build. Train. Race."]].map(([cls, label]) => option("motoamerica", cls, `MotoAmerica ${label}`)),
];

export const championshipForValue = (value: unknown) =>
  championshipOptions.find((option) => option.value === value);

export function followedChampionships(series: readonly string[], disabled: readonly string[]) {
  return championshipOptions.filter((option) => series.includes(option.series) && !disabled.includes(option.classKey ?? option.subSeries));
}

export function resolveFavouriteChampionship(value: unknown, series: readonly string[], disabled: readonly string[]): string | null {
  if (value === undefined) {
    return followedChampionships(series, disabled).some((option) => option.value === "motogp:motogp") ? "motogp:motogp" : null;
  }
  // Preserve an unfollowed favourite so the user can see why it is unavailable.
  return championshipForValue(value)?.value ?? null;
}
