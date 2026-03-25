export type SeriesKey = "motogp" | "wsbk" | "bsb" | "speedway" | "f1" | "gtwce";

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
  | "gtwce";

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
];

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
};

export const seriesChildren = (series: SeriesKey) =>
  SERIES_GROUPS.find((group) => group.key === series)?.children || [];
