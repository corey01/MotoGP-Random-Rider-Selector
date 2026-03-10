"use client";

import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchCalendarEvents, type ApiCalendarEvent } from "@/utils/getCalendarData";
import style from "./NextRace.module.scss";

type NextGpResponse = {
  status?: string;
  event?: {
    name?: string;
    circuit?: string | null;
    country?: string | null;
    window?: {
      start?: string | null;
      end?: string | null;
    };
  };
};

type RoundWindow = {
  name: string;
  circuit: string | null;
  country: string | null;
  start: Date;
  end: Date;
};

const parseDateSafe = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const buildRoundWindows = (events: ApiCalendarEvent[]): RoundWindow[] => {
  const byRound = new Map<string, RoundWindow>();

  for (const event of events) {
    const start = parseDateSafe(event.start);
    if (!start) continue;
    const end = parseDateSafe(event.end) || start;
    const key = String(event.round?.id ?? `${event.round?.name || "round"}:${event.id}`);
    const existing = byRound.get(key);

    if (!existing) {
      byRound.set(key, {
        name: event.round?.name || event.title || "Next Grand Prix",
        circuit: event.round?.circuit || null,
        country: event.round?.country || null,
        start,
        end,
      });
      continue;
    }

    if (start < existing.start) existing.start = start;
    if (end > existing.end) existing.end = end;
  }

  return Array.from(byRound.values()).sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );
};

const NextRace = () => {
  const [data, setData] = useState<NextGpResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const year = Number(
          process.env.NEXT_PUBLIC_MOTOGP_SEASON_YEAR || new Date().getFullYear()
        );
        const events = await fetchCalendarEvents({
          year,
          series: ["motogp"],
          subSeries: ["motogp"],
          types: ["RACE"],
        });
        const rounds = buildRoundWindows(events);
        const now = new Date();

        const live = rounds.find((round) => now >= round.start && now <= round.end);
        if (live) {
          if (!cancelled) {
            setData({
              status: "live",
              event: {
                name: live.name,
                circuit: live.circuit,
                country: live.country,
                window: {
                  start: live.start.toISOString(),
                  end: live.end.toISOString(),
                },
              },
            });
          }
          return;
        }

        const next = rounds.find((round) => round.start > now);
        if (next) {
          if (!cancelled) {
            setData({
              status: "upcoming",
              event: {
                name: next.name,
                circuit: next.circuit,
                country: next.country,
                window: {
                  start: next.start.toISOString(),
                  end: next.end.toISOString(),
                },
              },
            });
          }
          return;
        }

        if (!cancelled) setData({ status: "offseason" });
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return null;

  const status = String(data?.status || "").toLowerCase();
  if (!data?.event || status === "offseason") return null;

  const isActiveNow = status === "live";
  const raceName = data.event.name || "Next Grand Prix";
  const startRaw = data.event.window?.start || "";
  const endRaw = data.event.window?.end || "";
  const startDate = startRaw ? new Date(startRaw) : null;
  const endDate = endRaw ? new Date(endRaw) : null;
  const hasStartDate = !!(startDate && !Number.isNaN(startDate.valueOf()));
  const hasEndDate = !!(endDate && !Number.isNaN(endDate.valueOf()));

  return (
    <div className={`${style.nextRace} ${isActiveNow ? style.ongoing : ""}`}>
      <h2>{isActiveNow ? "Ongoing Grand Prix" : "Next Grand Prix"}</h2>
      <p className={style.raceName}>
        <Link href="/calendar">{raceName}</Link>
      </p>
      {(data.event.circuit || data.event.country) && (
        <p>
          {data.event.circuit || ""}
          {data.event.circuit && data.event.country ? " - " : ""}
          {data.event.country || ""}
        </p>
      )}
      {hasStartDate && (
        <p>
          {format(startDate as Date, "eee do")}
          {hasEndDate ? ` - ${format(endDate as Date, "eee do MMM yy")}` : ""}
        </p>
      )}
      {!isActiveNow && hasStartDate && (
        <p>
          Starts in {formatDistanceToNow(startDate as Date) + "!"}
        </p>
      )}
    </div>
  );
};

export default NextRace;
