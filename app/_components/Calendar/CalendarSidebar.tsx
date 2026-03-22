"use client";

import style from "./CalendarSidebar.module.scss";
import { SERIES_GROUPS, SeriesKey, SubSeriesKey } from "./filterConfig";

export const SERIES_COLORS: Record<string, string> = {
  motogp: "var(--motogp-red)",
  wsbk: "var(--wsbk-blue)",
  bsb: "#1db954",
  speedway: "#f57c00",
  f1: "var(--f1-red)",
};

interface CalendarSidebarProps {
  visibleSubSeries: Record<SubSeriesKey, boolean>;
  onToggleSeries: (series: SeriesKey) => void;
  seriesKeys?: SeriesKey[];
}

export function CalendarSidebar({
  visibleSubSeries,
  onToggleSeries,
  seriesKeys,
}: CalendarSidebarProps) {
  const visibleGroups = SERIES_GROUPS.filter((group) =>
    seriesKeys ? seriesKeys.includes(group.key) : true
  );

  return (
    <aside className={style.sidebar}>
      <div className={style.section}>
        <p className={style.sectionLabel}>Series Filters</p>
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
