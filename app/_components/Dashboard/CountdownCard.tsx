"use client";

import { useEffect, useState } from "react";
import { type ApiCalendarEvent } from "@/utils/getCalendarData";
import style from "./CountdownCard.module.scss";

interface CountdownCardProps {
  nextRace: ApiCalendarEvent | null;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(target: string): TimeLeft {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function CountdownCard({ nextRace }: CountdownCardProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(
    nextRace ? getTimeLeft(nextRace.start) : null
  );

  useEffect(() => {
    if (!nextRace) return;
    const tick = () => setTimeLeft(getTimeLeft(nextRace.start));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextRace]);

  if (!nextRace || !timeLeft) {
    return (
      <div className={style.card}>
        <p className={style.empty}>No upcoming races</p>
      </div>
    );
  }

  return (
    <div className={style.card}>
      <div className={style.meta}>
        <span className={style.series}>{nextRace.series.toUpperCase()}</span>
        <span className={style.separator}>·</span>
        <span className={style.roundName}>{nextRace.round.name}</span>
        {nextRace.round.country && (
          <>
            <span className={style.separator}>·</span>
            <span className={style.country}>{nextRace.round.country}</span>
          </>
        )}
      </div>

      <div className={style.countdown}>
        <div className={style.unit}>
          <span className={style.number}>{timeLeft.days}</span>
          <span className={style.label}>Days</span>
        </div>
        <span className={style.colon}>:</span>
        <div className={style.unit}>
          <span className={style.number}>{pad(timeLeft.hours)}</span>
          <span className={style.label}>Hrs</span>
        </div>
        <span className={style.colon}>:</span>
        <div className={style.unit}>
          <span className={style.number}>{pad(timeLeft.minutes)}</span>
          <span className={style.label}>Min</span>
        </div>
        <span className={style.colon}>:</span>
        <div className={style.unit}>
          <span className={style.number}>{pad(timeLeft.seconds)}</span>
          <span className={style.label}>Sec</span>
        </div>
      </div>

      <p className={style.eventName}>{nextRace.sessionName || nextRace.title}</p>
    </div>
  );
}
