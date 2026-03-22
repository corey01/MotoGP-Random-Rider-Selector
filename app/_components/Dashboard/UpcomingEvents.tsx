"use client";

import { useMemo } from "react";
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
};

const SERIES_COLORS: Record<string, string> = {
  motogp: "var(--motogp-red)",
  wsbk: "var(--wsbk-blue)",
  bsb: "var(--bsb-green)",
  speedway: "var(--speedway-orange)",
  f1: "var(--f1-red)",
};

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
            {group.events.map((ev) => {
              const isRace = ev.type === "RACE";
              const subLabel = SUB_SERIES_LABELS[ev.subSeries] ?? ev.subSeries;
              const seriesLabel = SUB_SERIES_LABELS[ev.series] ?? ev.series;
              const showSubChip = subLabel !== seriesLabel;
              return (
                <div
                  key={ev.id}
                  className={`${style.session} ${isRace ? style.sessionRace : ""}`}
                >
                  <div className={style.sessionLeft}>
                    {showSubChip && (
                      <span className={style.subChip}>{subLabel}</span>
                    )}
                    <span className={style.sessionName}>{ev.sessionName || ev.type}</span>
                  </div>
                  <span className={style.sessionTime}>
                    {format(parseISO(ev.start), "EEE d MMM, HH:mm")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
