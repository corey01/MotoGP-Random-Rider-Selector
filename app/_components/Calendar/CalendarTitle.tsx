import { motoGP } from '@/app/fonts';
import styles from './CalendarTitle.module.scss';

interface CalendarTitleProps {
  currentDate: Date;
  direction?: 'next' | 'prev' | 'today';
}

export const CalendarTitle = ({ currentDate, direction }: CalendarTitleProps) => {
  const formattedDate = new Date(currentDate).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  // Only apply animation class if there's a direction
  const animationClass = direction ? (
    direction === 'next' ? styles.slideLeft :
    direction === 'prev' ? styles.slideRight :
    styles.fadeIn
  ) : '';

  return (
    <div className={`${styles.titleContainer} ${motoGP.className}`}>
      <span 
        key={direction ? formattedDate : undefined} // Only use key when animating
        className={`${styles.animatedText} ${animationClass}`}
      >
        {formattedDate}
      </span>
    </div>
  );
};
