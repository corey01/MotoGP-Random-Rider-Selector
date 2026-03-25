"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { type ApiCalendarEvent } from "@/utils/getCalendarData";
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
  gtwce: "#e8a000",
};

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
  const [racesOnly, setRacesOnly] = useState(false);
  const [filterHeight, setFilterHeight] = useState(0);
  const filterRef = useRef<HTMLDivElement>(null);

  const HEADER_HEIGHT = 52;

  useEffect(() => {
    const el = filterRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setFilterHeight(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const seriesOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const ev of events) seen.add(ev.series);
    return Array.from(seen).sort();
  }, [events]);

  const tzLabel = useMemo(() => getTimezoneLabel(), []);

  const days = useMemo<DayGroup[]>(() => {
    let filtered = activeSeries === "all" ? events : events.filter((ev) => ev.series === activeSeries);
    if (racesOnly) filtered = filtered.filter((ev) => ev.type === "RACE");
    const map = new Map<string, ApiCalendarEvent[]>();
    for (const ev of filtered) {
      const date = ev.start.slice(0, 10);
      if (!map.has(date)) map.set(date, []);
      map.get(date)!.push(ev);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
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
  }, [events, activeSeries, racesOnly]);

  return (
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
              <div className={style.dayHeader} style={{ top: HEADER_HEIGHT + filterHeight }}>
                <span className={style.dayNum}>{day.dayNum}</span>
                <div className={style.dayMeta}>
                  <span className={style.dayName}>{day.dayName}</span>
                  <span className={style.monthYear}>{day.monthYear}</span>
                </div>
              </div>

              <div className={style.sessions}>
                {day.events.map((ev) => {
                  const seriesColor = SERIES_COLORS[ev.series] ?? "#555";
                  const subLabel = SUB_SERIES_LABELS[ev.subSeries] ?? ev.subSeries.toUpperCase();
                  const seriesLabel = (SERIES_LABELS[ev.series] ?? ev.series).toUpperCase();
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
                    <div key={ev.id} className={style.session}>
                      {isRace && (
                        <div className={style.sessionAccent} style={{ background: seriesColor }} />
                      )}
                      <div className={style.sessionContent}>
                        <div className={style.sessionLeft}>
                          <span className={style.sessionMeta}>
                            {roundName} • {ev.round.circuit}
                          </span>
                          <span className={style.roundName}>{subLabel} • {sessionLabel}</span>
                        </div>
                        <div className={style.sessionRight}>
                          <span className={style.sessionTime}>
                            {format(parseISO(ev.start), "HH:mm")}
                          </span>
                          {isLive ? (
                            <span className={style.sessionSub} style={{ color: seriesColor }}>
                              Live
                            </span>
                          ) : duration ? (
                            <span className={style.sessionSub}>{duration}</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
