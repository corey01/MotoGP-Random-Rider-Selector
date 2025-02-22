'use client';

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

  return (
    <div onClick={handleOverlayClick} className={style.Overlay}>
      <div className={style.Modal}>
        <p className={style.title}>Race Details</p>
        <div>
          <p style={{ marginBottom: '12px' }}>
            {new Date(event.start).toLocaleString([], {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          <p>{event.title}</p>
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
