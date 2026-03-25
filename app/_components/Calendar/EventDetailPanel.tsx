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

function parseGmtOffsetMinutes(timezone?: string | null): number | null {
  const value = String(timezone || "").trim().toUpperCase();
  const match = value.match(/^GMT([+-])(\d{2}):(\d{2})$/);
  if (!match) return null;

  const sign = match[1] === "+" ? 1 : -1;
  const hours = Number(match[2]);
  const minutes = Number(match[3]);
  return sign * (hours * 60 + minutes);
}

function formatOffsetLabel(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absolute = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, "0");
  const minutes = String(absolute % 60).padStart(2, "0");
  return `GMT${sign}${hours}:${minutes}`;
}

function formatWithOffset(isoString: string, offsetMinutes: number): { time: string; day: string } | null {
  try {
    const date = parseISO(isoString);
    const shifted = new Date(date.getTime() + offsetMinutes * 60_000);
    const shiftedIso = shifted.toISOString();
    const [year, month, day] = shiftedIso.slice(0, 10).split("-").map(Number);
    const localDate = new Date(year, month - 1, day);

    return {
      time: shiftedIso.slice(11, 16),
      day: localDate.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    };
  } catch {
    return null;
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
  const userDayLabel = format(sessionDate, "EEEE, d MMMM yyyy");

  const trackOffsetMinutes = parseGmtOffsetMinutes(session.timezone);
  const trackOffsetTime = trackOffsetMinutes !== null ? formatWithOffset(session.start, trackOffsetMinutes) : null;
  const trackTimezone = trackOffsetMinutes === null && session.timezone && session.timezone !== "UTC"
    ? session.timezone
    : null;
  const trackTime = trackOffsetTime?.time ?? (trackTimezone ? formatInTimezone(session.start, trackTimezone) : null);
  const trackDayLabel = trackOffsetTime?.day ?? (trackTimezone ? (() => {
    try {
      return new Intl.DateTimeFormat("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: trackTimezone,
      }).format(sessionDate);
    } catch {
      return null;
    }
  })() : null);
  const trackTzLabel = trackOffsetMinutes !== null
    ? formatOffsetLabel(trackOffsetMinutes)
    : trackTimezone
      ? getTimezoneLabel(session.start, trackTimezone)
      : null;
  const showTrackTime = trackTime && trackTzLabel && (`${trackTime} ${trackTzLabel}` !== `${userTime} ${userTzLabel}`);

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
          <p className={style.sessionDay}>{userDayLabel}</p>
        </div>

        {/* Time */}
        <div className={style.timeBlock}>
          <p className={style.sectionLabel}>Time</p>
          <div className={style.timeRow}>
            <div className={style.timeItem}>
              <span className={style.timeValue}>{userTime}</span>
              <span className={style.timeLabel}>Your time {userTzLabel && `· ${userTzLabel}`}</span>
              {showTrackTime && trackTime && trackTzLabel && (
                <>
                  <span className={style.secondaryTime}>
                    Circuit local: {trackTime} · {trackTzLabel}
                  </span>
                  {trackDayLabel && trackDayLabel !== userDayLabel && (
                    <span className={style.secondaryTime}>{trackDayLabel}</span>
                  )}
                </>
              )}
            </div>
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
