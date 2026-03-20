const getBaseUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_RACECAL_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_RACECAL_URL is not set");
  return baseUrl.replace(/\/$/, "");
};

export interface RaceResultItem {
  position: number | null;
  riderExternalId: string | null;
  riderName: string;
  riderNumber: number | null;
  teamName: string | null;
  teamColor: string | null;
  textColor: string | null;
  pictures: {
    profile?: string;
    bike?: string;
    helmet?: string;
    portrait?: string;
    number?: string;
  } | null;
  totalLaps: number | null;
  bestLapTime: string | null;
  gapFirst: string | null;
  status: string | null;
  points: number;
}

export interface RaceResultsData {
  roundId: number;
  sessions: Record<string, RaceResultItem[]>;
}

export async function fetchRaceResults(roundId: number): Promise<RaceResultsData | null> {
  const url = `${getBaseUrl()}/results?roundId=${roundId}`;
  const res = await fetch(url, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`results fetch failed (${res.status})`);
  const payload = (await res.json()) as { ok: boolean } & RaceResultsData;
  if (!payload.ok) return null;
  return payload;
}
