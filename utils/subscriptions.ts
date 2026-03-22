import { fetchWithAuth } from "./auth";
import type { SeriesKey, SubSeriesKey } from "@/app/_components/Calendar/filterConfig";

export async function fetchSubscriptions(): Promise<SeriesKey[]> {
  try {
    const res = await fetchWithAuth("/subscriptions");
    if (!res.ok) return [];
    const data = await res.json();
    // Handle both { series: [] } and { subscriptions: [{ series: "motogp" }] }
    if (Array.isArray(data.series)) return data.series as SeriesKey[];
    if (Array.isArray(data.subscriptions)) {
      return data.subscriptions.map((s: { series: string } | string) =>
        typeof s === "string" ? s : s.series
      ) as SeriesKey[];
    }
    return [];
  } catch {
    return [];
  }
}

export async function saveSubscriptions(series: SeriesKey[]): Promise<void> {
  await fetchWithAuth("/subscriptions", {
    method: "PUT",
    body: JSON.stringify({ series }),
  });
}

export async function fetchDisabledSubSeries(): Promise<SubSeriesKey[]> {
  try {
    const res = await fetchWithAuth("/user/preferences");
    if (!res.ok) return [];
    const data = await res.json();
    const disabled = data?.preferences?.disabledSubSeries;
    if (Array.isArray(disabled)) return disabled as SubSeriesKey[];
    return [];
  } catch {
    return [];
  }
}

export async function saveDisabledSubSeries(disabled: SubSeriesKey[]): Promise<void> {
  await fetchWithAuth("/user/preferences", {
    method: "PUT",
    body: JSON.stringify({ disabledSubSeries: disabled }),
  });
}
