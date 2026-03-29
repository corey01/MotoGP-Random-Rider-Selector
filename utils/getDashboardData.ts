import { type ApiCalendarEvent } from "./getCalendarData";
import { fetchWithAuth } from "./auth";

export interface DashboardData {
  nextRace: ApiCalendarEvent | null;
  nextPerSeries: ApiCalendarEvent[];
  today: ApiCalendarEvent[];
  thisWeekend: ApiCalendarEvent[];
  subscribedSeries: string[];
  showMotoGPChampionship: boolean;
}

const EMPTY: DashboardData = {
  nextRace: null,
  nextPerSeries: [],
  today: [],
  thisWeekend: [],
  subscribedSeries: [],
  showMotoGPChampionship: true,
};

export async function getDashboardData(): Promise<DashboardData> {
  try {
    const res = await fetchWithAuth("/dashboard");
    if (!res.ok) return EMPTY;
    const data = await res.json();
    return {
      nextRace: data.nextRace ?? null,
      nextPerSeries: data.nextPerSeries ?? [],
      today: data.today ?? [],
      thisWeekend: data.thisWeekend ?? [],
      subscribedSeries: data.subscribedSeries ?? [],
      showMotoGPChampionship: data.showMotoGPChampionship ?? true,
    };
  } catch {
    return EMPTY;
  }
}
