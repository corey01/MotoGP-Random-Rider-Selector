import {
  ROUND_SERIES_LABELS,
  SERIES_COLORS,
  SERIES_LABELS,
  SERIES_SHORT_LABELS,
  SUB_SERIES_LABELS,
  SUB_SERIES_SHORT_LABELS,
} from "@/consts/series";

export type SeriesLabelVariant = "full" | "short" | "round";

const LABEL_MAPS: Record<SeriesLabelVariant, Array<Record<string, string>>> = {
  full: [SUB_SERIES_LABELS, SERIES_LABELS],
  short: [SUB_SERIES_SHORT_LABELS, SERIES_SHORT_LABELS],
  round: [ROUND_SERIES_LABELS, SUB_SERIES_SHORT_LABELS, SERIES_SHORT_LABELS],
};

export function normalizeSeriesKey(value?: string | null): string {
  return String(value ?? "").trim().toLowerCase();
}

export function getSeriesDisplayLabel(
  value?: string | null,
  options: { variant?: SeriesLabelVariant; fallback?: string } = {},
): string {
  const { variant = "full", fallback } = options;
  const normalized = normalizeSeriesKey(value);

  if (!normalized) return fallback ?? "";

  for (const labels of LABEL_MAPS[variant]) {
    const label = labels[normalized];
    if (label) return label;
  }

  return fallback ?? normalized.toUpperCase();
}

export function getSeriesColor(value?: string | null, fallback = "var(--kc-primary)"): string {
  const normalized = normalizeSeriesKey(value);
  return SERIES_COLORS[normalized] ?? fallback;
}
