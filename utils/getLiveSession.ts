import { fetchWithAuth } from "./auth";

export interface LiveSessionData {
  ok: boolean;
  category: string | null;
  sessionName: string | null;
  sessionShortname: string | null;
  numLaps: number;
  remaining: number;
  statusId: string | null;
  isLive: boolean;
  isDone: boolean;
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
