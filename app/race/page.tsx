"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  fetchRoundById,
  type CalendarRound,
  type CalendarSession,
} from "@/utils/getCalendarData";
import { RaceGrid } from "@/app/_components/Grid/RaceGrid";
import { RaceResults } from "@/app/_components/Results/RaceResults";
import style from "./RacePage.module.scss";

const SESSION_ORDER: Record<string, number> = {
  PRACTICE: 0,
  QUALIFYING: 1,
  RACE: 2,
};

const SUBSERIES_LABEL: Record<string, string> = {
  motogp: "MotoGP",
  moto2: "Moto2",
  moto3: "Moto3",
};

const RACING_TYPES = new Set(["PRACTICE", "QUALIFYING", "RACE"]);

const TYPE_TONE_CLASS: Record<string, string> = {
  PRACTICE: style.practiceTone,
  QUALIFYING: style.qualifyingTone,
  RACE: style.raceTone,
};

const SERIES_LABEL: Record<string, string> = {
  motogp: "MotoGP",
  moto2: "Moto2",
  moto3: "Moto3",
  worldsbk: "WorldSBK",
  worldssp: "WorldSSP",
  worldwcr: "WorldWCR",
  worldspb: "WorldSPB",
  bsb: "BSB",
  speedway: "Speedway",
  f1: "Formula 1",
};

function cleanSessionName(ev: CalendarSession): string {
  let name = ev.sessionName || ev.type || "";
  name = name.replace(/\s*\(Restart\)/gi, "").trim();
  name = name.replace(/Free Practice Nr\.\s*(\d)/i, "FP$1");
  name = name.replace(/Qualifying Nr\.\s*(\d)/i, "Q$1");
  return name;
}

function sessionAbbrev(ev: CalendarSession): string {
  const name = cleanSessionName(ev).toLowerCase();
  if (/grand prix/i.test(name)) return "GP";
  if (/sprint/i.test(name)) return "SPR";
  if (/fp(\d)/.test(name)) return name.match(/fp\d/i)?.[0].toUpperCase() ?? "FP";
  if (/^q(\d)/.test(name)) return name.match(/^q\d/i)?.[0].toUpperCase() ?? "Q";
  if (/warm.?up/i.test(name)) return "WU";
  if (/practice/i.test(name)) return "P";
  return ev.type?.slice(0, 2) ?? "?";
}

function formatDayHeader(iso: string): string {
  try {
    return format(new Date(iso), "EEEE d MMMM");
  } catch {
    return iso;
  }
}

const formatTimezoneLabel = (timezone?: string | null) => {
  const value = String(timezone || "").trim();
  if (!value) return null;
  if (/^utc$/i.test(value)) return "UTC";
  return value.toUpperCase();
};

const parseOffsetMinutes = (timezone?: string | null) => {
  const value = String(timezone || "").trim().toUpperCase();
  if (!value || value === "UTC" || value === "GMT") return 0;

  const match = value.match(/^(?:UTC|GMT)([+-])(\d{2}):?(\d{2})$/);
  if (!match) return null;

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3]);
  return sign * (hours * 60 + minutes);
};

const extractClockParts = (iso: string) => {
  const match = iso.match(/T(\d{2}):(\d{2})/);
  if (!match) return null;
  return { hours: Number(match[1]), minutes: Number(match[2]) };
};

const formatClock = (totalMinutes: number) => {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const hasExplicitTimezone = (iso: string) => /(?:Z|[+-]\d{2}:\d{2})$/i.test(iso);

const extractDateTimeParts = (iso: string) => {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return null;

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hours: Number(match[4]),
    minutes: Number(match[5]),
    seconds: Number(match[6] ?? "0"),
  };
};

