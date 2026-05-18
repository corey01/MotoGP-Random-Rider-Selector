import { isSelectableSubSeriesKey, type SubSeriesKey } from "@/consts/series";
import { fetchWithAuth } from "./auth";

export interface UserPreferences {
  sessionView?: "races" | "all";
  calendarView?: "rounds" | "events";
  disabledSubSeries?: SubSeriesKey[];
  showMotoGPChampionship?: boolean;
}

export async function fetchPreferences(): Promise<UserPreferences> {
  const res = await fetchWithAuth("/user/preferences");
  if (!res.ok) return {};
  const data = await res.json();
  const raw = (data.preferences ?? data ?? {}) as UserPreferences & { disabledSubSeries?: unknown };
  const disabledSubSeries = Array.isArray(raw.disabledSubSeries)
    ? raw.disabledSubSeries
        .map((value) => String(value).trim().toLowerCase())
        .filter(isSelectableSubSeriesKey)
    : undefined;

  return {
    ...raw,
    ...(disabledSubSeries ? { disabledSubSeries } : {}),
  };
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
