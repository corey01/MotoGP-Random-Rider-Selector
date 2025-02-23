import style from './SessionToggle.module.scss';
import { inter } from '@/app/fonts';

interface SessionToggleProps {
  showAllSessions: boolean;
  onToggle: () => void;
}

export const SessionToggle = ({ showAllSessions, onToggle }: SessionToggleProps) => {
  return (
    <div className={`${style.toggleContainer} ${inter.className}`}>
      <button 
        className={`${style.toggle} ${showAllSessions ? style.active : ''}`}
        onClick={onToggle}
      >
        {showAllSessions ? 'Showing All Sessions' : 'Showing Races Only'}
      </button>
    </div>
  );
};
