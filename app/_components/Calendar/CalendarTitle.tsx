import { motoGP } from '@/app/fonts';
import styles from './CalendarTitle.module.scss';

interface CalendarTitleProps {
  currentDate: Date;
}

export const CalendarTitle = ({ currentDate }: CalendarTitleProps) => {
  const formattedDate = new Date(currentDate).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className={`${styles.titleContainer} ${motoGP.className}`}>
      {formattedDate}
    </div>
  );
};
