import type { ReactNode } from 'react';
import { sessionDisruption, strikeSessionTime } from '@/utils/sessionStatus';
import style from './SessionStatus.module.scss';

export function SessionStatus({status}: {status?: string | null}) {
  const label = sessionDisruption(status);
  return label ? <span className={style.label}>{label}</span> : null;
}

export function ScheduledTime({status, start, children}: {status?: string | null; start?: string | null; children: ReactNode}) {
  return strikeSessionTime(status, start) ? <s className={style.cancelledTime}>{children}</s> : <>{children}</>;
}
