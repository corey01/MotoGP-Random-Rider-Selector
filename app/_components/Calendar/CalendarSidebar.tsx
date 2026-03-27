"use client";

import { SERIES_COLORS, SERIES_GROUPS, type SeriesKey, type SubSeriesKey } from "@/consts/series";
import { type CalendarView, type SessionView } from "@/utils/getCalendarData";
import style from "./CalendarSidebar.module.scss";

interface CalendarSidebarProps {
  visibleSubSeries: Record<SubSeriesKey, boolean>;
  onToggleSeries: (series: SeriesKey) => void;
  onSelectAll: () => void;
  calendarView: CalendarView;
  sessionView: SessionView;
  onSessionViewChange: (view: SessionView) => void;
  seriesKeys?: SeriesKey[];
}

export function CalendarSidebar({
  visibleSubSeries,
  onToggleSeries,
  onSelectAll,
  calendarView,
  sessionView,
  onSessionViewChange,
  seriesKeys,
}: CalendarSidebarProps) {
  const visibleGroups = SERIES_GROUPS.filter((group) =>
    seriesKeys ? seriesKeys.includes(group.key) : true
  );
  const allEnabled = visibleGroups.every((group) =>
    group.children.every((child) => visibleSubSeries[child.key])
  );

  return (
    <aside className={style.sidebar}>
      {calendarView === "events" && (
        <div className={style.section}>
          <div className={style.sectionHeader}>
            <p className={style.sectionLabel}>Sessions</p>
          </div>
          <button
            type="button"
            className={`${style.sessionSwitch} ${
              sessionView === "all" ? style.sessionSwitchAll : ""
            }`}
            onClick={() => onSessionViewChange(sessionView === "races" ? "all" : "races")}
            role="switch"
            aria-checked={sessionView === "all"}
            aria-label={`Session mode: ${sessionView === "races" ? "Races only" : "All events"}`}
          >
            <span className={style.sessionSwitchThumb} aria-hidden="true" />
            <span className={style.switchLabels}>
              <span>Races</span>
              <span>All events</span>
            </span>
          </button>
        </div>
      )}

      <div className={style.section}>
        <div className={style.sectionHeader}>
          <p className={style.sectionLabel}>Series Filters</p>
          <button
            type="button"
            className={style.actionButton}
            onClick={onSelectAll}
            disabled={allEnabled}
          >
            Select all
          </button>
        </div>
        <ul className={style.seriesList}>
          {visibleGroups.map((group) => {
            const anyEnabled = group.children.some((c) => visibleSubSeries[c.key]);
            const color = SERIES_COLORS[group.key] ?? "#555";

            return (
              <li key={group.key} className={style.seriesItem}>
                <button
                  type="button"
                  className={`${style.seriesButton} ${anyEnabled ? style.seriesButtonActive : ""}`}
                  style={{ "--series-color": color } as React.CSSProperties}
                  onClick={() => onToggleSeries(group.key)}
                  aria-pressed={anyEnabled}
                >
                  <span
                    className={style.seriesBar}
                    style={{ background: anyEnabled ? color : "var(--kc-border)" }}
                  />
                  <span className={style.seriesName}>{group.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
