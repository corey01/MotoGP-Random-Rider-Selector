// Fetches calendar data from the RaceCal API.

export type CalendarView = "rounds" | "events";
export type SessionView = "races" | "all";

import { fetchWithAuth, getAccessToken } from "./auth";

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

export interface EffectiveCalendarFilters {
  series: string[];
  subSeries: string[];
}

export interface CalendarSession {
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
}

export interface CalendarRound {
  id: number;
  externalId?: string | null;
  name: string;
  series: string;
  subSeries: string;
  place?: string | null;
  startDate: string;
  endDate: string;
  circuit: string | null;
  country: string | null;
  number: number | null;
  hasGrid?: boolean;
  sourceUrl: string | null;
  metadata?: Record<string, unknown> | null;
  events: CalendarSession[];
}

export interface CalendarMonthPayload {
  ok: boolean;
  year: number;
  month: number;
  count: number;
  effectiveFilters: EffectiveCalendarFilters;
  rounds: CalendarRound[];
}

export interface CalendarDatePayload {
  ok: boolean;
  date: string;
  count: number;
  effectiveFilters: EffectiveCalendarFilters;
  rounds: CalendarRound[];
}

export interface CalendarRoundPayload {
  ok: boolean;
  round: CalendarRound | null;
}

// The shape FullCalendar expects
export interface CalendarRoundEvent {
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  display?: "auto" | "block" | "list-item";
  className: string;
  extendedProps?: {
    session?: string;
    sessionId?: string;
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

const SESSION_SERIES_PREFIX: Record<string, string> = {
  motogp: "MotoGP",
  moto2: "Moto2",
  moto3: "Moto3",
  bsb: "BSB",
  baggers: "Baggers",
  speedway: "Speedway",
  f1: "F1",
  gtwce: "GT WCE",
  iomtt: "IoMTT",
  nls: "NLS",
};

const ROUND_SERIES_PREFIX: Record<string, string> = {
  motogp: "MotoGP",
  moto2: "Moto2",
  moto3: "Moto3",
  wsbk: "WSBK",
  worldsbk: "WSBK",
  worldssp: "WSBK",
  worldwcr: "WSBK",
  worldspb: "WSBK",
  bsb: "BSB",
  baggers: "Baggers",
  speedway: "Speedway",
  f1: "F1",
  gtwce: "GT WCE",
  iomtt: "IoMTT",
  nls: "NLS",
};

const prefixSessionTitle = (title: string, subSeries: string): string => {
  const prefix = SESSION_SERIES_PREFIX[subSeries];
  if (!prefix) return title;
  if (title.toLowerCase().startsWith(`${prefix.toLowerCase()} - `)) return title;
  return `${prefix} - ${title}`;
};

const prefixRoundTitle = (title: string, subSeries: string, series: string): string => {
  const prefix = ROUND_SERIES_PREFIX[subSeries] ?? ROUND_SERIES_PREFIX[series];
  if (!prefix) return title;
  if (title.toLowerCase().startsWith(`${prefix.toLowerCase()} - `)) return title;
  return `${prefix} - ${title}`;
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
  gtwce: "gtwce-event",
  iomtt: "iomtt-event",
  nls: "nls-event",
};

const getBaseUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_RACECAL_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_RACECAL_URL is not set");
  return baseUrl.replace(/\/$/, "");
};

const emptyEffectiveFilters = (): EffectiveCalendarFilters => ({
  series: [],
  subSeries: [],
});

const toQueryValue = (value?: string[]) =>
  value
    ?.map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(",");

const appendCalendarFilters = (
  params: URLSearchParams,
  filters?: { series?: string[]; subSeries?: string[] }
) => {
  const seriesValue = toQueryValue(filters?.series);
  if (seriesValue) params.set("series", seriesValue);

  const subSeriesValue = toQueryValue(filters?.subSeries);
  if (subSeriesValue) params.set("subSeries", subSeriesValue);
};

async function fetchCalendarResource(path: string): Promise<Response> {
  if (typeof window !== "undefined") {
    try {
      if (getAccessToken()) {
        return await fetchWithAuth(path, { cache: "no-store" });
      }
    } catch {
      // Fall back to an unauthenticated request when the user has no token.
    }
  }

  return fetch(`${getBaseUrl()}${path}`, { cache: "no-store" });
}

const toEffectiveFilters = (
  value?: Partial<EffectiveCalendarFilters> | null
): EffectiveCalendarFilters => ({
  series: Array.isArray(value?.series) ? value!.series.filter(Boolean) : [],
  subSeries: Array.isArray(value?.subSeries) ? value!.subSeries.filter(Boolean) : [],
});

const toCalendarDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toExclusiveEndDate = (date: string) => {
  const endDate = new Date(`${date}T12:00:00Z`);
  endDate.setUTCDate(endDate.getUTCDate() + 1);
  return endDate.toISOString().slice(0, 10);
};

type FetchCalendarEventsArgs = {
  year: number;
  series?: string[];
  subSeries?: string[];
  types?: string[];
};

type FetchCalendarMonthArgs = {
  year: number;
  month: number;
  series?: string[];
  subSeries?: string[];
};

type FetchCalendarDateArgs = {
  date: Date | string;
  series?: string[];
  subSeries?: string[];
  types?: string[];
};

type RawCalendarMonthRound = {
  id?: number;
  roundId?: number;
  externalId?: string | null;
  name?: string;
  roundName?: string;
  series?: string;
  subSeries?: string;
  place?: string | null;
  circuit?: string | null;
  country?: string | null;
  number?: number | null;
  sourceUrl?: string | null;
  hasGrid?: boolean;
  startDate?: string;
  endDate?: string;
  metadata?: unknown;
  events?: RawCalendarSession[];
};

type RawCalendarSession = {
  id?: string | number;
  title?: string;
  sessionName?: string;
  start?: string;
  end?: string | null;
  timezone?: string;
  series?: string;
  subSeries?: string;
  type?: string;
  status?: string;
};

const toDateOnly = (value?: string | null) => String(value || "").slice(0, 10);

const normalizeRoundMetadata = (metadata: unknown): Record<string, unknown> | null => {
  if (!metadata) return null;

  if (typeof metadata === "string") {
    try {
      const parsed = JSON.parse(metadata);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }

  return metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? (metadata as Record<string, unknown>)
    : null;
};

const sortSessions = (sessions: CalendarSession[]) =>
  [...sessions].sort((left, right) => new Date(left.start).getTime() - new Date(right.start).getTime());

const toCalendarSession = (event: RawCalendarSession): CalendarSession => ({
  id: String(event.id ?? ""),
  title: String(event.title ?? event.sessionName ?? event.type ?? ""),
  sessionName: String(event.sessionName ?? event.title ?? event.type ?? ""),
  start: String(event.start ?? ""),
  end: event.end ?? null,
  timezone: String(event.timezone ?? "UTC"),
  series: String(event.series ?? ""),
  subSeries: String(event.subSeries ?? event.series ?? ""),
  type: String(event.type ?? ""),
  status: String(event.status ?? ""),
});

const toCalendarRound = (
  round: RawCalendarMonthRound,
  events: CalendarSession[] = []
): CalendarRound => {
  const sortedEvents = sortSessions(events);
  const firstEvent = sortedEvents[0];
  const lastEvent = sortedEvents[sortedEvents.length - 1];

  return {
    id: Number(round.id ?? round.roundId ?? 0),
    externalId: round.externalId ?? null,
    name: String(round.name ?? round.roundName ?? firstEvent?.title ?? ""),
    series: String(round.series ?? firstEvent?.series ?? ""),
    subSeries: String(round.subSeries ?? firstEvent?.subSeries ?? firstEvent?.series ?? round.series ?? ""),
    place: round.place ?? null,
    startDate: String(
      round.startDate ??
        toDateOnly(firstEvent?.start) ??
        ""
    ),
    endDate: String(
      round.endDate ??
        toDateOnly(lastEvent?.end || lastEvent?.start) ??
        ""
    ),
    circuit: round.circuit ?? null,
    country: round.country ?? null,
    number: round.number ?? null,
    hasGrid: round.hasGrid ?? false,
    sourceUrl: round.sourceUrl ?? null,
    metadata: normalizeRoundMetadata(round.metadata),
    events: sortedEvents,
  };
};

const groupApiCalendarEvents = (events: ApiCalendarEvent[]): CalendarRound[] => {
  const roundMap = new Map<string, ApiCalendarEvent[]>();

  for (const event of events) {
    const roundId = Number(event.round?.id ?? 0);
    const roundKey = roundId > 0 ? `round:${roundId}` : `event:${event.id}`;
    const existing = roundMap.get(roundKey);
    if (existing) {
      existing.push(event);
    } else {
      roundMap.set(roundKey, [event]);
    }
  }

  return Array.from(roundMap.values())
    .map((roundEvents) => {
      const sortedEvents = roundEvents.sort(
        (left, right) => new Date(left.start).getTime() - new Date(right.start).getTime()
      );
      const firstEvent = sortedEvents[0];
      const lastEvent = sortedEvents[sortedEvents.length - 1];

      return toCalendarRound(
        {
          id: firstEvent.round?.id,
          name: firstEvent.round?.name,
          series: firstEvent.series,
          subSeries: firstEvent.subSeries,
          place: null,
          circuit: firstEvent.round?.circuit ?? null,
          country: firstEvent.round?.country ?? null,
          number: firstEvent.round?.number ?? null,
          sourceUrl: firstEvent.round?.sourceUrl ?? null,
          hasGrid: firstEvent.round?.hasGrid ?? false,
          startDate: toDateOnly(firstEvent.start),
          endDate: toDateOnly(lastEvent.end || lastEvent.start),
        },
        sortedEvents.map((event) => toCalendarSession(event))
      );
    })
    .sort((left, right) => new Date(left.startDate).getTime() - new Date(right.startDate).getTime());
};

const normalizeMonthRounds = (rounds?: RawCalendarMonthRound[] | null): CalendarRound[] =>
  Array.isArray(rounds)
    ? rounds.map((round) =>
        toCalendarRound(
          round,
          Array.isArray(round.events) ? round.events.map(toCalendarSession) : []
        )
      )
    : [];

const normalizeDateRounds = (
  payload: Partial<CalendarDatePayload> & { events?: ApiCalendarEvent[]; rounds?: RawCalendarMonthRound[] }
): CalendarRound[] => {
  if (Array.isArray(payload.rounds)) {
    return payload.rounds.map((round) =>
      toCalendarRound(
        round,
        Array.isArray(round.events) ? round.events.map((event) => toCalendarSession(event)) : []
      )
    );
  }

  if (Array.isArray(payload.events)) {
    return groupApiCalendarEvents(payload.events);
  }

  return [];
};

export async function fetchCalendarEvents({
  year,
  series,
  subSeries,
  types,
}: FetchCalendarEventsArgs): Promise<ApiCalendarEvent[]> {
  const params = new URLSearchParams();
  params.set("year", String(year));

  appendCalendarFilters(params, { series, subSeries });

  const typesValue = toQueryValue(types);
  if (typesValue) params.set("type", typesValue);

  const url = `${getBaseUrl()}/calendar-events?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`calendar-events failed (${res.status})`);

  const payload = (await res.json()) as { events?: ApiCalendarEvent[] };
  return payload?.events ?? [];
}

export async function fetchCalendarMonth({
  year,
  month,
  series,
  subSeries,
}: FetchCalendarMonthArgs): Promise<CalendarMonthPayload> {
  const params = new URLSearchParams();
  params.set("year", String(year));
  params.set("month", String(month));
  appendCalendarFilters(params, { series, subSeries });

  const res = await fetchCalendarResource(`/calendar/month?${params.toString()}`);
  if (!res.ok) throw new Error(`calendar month failed (${res.status})`);

  const payload = (await res.json()) as Partial<CalendarMonthPayload>;

  return {
    ok: Boolean(payload.ok),
    year: Number(payload.year ?? year),
    month: Number(payload.month ?? month),
    count: Number(payload.count ?? 0),
    effectiveFilters: toEffectiveFilters(payload.effectiveFilters),
    rounds: normalizeMonthRounds(payload.rounds as RawCalendarMonthRound[] | undefined),
  };
}

export async function fetchCalendarDate({
  date,
  series,
  subSeries,
  types,
}: FetchCalendarDateArgs): Promise<CalendarDatePayload> {
  const params = new URLSearchParams();
  params.set("date", typeof date === "string" ? date : toCalendarDateValue(date));
  appendCalendarFilters(params, { series, subSeries });

  const typesValue = toQueryValue(types);
  if (typesValue) params.set("types", typesValue);

  const res = await fetchCalendarResource(`/calendar/date?${params.toString()}`);
  if (!res.ok) throw new Error(`calendar date failed (${res.status})`);

  const payload = (await res.json()) as Partial<CalendarDatePayload> & {
    events?: ApiCalendarEvent[];
    rounds?: RawCalendarMonthRound[];
  };

  return {
    ok: Boolean(payload.ok),
    date: String(payload.date ?? params.get("date") ?? ""),
    count: Array.isArray(payload.rounds)
      ? payload.rounds.length
      : Number(payload.count ?? 0),
    effectiveFilters: toEffectiveFilters(payload.effectiveFilters),
    rounds: normalizeDateRounds(payload),
  };
}

export async function fetchRoundById(roundId: number): Promise<CalendarRoundPayload> {
  const res = await fetchCalendarResource(`/rounds/${roundId}`);
  if (!res.ok) throw new Error(`round failed (${res.status})`);

  const payload = (await res.json()) as Partial<CalendarRoundPayload> & {
    sessions?: RawCalendarSession[];
    round?: RawCalendarMonthRound | null;
  };

  return {
    ok: Boolean(payload.ok),
    round: payload.round
      ? toCalendarRound(
          payload.round,
          Array.isArray(payload.round.events)
            ? payload.round.events.map((event) => toCalendarSession(event))
            : Array.isArray(payload.sessions)
              ? payload.sessions.map((event) => toCalendarSession(event))
              : []
        )
      : null,
  };
}

export function emptyEffectiveCalendarFilters(): EffectiveCalendarFilters {
  return emptyEffectiveFilters();
}

export function toCalendarSessionFromApiEvent(event: ApiCalendarEvent): CalendarSession {
  return toCalendarSession(event);
}

export function groupApiCalendarEventsByRound(events: ApiCalendarEvent[]): CalendarRound[] {
  return groupApiCalendarEvents(events);
}

export function toFullCalendarSessionEvent(
  session: CalendarSession,
  round: CalendarRound
): CalendarRoundEvent {
  const subSeries = String(session.subSeries || round.subSeries || round.series || "").toLowerCase();
  const series = String(session.series || round.series || "").toLowerCase();

  return {
    title: prefixSessionTitle(session.sessionName || session.title || session.type, subSeries),
    start: session.start,
    end: session.end ?? undefined,
    allDay: false,
    className: CLASS_MAP[subSeries] ?? CLASS_MAP[series] ?? `${series}-event`,
    extendedProps: {
      session: session.sessionName,
      sessionId: session.id,
      type: session.type,
      subSeries: subSeries || series,
      meta: {
        round: round.name,
        roundId: round.id ?? null,
        name: round.name,
        deviceTime: session.start,
        deviceEndTime: session.end ?? null,
        raceTime: session.start,
        country: round.country ?? "",
        sessionName: session.sessionName,
        eventDateLabel: "",
        sourceUrl: round.sourceUrl ?? "",
        hasGrid: round.hasGrid ?? false,
      },
    },
  };
}

export function toFullCalendarRoundEvent(round: CalendarRound): CalendarRoundEvent {
  const subSeries = String(round.subSeries || round.series || "").toLowerCase();
  const series = String(round.series || "").toLowerCase();
  const baseClassName = CLASS_MAP[subSeries] ?? CLASS_MAP[series] ?? `${series}-event`;
  const isSingleDayRound = round.startDate === round.endDate;

  return {
    title: prefixRoundTitle(round.name, subSeries, series),
    start: round.startDate,
    end: toExclusiveEndDate(round.endDate),
    allDay: true,
    display: isSingleDayRound ? "list-item" : "block",
    className: isSingleDayRound ? `${baseClassName} single-day-round` : baseClassName,
    extendedProps: {
      subSeries: subSeries || series,
      meta: {
        round: round.name,
        roundId: round.id ?? null,
        name: round.name,
        deviceTime: round.startDate,
        deviceEndTime: round.endDate,
        raceTime: round.startDate,
        country: round.country ?? "",
        sessionName: round.name,
        eventDateLabel: "",
        sourceUrl: round.sourceUrl ?? "",
        hasGrid: round.hasGrid ?? false,
      },
    },
  };
}
