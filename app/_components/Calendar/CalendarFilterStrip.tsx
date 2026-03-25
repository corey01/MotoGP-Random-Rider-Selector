"use client";

import { type CalendarView, type SessionView } from "@/utils/getCalendarData";
import { SERIES_GROUPS, SeriesKey, SubSeriesKey } from "./filterConfig";
import { SERIES_COLORS } from "./CalendarSidebar";
import style from "./CalendarFilterStrip.module.scss";

interface CalendarFilterStripProps {
  visibleSubSeries: Record<SubSeriesKey, boolean>;
  onToggleSeries: (series: SeriesKey) => void;
  seriesKeys: SeriesKey[];
  calendarView: CalendarView;
  sessionView: SessionView;
  onSessionViewChange: (view: SessionView) => void;
}

export function CalendarFilterStrip({
  visibleSubSeries,
  onToggleSeries,
  seriesKeys,
  calendarView,
  sessionView,
  onSessionViewChange,
}: CalendarFilterStripProps) {
  const visibleGroups = SERIES_GROUPS.filter((group) => seriesKeys.includes(group.key));
  const showRacesToggle = calendarView === "events";

  return (
    <div className={style.strip} aria-label="Calendar filters">
      <div className={style.filters}>
        {visibleGroups.map((group) => {
          const isActive = group.children.some((child) => visibleSubSeries[child.key]);
          const color = SERIES_COLORS[group.key] ?? "#555";

          return (
            <button
              key={group.key}
              type="button"
              className={`${style.item} ${isActive ? style.itemActive : ""}`}
              onClick={() => onToggleSeries(group.key)}
              aria-pressed={isActive}
            >
              <span className={style.dot} style={{ backgroundColor: color }} />
              <span className={style.label}>{group.label}</span>
            </button>
          );
        })}
      </div>

      {showRacesToggle && (
        <button
          type="button"
          className={`${style.racesToggle} ${
            sessionView === "races" ? style.racesToggleActive : ""
          }`}
          onClick={() => onSessionViewChange(sessionView === "races" ? "all" : "races")}
          role="switch"
          aria-checked={sessionView === "races"}
          aria-label={`Session mode: ${sessionView === "races" ? "Races only" : "All events"}`}
        >
          Races only
          <span className={style.toggleTrack} aria-hidden="true">
            <span className={style.toggleKnob} />
          </span>
        </button>
      )}
    </div>
  );
}
