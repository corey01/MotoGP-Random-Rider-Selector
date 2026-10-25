const getBaseUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_RACECAL_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_RACECAL_URL is not set");
  return baseUrl.replace(/\/$/, "");
};

export interface GridItem {
  position: number;
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
}

export interface GridData {
  roundId: number;
  count: number;
  grid: GridItem[];
}

export async function fetchGridData(roundId: number, subSeries = "motogp"): Promise<GridData | null> {
  const url = `${getBaseUrl()}/grid?roundId=${roundId}&subSeries=${encodeURIComponent(subSeries)}`;
  let res = await fetch(url, { cache: "no-store" });
  if (res.status === 404) res = await fetch(`${url}&refresh=true`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`grid fetch failed (${res.status})`);
  const payload = (await res.json()) as { ok: boolean } & GridData;
  if (!payload.ok) return null;
  return payload;
}
