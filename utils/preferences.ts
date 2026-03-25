import { fetchWithAuth } from "./auth";

export interface UserPreferences {
  sessionView?: "races" | "all";
  calendarView?: "rounds" | "events";
}

export async function fetchPreferences(): Promise<UserPreferences> {
  const res = await fetchWithAuth("/user/preferences");
  if (!res.ok) return {};
  const data = await res.json();
  return data.preferences ?? data ?? {};
}

export async function savePreferences(prefs: Partial<UserPreferences>): Promise<void> {
  await fetchWithAuth("/user/preferences", {
    method: "PUT",
    body: JSON.stringify(prefs),
  });
}
