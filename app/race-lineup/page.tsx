"use client";

import { useEffect, useMemo, useState } from "react";
import { RaceLineup } from "../_components/RaceLineup/RaceLineup";
import type { Race, Season } from "@/models/race";
import { fetchCalendarEvents, type ApiCalendarEvent } from "@/utils/getCalendarData";

const defaultSeason: Season = {
  past: [],
  current: [],
  future: [],
};

const subSeriesLabel = (subSeries?: string | null) => {
  const value = String(subSeries || "").toLowerCase();
  if (value === "motogp") return "MotoGP";
  if (value === "moto2") return "Moto2";
  if (value === "moto3") return "Moto3";
  return value ? value.toUpperCase() : "MotoGP";
};

const parseDateSafe = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const classifyRaceStatus = (startRaw: string, endRaw: string) => {
  const now = Date.now();
  const start = parseDateSafe(startRaw)?.getTime();
  const end = parseDateSafe(endRaw)?.getTime();

  if (!start || !end) return "UPCOMING";
  if (end < now) return "FINISHED";
  if (start <= now && now <= end) return "CURRENT";
  return "UPCOMING";
};

const buildRaces = (events: ApiCalendarEvent[]): Race[] => {
  const grouped = new Map<string, ApiCalendarEvent[]>();

  for (const event of events) {
    const key = String(event.round?.id ?? `${event.round?.name || "round"}:${event.id}`);
    const existing = grouped.get(key);
    if (existing) {
      existing.push(event);
    } else {
      grouped.set(key, [event]);
    }
  }

  return Array.from(grouped.values())
    .map((group): Race | null => {
      const sorted = [...group].sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
      );
      if (!sorted.length) return null;

      const first = sorted[0];
      const starts = sorted.map((event) => parseDateSafe(event.start)?.getTime() || 0).filter(Boolean);
      const ends = sorted.map((event) => parseDateSafe(event.end)?.getTime() || parseDateSafe(event.start)?.getTime() || 0).filter(Boolean);

      const minStart = starts.length ? new Date(Math.min(...starts)).toISOString() : first.start;
      const maxEnd = ends.length ? new Date(Math.max(...ends)).toISOString() : first.end || first.start;

      return {
        name: first.round?.name || first.title || "Grand Prix",
        country: first.round?.country || "",
        url: first.round?.sourceUrl || first.round?.circuit || "",
        status: classifyRaceStatus(minStart, maxEnd),
        date_start: minStart,
        date_end: maxEnd,
        circuit: {
          circuitName: first.round?.circuit || "",
          circuitCountry: first.round?.country || "",
          city: "",
          length: {
            miles: 0,
            kilometers: 0,
          },
          simpleCircuitPath: "",
          fullCircuitPath: "",
        },
        broadcasts: sorted.map((event) => ({
          date_end: event.end || event.start,
          date_start: event.start,
          eventName: subSeriesLabel(event.subSeries),
          kind: event.type,
          name: event.sessionName || event.type,
          status: event.status,
          type: event.type,
        })),
      };
    })
    .filter((race): race is Race => !!race)
    .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime());
};

export default function RaceLineupPage() {
  const [season, setSeason] = useState<Season>(defaultSeason);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const year = Number(
          process.env.NEXT_PUBLIC_MOTOGP_SEASON_YEAR || new Date().getFullYear()
        );
        const events = await fetchCalendarEvents({ year, series: ["motogp"] });
        const races = buildRaces(events);

        if (cancelled) return;

        const nextSeason: Season = {
          past: races.filter((race) => race.status === "FINISHED"),
          current: races.filter((race) => race.status === "CURRENT"),
          future: races.filter((race) => race.status !== "FINISHED" && race.status !== "CURRENT"),
        };
        setSeason(nextSeason);
      } catch {
        if (!cancelled) setSeason(defaultSeason);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const currentRace = season.current;
  const sortedFutureRaces = useMemo(
    () =>
      [...season.future].sort((a, b) => {
        return new Date(a.date_start).valueOf() - new Date(b.date_start).valueOf();
      }),
    [season.future]
  );

  const races = [...currentRace, ...sortedFutureRaces];

  return (
    <RaceLineup
      season={season}
      races={races}
      currentRaceName={currentRace[0]?.name || undefined}
    />
  );
}
