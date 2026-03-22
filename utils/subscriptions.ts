import { fetchWithAuth } from "./auth";
import type { SeriesKey } from "@/app/_components/Calendar/filterConfig";

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
