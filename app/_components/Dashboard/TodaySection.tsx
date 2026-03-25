"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { type ApiCalendarEvent } from "@/utils/getCalendarData";
import { fetchLiveSession, type LiveSessionData } from "@/utils/getLiveSession";
import style from "./TodaySection.module.scss";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const NINETY_MINS_MS = 90 * 60 * 1000;
const POLL_INTERVAL_MS = 10_000;

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
};

const SERIES_COLORS: Record<string, string> = {
  motogp: "var(--motogp-red)",
  wsbk: "var(--wsbk-blue)",
  bsb: "var(--bsb-green)",
  speedway: "var(--speedway-orange)",
  f1: "var(--f1-red)",
  gtwce: "var(--gtwce-gold)",
};

// Normalise a category string from the live API to a subSeries slug
// e.g. "Moto2" → "moto2", "MotoGP" → "motogp"
function categoryToSubSeries(category: string | null): string | null {
  if (!category) return null;
  return category.toLowerCase().replace(/\s/g, "");
}

interface RoundGroup {
  roundId: number;
  roundName: string;
  country: string | null;
  series: string;
  seriesColor: string;
  races: ApiCalendarEvent[];
  others: ApiCalendarEvent[];
}

// Fallback heuristic used when the live endpoint hasn't confirmed status yet
function getFallbackStatus(ev: ApiCalendarEvent, now: number): "upcoming" | "live" | "done" {
  const start = new Date(ev.start).getTime();
  if (start > now) return "upcoming";
  const isSprint = /sprint/i.test(ev.sessionName ?? "");
  const minDurationMs = isSprint ? 20 * 60_000 : 30 * 60_000;
  return now < start + minDurationMs ? "live" : "done";
}

// Returns true if we should be polling the live endpoint for this race
function isWithinLiveWindow(ev: ApiCalendarEvent, now: number): boolean {
  const start = new Date(ev.start).getTime();
  // Within 2 hours before start, or up to 90 minutes after start
  return start - now < TWO_HOURS_MS && now < start + NINETY_MINS_MS;
}

interface TodaySectionProps {
  events: ApiCalendarEvent[];
}

export function TodaySection({ events }: TodaySectionProps) {
  const [now, setNow] = useState(() => Date.now());
  const [liveData, setLiveData] = useState<LiveSessionData | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tick once per minute to keep "now" current (for upcoming/done transitions)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // All race events from today
  const raceEvents = useMemo(
    () => events.filter((ev) => ev.type === "RACE"),
    [events]
  );

  // Start/stop polling based on whether any race is within the live window
  useEffect(() => {
    const anyInWindow = raceEvents.some((ev) => isWithinLiveWindow(ev, now));

    if (!anyInWindow) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setLiveData(null);
      }
      return;
    }

    // Poll immediately, then on interval — self-terminates when all races are done
    const poll = () =>
      fetchLiveSession().then((d) => {
        if (!d) return;
        setLiveData(d);
        const allRacesDone = raceEvents.every(
          (ev) => getFallbackStatus(ev, Date.now()) === "done"
        );
        if (allRacesDone) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
        }
      });
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [raceEvents, now]);

  const groups = useMemo<RoundGroup[]>(() => {
    const map = new Map<number, RoundGroup>();
    for (const ev of events) {
      const id = ev.round.id;
      if (!map.has(id)) {
        map.set(id, {
          roundId: id,
          roundName: ev.round.name,
          country: ev.round.country ?? null,
          series: ev.series,
          seriesColor: SERIES_COLORS[ev.series] ?? "#555",
          races: [],
          others: [],
        });
      }
      const group = map.get(id)!;
      if (ev.type === "RACE") {
        group.races.push(ev);
      } else {
        group.others.push(ev);
      }
    }

    return Array.from(map.values())
      .map((g) => ({
        ...g,
        races: [...g.races].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
        others: [...g.others].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
      }))
      .sort((a, b) => {
        const aFirst = (a.races[0] ?? a.others[0])?.start ?? "";
        const bFirst = (b.races[0] ?? b.others[0])?.start ?? "";
        return new Date(aFirst).getTime() - new Date(bFirst).getTime();
      });
  }, [events]);

  if (!groups.length) return null;

  const hasRaces = groups.some((g) => g.races.length > 0);
  const liveSubSeries = liveData?.isLive ? categoryToSubSeries(liveData.category) : null;

  const getRaceStatus = (ev: ApiCalendarEvent): "upcoming" | "live" | "done" => {
    // If live endpoint confirms a specific class is live, trust it over the heuristic
    if (liveData) {
      if (liveData.isLive && liveSubSeries === ev.subSeries) return "live";
      if (liveData.isDone && liveSubSeries === ev.subSeries) return "done";
    }
    return getFallbackStatus(ev, now);
  };

  return (
    <section className={style.section}>
      <div className={style.header}>
        <h2 className={style.heading}>{hasRaces ? "Race Day" : "Today"}</h2>
        <span className={style.date}>{format(new Date(), "EEEE d MMMM")}</span>
      </div>

      <div className={style.groups}>
        {groups.map((group) => (
          <div key={group.roundId} className={style.group}>
            <div className={style.groupHeader} style={{ borderLeftColor: group.seriesColor }}>
              <span
                className={style.seriesDot}
                style={{ background: group.seriesColor }}
              />
              <Link href={`/race?roundId=${group.roundId}`} className={style.groupRoundName}>{group.roundName}</Link>
              {group.country && (
                <span className={style.groupCountry}>{group.country}</span>
              )}
            </div>

            {/* Race sessions - visually prominent */}
            {group.races.map((ev) => {
              const status = getRaceStatus(ev);
              const subLabel = SUB_SERIES_LABELS[ev.subSeries] ?? ev.subSeries;
              const sessionLabel = ev.sessionName || "Race";
              return (
                <div
                  key={ev.id}
                  className={`${style.raceRow} ${status === "done" ? style.past : ""}`}
                  style={{ "--series-color": group.seriesColor } as React.CSSProperties}
                >
                  <div className={style.raceMain}>
                    <div className={style.raceLeft}>
                      <span
                        className={style.classBadge}
                        style={{ background: group.seriesColor }}
                      >
                        {subLabel}
                      </span>
                      <span className={style.raceName}>{sessionLabel}</span>
                    </div>
                    <div className={style.raceRight}>
                      <span className={style.raceTime}>
                        {format(parseISO(ev.start), "HH:mm")}
                      </span>
                      {status === "done" && <span className={style.pastTag}>Done</span>}
                    </div>
                  </div>
                  {status === "live" && (
                    <div className={style.liveRow}>
                      <span className={style.liveTag}>
                        {liveData?.isLive && liveData.remaining > 0
                          ? `Live · ${liveData.remaining} laps remaining`
                          : "Live"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Other sessions - compact */}
            {group.others.length > 0 && (
              <div className={style.otherSessions}>
                {group.others.map((ev) => {
                  const isPast = new Date(ev.start).getTime() < now;
                  const subLabel = SUB_SERIES_LABELS[ev.subSeries] ?? ev.subSeries;
                  const seriesLabel = SUB_SERIES_LABELS[ev.series] ?? ev.series;
                  const prefix = subLabel !== seriesLabel ? `${subLabel} · ` : "";
                  return (
                    <div
                      key={ev.id}
                      className={`${style.otherRow} ${isPast ? style.past : ""}`}
                    >
                      <span className={style.otherName}>
                        {prefix}{ev.sessionName || ev.type}
                      </span>
                      <span className={style.otherTime}>
                        {format(parseISO(ev.start), "HH:mm")}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
