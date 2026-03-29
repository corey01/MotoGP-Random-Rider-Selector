"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { type ApiCalendarEvent } from "@/utils/getCalendarData";
import { fetchLiveSession, type LiveSessionData } from "@/utils/getLiveSession";
import { getSeriesColor, getSeriesDisplayLabel } from "@/utils/series";
import { LiveRaceCard } from "./LiveRaceCard";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const NINETY_MINS_MS = 90 * 60 * 1000;
const POLL_INTERVAL_MS = 10_000;

function categoryToSubSeries(category: string | null): string | null {
  if (!category) return null;
  const normalized = category.toLowerCase().replace(/\s/g, "");
  return normalized === "worldsbk" ? "wsbk" : normalized;
}

function normalizeSessionName(value: string | null | undefined): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/live timing/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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

export function LiveSection({ events }: TodaySectionProps) {
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

  const liveSubSeries = categoryToSubSeries(liveData?.series ?? null);
  const liveRoundEvent = useMemo(() => {
    if (!liveData?.isLive || !liveSubSeries) return null;

    const candidates = events.filter((ev) => {
      const eventSubSeries = categoryToSubSeries(ev.subSeries || ev.series);
      return ev.type === "RACE" && eventSubSeries === liveSubSeries;
    });
    if (candidates.length === 0) return null;

    const liveSessionName = normalizeSessionName(liveData.sessionName);
    const sessionMatchedCandidates = liveSessionName
      ? candidates.filter((ev) => {
          const eventSessionName = normalizeSessionName(ev.sessionName);
          return (
            eventSessionName === liveSessionName ||
            eventSessionName.endsWith(liveSessionName) ||
            liveSessionName.endsWith(eventSessionName)
          );
        })
      : candidates;

    const startedCandidates = (sessionMatchedCandidates.length > 0 ? sessionMatchedCandidates : candidates)
      .filter((ev) => new Date(ev.start).getTime() <= now)
      .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

    return startedCandidates[0] ?? null;
  }, [events, liveData, liveSubSeries, now]);

  if (!liveData?.isLive || !liveRoundEvent) return null;

  return (
    <LiveRaceCard
      liveData={liveData}
      roundName={liveRoundEvent?.round.name ?? ""}
      circuit={liveRoundEvent?.round.circuit ?? null}
      seriesLabel={getSeriesDisplayLabel(liveSubSeries, {
        variant: "short",
        fallback: liveData.series ?? "",
      })}
      seriesColor={liveRoundEvent ? getSeriesColor(liveRoundEvent.series, "#555") : "#555"}
    />
  );
}
