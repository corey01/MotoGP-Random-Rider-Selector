"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { type ApiCalendarEvent } from "@/utils/getCalendarData";
import style from "./CountdownCard.module.scss";

const SUB_SERIES_LABELS: Record<string, string> = {
  motogp: "MotoGP",
  moto2: "Moto2",
  moto3: "Moto3",
  worldsbk: "WorldSBK",
  worldssp: "WorldSSP",
  worldwcr: "WorldWCR",
  worldspb: "WorldSPB",
  f1: "Formula 1",
  bsb: "BSB",
  speedway: "Speedway",
};

function getSecondsLeft(target: string): number {
  return Math.max(0, Math.floor((new Date(target).getTime() - Date.now()) / 1000));
}

function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return "now";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

interface CountdownCardProps {
  nextRace: ApiCalendarEvent | null;
}

export function CountdownCard({ nextRace }: CountdownCardProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(
    nextRace ? getSecondsLeft(nextRace.start) : 0
  );

  useEffect(() => {
    if (!nextRace) return;
    const tick = () => setSecondsLeft(getSecondsLeft(nextRace.start));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextRace]);

  if (!nextRace) {
    return (
      <div className={style.card}>
        <p className={style.empty}>No upcoming races</p>
      </div>
    );
  }

  const isToday =
    new Date(nextRace.start).toDateString() === new Date().toDateString();
  const hasSubSeries = nextRace.subSeries !== nextRace.series;
  const badgeLabel = hasSubSeries
    ? (SUB_SERIES_LABELS[nextRace.subSeries] ?? nextRace.subSeries)
    : nextRace.series.toUpperCase();
  const sessionLabel = nextRace.sessionName || nextRace.type;
  const timeStr = isToday
    ? `Today · ${format(parseISO(nextRace.start), "HH:mm")}`
    : format(parseISO(nextRace.start), "EEE d MMM · HH:mm");

  return (
    <div className={style.card}>
      <p className={style.eyebrow}>Next Race</p>

      <div className={style.badges}>
        <span className={`${style.seriesBadge} ${style[`series_${nextRace.series}`] ?? ""}`}>
          {badgeLabel}
        </span>
      </div>

      <h2 className={style.roundName}>{nextRace.round.name}</h2>

      <p className={style.sessionRow}>
        <span className={style.sessionName}>{sessionLabel}</span>
        <span className={style.dot}>·</span>
        <span className={style.timeStr}>{timeStr}</span>
      </p>

      <div className={style.countdown}>
        {secondsLeft > 0 ? (
          <>
            <span className={style.countdownLabel}>Starts in</span>
            <span className={style.countdownValue}>{formatTimeRemaining(secondsLeft)}</span>
          </>
        ) : (
          <span className={style.liveIndicator}>Underway</span>
        )}
      </div>
    </div>
  );
}
