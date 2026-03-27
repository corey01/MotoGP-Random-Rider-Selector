"use client";

import { Fragment, useEffect, useRef, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  groupApiCalendarEventsByRound,
  toCalendarSessionFromApiEvent,
  type ApiCalendarEvent,
  type CalendarRound,
  type CalendarSession,
} from "@/utils/getCalendarData";
import { EventDetailPanel } from "@/app/_components/Calendar/EventDetailPanel";
import style from "./UpcomingEvents.module.scss";

const SUB_SERIES_LABELS: Record<string, string> = {
  motogp: "MotoGP",
  moto2: "Moto2",
  moto3: "Moto3",
  worldsbk: "WorldSBK",
  worldssp: "WorldSSP",
  worldwcr: "WorldWCR",
  worldspb: "WorldSPB",
  f1: "F1",
  bsb: "BSB",
  speedway: "Speedway",
  gtwce: "GTWCE",
  baggers: "Baggers",
};

const SERIES_LABELS: Record<string, string> = {
  motogp: "MotoGP",
  wsbk: "WorldSBK",
  f1: "Formula 1",
  bsb: "BSB",
  speedway: "FIM Speedway",
  gtwce: "GT World Challenge",
};

const SERIES_COLORS: Record<string, string> = {
  motogp: "var(--motogp-red)",
  wsbk: "var(--wsbk-blue)",
  bsb: "var(--bsb-green)",
  speedway: "var(--speedway-orange)",
  f1: "var(--f1-red)",
  gtwce: "var(--gtwce-gold)",
};

const EVENT_BUFFER_MS: Record<string, number> = {
  RACE: 2 * 60 * 60 * 1000,
  QUALIFYING: 60 * 60 * 1000,
  PRACTICE: 60 * 60 * 1000,
  SESSION: 45 * 60 * 1000,
};

function isEventOver(ev: ApiCalendarEvent, now: Date): boolean {
  const nowMs = now.getTime();
  if (ev.end) return new Date(ev.end).getTime() < nowMs;
  const buffer = EVENT_BUFFER_MS[ev.type.toUpperCase()] ?? 60 * 60 * 1000;
  return new Date(ev.start).getTime() + buffer < nowMs;
}

function isEventActive(ev: ApiCalendarEvent, now: Date): boolean {
  return new Date(ev.start).getTime() <= now.getTime() && !isEventOver(ev, now);
}

