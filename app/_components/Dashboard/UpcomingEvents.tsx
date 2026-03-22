"use client";

import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { type ApiCalendarEvent } from "@/utils/getCalendarData";
import style from "./UpcomingEvents.module.scss";

interface UpcomingEventsProps {
  events: ApiCalendarEvent[];
}

interface RoundGroup {
  roundId: number;
  roundName: string;
  country: string | null;
  series: string;
  events: ApiCalendarEvent[];
}

const SESSION_ORDER: Record<string, number> = {
  PRACTICE: 0,
  QUALIFYING: 1,
  RACE: 2,
};

const SERIES_COLORS: Record<string, string> = {
  motogp: "var(--motogp-red)",
  wsbk: "var(--wsbk-blue)",
  bsb: "#1db954",
  speedway: "#f57c00",
  f1: "var(--f1-red)",
};

export function UpcomingEvents({ events }: UpcomingEventsProps) {
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
          events: [],
        });
      }
      map.get(id)!.events.push(ev);
    }
    // Sort groups by earliest event, events within group by session order
    return Array.from(map.values())
      .map((g) => ({
        ...g,
        events: [...g.events].sort(
          (a, b) =>
            (SESSION_ORDER[a.type] ?? 99) - (SESSION_ORDER[b.type] ?? 99) ||
            new Date(a.start).getTime() - new Date(b.start).getTime()
        ),
      }))
      .sort((a, b) => new Date(a.events[0].start).getTime() - new Date(b.events[0].start).getTime());
  }, [events]);

  if (!groups.length) {
    return (
      <div className={style.empty}>
        <p>No upcoming events. Adjust your series subscriptions to see events here.</p>
      </div>
    );
  }

  return (
    <div className={style.list}>
      {groups.map((group) => (
        <div key={group.roundId} className={style.round}>
          <div className={style.roundHeader}>
            <span
              className={style.seriesBadge}
              style={{ background: SERIES_COLORS[group.series] ?? "#555" }}
            >
              {group.series.toUpperCase()}
            </span>
            <span className={style.roundName}>{group.roundName}</span>
            {group.country && (
              <span className={style.country}>{group.country}</span>
            )}
          </div>
          <div className={style.sessions}>
            {group.events.map((ev) => (
              <div
                key={ev.id}
                className={`${style.session} ${ev.type === "RACE" ? style.sessionRace : ""}`}
              >
                <span className={style.sessionName}>{ev.sessionName || ev.type}</span>
                <span className={style.sessionTime}>
                  {format(parseISO(ev.start), "EEE d MMM, HH:mm")}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
