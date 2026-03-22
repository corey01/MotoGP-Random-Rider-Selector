import { type ApiCalendarEvent } from "./getCalendarData";
import { fetchWithAuth } from "./auth";

export interface DashboardData {
  nextRace: ApiCalendarEvent | null;
  today: ApiCalendarEvent[];
  upcoming: ApiCalendarEvent[];
  upcomingRaces: ApiCalendarEvent[];
  subscribedSeries: string[];
}

const EMPTY: DashboardData = {
  nextRace: null,
  today: [],
  upcoming: [],
  upcomingRaces: [],
  subscribedSeries: [],
};

export async function getDashboardData(): Promise<DashboardData> {
  try {
    const res = await fetchWithAuth("/dashboard");
    if (!res.ok) return EMPTY;
    const data = await res.json();
    return {
      nextRace: data.nextRace ?? null,
      today: data.today ?? [],
      upcoming: data.upcoming ?? [],
      upcomingRaces: data.upcomingRaces ?? [],
      subscribedSeries: data.subscribedSeries ?? [],
    };
  } catch {
    return EMPTY;
  }
}
