export type SeriesKey = "motogp" | "wsbk" | "bsb" | "speedway" | "f1" | "gtwce" | "iomtt" | "nls" | "wec" | "rookiescup" | "motoamerica";

export type SubSeriesKey =
  | "motogp"
  | "moto2"
  | "moto3"
  | "worldsbk"
  | "worldssp"
  | "worldwcr"
  | "worldspb"
  | "bsb"
  | "speedway"
  | "f1"
  | "gtwce"
  | "iomtt"
  | "nls"
  | "wec"
  | "rookiescup"
  | "superbike"
  | "superbike-cup"
  | "supersport"
  | "talent-cup"
  | "king-of-the-baggers"
  | "twins-cup"
  | "super-hooligan"
  | "build-train-race"
  | "bsb-supersport"
  | "bsb-superstock"
  | "bsb-sportbike"
  | "bsb-bmw"
  | "bsb-sidecar";

export type SeriesGroup = {
  key: SeriesKey;
  label: string;
  children: Array<{ key: SubSeriesKey; label: string }>;
};

export const SERIES_GROUPS: SeriesGroup[] = [
  {
    key: "motoamerica",
    label: "MotoAmerica",
    children: [
      { key: "superbike", label: "Superbike" },
      { key: "superbike-cup", label: "Superbike Cup" },
      { key: "supersport", label: "Supersport" },
      { key: "talent-cup", label: "Talent Cup" },
      { key: "king-of-the-baggers", label: "King of the Baggers" },
      { key: "twins-cup", label: "Twins Cup" },
      { key: "super-hooligan", label: "Super Hooligan" },
      { key: "build-train-race", label: "Build. Train. Race." },
    ],
  },

  {
    key: "motogp",
    label: "MotoGP",
    children: [
      { key: "motogp", label: "MotoGP" },
      { key: "moto2", label: "Moto2" },
      { key: "moto3", label: "Moto3" },
    ],
  },
  {
    key: "wsbk",
    label: "WSBK",
    children: [
      { key: "worldsbk", label: "WorldSBK" },
      { key: "worldssp", label: "WorldSSP" },
      { key: "worldwcr", label: "WorldWCR" },
      { key: "worldspb", label: "WorldSPB" },
    ],
  },
  {
    key: "bsb",
    label: "BSB",
    children: [{ key: "bsb", label: "Superbike" }, { key: "bsb-supersport", label: "British Supersport" }, { key: "bsb-superstock", label: "National Superstock" }, { key: "bsb-sportbike", label: "British Sportbike" }, { key: "bsb-bmw", label: "BMW F 900 R Cup" }, { key: "bsb-sidecar", label: "British Sidecar (overall crews)" }],
  },
  {
    key: "speedway",
    label: "Speedway",
    children: [{ key: "speedway", label: "Speedway" }],
  },
  {
    key: "f1",
    label: "F1",
    children: [{ key: "f1", label: "F1" }],
  },
  {
    key: "gtwce",
    label: "GT World Challenge Europe",
    children: [{ key: "gtwce", label: "GT World Challenge Europe" }],
  },
  {
    key: "iomtt",
    label: "IoMTT",
    children: [{ key: "iomtt", label: "Isle of Man TT" }],
  },
  {
    key: "nls",
    label: "NLS",
    children: [{ key: "nls", label: "NLS" }],
  },
  {
    key: "wec",
    label: "FIA WEC",
    children: [{ key: "wec", label: "FIA WEC" }],
  },
  {
    key: "rookiescup",
    label: "Rookies Cup",
    children: [{ key: "rookiescup", label: "Red Bull Rookies Cup" }],
  },
];

// New championships are opt-in, including the guest/loading fallback.
export const DEFAULT_SERIES_KEYS = SERIES_GROUPS.filter((group) => group.key !== "wec").map((group) => group.key);

export const DEFAULT_SUB_SERIES_VISIBILITY: Record<SubSeriesKey, boolean> = {
  motogp: true,
  moto2: true,
  moto3: true,
  worldsbk: true,
  worldssp: true,
  worldwcr: true,
  worldspb: true,
  bsb: true,
  speedway: true,
  f1: true,
  gtwce: true,
  iomtt: true,
  nls: true,
  wec: false,
  rookiescup: true,
  "bsb-supersport": true,
  "bsb-superstock": false,
  "bsb-sportbike": false,
  "bsb-bmw": false,
  "bsb-sidecar": false,
  "superbike": true,
  "superbike-cup": true,
  "supersport": true,
  "talent-cup": true,
  "king-of-the-baggers": true,
  "twins-cup": true,
  "super-hooligan": true,
  "build-train-race": true,

};

