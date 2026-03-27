"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { type ApiCalendarEvent } from "@/utils/getCalendarData";
import { fetchLiveSession, type LiveSessionData } from "@/utils/getLiveSession";
import { LiveCard } from "./LiveCard";

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

function categoryToSubSeries(category: string | null): string | null {
  if (!category) return null;
  return category.toLowerCase().replace(/\s/g, "");
}

function isWithinLiveWindow(ev: ApiCalendarEvent, now: number): boolean {
  const start = new Date(ev.start).getTime();
  return start - now < TWO_HOURS_MS && now < start + NINETY_MINS_MS;
}

function getFallbackStatus(ev: ApiCalendarEvent, now: number): "upcoming" | "live" | "done" {
  const start = new Date(ev.start).getTime();
  if (start > now) return "upcoming";
  const isSprint = /sprint/i.test(ev.sessionName ?? "");
  const minDurationMs = isSprint ? 20 * 60_000 : 30 * 60_000;
  return now < start + minDurationMs ? "live" : "done";
}

interface TodaySectionProps {
  events: ApiCalendarEvent[];
}

export function TodaySection({ events }: TodaySectionProps) {
  const [now, setNow] = useState(() => Date.now());
  const [liveData, setLiveData] = useState<LiveSessionData | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const raceEvents = useMemo(
    () => events.filter((ev) => ev.type === "RACE"),
    [events]
  );

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

  if (!liveData?.isLive) return null;

  const liveSubSeries = categoryToSubSeries(liveData.series);
  const liveRoundEvent = liveSubSeries
    ? events.find((ev) => ev.subSeries === liveSubSeries)
    : null;

  return (
    <LiveCard
      liveData={liveData}
      roundName={liveRoundEvent?.round.name ?? ""}
      circuit={liveRoundEvent?.round.circuit ?? null}
      seriesLabel={SUB_SERIES_LABELS[liveSubSeries!] ?? liveData.series ?? ""}
      seriesColor={liveRoundEvent ? (SERIES_COLORS[liveRoundEvent.series] ?? "#555") : "#555"}
    />
  );
}
