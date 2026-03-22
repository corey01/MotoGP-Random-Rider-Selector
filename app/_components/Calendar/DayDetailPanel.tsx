"use client";

import Link from "next/link";
import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import type { CalendarRound, CalendarSession } from "@/utils/getCalendarData";
import style from "./DayDetailPanel.module.scss";

interface DayDetailPanelProps {
  date: Date;
  rounds: CalendarRound[];
  focusMode: "date" | "round";
  focusedRound: CalendarRound | null;
  sessionView: "races" | "all";
  onSessionViewChange: (view: "races" | "all") => void;
  isLoading?: boolean;
  onClose: () => void;
}

interface DayGroup {
  dayKey: string;
  dayLabel: string;
  series: string;
  sessions: CalendarSession[];
}

interface RoundTimelineGroup {
  groupKey: string;
  roundName: string;
  roundNumber: number | null;
  dayGroups: DayGroup[];
  sessionCount: number;
}

const SERIES_COLORS: Record<string, string> = {
  motogp: "var(--motogp-red)",
  wsbk: "var(--wsbk-blue)",
  bsb: "#1db954",
  speedway: "#f57c00",
  f1: "var(--f1-red)",
};

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

const SESSION_ORDER: Record<string, number> = {
  PRACTICE: 0,
  QUALIFYING: 1,
  SPRINT: 2,
  RACE: 3,
};

const bySessionOrder = (left: CalendarSession, right: CalendarSession) =>
  (SESSION_ORDER[left.type] ?? 99) - (SESSION_ORDER[right.type] ?? 99) ||
  new Date(left.start).getTime() - new Date(right.start).getTime();

const formatTimezoneLabel = (timezone: string) => {
  if (!timezone) return "";
  return timezone === "UTC" ? "GMT" : timezone;
};

const formatSessionTimeRange = (session: CalendarSession) => {
  const start = format(parseISO(session.start), "HH:mm");
  const timezoneLabel = formatTimezoneLabel(session.timezone);

  if (!session.end || session.end === session.start) {
    return timezoneLabel ? `${start} ${timezoneLabel}` : start;
  }

  const end = format(parseISO(session.end), "HH:mm");
  return timezoneLabel ? `${start} - ${end} ${timezoneLabel}` : `${start} - ${end}`;
};

const formatRoundRange = (round: CalendarRound) => {
  try {
    const start = parseISO(`${round.startDate}T12:00:00`);
    const end = parseISO(`${round.endDate}T12:00:00`);
    return `${format(start, "EEE d MMM")} - ${format(end, "EEE d MMM yyyy")}`;
  } catch {
    return `${round.startDate} - ${round.endDate}`;
  }
};

const formatDayLabel = (dayKey: string) => {
  try {
    return format(parseISO(`${dayKey}T12:00:00`), "EEEE d MMMM");
  } catch {
    return dayKey;
  }
};

const getSessionDisplayName = (session: CalendarSession) => {
  const seriesLabel = SUB_SERIES_LABELS[session.subSeries] ?? session.subSeries.toUpperCase();
  const sessionName = session.sessionName?.trim();

  if (!sessionName) return seriesLabel;
  if (sessionName.toUpperCase() === session.type.toUpperCase()) return `${seriesLabel} • ${session.type}`;
  return `${seriesLabel} • ${sessionName}`;
};

const buildDayGroups = (sessions: CalendarSession[]) => {
  const dayMap = new Map<string, CalendarSession[]>();

  for (const session of [...sessions].sort(bySessionOrder)) {
    const dayKey = session.start.slice(0, 10);
    const existing = dayMap.get(dayKey);
    if (existing) {
      existing.push(session);
    } else {
      dayMap.set(dayKey, [session]);
    }
  }

  return Array.from(dayMap.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([dayKey, daySessions]) => ({
      dayKey,
      dayLabel: formatDayLabel(dayKey),
      series: daySessions[0]?.series ?? "",
      sessions: daySessions,
    }));
};

