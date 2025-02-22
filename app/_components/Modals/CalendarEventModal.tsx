'use client';

import { motoGP } from "@/app/fonts";
import style from "./Modal.module.scss";

interface CalendarEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
}

export const CalendarEventModal = ({ isOpen, onClose, event }: CalendarEventModalProps) => {
  if (!isOpen || !event) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const eventProps = event.extendedProps;
  const eventDate = new Date(event.start);

  const formatDate = (date: Date) => {
    return {
      day: date.toLocaleDateString([], { weekday: 'long' }),
      date: date.toLocaleDateString([], { 
        day: 'numeric', 
        month: 'long'
      }),
      year: date.getFullYear(),
      time: date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
    };
  };

  const { day, date, year, time } = formatDate(eventDate);

  return (
    <div onClick={handleOverlayClick} className={style.Overlay}>
      <div className={style.Modal}>
        <div className={style.modalHeader}>
          <div className={`${style.seriesTag} ${event.classNames.includes('motogp-event') ? style.motogpTag : style.wsbkTag}`}>
            {event.classNames.includes('motogp-event') ? 'MotoGP' : 'WSBK'}
          </div>
          <h2 className={style.title}>{eventProps.meta.round}</h2>
        </div>
        
        <div className={style.eventContent}>
          <div className={style.eventDateTime}>
            <div className={style.eventDay}>{day}</div>
            <div className={style.eventDate}>{date}, {year}</div>
            <div className={style.eventTime}>{time}</div>
          </div>

          <div className={style.eventName}>
            {event.title}
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
