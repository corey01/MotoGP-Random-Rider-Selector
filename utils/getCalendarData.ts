// Fetches calendar data from the RaceCal API and maps it to
// the FullCalendar event shape expected by Calendar.tsx.

// Mirrors the shape returned by GET /calendar-events
export interface ApiCalendarEvent {
  id: string;
  title: string;
  sessionName: string;
  start: string;
  end: string | null;
  timezone: string;
  series: string;
  subSeries: string;
  type: string;
  status: string;
  round: {
    id: number;
    name: string;
    circuit: string | null;
    country: string | null;
    number: number | null;
    sourceUrl: string | null;
    hasGrid?: boolean;
  };
}

// The shape FullCalendar expects
export interface CalendarEvent {
  title: string;
  start: string;
  end?: string;
  className: string;
  extendedProps?: {
    session?: string;
    type?: string;
    subSeries?: string;
    meta?: {
      round: string;
      roundId?: number | null;
      name: string;
      deviceTime: string;
      deviceEndTime?: string | null;
      raceTime: string;
      country?: string;
      sessionName?: string;
      eventDateLabel?: string;
      sourceUrl?: string;
      hasGrid?: boolean;
    };
  };
}

export type MotoGpSeasonData = CalendarEvent[];
export type WsbkSeasonData = CalendarEvent[];
export type BsbSeasonData = CalendarEvent[];
export type FimSpeedwaySeasonData = CalendarEvent[];
export type Formula1SeasonData = CalendarEvent[];

export type AllCalendarData = {
  motoGpData: MotoGpSeasonData;
  wsbkData: WsbkSeasonData;
  bsbData: BsbSeasonData;
  fimSpeedwayData: FimSpeedwaySeasonData;
  formula1Data: Formula1SeasonData;
};

const CLASS_MAP: Record<string, string> = {
  motogp: "motogp-event",
  moto2: "motogp-event",
  moto3: "motogp-event",
  worldsbk: "wsbk-event",
  worldssp: "wsbk-event",
  worldwcr: "wsbk-event",
  worldspb: "wsbk-event",
  wsbk: "wsbk-event",
  bsb: "bsb-event",
  speedway: "speedway-event",
  f1: "f1-event",
};

const getBaseUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_RACECAL_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_RACECAL_URL is not set");
  return baseUrl.replace(/\/$/, "");
};

const toQueryValue = (value?: string[]) =>
  value
    ?.map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(",");

type FetchCalendarEventsArgs = {
  year: number;
  series?: string[];
  subSeries?: string[];
  types?: string[];
};

export async function fetchCalendarEvents({
  year,
  series,
  subSeries,
  types,
}: FetchCalendarEventsArgs): Promise<ApiCalendarEvent[]> {
  const params = new URLSearchParams();
  params.set("year", String(year));

  const seriesValue = toQueryValue(series);
  if (seriesValue) params.set("series", seriesValue);

  const subSeriesValue = toQueryValue(subSeries);
  if (subSeriesValue) params.set("subSeries", subSeriesValue);

  const typesValue = toQueryValue(types);
  if (typesValue) params.set("type", typesValue);

  const url = `${getBaseUrl()}/calendar-events?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`calendar-events failed (${res.status})`);

  const payload = (await res.json()) as { events?: ApiCalendarEvent[] };
  return payload?.events ?? [];
}

function toFullCalendarEvent(ev: ApiCalendarEvent): CalendarEvent {
  const subSeries = String(ev.subSeries || ev.series || "").toLowerCase();
  const series = String(ev.series || "").toLowerCase();

  return {
    title: ev.title,
    start: ev.start,
    end: ev.end ?? undefined,
    className: CLASS_MAP[subSeries] ?? CLASS_MAP[series] ?? `${series}-event`,
    extendedProps: {
      session: ev.type,
      type: ev.type,
      subSeries: subSeries || series,
      meta: {
        round: ev.round?.name || ev.title,
        roundId: ev.round?.id ?? null,
        name: ev.sessionName || ev.title,
        deviceTime: ev.start,
        deviceEndTime: ev.end,
        raceTime: ev.timezone !== "UTC" ? `${ev.start} (${ev.timezone})` : ev.start,
        country: ev.round?.country ?? "",
        sessionName: ev.sessionName,
        eventDateLabel: "",
        sourceUrl: ev.round?.sourceUrl ?? "",
        hasGrid: ev.round?.hasGrid ?? false,
      },
    },
  };
}

export function emptyCalendarData(): AllCalendarData {
  return {
    motoGpData: [],
    wsbkData: [],
    bsbData: [],
    fimSpeedwayData: [],
    formula1Data: [],
  };
}

export async function fetchCalendarData(
  year: number,
  racesOnly: boolean,
  filters?: { series?: string[]; subSeries?: string[] }
): Promise<AllCalendarData> {
  const events = await fetchCalendarEvents({
    year,
    series: filters?.series,
    subSeries: filters?.subSeries,
    types: racesOnly ? ["RACE"] : undefined,
  });

  const motoGpData: CalendarEvent[] = [];
  const wsbkData: CalendarEvent[] = [];
  const bsbData: CalendarEvent[] = [];
  const fimSpeedwayData: CalendarEvent[] = [];
  const formula1Data: CalendarEvent[] = [];

  for (const ev of events) {
    const mapped = toFullCalendarEvent(ev);
    switch (ev.series) {
      case "motogp":
        motoGpData.push(mapped);
        break;
      case "wsbk":
        wsbkData.push(mapped);
        break;
      case "bsb":
        bsbData.push(mapped);
        break;
      case "speedway":
        fimSpeedwayData.push(mapped);
        break;
      case "f1":
        formula1Data.push(mapped);
        break;
    }
  }

  return {
    motoGpData,
    wsbkData,
    bsbData,
    fimSpeedwayData,
    formula1Data,
  };
}