export function DayDetailPanel({
  date,
  rounds,
  focusMode,
  focusedRound,
  sessionView,
  onSessionViewChange,
  isLoading = false,
  onClose,
}: DayDetailPanelProps) {
  const hasAnySessions = useMemo(() => rounds.some((round) => round.events.length > 0), [rounds]);

  const groups = useMemo<RoundTimelineGroup[]>(() => {
    return rounds
      .map((round) => {
        const filteredSessions =
          sessionView === "races"
            ? round.events.filter((session) => session.type === "RACE")
            : round.events;

        return {
          groupKey: String(round.id),
          roundName: round.name,
          roundNumber: round.number ?? null,
          dayGroups: buildDayGroups(filteredSessions),
          sessionCount: filteredSessions.length,
        };
      })
      .filter((group) => group.sessionCount > 0);
  }, [rounds, sessionView]);

  const dateLabel = format(date, "MMM d").toUpperCase();
  const dayLabel = format(date, "EEEE, d MMMM yyyy");

  return (
    <div className={style.panel}>
      <div className={style.panelHeader}>
        <div>
          <p className={style.focusedLabel}>Currently Focused</p>
          {focusMode === "round" && focusedRound ? (
            <>
              <h2 className={style.roundHeading}>{focusedRound.name}</h2>
              <div className={style.roundSummary}>
                <span className={style.selectedBadge}>Round</span>
                <span className={style.roundRange}>{formatRoundRange(focusedRound)}</span>
              </div>
              <p className={style.dateFull}>
                {[focusedRound.circuit, focusedRound.country].filter(Boolean).join(" · ")}
              </p>
            </>
          ) : (
            <>
              <div className={style.dateRow}>
                <h2 className={style.dateHeading}>{dateLabel}</h2>
                <span className={style.selectedBadge}>Selected</span>
              </div>
              <p className={style.dateFull}>{dayLabel}</p>
            </>
          )}
        </div>
        <button className={style.closeBtn} onClick={onClose} aria-label="Close panel">✕</button>
      </div>

      <div className={style.panelBody}>
        <div className={style.sessionToggleRow}>
          <button
            type="button"
            className={`${style.sessionSwitch} ${sessionView === "all" ? style.sessionSwitchAll : ""}`}
            onClick={() => onSessionViewChange(sessionView === "races" ? "all" : "races")}
            role="switch"
            aria-checked={sessionView === "all"}
          >
            <span className={style.sessionSwitchThumb} />
            <span className={style.switchLabels}>
              <span>Races Only</span>
              <span>All Events</span>
            </span>
          </button>
        </div>

        {isLoading ? (
          <p className={style.emptyMsg}>
            {focusMode === "round" ? "Loading round…" : "Loading sessions…"}
          </p>
        ) : groups.length === 0 ? (
          <p className={style.emptyMsg}>
            {hasAnySessions
              ? "No races in this view. Switch to \"All Events\" to see the full schedule."
              : "No sessions available."}
          </p>
        ) : (
          groups.map((group) => (
            <div key={group.groupKey} className={style.roundGroup}>
              <div className={style.roundMeta}>
                <div className={style.roundMetaMain}>
                  <h3 className={style.roundName}>{group.roundName}</h3>
                  {group.roundNumber ? (
                    <span className={style.roundMetaText}>
                      Round {String(group.roundNumber).padStart(2, "0")}
                    </span>
                  ) : null}
                </div>
                {Number(group.groupKey) > 0 ? (
                  <Link
                    href={`/round?roundId=${encodeURIComponent(group.groupKey)}`}
                    className={style.roundLink}
                  >
                    Round Info
                  </Link>
                ) : null}
              </div>

              {group.dayGroups.map((dayGroup) => (
                <div
                  key={`${group.groupKey}-${dayGroup.dayKey}`}
                  className={style.dayGroup}
                  style={{ "--group-color": SERIES_COLORS[dayGroup.series] ?? "var(--kc-primary)" } as React.CSSProperties}
                >
                  {focusMode === "round" || group.dayGroups.length > 1 ? (
                    <p className={style.dayHeading}>{dayGroup.dayLabel}</p>
                  ) : null}

                    <div className={style.sessions}>
                      {dayGroup.sessions.map((session) => (
                        <div
                          key={session.id}
                          className={`${style.session} ${session.type === "RACE" ? style.sessionRace : ""}`}
                        >
                        {session.type === "RACE" ? (
                          <span className={style.sessionMarker} aria-hidden="true" />
                        ) : null}
                        <div className={style.sessionInfo}>
                          <span className={style.sessionType}>{session.type}</span>
                          <span className={style.sessionName}>{getSessionDisplayName(session)}</span>
                          <span className={style.sessionTime}>{formatSessionTimeRange(session)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
