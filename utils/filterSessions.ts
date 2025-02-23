import { EventImpl } from '@fullcalendar/core/internal';

type SessionType = 'RACE' | 'PRACTICE' | 'QUALIFYING' | 'WARMUP';

export const filterSessions = (events: EventImpl[], sessionType: SessionType) => {
  return events.filter(event => {
    // Handle MotoGP events
    if (event.extendedProps?.kind) {
      return event.extendedProps.kind === sessionType;
    }
    // Handle WSBK events
    if (event.extendedProps?.type) {
      return event.extendedProps.type === sessionType;
    }
    return false;
  });
};