const SMALL_WORDS = new Set([
  "a", "an", "the", "and", "but", "or", "for", "nor",
  "on", "at", "in", "to", "by", "of", "with", "from", "as",
]);

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word, i) => {
      if (i > 0 && SMALL_WORDS.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function getTimezoneLabel(): string {
  const offset = -new Date().getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const abs = Math.abs(offset);
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;
  return mins === 0
    ? `GMT${sign}${hours}`
    : `GMT${sign}${hours}:${String(mins).padStart(2, "0")}`;
}

function formatDuration(start: string, end: string | null): string | null {
  if (!end) return null;
  const mins = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 60000
  );
  if (mins <= 0) return null;
  if (mins < 60) return `${mins} mins`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

interface DayGroup {
  date: string;
  dayNum: string;
  dayName: string;
  monthYear: string;
  events: ApiCalendarEvent[];
}

interface UpcomingEventsProps {
  events: ApiCalendarEvent[];
}

export function UpcomingEvents({ events }: UpcomingEventsProps) {
  const [activeSeries, setActiveSeries] = useState<string>("all");
  const [racesOnly, setRacesOnly] = useState(true);
  const [filterHeight, setFilterHeight] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<{
    session: CalendarSession;
    round: CalendarRound;
  } | null>(null);
  const [now, setNow] = useState(() => new Date());
  const filterRef = useRef<HTMLDivElement>(null);

  const HEADER_HEIGHT = 52;

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = filterRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setFilterHeight(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const todayStr = format(now, "yyyy-MM-dd");

  const allEvents = events;

  const seriesOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const ev of allEvents) seen.add(ev.series);
    return Array.from(seen).sort();
  }, [allEvents]);

  const tzLabel = useMemo(() => getTimezoneLabel(), []);
  const eventDetailsById = useMemo(() => {
    const lookup = new Map<string, { session: CalendarSession; round: CalendarRound }>();

    for (const round of groupApiCalendarEventsByRound(allEvents)) {
      for (const session of round.events) {
        lookup.set(session.id, { session, round });
      }
    }

    return lookup;
  }, [allEvents]);

  const days = useMemo<DayGroup[]>(() => {
    let filtered = activeSeries === "all" ? allEvents : allEvents.filter((ev) => ev.series === activeSeries);
    if (racesOnly) filtered = filtered.filter((ev) => ev.type === "RACE");
    const map = new Map<string, ApiCalendarEvent[]>();
    for (const ev of filtered) {
      const date = ev.start.slice(0, 10);
      if (!map.has(date)) map.set(date, []);
      map.get(date)!.push(ev);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .filter(([date]) => date >= todayStr)
      .map(([date, evs]) => {
        const parsed = parseISO(date);
        return {
          date,
          dayNum: format(parsed, "d"),
          dayName: format(parsed, "EEEE").toUpperCase(),
          monthYear: format(parsed, "MMMM yyyy").toUpperCase(),
          events: [...evs].sort(
            (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
          ),
        };
      });
  }, [allEvents, activeSeries, racesOnly, todayStr]);

  const openEventDetail = (event: ApiCalendarEvent) => {
    const existing = eventDetailsById.get(event.id);

    if (existing) {
      setSelectedEvent(existing);
      return;
    }

    const [fallbackRound] = groupApiCalendarEventsByRound([event]);
    if (!fallbackRound) return;

    setSelectedEvent({
      session: toCalendarSessionFromApiEvent(event),
      round: fallbackRound,
    });
  };

  return (
    <>
      <div className={style.root}>
        <div className={style.header}>
          <span className={style.title}>Weekend Feed</span>
          <span className={style.tz}>Times in local ({tzLabel})</span>
        </div>

        <div className={style.filterRow} ref={filterRef}>
          <div className={style.filters}>
            <button
              className={`${style.filterBtn} ${activeSeries === "all" ? style.filterBtnActive : ""}`}
              onClick={() => setActiveSeries("all")}
            >
              All Series
            </button>
            {seriesOptions.map((s) => (
              <button
                key={s}
                className={`${style.filterBtn} ${activeSeries === s ? style.filterBtnActive : ""}`}
                onClick={() => setActiveSeries(s)}
              >
                {SERIES_LABELS[s] ?? s}
              </button>
            ))}
          </div>
          <button
            className={`${style.racesToggle} ${racesOnly ? style.racesToggleActive : ""}`}
            onClick={() => setRacesOnly((v) => !v)}
          >
            Races only
            <span className={style.toggleTrack}>
              <span className={style.toggleKnob} />
            </span>
          </button>
        </div>

        {days.length === 0 ? (
          <div className={style.empty}>
            <p>No events this weekend.</p>
          </div>
        ) : (
          <div className={style.list}>
            {days.map((day) => (
              <div key={day.date} className={style.day}>
                <div className={style.dayHeader} style={{ top: HEADER_HEIGHT + filterHeight - 1 }}>
                  <span className={style.dayNum}>{day.dayNum}</span>
                  <div className={style.dayMeta}>
                    <span className={style.dayName}>{day.dayName}</span>
                    <span className={style.monthYear}>{day.monthYear}</span>
                  </div>
                </div>

                <div className={style.sessions}>
                  {day.events.map((ev, index) => {
                    const isToday = day.date === todayStr;
                    const past = isToday && isEventOver(ev, now);
                    const active = isToday && isEventActive(ev, now);
                    const prevPast = isToday && index > 0 && isEventOver(day.events[index - 1], now);
                    const showNowLine = prevPast && !past && !active;

                    const seriesColor = SERIES_COLORS[ev.series] ?? "#555";
                    const subLabel = SUB_SERIES_LABELS[ev.subSeries] ?? ev.subSeries.toUpperCase();
                    const prefix = `${subLabel} - `;
                    const rawSession = ev.sessionName || ev.type;
                    const sessionLabel = rawSession.startsWith(prefix)
                      ? rawSession.slice(prefix.length).toUpperCase()
                      : rawSession.toUpperCase();
                    const roundName = toTitleCase(ev.round.name);
                    const isLive = ev.status?.toLowerCase() === "live";
                    const isRace = ev.type === "RACE";
                    const duration = formatDuration(ev.start, ev.end);

                    return (
                      <Fragment key={ev.id}>
                        {showNowLine && (
                          <div className={style.nowLine}>
                            <span>Now</span>
                          </div>
                        )}
                        <button
                          type="button"
                          className={`${style.session} ${past ? style.sessionPast : ""} ${selectedEvent?.session.id === ev.id ? style.sessionSelected : ""}`}
                          onClick={() => openEventDetail(ev)}
                        >
                          {active && (
                            <div className={style.nowBar}>
                              <span>Now</span>
                            </div>
                          )}
                          {isRace && (
                            <div className={style.sessionAccent} style={{ background: seriesColor }} />
                          )}
                          <div className={style.sessionContent}>
                            <div className={style.sessionLeft}>
                              {!past && (
                                <span className={style.sessionMeta}>
                                  {[roundName, ev.round.circuit].filter(Boolean).join(" • ")}
                                </span>
                              )}
                              <span className={style.roundName}>{subLabel} • {sessionLabel}</span>
                            </div>
                            <div className={style.sessionRight}>
                              <span className={style.sessionTime}>
                                {format(parseISO(ev.start), "HH:mm")}
                              </span>
                              {!past && (isLive ? (
                                <span className={style.sessionSub} style={{ color: seriesColor }}>
                                  Live
                                </span>
                              ) : duration ? (
                                <span className={style.sessionSub}>{duration}</span>
                              ) : null)}
                            </div>
                          </div>
                        </button>
                      </Fragment>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedEvent && (
        <EventDetailPanel
          session={selectedEvent.session}
          round={selectedEvent.round}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </>
  );
}
