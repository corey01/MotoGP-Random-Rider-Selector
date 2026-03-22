"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { fetchCalendarEvents, type ApiCalendarEvent } from "@/utils/getCalendarData";
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

function cleanSessionName(ev: ApiCalendarEvent): string {
  let name = ev.sessionName || ev.type || "";
  name = name.replace(/\s*\(Restart\)/gi, "").trim();
  name = name.replace(/Free Practice Nr\.\s*(\d)/i, "FP$1");
  name = name.replace(/Qualifying Nr\.\s*(\d)/i, "Q$1");
  return name;
}

function sessionAbbrev(ev: ApiCalendarEvent): string {
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

function formatTime(iso: string): string {
  try {
    return format(new Date(iso), "HH:mm 'UTC'");
  } catch {
    return iso;
  }
}

function formatDateLabel(iso: string): string {
  try {
    return format(new Date(iso), "d MMM yyyy");
  } catch {
    return iso;
  }
}

function RacePage() {
  const searchParams = useSearchParams();
  const roundIdParam = searchParams.get("roundId");
  const roundId = roundIdParam ? parseInt(roundIdParam, 10) : null;

  const [events, setEvents] = useState<ApiCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!roundId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let alive = true;
    const year = Number(process.env.NEXT_PUBLIC_MOTOGP_SEASON_YEAR || new Date().getFullYear());

    fetchCalendarEvents({ year, series: ["motogp"] })
      .then((all) => {
        if (!alive) return;
        const forRound = all.filter((event) => event.round?.id === roundId);
        if (forRound.length === 0) {
          setNotFound(true);
        } else {
          setEvents(forRound);
        }
        setLoading(false);
      })
      .catch(() => {
        if (alive) {
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

  const first = events[0];
  const round = first.round;
  const sortedByStart = [...events].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );
  const firstEvent = sortedByStart[0];
  const lastEvent = sortedByStart[sortedByStart.length - 1];

  const bySubSeries = new Map<string, ApiCalendarEvent[]>();
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
      const typeOrder = (SESSION_ORDER[a.type] ?? 9) - (SESSION_ORDER[b.type] ?? 9);
      if (typeOrder !== 0) return typeOrder;
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    });
  }

  return (
    <div className={style.page}>
      <Link href="/calendar" className={style.backLink}>
        Back to calendar
      </Link>

      <section className={style.hero}>
        <div className={style.heroBackdrop}>
          {String(roundId).padStart(2, "0")}
        </div>

        <div className={style.heroTopline}>
          <span className={style.eyebrow}>Round Details</span>
          <span className={style.heroRoundTag}>Round {String(roundId).padStart(2, "0")}</span>
        </div>

        <div className={style.heroGrid}>
          <div className={style.heroCopy}>
            <p className={style.heroLabel}>MotoGP Weekend</p>
            <h1 className={style.heroTitle}>{round?.name || "Grand Prix"}</h1>
            <p className={style.heroSummary}>
              {[round?.circuit, round?.country].filter(Boolean).join(" · ")}
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

            const byDay = new Map<string, ApiCalendarEvent[]>();
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

                        return (
                          <div key={event.id} className={style.sessionRow}>
                            <span className={`${style.sessionBadge} ${toneClass}`}>
                              {sessionAbbrev(event)}
                            </span>
                            <div className={style.sessionCopy}>
                              <span className={style.sessionName}>{cleanSessionName(event)}</span>
                              <span className={style.sessionTime}>{formatTime(event.start)}</span>
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