export const SERIES_LABELS: Record<string, string> = {
  motoamerica: "MotoAmerica",
  motogp: "MotoGP",
  wsbk: "WorldSBK",
  bsb: "BSB",
  speedway: "FIM Speedway",
  f1: "Formula 1",
  gtwce: "GT World Challenge",
  iomtt: "Isle of Man TT",
  nls: "Nürburgring Langstrecken-Serie",
  wec: "FIA WEC",
  rookiescup: "Red Bull Rookies Cup",
};

export const SERIES_SHORT_LABELS: Record<string, string> = {
  motoamerica: "MotoAmerica",
  motogp: "MotoGP",
  wsbk: "WSBK",
  bsb: "BSB",
  speedway: "Speedway",
  f1: "F1",
  gtwce: "GTWCE",
  iomtt: "IoMTT",
  nls: "NLS",
  wec: "FIA WEC",
  rookiescup: "Rookies Cup",
};

export const SUB_SERIES_LABELS: Record<string, string> = {
  "bsb-supersport": "British Supersport",
  "bsb-superstock": "National Superstock",
  "bsb-sportbike": "British Sportbike",
  "bsb-bmw": "BMW F 900 R Cup",
  "bsb-sidecar": "British Sidecar (overall crews)",
  "superbike": "Superbike",
  "superbike-cup": "Superbike Cup",
  "supersport": "Supersport",
  "talent-cup": "Talent Cup",
  "king-of-the-baggers": "King of the Baggers",
  "twins-cup": "Twins Cup",
  "super-hooligan": "Super Hooligan",
  "build-train-race": "Build. Train. Race.",

  motogp: "MotoGP",
  moto2: "Moto2",
  moto3: "Moto3",
  baggers: "King of the Baggers",
  baggerscup: "King of the Baggers",
  bwc: "King of the Baggers",
  kingofthebaggers: "King of the Baggers",
  missionkingofthebaggers: "King of the Baggers",
  worldsbk: "WorldSBK",
  worldssp: "WorldSSP",
  worldwcr: "WorldWCR",
  worldspb: "WorldSPB",
  bsb: "BSB",
  speedway: "Speedway",
  f1: "Formula 1",
  gtwce: "GT World Challenge",
  iomtt: "Isle of Man TT",
  nls: "NLS",
  wec: "FIA WEC",
  rookiescup: "Red Bull Rookies Cup",
};

export const SUB_SERIES_SHORT_LABELS: Record<string, string> = {
  "bsb-supersport": "British Supersport",
  "bsb-superstock": "National Superstock",
  "bsb-sportbike": "British Sportbike",
  "bsb-bmw": "BMW F 900 R Cup",
  "bsb-sidecar": "British Sidecar (overall crews)",
  "superbike": "Superbike",
  "superbike-cup": "Superbike Cup",
  "supersport": "Supersport",
  "talent-cup": "Talent Cup",
  "king-of-the-baggers": "King of the Baggers",
  "twins-cup": "Twins Cup",
  "super-hooligan": "Super Hooligan",
  "build-train-race": "Build. Train. Race.",

  ...SUB_SERIES_LABELS,
  f1: "F1",
  gtwce: "GTWCE",
  iomtt: "IoMTT",
  nls: "NLS",
  wec: "FIA WEC",
  rookiescup: "Redbull Rookies",
};

export const ROUND_SERIES_LABELS: Record<string, string> = {
  motoamerica: "MotoAmerica",
  "bsb-supersport": "BSB",
  "bsb-superstock": "BSB",
  "bsb-sportbike": "BSB",
  "bsb-bmw": "BSB",
  "bsb-sidecar": "BSB",
  "superbike": "MotoAmerica",
  "superbike-cup": "MotoAmerica",
  "supersport": "MotoAmerica",
  "talent-cup": "MotoAmerica",
  "king-of-the-baggers": "MotoAmerica",
  "twins-cup": "MotoAmerica",
  "super-hooligan": "MotoAmerica",
  "build-train-race": "MotoAmerica",

  motogp: "MotoGP",
  moto2: "Moto2",
  moto3: "Moto3",
  baggers: "MotoGP",
  baggerscup: "MotoGP",
  bwc: "MotoGP",
  kingofthebaggers: "MotoGP",
  missionkingofthebaggers: "MotoGP",
  wsbk: "WSBK",
  worldsbk: "WSBK",
  worldssp: "WSBK",
  worldwcr: "WSBK",
  worldspb: "WSBK",
  bsb: "BSB",
  speedway: "Speedway",
  f1: "F1",
  gtwce: "GTWCE",
  iomtt: "IoMTT",
  nls: "NLS",
  wec: "FIA WEC",
  rookiescup: "Rookies",
};

