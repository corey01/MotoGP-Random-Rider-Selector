"use client";

import { useMemo, useState } from "react";
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

// Series that always get a colored badge (using the sub-series label for specificity)
const COLORED_BADGE_SERIES = new Set(["motogp", "wsbk", "f1"]);

// Prefixed to the round name for context
const ROUND_PREFIX: Record<string, string> = {
  motogp: "MotoGP",
  wsbk: "WorldSBK",
  f1: "Formula 1",
  bsb: "BSB",
  speedway: "FIM Speedway",
};

const SERIES_COLORS: Record<string, string> = {
  motogp: "var(--motogp-red)",
  wsbk: "var(--wsbk-blue)",
  bsb: "var(--bsb-green)",
  speedway: "var(--speedway-orange)",
  f1: "var(--f1-red)",
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

function formatRoundName(series: string, roundName: string): string {
  const prefix = ROUND_PREFIX[series];
  const titled = toTitleCase(roundName);
  return prefix ? `${prefix} ${titled}` : titled;
}

interface UpcomingEventsProps {
  allEvents: ApiCalendarEvent[];
  raceEvents: ApiCalendarEvent[];
}

interface DayGroup {
  date: string;
  label: string;
  events: ApiCalendarEvent[];
}

export function UpcomingEvents({ allEvents, raceEvents }: UpcomingEventsProps) {
  const [racesOnly, setRacesOnly] = useState(true);

  const days = useMemo<DayGroup[]>(() => {
    const filtered = racesOnly ? raceEvents : allEvents;
    const map = new Map<string, ApiCalendarEvent[]>();
    for (const ev of filtered) {
      const date = ev.start.slice(0, 10);
      if (!map.has(date)) map.set(date, []);
      map.get(date)!.push(ev);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, evs]) => ({
        date,
        label: format(parseISO(date), "EEEE d MMM").toUpperCase(),
        events: [...evs].sort(
          (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
        ),
      }));
  }, [allEvents, raceEvents, racesOnly]);

  return (
    <div className={style.root}>
      <div className={style.toolbar}>
        <button
          className={`${style.filterBtn} ${racesOnly ? style.filterBtnActive : ""}`}
          onClick={() => setRacesOnly((v) => !v)}
        >
          Races only
        </button>
      </div>

      {days.length === 0 ? (
        <div className={style.empty}>
          <p>No upcoming events. Adjust your series subscriptions to see events here.</p>
        </div>
      ) : (
        <div className={style.list}>
          {days.map((day) => (
            <div key={day.date} className={style.day}>
              <h3 className={style.dayHeader}>{day.label}</h3>
              <div className={style.sessions}>
                {day.events.map((ev) => {
                  const seriesColor = SERIES_COLORS[ev.series] ?? "#555";
                  const subLabel = SUB_SERIES_LABELS[ev.subSeries] ?? ev.subSeries;
                  const seriesLabel = SUB_SERIES_LABELS[ev.series] ?? ev.series;
                  const useColoredBadge = COLORED_BADGE_SERIES.has(ev.series);
                  const showSubChip = !useColoredBadge && subLabel !== seriesLabel;
                  const prefix = subLabel + " - ";
                  const sessionName = ev.sessionName.startsWith(prefix)
                    ? ev.sessionName.slice(prefix.length)
                    : ev.sessionName;
                  const roundName = formatRoundName(ev.series, ev.round.name);
                  const isRace = ev.type === "RACE";
                  return (
                    <div
                      key={ev.id}
                      className={`${style.session} ${isRace ? style.sessionRace : ""}`}
                      style={{ borderLeftColor: seriesColor }}
                    >
                      <div className={style.sessionTop}>
                        {useColoredBadge && (
                          <span className={style.seriesBadge} style={{ background: seriesColor }}>
                            {subLabel}
                          </span>
                        )}
                        {showSubChip && (
                          <span className={style.subChip}>{subLabel}</span>
                        )}
                        <span className={style.sessionName}>{sessionName || ev.type}</span>
                      </div>
                      <div className={style.sessionBottom}>
                        <span className={style.roundName}>{roundName}</span>
                        <span className={style.sessionTime}>
                          {format(parseISO(ev.start), "HH:mm")}
                        </span>
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
