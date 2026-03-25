"use client";

import style from "./CalendarSidebar.module.scss";
import { SERIES_GROUPS, SeriesKey, SubSeriesKey } from "./filterConfig";

export const SERIES_COLORS: Record<string, string> = {
  motogp: "var(--motogp-red)",
  wsbk: "var(--wsbk-blue)",
  bsb: "var(--bsb-green)",
  speedway: "var(--speedway-orange)",
  f1: "var(--f1-red)",
  gtwce: "var(--gtwce-gold)",
};

interface CalendarSidebarProps {
  visibleSubSeries: Record<SubSeriesKey, boolean>;
  onToggleSeries: (series: SeriesKey) => void;
  onSelectAll: () => void;
  seriesKeys?: SeriesKey[];
}

export function CalendarSidebar({
  visibleSubSeries,
  onToggleSeries,
  onSelectAll,
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