export const SERIES_COLORS: Record<string, string> = {
  motoamerica: "#729aff",
  motogp: "var(--motogp-red)",
  wsbk: "var(--wsbk-blue)",
  bsb: "var(--bsb-green)",
  speedway: "var(--speedway-orange)",
  f1: "var(--f1-red)",
  gtwce: "var(--gtwce-gold)",
  iomtt: "var(--iomtt-amber)",
  nls: "var(--nls-green)",
  wec: "var(--wec-blue)",
  rookiescup: "var(--rookiescup-teal)",
};

export const seriesChildren = (series: SeriesKey) =>
  SERIES_GROUPS.find((group) => group.key === series)?.children || [];

export const SELECTABLE_SUB_SERIES_KEYS = new Set<SubSeriesKey>(
  SERIES_GROUPS.flatMap((group) => group.children.map((child) => child.key))
);

const MOTOGP_SPECIAL_SUB_SERIES_LABELS: Record<string, string> = {
  baggers: "King of the Baggers",
  baggerscup: "King of the Baggers",
  bwc: "King of the Baggers",
  kingofthebaggers: "King of the Baggers",
  missionkingofthebaggers: "King of the Baggers",
};

export function isSelectableSubSeriesKey(value: string): value is SubSeriesKey {
  return SELECTABLE_SUB_SERIES_KEYS.has(value as SubSeriesKey);
}

export function normalizeMotoGPSubSeriesSlug(value?: string | null): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export function getMotoGPSpecialSubSeriesLabel(value?: string | null): string | null {
  const normalized = normalizeMotoGPSubSeriesSlug(value);
  if (!normalized) return null;
  return MOTOGP_SPECIAL_SUB_SERIES_LABELS[normalized] ?? null;
}

export const SERIES_CARD_META: Record<SubSeriesKey, { abbr: string; subtitle: string }> = {
  motogp:   { abbr: "GP",  subtitle: "Premier Class" },
  moto2:    { abbr: "M2",  subtitle: "Intermediate" },
  moto3:    { abbr: "M3",  subtitle: "Lightweight" },
  worldsbk: { abbr: "SBK", subtitle: "Superbike" },
  worldssp: { abbr: "SSP", subtitle: "Supersport" },
  worldwcr: { abbr: "WCR", subtitle: "Women's Cup" },
  worldspb: { abbr: "SPB", subtitle: "Sportbike" },
  bsb:      { abbr: "BSB", subtitle: "British SBK" },
  speedway: { abbr: "SGP", subtitle: "Grand Prix" },
  f1:       { abbr: "F1",  subtitle: "Single Seater" },
  gtwce:    { abbr: "GT",  subtitle: "GT3 / GT4" },
  iomtt:    { abbr: "IoMTT",  subtitle: "Road Racing" },
  nls:      { abbr: "NLS", subtitle: "Endurance" },
  wec:      { abbr: "WEC", subtitle: "Endurance · Race results & grids" },
  rookiescup: { abbr: "RRC", subtitle: "Junior Grand Prix" },
  "bsb-supersport": { abbr: "BSS", subtitle: "British Supersport" },
  "bsb-superstock": { abbr: "STK", subtitle: "National Superstock" },
  "bsb-sportbike": { abbr: "SPB", subtitle: "British Sportbike" },
  "bsb-bmw": { abbr: "BMW", subtitle: "Heats · LCQ · Main / Sprint" },
  "bsb-sidecar": { abbr: "SC", subtitle: "Crews · Overall standings" },
  "superbike": { abbr: "MA", subtitle: "MotoAmerica standings" },
  "superbike-cup": { abbr: "MA", subtitle: "MotoAmerica standings" },
  "supersport": { abbr: "MA", subtitle: "MotoAmerica standings" },
  "talent-cup": { abbr: "MA", subtitle: "MotoAmerica standings" },
  "king-of-the-baggers": { abbr: "MA", subtitle: "MotoAmerica standings" },
  "twins-cup": { abbr: "MA", subtitle: "MotoAmerica standings" },
  "super-hooligan": { abbr: "MA", subtitle: "MotoAmerica standings" },
  "build-train-race": { abbr: "MA", subtitle: "MotoAmerica standings" },

};
