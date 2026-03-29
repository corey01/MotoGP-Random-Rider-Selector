export type SeriesKey = "motogp" | "wsbk" | "bsb" | "speedway" | "f1" | "gtwce" | "iomtt" | "nls";

export type SubSeriesKey =
  | "motogp"
  | "moto2"
  | "moto3"
  | "baggers"
  | "worldsbk"
  | "worldssp"
  | "worldwcr"
  | "worldspb"
  | "bsb"
  | "speedway"
  | "f1"
  | "gtwce"
  | "iomtt"
  | "nls";

export type SeriesGroup = {
  key: SeriesKey;
  label: string;
  children: Array<{ key: SubSeriesKey; label: string }>;
};

export const SERIES_GROUPS: SeriesGroup[] = [
  {
    key: "motogp",
    label: "MotoGP",
    children: [
      { key: "motogp", label: "MotoGP" },
      { key: "moto2", label: "Moto2" },
      { key: "moto3", label: "Moto3" },
      { key: "baggers", label: "Baggers" },
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
    children: [{ key: "bsb", label: "BSB" }],
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
];

export const DEFAULT_SUB_SERIES_VISIBILITY: Record<SubSeriesKey, boolean> = {
  motogp: true,
  moto2: true,
  moto3: true,
  baggers: true,
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
};

export const SERIES_LABELS: Record<string, string> = {
  motogp: "MotoGP",
  wsbk: "WorldSBK",
  bsb: "BSB",
  speedway: "FIM Speedway",
  f1: "Formula 1",
  gtwce: "GT World Challenge",
  iomtt: "Isle of Man TT",
  nls: "Nürburgring Langstrecken-Serie",
};

export const SERIES_SHORT_LABELS: Record<string, string> = {
  motogp: "MotoGP",
  wsbk: "WSBK",
  bsb: "BSB",
  speedway: "Speedway",
  f1: "F1",
  gtwce: "GTWCE",
  iomtt: "IoMTT",
  nls: "NLS",
};

export const SUB_SERIES_LABELS: Record<string, string> = {
  motogp: "MotoGP",
  moto2: "Moto2",
  moto3: "Moto3",
  baggers: "Baggers",
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
};

export const SUB_SERIES_SHORT_LABELS: Record<string, string> = {
  ...SUB_SERIES_LABELS,
  f1: "F1",
  gtwce: "GTWCE",
  iomtt: "IoMTT",
  nls: "NLS",
};

export const ROUND_SERIES_LABELS: Record<string, string> = {
  motogp: "MotoGP",
  moto2: "Moto2",
  moto3: "Moto3",
  baggers: "Baggers",
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
};

export const SERIES_COLORS: Record<string, string> = {
  motogp: "var(--motogp-red)",
  wsbk: "var(--wsbk-blue)",
  bsb: "var(--bsb-green)",
  speedway: "var(--speedway-orange)",
  f1: "var(--f1-red)",
  gtwce: "var(--gtwce-gold)",
  iomtt: "var(--iomtt-amber)",
  nls: "var(--nls-green)",
};

export const seriesChildren = (series: SeriesKey) =>
  SERIES_GROUPS.find((group) => group.key === series)?.children || [];
