import style from "./SessionToggle.module.scss";
import { inter } from "@/app/fonts";
import { useState } from "react";

export type SessionView = "races" | "all";
export type SeriesKey = "motogp" | "wsbk" | "bsb" | "speedway" | "f1";

interface SessionToggleProps {
  sessionView: SessionView;
  onSessionViewChange: (view: SessionView) => void;
  visibleSeries: Record<SeriesKey, boolean>;
  onToggleSeries: (series: SeriesKey) => void;
}

const SESSION_OPTIONS: Array<{ key: SessionView; label: string }> = [
  { key: "races", label: "Races Only" },
  { key: "all", label: "All Events" },
];

const SERIES_OPTIONS: Array<{ key: SeriesKey; label: string }> = [
  { key: "motogp", label: "MotoGP" },
  { key: "wsbk", label: "WSBK" },
  { key: "bsb", label: "BSB" },
  { key: "speedway", label: "Speedway" },
  { key: "f1", label: "F1" },
];

export const SessionToggle = ({
  sessionView,
  onSessionViewChange,
  visibleSeries,
  onToggleSeries,
}: SessionToggleProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const enabledCount = SERIES_OPTIONS.filter((option) => visibleSeries[option.key]).length;

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
              <fieldset className={style.sessionMode} aria-label="Event visibility mode">
                {SESSION_OPTIONS.map((option) => {
                  const inputId = `session-mode-${option.key}`;
                  return (
                    <label key={option.key} htmlFor={inputId} className={style.radioLabel}>
                      <input
                        id={inputId}
                        type="radio"
                        name="session-mode"
                        value={option.key}
                        checked={sessionView === option.key}
                        onChange={() => onSessionViewChange(option.key)}
                        className={style.radioInput}
                      />
                      <span className={style.radioText}>{option.label}</span>
                    </label>
                  );
                })}
              </fieldset>
            </div>

            <div className={style.section}>
              <p className={style.sectionTitle}>Series</p>
              <div className={style.seriesRow} role="group" aria-label="Series visibility">
                {SERIES_OPTIONS.map((option) => {
                  const isActive = visibleSeries[option.key];
                  return (
                    <button
                      key={option.key}
                      type="button"
                      className={`${style.seriesButton} ${style[option.key]} ${
                        isActive ? style.seriesButtonActive : ""
                      }`}
                      onClick={() => onToggleSeries(option.key)}
                      aria-pressed={isActive}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
