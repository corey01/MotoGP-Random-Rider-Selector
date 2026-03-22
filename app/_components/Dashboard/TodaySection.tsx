"use client";

import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { type ApiCalendarEvent } from "@/utils/getCalendarData";
import style from "./TodaySection.module.scss";

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

interface RoundGroup {
  roundId: number;
  roundName: string;
  country: string | null;
  series: string;
  seriesColor: string;
  races: ApiCalendarEvent[];
  others: ApiCalendarEvent[];
}

interface TodaySectionProps {
  events: ApiCalendarEvent[];
}

export function TodaySection({ events }: TodaySectionProps) {
  const now = Date.now();

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
              <span className={style.groupRoundName}>{group.roundName}</span>
              {group.country && (
                <span className={style.groupCountry}>{group.country}</span>
              )}
            </div>

            {/* Race sessions - visually prominent */}
            {group.races.map((ev) => {
              const isPast = new Date(ev.start).getTime() < now;
              const subLabel = SUB_SERIES_LABELS[ev.subSeries] ?? ev.subSeries;
              const sessionLabel = ev.sessionName || "Race";
              return (
                <div
                  key={ev.id}
                  className={`${style.raceRow} ${isPast ? style.past : ""}`}
                  style={{ "--series-color": group.seriesColor } as React.CSSProperties}
                >
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
                    {isPast && <span className={style.pastTag}>Done</span>}
                  </div>
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
