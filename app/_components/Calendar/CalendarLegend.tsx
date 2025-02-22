import { motoGPTextBold } from '@/app/fonts';
import style from './CalendarLegend.module.scss';

export const CalendarLegend = () => {
  return (
    <div className={`${style.legendContainer} ${motoGPTextBold.className}`}>
        <h4>Key</h4>
    <div className={style.legend}>
      <div className={style.legendItem}>
        <div className={`${style.seriesTag} ${style.motogpTag}`}>MotoGP</div>
      </div>
      <div className={style.legendItem}>
        <div className={`${style.seriesTag} ${style.wsbkTag}`}>WSBK</div>
      </div>
    </div>
    </div>
  );
};
