import type { SubSeriesKey } from "@/app/_components/Calendar/filterConfig";
import { fetchWithAuth } from "./auth";

export interface UserPreferences {
  sessionView?: "races" | "all";
  calendarView?: "rounds" | "events";
  disabledSubSeries?: SubSeriesKey[];
}

export async function fetchPreferences(): Promise<UserPreferences> {
  const res = await fetchWithAuth("/user/preferences");
  if (!res.ok) return {};
  const data = await res.json();
  return data.preferences ?? data ?? {};
}

export async function savePreferences(prefs: Partial<UserPreferences>): Promise<void> {
  const res = await fetchWithAuth("/user/preferences", {
    method: "PUT",
    body: JSON.stringify(prefs),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? data.message ?? "Failed to save preferences");
  }
}
