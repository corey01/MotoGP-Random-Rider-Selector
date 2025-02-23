'use client';

import { motoGP } from "@/app/fonts";
import style from "./Modal.module.scss";
import { format } from 'date-fns-tz';

interface CalendarEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
}

export const CalendarEventModal = ({ isOpen, onClose, event }: CalendarEventModalProps) => {
  if (!event) return null;

  // Start time formatting
  const deviceStartDate = new Date(event.extendedProps?.meta?.deviceTime);
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

  // End time formatting (if exists)
  const deviceEndDate = event.extendedProps?.meta?.deviceEndTime ? new Date(event.extendedProps?.meta?.deviceEndTime) : null;
  const deviceEndTimeFormatted = deviceEndDate?.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const deviceEndDateFormatted = deviceEndDate?.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Show end date only if it's different from start date
  const showEndDate = deviceEndDate && 
    deviceEndDateFormatted !== deviceStartDateFormatted;

  // Race time formatting (original timezone)
  const raceTimeString = event.extendedProps?.meta?.raceTime;
  // Extract the time portion before the timezone
  const [timeWithoutTz] = raceTimeString.split(' (GMT');
  const raceDate = new Date(timeWithoutTz);
  const raceTimeFormatted = format(raceDate, 'HH:mm');
  const raceDateFormatted = format(raceDate, 'EEEE, d MMMM yyyy');
  const timezone = raceTimeString.match(/GMT([+-]\d{4})\)/)?.[1] || '';

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div onClick={handleOverlayClick} className={style.Overlay}>
      <div className={style.Modal}>
        <div className={style.modalHeader}>
          <div className={`${style.seriesTag} ${event.classNames.includes('motogp-event') ? style.motogpTag : style.wsbkTag}`}>
            {event.classNames.includes('motogp-event') ? 'MotoGP' : 'WSBK'}
          </div>
          <h2 className={style.title}>{event.extendedProps?.meta?.round}</h2>
        </div>
        
        <div className={style.eventContent}>
          <div className={style.eventName}>
            {event.title}
          </div>
          
          <div className={style.timeInfo}>
            <div className={style.timeBlock}>
              <div className={style.mainTime}>
                {deviceStartTimeFormatted}
                {deviceEndTimeFormatted && ` - ${deviceEndTimeFormatted}`}
              </div>
              <div className={style.date}>
                {deviceStartDateFormatted}
                {showEndDate && (
                  <>
                    <br />
                    <span className={style.endDate}>Until {deviceEndDateFormatted}</span>
                  </>
                )}
              </div>
              <div className={style.raceTime}>Local Time: {raceTimeFormatted}</div>
              <div className={style.raceDate}>{raceDateFormatted}</div>
              <div className={style.timezone}>GMT{timezone}</div>
            </div>
          </div>
        </div>

        <div className={style.buttonBar}>
          <button className="pickButton" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
