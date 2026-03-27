import { fetchWithAuth } from "./auth";
import type { SeriesKey } from "@/app/_components/Calendar/filterConfig";

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
}

const EMPTY: StandingsData = { ok: false, year: 0, count: 0, standings: [] };

export async function getStandings(
  series: SeriesKey,
  year?: number
): Promise<StandingsData> {
  try {
    const params = new URLSearchParams({ series });
    if (year) params.set("year", String(year));
    const res = await fetchWithAuth(`/standings?${params}`);
    if (!res.ok) return EMPTY;
    return res.json() as Promise<StandingsData>;
  } catch {
    return EMPTY;
  }
}
