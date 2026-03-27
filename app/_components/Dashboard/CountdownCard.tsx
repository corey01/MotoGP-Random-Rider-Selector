"use client";

import { useEffect, useRef, useState } from "react";
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

function RaceCard({ race }: { race: ApiCalendarEvent }) {
  const [secondsLeft, setSecondsLeft] = useState<number>(getSecondsLeft(race.start));

  useEffect(() => {
    const tick = () => setSecondsLeft(getSecondsLeft(race.start));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [race.start]);

  const isToday = new Date(race.start).toDateString() === new Date().toDateString();
  const hasSubSeries = race.subSeries !== race.series;
  const badgeLabel = hasSubSeries
    ? (SUB_SERIES_LABELS[race.subSeries] ?? race.subSeries)
    : race.series.toUpperCase();
  const sessionLabel = race.sessionName || race.type;
  const timeStr = isToday
    ? `Today · ${format(parseISO(race.start), "HH:mm")}`
    : format(parseISO(race.start), "EEE d MMM · HH:mm");

  return (
    <div className={style.card}>
      <div className={style.badges}>
        <span className={`${style.seriesBadge} ${style[`series_${race.series}`] ?? ""}`}>
          {badgeLabel}
        </span>
      </div>

      <h2 className={style.roundName}>{race.round.name}</h2>

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

interface NextRaceStripProps {
  races: ApiCalendarEvent[];
}

export function NextRaceStrip({ races }: NextRaceStripProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const el = stripRef.current;
    if (!el || races.length <= 1) return;
    const onScroll = () => {
      const index = Math.round(el.scrollLeft / el.offsetWidth);
      setActiveIndex(index);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [races.length]);

  if (races.length === 0) return null;

  return (
    <div className={style.stripWrapper}>
      <div ref={stripRef} className={style.strip}>
        {races.map((race) => (
          <RaceCard key={race.id} race={race} />
        ))}
      </div>
      {races.length > 1 && (
        <div className={style.dots}>
          {races.map((_, i) => (
            <span
              key={i}
              className={`${style.pip} ${i === activeIndex ? style.pipActive : ""}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
