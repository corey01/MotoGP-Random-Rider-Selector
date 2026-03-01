import { motoGPTextBold } from "@/app/fonts";
import type { SeriesKey } from "./filterConfig";
import style from "./CalendarLegend.module.scss";

interface CalendarLegendProps {
  visibleSeries: Record<SeriesKey, boolean>;
}

const SERIES_OPTIONS: Array<{ key: SeriesKey; label: string; styleKey: string }> = [
  { key: "motogp", label: "MOTOGP", styleKey: "motogpTag" },
  { key: "wsbk", label: "WSBK", styleKey: "wsbkTag" },
  { key: "bsb", label: "BSB", styleKey: "bsbTag" },
  { key: "speedway", label: "SPEEDWAY", styleKey: "speedwayTag" },
];

export const CalendarLegend = ({
  visibleSeries,
}: CalendarLegendProps) => {
  return (
    <div className={`${style.legendContainer} ${motoGPTextBold.className}`}>
      <h4>Key</h4>
      <div className={style.legend} aria-label="Series key">
        {SERIES_OPTIONS.map((series) => {
          const isActive = visibleSeries[series.key];
          return (
            <div
              key={series.key}
              className={`${style.seriesTag} ${style[series.styleKey]} ${
                isActive ? "" : style.seriesTagInactive
              }`}
              title={`${series.label} ${isActive ? "enabled" : "disabled"}`}
            >
              {series.label}
            </div>
          );
        })}
      </div>
    </div>
  );
};
