"use client";

import { SERIES_GROUPS, SeriesKey, SubSeriesKey } from "./filterConfig";
import { SERIES_COLORS } from "./CalendarSidebar";
import style from "./CalendarFilterStrip.module.scss";

interface CalendarFilterStripProps {
  visibleSubSeries: Record<SubSeriesKey, boolean>;
  onToggleSeries: (series: SeriesKey) => void;
  seriesKeys: SeriesKey[];
}

export function CalendarFilterStrip({
  visibleSubSeries,
  onToggleSeries,
  seriesKeys,
}: CalendarFilterStripProps) {
  const visibleGroups = SERIES_GROUPS.filter((group) => seriesKeys.includes(group.key));

  return (
    <div className={style.strip} aria-label="Calendar filters">
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
  );
}
