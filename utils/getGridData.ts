const getBaseUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_RACECAL_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_RACECAL_URL is not set");
  return baseUrl.replace(/\/$/, "");
};

export interface GridItem {
  position: number;
  riderName: string;
  riderNumber: number | null;
  teamName: string | null;
  manufacturer: string | null;
  riderId: number | null;
  riderExternalId: string | null;
  teamColor: string | null;
  textColor: string | null;
  pictures: {
    profile?: string;
    bike?: string;
    helmet?: string;
    portrait?: string;
    number?: string;
  } | null;
}

export interface GridData {
  roundId: number;
  source: "official" | "derived";
  count: number;
  grid: GridItem[];
}

export async function fetchGridData(roundId: number): Promise<GridData | null> {
  const url = `${getBaseUrl()}/grid?roundId=${roundId}`;
  const res = await fetch(url, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`grid fetch failed (${res.status})`);
  const payload = (await res.json()) as { ok: boolean } & GridData;
  if (!payload.ok) return null;
  return payload;
}
