import { motoGPTextMed } from "@/app/fonts";
import styles from './CalendarTitle.module.scss';

interface CalendarTitleProps {
  currentDate: Date;
  direction?: 'next' | 'prev' | 'today';
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export const CalendarTitle = ({
  currentDate,
  direction,
  onPrev,
  onNext,
  onToday,
}: CalendarTitleProps) => {
  const formattedMonth = new Date(currentDate).toLocaleDateString("en-US", {
    month: "long",
  }).toUpperCase();
  const formattedSeason = `${new Date(currentDate).getFullYear()} SEASON`;

  // Only apply animation class if there's a direction
  const animationClass = direction ? (
    direction === 'next' ? styles.slideLeft :
    direction === 'prev' ? styles.slideRight :
    styles.fadeIn
  ) : '';

  return (
    <div className={styles.headerRow}>
      <div className={styles.titleBlock}>
        <p className={styles.eyebrow}>{formattedSeason}</p>
        <div className={`${styles.titleContainer} ${motoGPTextMed.className}`}>
        <span
          key={direction ? `${formattedMonth}-${formattedSeason}` : undefined}
          className={`${styles.animatedText} ${animationClass}`}
        >
          {formattedMonth}
        </span>
        </div>
      </div>

      <div className={styles.controls} aria-label="Calendar navigation">
        <button type="button" className={styles.navButton} onClick={onPrev} aria-label="Previous month">
          &#8249;
        </button>
        <button type="button" className={styles.todayButton} onClick={onToday}>
          TODAY
        </button>
        <button type="button" className={styles.navButton} onClick={onNext} aria-label="Next month">
          &#8250;
        </button>
      </div>
    </div>
  );
};
