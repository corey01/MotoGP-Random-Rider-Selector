'use client';

import style from "./Modal.module.scss";

interface CalendarEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  onCreateSweepstake?: (roundId: number) => void;
}

export const CalendarEventModal = ({ onClose, event, onCreateSweepstake }: CalendarEventModalProps) => {
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

  // Race time formatting (venue's local timezone)
  // raceTime format: "2026-03-22T18:00:00.000Z (GMT-03:00)" or just "2026-03-22T18:00:00.000Z"
  const raceTimeString = String(meta.raceTime || "");
  const [utcPart] = raceTimeString.split(' (GMT');
  const offsetMatch = raceTimeString.match(/GMT([+-])(\d{2}):?(\d{2})\)/);
  const timezone = offsetMatch ? `${offsetMatch[1]}${offsetMatch[2]}${offsetMatch[3]}` : '';
  const utcDate = new Date(utcPart);
  let venueDate = utcDate;
  if (offsetMatch) {
    const sign = offsetMatch[1] === '+' ? 1 : -1;
    const offsetMs = sign * (parseInt(offsetMatch[2]) * 60 + parseInt(offsetMatch[3])) * 60000;
    venueDate = new Date(utcDate.getTime() + offsetMs);
  }
  const venueIso = venueDate.toISOString();
  const raceTimeFormatted = venueIso.substring(11, 16);
  const [vy, vm, vd] = venueIso.substring(0, 10).split('-').map(Number);
  const raceDateFormatted = new Date(vy, vm - 1, vd).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  const fallbackSession = String(
    meta.sessionName || event.extendedProps?.session || event.extendedProps?.type || ""
  ).trim();
  const detailItems = [
    { label: "Country", value: meta.country },
    { label: "Session", value: fallbackSession },
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
  const isGrandPrix = fallbackSession.toLowerCase().includes("grand prix");
  const roundId: number | null = meta.roundId ?? null;
  const showSweepstakeButton = isMotoGP && isRace && isMainMotoGP && isGrandPrix && roundId !== null && onCreateSweepstake;

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
          {meta.round && (
            <div className={style.eventName}>{meta.round}</div>
          )}

          <div className={style.timeInfo}>
            <div className={style.timeBlock}>
              <div className={style.timeLabel}>Your time</div>
              <div className={style.mainTime}>{deviceStartTimeFormatted}</div>
              <div className={style.date}>{deviceStartDateFormatted}</div>
            </div>
            <div className={style.venueTimeBlock}>
              <div className={style.timeLabel}>
                Venue time{timezone ? ` (GMT${timezone})` : ''}
              </div>
              <div className={style.mainTime}>{raceTimeFormatted}</div>
              <div className={style.date}>{raceDateFormatted}</div>
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