const getTrackInstant = (event: CalendarSession) => {
  if (hasExplicitTimezone(event.start)) {
    const date = new Date(event.start);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parts = extractDateTimeParts(event.start);
  const offsetMinutes = parseOffsetMinutes(event.timezone);
  if (!parts || offsetMinutes == null) return null;

  const utcMillis =
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hours, parts.minutes, parts.seconds) -
    offsetMinutes * 60 * 1000;

  const date = new Date(utcMillis);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getDeviceTimezoneLabel = (date: Date) => {
  try {
    const parts = new Intl.DateTimeFormat(undefined, { timeZoneName: "short" }).formatToParts(date);
    return parts.find((part) => part.type === "timeZoneName")?.value?.toUpperCase() ?? "LOCAL";
  } catch {
    return "LOCAL";
  }
};

function getSessionTimes(event: CalendarSession) {
  const timezoneLabel = formatTimezoneLabel(event.timezone) ?? "UTC";
  const instant = getTrackInstant(event);

  const offsetMinutes = parseOffsetMinutes(event.timezone);
  const localClockParts = extractClockParts(event.start);
  const trackClock =
    instant && offsetMinutes != null
      ? formatClock(instant.getUTCHours() * 60 + instant.getUTCMinutes() + offsetMinutes)
      : localClockParts
        ? formatClock(localClockParts.hours * 60 + localClockParts.minutes)
        : event.start;

  if (!instant) {
    return {
      primary: trackClock,
      primaryLabel: timezoneLabel,
      secondary: null as string | null,
      secondaryLabel: null as string | null,
    };
  }

  const deviceClock = format(instant, "HH:mm");
  const deviceLabel = getDeviceTimezoneLabel(instant);
  const secondary =
    `${trackClock} ${timezoneLabel}` === `${deviceClock} ${deviceLabel}` ? null : trackClock;

  return {
    primary: deviceClock,
    primaryLabel: deviceLabel,
    secondary,
    secondaryLabel: secondary ? timezoneLabel : null,
  };
}

function formatDateLabel(iso: string): string {
  try {
    return format(new Date(iso), "d MMM yyyy");
  } catch {
    return iso;
  }
}

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const getRoundSequence = (round: CalendarRound | null): number | null =>
  toNumber(round?.metadata?.sequence) ?? toNumber(round?.number);

function RacePage() {
  const searchParams = useSearchParams();
  const roundIdParam = searchParams.get("roundId");
  const roundId = roundIdParam ? parseInt(roundIdParam, 10) : null;

  const [round, setRound] = useState<CalendarRound | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!roundId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let alive = true;
    fetchRoundById(roundId)
      .then((payload) => {
        if (!alive) return;
        if (!payload.round) {
          setNotFound(true);
        } else {
          setRound(payload.round);
          setNotFound(false);
        }
        setLoading(false);
      })
      .catch(() => {
        if (alive) {
          setRound(null);
          setNotFound(true);
          setLoading(false);
        }
      });

    return () => {
      alive = false;
    };
  }, [roundId]);

  if (loading) {
    return (
      <div className={style.page}>
        <div className={style.statePanel}>
          <p className={style.stateLabel}>Loading race weekend…</p>
        </div>
      </div>
    );
  }

  if (notFound || !roundId) {
    return (
      <div className={style.page}>
        <div className={style.statePanel}>
          <p className={style.stateLabel}>Round not found.</p>
          <Link href="/calendar" className={style.backLink}>
            Back to calendar
          </Link>
        </div>
      </div>
    );
  }

  const events = round?.events ?? [];
  const displayRoundNumber = getRoundSequence(round) ?? roundId;
  const sortedByStart = [...events].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );
  const firstEvent = sortedByStart[0];
  const lastEvent = sortedByStart[sortedByStart.length - 1];

  const bySubSeries = new Map<string, CalendarSession[]>();
  for (const event of events) {
    const key = event.subSeries || event.series || "motogp";
    if (!bySubSeries.has(key)) bySubSeries.set(key, []);
    bySubSeries.get(key)?.push(event);
  }

  const subSeriesOrder = ["motogp", "moto2", "moto3"];
  const sortedSubSeries = Array.from(bySubSeries.keys()).sort(
    (a, b) => subSeriesOrder.indexOf(a) - subSeriesOrder.indexOf(b)
  );

  for (const sessions of Array.from(bySubSeries.values())) {
    sessions.sort((a, b) => {
      const typeOrder =
        (SESSION_ORDER[a.type?.toUpperCase() ?? ""] ?? 9) -
        (SESSION_ORDER[b.type?.toUpperCase() ?? ""] ?? 9);
      if (typeOrder !== 0) return typeOrder;
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    });
  }

  const weekendLabel =
    SERIES_LABEL[round?.subSeries || ""] ??
    SERIES_LABEL[round?.series || ""] ??
    "Race";

  return (
    <div className={style.page}>
      <Link href="/calendar" className={style.backLink}>
        Back to calendar
      </Link>

      <section className={style.hero}>
        <div className={style.heroBackdrop}>
          {String(displayRoundNumber).padStart(2, "0")}
        </div>

        <div className={style.heroTopline}>
          <span className={style.eyebrow}>Round Details</span>
          <span className={style.heroRoundTag}>Round {String(displayRoundNumber).padStart(2, "0")}</span>
        </div>

        <div className={style.heroGrid}>
          <div className={style.heroCopy}>
            <p className={style.heroLabel}>{weekendLabel} Weekend</p>
            <h1 className={style.heroTitle}>{round?.name || "Grand Prix"}</h1>
            <p className={style.heroSummary}>
              {[round?.place, round?.circuit, round?.country].filter(Boolean).join(" · ")}
            </p>
          </div>

          <div className={style.metrics}>
            <div className={style.metric}>
              <span className={style.metricLabel}>Weekend window</span>
              <strong className={style.metricValue}>
                {firstEvent?.start ? formatDateLabel(firstEvent.start) : "TBC"}
              </strong>
              <span className={style.metricMeta}>
                {lastEvent?.start ? `to ${formatDateLabel(lastEvent.start)}` : ""}
              </span>
            </div>
            <div className={style.metric}>
              <span className={style.metricLabel}>Sessions loaded</span>
              <strong className={style.metricValue}>{events.length}</strong>
              <span className={style.metricMeta}>Across all classes</span>
            </div>
            <div className={style.metric}>
              <span className={style.metricLabel}>Classes in focus</span>
              <strong className={style.metricValue}>{sortedSubSeries.length}</strong>
              <span className={style.metricMeta}>
                {sortedSubSeries
                  .map((subSeries) => SUBSERIES_LABEL[subSeries] ?? subSeries.toUpperCase())
                  .join(" · ")}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className={style.sectionGrid}>
        <section className={style.primarySection}>
          <div className={style.sectionHeader}>
            <div>
              <p className={style.sectionEyebrow}>Results</p>
              <h2 className={style.sectionTitle}>Race classification</h2>
            </div>
          </div>
          <RaceResults roundId={roundId} />
        </section>

        <section className={style.secondarySection}>
          <div className={style.sectionHeader}>
            <div>
              <p className={style.sectionEyebrow}>Grid</p>
              <h2 className={style.sectionTitle}>Starting order</h2>
            </div>
          </div>
          <RaceGrid roundId={roundId} />
        </section>
      </div>

      <section className={style.scheduleSection}>
        <div className={style.sectionHeader}>
          <div>
            <p className={style.sectionEyebrow}>Schedule</p>
            <h2 className={style.sectionTitle}>Session timetable</h2>
          </div>
        </div>

        <div className={style.scheduleBlocks}>
          {sortedSubSeries.map((subSeries) => {
            const allSessions = bySubSeries.get(subSeries) ?? [];
            const sessions = allSessions.filter((event) =>
              RACING_TYPES.has(event.type?.toUpperCase() ?? "")
            );
            if (sessions.length === 0) return null;

            const byDay = new Map<string, CalendarSession[]>();
            for (const event of sessions) {
              const day = formatDayHeader(event.start);
              if (!byDay.has(day)) byDay.set(day, []);
              byDay.get(day)?.push(event);
            }

            const label = SUBSERIES_LABEL[subSeries] ?? subSeries.toUpperCase();

            return (
              <div key={subSeries} className={style.scheduleBlock}>
                <div className={style.scheduleBlockHeader}>
                  <h3 className={style.scheduleBlockTitle}>{label}</h3>
                </div>

                {Array.from(byDay.entries()).map(([day, daySessions]) => (
                  <div key={day} className={style.dayBlock}>
                    <div className={style.dayHeader}>{day}</div>

                    <div className={style.sessionList}>
                      {daySessions.map((event) => {
                        const typeKey = event.type?.toUpperCase() ?? "";
                        const toneClass = TYPE_TONE_CLASS[typeKey] ?? "";
                        const isLive = event.status === "LIVE";
                        const isDone = event.status === "COMPLETED";
                        const sessionTimes = getSessionTimes(event);

                        return (
                          <div key={event.id} className={style.sessionRow}>
                            <span className={`${style.sessionBadge} ${toneClass}`}>
                              {sessionAbbrev(event)}
                            </span>
                            <div className={style.sessionCopy}>
                                <span className={style.sessionName}>{cleanSessionName(event)}</span>
                                <div className={style.sessionTimes}>
                                <span className={style.sessionTime}>
                                  {sessionTimes.primary} {sessionTimes.primaryLabel}
                                </span>
                                {sessionTimes.secondary && sessionTimes.secondaryLabel ? (
                                  <span className={style.sessionTimeSecondary}>
                                    {sessionTimes.secondary} {sessionTimes.secondaryLabel}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            {isLive && <span className={style.liveState}>Live</span>}
                            {isDone && <span className={style.doneState}>Done</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default function RaceInfoPage() {
  return (
    <Suspense>
      <RacePage />
    </Suspense>
  );
}
