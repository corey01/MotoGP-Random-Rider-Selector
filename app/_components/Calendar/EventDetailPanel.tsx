"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import type { CalendarRound, CalendarSession } from "@/utils/getCalendarData";
import style from "./EventDetailPanel.module.scss";

interface EventDetailPanelProps {
  session: CalendarSession;
  round: CalendarRound;
  onClose: () => void;
}

const SUB_SERIES_LABELS: Record<string, string> = {
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

const SERIES_COLORS: Record<string, string> = {
  motogp: "var(--motogp-red)",
  wsbk: "var(--wsbk-blue)",
  bsb: "#1db954",
  speedway: "#f57c00",
  f1: "var(--f1-red)",
};

const TYPE_LABELS: Record<string, string> = {
  RACE: "Race",
  QUALIFYING: "Qualifying",
  PRACTICE: "Practice",
  SPRINT: "Sprint",
  TEST: "Test",
  SESSION: "Session",
  GATES: "Gates",
};

function formatInTimezone(isoString: string, timezone: string): string {
  try {
    const date = parseISO(isoString);
    return new Intl.DateTimeFormat("default", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone,
      hour12: false,
    }).format(date);
  } catch {
    return "";
  }
}

function getTimezoneLabel(isoString: string, timezone: string): string {
  try {
    const date = parseISO(isoString);
    const parts = new Intl.DateTimeFormat("default", {
      timeZone: timezone,
      timeZoneName: "short",
    }).formatToParts(date);
    return parts.find((p) => p.type === "timeZoneName")?.value?.toUpperCase() ?? "";
  } catch {
    return timezone;
  }
}

function getUserTimezoneLabel(isoString: string): string {
  try {
    const date = parseISO(isoString);
    const parts = new Intl.DateTimeFormat("default", { timeZoneName: "short" }).formatToParts(date);
    return parts.find((p) => p.type === "timeZoneName")?.value?.toUpperCase() ?? "";
  } catch {
    return "";
  }
}

function formatRoundRange(round: CalendarRound): string {
  try {
    const start = parseISO(`${round.startDate}T12:00:00`);
    const end = parseISO(`${round.endDate}T12:00:00`);
    return `${format(start, "d MMM")} – ${format(end, "d MMM yyyy")}`;
  } catch {
    return `${round.startDate} – ${round.endDate}`;
  }
}

export function EventDetailPanel({ session, round, onClose }: EventDetailPanelProps) {
  const subSeries = session.subSeries || round.subSeries || round.series;
  const seriesColor = SERIES_COLORS[round.series] ?? "var(--kc-primary)";
  const seriesLabel = SUB_SERIES_LABELS[subSeries] ?? subSeries.toUpperCase();
  const typeLabel = TYPE_LABELS[session.type] ?? session.type;
  const isRace = session.type === "RACE";

  const sessionDate = parseISO(session.start);
  const userTime = format(sessionDate, "HH:mm");
  const userTzLabel = getUserTimezoneLabel(session.start);

  // Track time (if the session has a timezone and it differs from user's)
  const trackTimezone = session.timezone && session.timezone !== "UTC" ? session.timezone : null;
  const trackTime = trackTimezone ? formatInTimezone(session.start, trackTimezone) : null;
  const trackTzLabel = trackTimezone ? getTimezoneLabel(session.start, trackTimezone) : null;
  const showTrackTime = trackTime && trackTzLabel && trackTime !== userTime;

  const sessionDayLabel = format(sessionDate, "EEEE, d MMMM yyyy");

  return (
    <div className={style.panel}>
      <div className={style.panelHeader}>
        <div className={style.headerMeta}>
          <div className={style.badges}>
            <span
              className={style.seriesBadge}
              style={{ "--series-color": seriesColor } as React.CSSProperties}
            >
              {seriesLabel}
            </span>
            <span className={`${style.typeBadge} ${isRace ? style.typeBadgeRace : ""}`}>
              {typeLabel}
            </span>
          </div>
        </div>
        <button className={style.closeBtn} onClick={onClose} aria-label="Close panel">✕</button>
      </div>

      <div className={style.panelBody}>
        {/* Session name */}
        <div className={style.sessionBlock}>
          <p className={style.sectionLabel}>Session</p>
          <h2
            className={style.sessionName}
            style={{ "--series-color": seriesColor } as React.CSSProperties}
          >
            {session.sessionName || typeLabel}
          </h2>
          <p className={style.sessionDay}>{sessionDayLabel}</p>
        </div>

        {/* Time */}
        <div className={style.timeBlock}>
          <p className={style.sectionLabel}>Time</p>
          <div className={style.timeRow}>
            <div className={style.timeItem}>
              <span className={style.timeValue}>{userTime}</span>
              <span className={style.timeLabel}>Your time {userTzLabel && `· ${userTzLabel}`}</span>
            </div>
            {showTrackTime && (
              <div className={style.timeItem}>
                <span className={style.timeValue}>{trackTime}</span>
                <span className={style.timeLabel}>Track time · {trackTzLabel}</span>
              </div>
            )}
          </div>
        </div>

        {/* Round info */}
        <div className={style.roundBlock}>
          <p className={style.sectionLabel}>Round</p>
          <div className={style.roundCard}>
            <div className={style.roundCardTop}>
              <div>
                <h3 className={style.roundName}>{round.name}</h3>
                {round.number != null && (
                  <p className={style.roundNumber}>Round {String(round.number).padStart(2, "0")}</p>
                )}
              </div>
              {round.id > 0 && (
                <Link
                  href={`/round?roundId=${encodeURIComponent(round.id)}`}
                  className={style.roundLink}
                >
                  Round Info →
                </Link>
              )}
            </div>

            <div className={style.roundMeta}>
              {(round.circuit || round.country) && (
                <div className={style.roundMetaRow}>
                  <span className={style.roundMetaLabel}>Circuit</span>
                  <span className={style.roundMetaValue}>
                    {[round.circuit, round.country].filter(Boolean).join(" · ")}
                  </span>
                </div>
              )}
              <div className={style.roundMetaRow}>
                <span className={style.roundMetaLabel}>Dates</span>
                <span className={style.roundMetaValue}>{formatRoundRange(round)}</span>
              </div>
              {session.status && session.status !== "UPCOMING" && (
                <div className={style.roundMetaRow}>
                  <span className={style.roundMetaLabel}>Status</span>
                  <span className={`${style.roundMetaValue} ${style[`status${session.status}`] ?? ""}`}>
                    {session.status.charAt(0) + session.status.slice(1).toLowerCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* External link */}
        {round.sourceUrl && (
          <a
            href={round.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={style.externalLink}
          >
            Official round page ↗
          </a>
        )}
      </div>
    </div>
  );
}
