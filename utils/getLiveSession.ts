import { fetchWithAuth } from "./auth";

export interface LiveTopThreeEntry {
  position: number;
  abbreviation: string;
  fullName: string;
  team: string;
  teamColour: string | null;
  gapToLeader: string | null;
}

export interface LiveSessionData {
  ok: boolean;
  series: string | null;
  sessionName: string | null;
  isLive: boolean;
  isDone: boolean;
  currentLap: number | null;
  totalLaps: number | null;
  topThree: LiveTopThreeEntry[];
}

export async function fetchLiveSession(): Promise<LiveSessionData | null> {
  try {
    const res = await fetchWithAuth("/live", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as LiveSessionData;
  } catch {
    return null;
  }
}
