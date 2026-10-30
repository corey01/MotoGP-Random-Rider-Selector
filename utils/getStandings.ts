import { fetchWithAuth } from "./auth";
import type { CrewMember } from "./classification";
import type { SeriesKey } from "@/consts/series";

export interface StandingsRider {
  id: string;
  fullName: string | null;
  number: number | null;
  country: { iso: string | null; name: string | null } | null;
  pictures: {
    profile?: string | null;
    bike?: string | null;
    helmet?: string | null;
    portrait?: string | null;
    number?: string | null;
  } | null;
}

export interface StandingsEntry {
  crew?: CrewMember[];
  machine?: string | null;
  category?: string | null;
  classPosition?: number | null;
  teamColor?: string | null;
  position: number;
  points: number;
  rider: StandingsRider;
  team: string | null;
  constructor: string | null;
}

export interface StandingsData {
  ok: boolean;
  year: number;
  count: number;
  standings: StandingsEntry[];
  asOfDate?: string;
  historicalWarnings?: string[];
  stale?: boolean;
  refreshFailed?: boolean;
  error?: string;
}

const EMPTY: StandingsData = { ok: false, year: 0, count: 0, standings: [] };

export async function getStandings(
  series: SeriesKey,
  year?: number,
  subSeries: string = series,
  competition = "riders",
  signal?: AbortSignal,
): Promise<StandingsData> {
  try {
    const targetYear = year ?? new Date().getFullYear();
    const params = new URLSearchParams({ series, subSeries, competition, year: String(targetYear) });
    const res = await fetchWithAuth(`/standings?${params}`, { signal });
    const data = await res.json();
    if (!res.ok) return { ...EMPTY, error: typeof data.error === "string" ? data.error : "Standings are currently unavailable." };
    if (data.subSeries !== subSeries || data.year !== targetYear ||
      (data.series !== undefined && data.series !== series) ||
      (competition !== "riders" ? data.competition !== competition : data.competition !== undefined && data.competition !== "riders") ||
      !Array.isArray(data.standings)) {
      return { ...EMPTY, error: "The standings do not match this championship and season." };
    }
    return data as StandingsData;
  } catch {
    return { ...EMPTY, error: "Standings are currently unavailable. Please try again later." };
  }
}
