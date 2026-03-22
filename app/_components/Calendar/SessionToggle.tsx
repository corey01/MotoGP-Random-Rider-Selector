import style from "./SessionToggle.module.scss";
import { inter } from "@/app/fonts";
import { useState } from "react";
import {
  SERIES_GROUPS,
  SeriesKey,
  SubSeriesKey,
} from "./filterConfig";

export type SessionView = "races" | "all";

interface SessionToggleProps {
  sessionView: SessionView;
  onSessionViewChange: (view: SessionView) => void;
  visibleSubSeries: Record<SubSeriesKey, boolean>;
  onToggleSeries: (series: SeriesKey) => void;
  onToggleSubSeries: (subSeries: SubSeriesKey) => void;
}

export const SessionToggle = ({
  sessionView,
  onSessionViewChange,
  visibleSubSeries,
  onToggleSeries,
  onToggleSubSeries,
}: SessionToggleProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const enabledCount = SERIES_GROUPS.filter((group) =>
    group.children.some((child) => visibleSubSeries[child.key])
  ).length;

  return (
    <>
      <div className={`${style.toggleContainer} ${inter.className}`}>
        <button
          type="button"
          className={style.triggerButton}
          onClick={() => setIsOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
        >
          Filters ({enabledCount})
        </button>
      </div>

      {isOpen && (
        <div className={style.overlay} onClick={() => setIsOpen(false)}>
          <div
            className={`${style.modal} ${inter.className}`}
            role="dialog"
            aria-modal="true"
            aria-label="Calendar filters"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={style.modalHeader}>
              <h3>Calendar Filters</h3>
              <button
                type="button"
                className={style.closeButton}
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </div>

            <div className={style.section}>
              <p className={style.sectionTitle}>Sessions</p>
              <div className={style.sessionSwitchWrap}>
                <button
                  type="button"
                  className={`${style.sessionSwitch} ${
                    sessionView === "all" ? style.sessionSwitchAll : ""
                  }`}
                  onClick={() =>
                    onSessionViewChange(sessionView === "races" ? "all" : "races")
                  }
                  role="switch"
                  aria-checked={sessionView === "all"}
                  aria-label={`Session mode: ${
                    sessionView === "races" ? "Races Only" : "All Events"
                  }`}
                >
                  <span className={style.sessionSwitchTextLeft}>Races Only</span>
                  <span className={style.sessionSwitchTextRight}>All Events</span>
                  <span className={style.sessionSwitchThumb} aria-hidden="true" />
                </button>
                <p className={style.sessionSwitchState}>
                  Showing: {sessionView === "races" ? "Races Only" : "All Events"}
                </p>
              </div>
            </div>

            <div className={style.section}>
              <p className={style.sectionTitle}>Series</p>
              <div className={style.seriesGroups} aria-label="Series visibility groups">
                {SERIES_GROUPS.map((group) => {
                  const enabledChildren = group.children.filter((child) => visibleSubSeries[child.key]).length;
                  const isAnyEnabled = enabledChildren > 0;
                  const isAllEnabled = enabledChildren === group.children.length;
                  return (
                    <div key={group.key} className={style.seriesGroup}>
                      <button
                        type="button"
                        className={`${style.groupButton} ${style[group.key]} ${
                          isAnyEnabled ? style.groupButtonActive : ""
                        } ${!isAllEnabled && isAnyEnabled ? style.groupButtonPartial : ""}`}
                        onClick={() => onToggleSeries(group.key)}
                        aria-pressed={isAnyEnabled}
                      >
                        {group.label}
                      </button>

                      {group.children.length > 1 && (
                        <div
                          className={style.subSeriesRow}
                          role="group"
                          aria-label={`${group.label} subclasses`}
                        >
                          {group.children.map((child) => {
                            const isActive = visibleSubSeries[child.key];
                            return (
                              <button
                                key={child.key}
                                type="button"
                                className={`${style.subSeriesButton} ${
                                  isActive ? style.subSeriesButtonActive : ""
                                }`}
                                onClick={() => onToggleSubSeries(child.key)}
                                aria-pressed={isActive}
                              >
                                {child.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className={style.filterHint}>
                Parent pills toggle full series. Child pills appear only for split series.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
