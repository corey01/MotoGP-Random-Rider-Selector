import { type ApiCalendarEvent } from "./getCalendarData";
import { fetchWithAuth } from "./auth";

export interface DashboardData {
  nextRace: ApiCalendarEvent | null;
  upcoming: ApiCalendarEvent[];
  subscribedSeries: string[];
}

const EMPTY: DashboardData = {
  nextRace: null,
  upcoming: [],
  subscribedSeries: [],
};

export async function getDashboardData(): Promise<DashboardData> {
  try {
    const res = await fetchWithAuth("/dashboard");
    if (!res.ok) return EMPTY;
    const data = await res.json();
    return {
      nextRace: data.nextRace ?? null,
      upcoming: data.upcoming ?? [],
      subscribedSeries: data.subscribedSeries ?? [],
    };
  } catch {
    return EMPTY;
  }
}
