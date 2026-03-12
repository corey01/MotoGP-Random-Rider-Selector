'use client';

import style from "./Modal.module.scss";
import { format } from 'date-fns-tz';

interface CalendarEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  onCreateSweepstake?: (roundId: number) => void;
}

export const CalendarEventModal = ({ isOpen, onClose, event, onCreateSweepstake }: CalendarEventModalProps) => {
  if (!event) return null;
  const meta = event.extendedProps?.meta || {};

  // Start time formatting
  const deviceStartDate = new Date(meta.deviceTime);
  const deviceStartTimeFormatted = deviceStartDate.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const deviceStartDateFormatted = deviceStartDate.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Race time formatting (original timezone)
  const raceTimeString = String(meta.raceTime || "");
  const [timeWithoutTz] = raceTimeString.split(' (GMT');
  const raceDate = new Date(timeWithoutTz);
  const raceTimeFormatted = format(raceDate, 'HH:mm');
  const raceDateFormatted = format(raceDate, 'EEEE, d MMMM yyyy');
  const timezone = raceTimeString.match(/GMT([+-]\d{4})\)/)?.[1] || '';
  const fallbackSession = String(
    meta.sessionName || event.extendedProps?.session || event.extendedProps?.type || ""
  ).trim();
  const detailItems = [
    { label: "Country", value: meta.country },
    { label: "Session", value: fallbackSession },
    { label: "Round Date", value: meta.eventDateLabel },
  ].filter((item) => item.value);
  const sourceUrl = String(meta.sourceUrl || "");

  // Determine the series tag and style
  let seriesLabel = '';
  let seriesClass = '';
  const isMotoGP = event.classNames?.includes('motogp-event');
  if (isMotoGP) {
    seriesLabel = 'MotoGP';
    seriesClass = style.motogpTag;
  } else if (event.classNames?.includes('wsbk-event')) {
    seriesLabel = 'WSBK';
    seriesClass = style.wsbkTag;
  } else if (event.classNames?.includes('bsb-event')) {
    seriesLabel = 'BSB';
    seriesClass = style.bsbTag;
  } else if (event.classNames?.includes('speedway-event')) {
    seriesLabel = 'Speedway';
    seriesClass = style.speedwayTag;
  } else if (event.classNames?.includes('f1-event')) {
    seriesLabel = 'F1';
    seriesClass = style.f1Tag;
  }

  const isRace = String(event.extendedProps?.type || "").toUpperCase() === "RACE";
  const isMainMotoGP = String(event.extendedProps?.subSeries || "").toLowerCase() === "motogp";
  const roundId: number | null = meta.roundId ?? null;
  const showSweepstakeButton = isMotoGP && isRace && isMainMotoGP && roundId !== null && onCreateSweepstake;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div onClick={handleOverlayClick} className={style.Overlay}>
      <div className={style.Modal}>
        <div className={style.modalHeader}>
          <div className={`${style.seriesTag} ${seriesClass}`}>
            {seriesLabel}
          </div>
          <h2 className={style.title}>{event.title}</h2>
        </div>

        <div className={style.eventContent}>
          <div className={style.eventName}>
            {meta.round}
          </div>

          <div className={style.timeInfo}>
            <div className={style.timeBlock}>
              <div className={style.mainTime}>
                {deviceStartTimeFormatted}
              </div>
              <div className={style.date}>
                {deviceStartDateFormatted}
              </div>
              <div className={style.raceTime}>Local Time: {raceTimeFormatted}</div>
              <div className={style.raceDate}>{raceDateFormatted}</div>
              <div className={style.timezone}>GMT{timezone}</div>
            </div>
          </div>

          {detailItems.length > 0 && (
            <div className={style.detailCard}>
              {detailItems.map((item) => (
                <div className={style.detailRow} key={item.label}>
                  <span className={style.detailLabel}>{item.label}</span>
                  <span className={style.detailValue}>{item.value}</span>
                </div>
              ))}
              {sourceUrl && (
                <a
                  className={style.sourceLink}
                  href={sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  View Official Event Page
                </a>
              )}
            </div>
          )}
        </div>

        <div className={style.buttonBar}>
          {showSweepstakeButton && (
            <button
              className={style.sweepstakeButton}
              onClick={() => {
                onCreateSweepstake(roundId!);
                onClose();
              }}
            >
              Create Sweepstake
            </button>
          )}
          <button className="pickButton" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
