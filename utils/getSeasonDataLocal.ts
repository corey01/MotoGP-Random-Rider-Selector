import { Season } from "@/models/race";
import seasonData from "./seasonData.json";
import wsbkSeasonData from './wsbkSeason2025.json';
import { add } from "date-fns";


interface Broadcast {
  kind: string;
  date_start: string;
  date_end: string;
  eventName: string;
  name: string;
}

interface RaceEvent {
  name: string;
  broadcasts: Broadcast[];
}

interface CalendarEvent {
  title: string;
  start: string;
  className: string;
  extendedProps?: {
    session?: string;
    type?: string;
    meta?: EventMeta;
  };
}

type EventMeta = {
  round: string;
  name: string;
  deviceTime: string;    // Time converted to device's local timezone
  raceTime: string;      // Original race time with timezone
}

const defaultSeasonObject = {
  past: [],
  future: [],
  current: [],
};

export async function getSeasonDataLocal() {
  const season: Season = seasonData.reduce((allSeasonsObject, season) => {
    let key: keyof typeof defaultSeasonObject;
    const endDate = add(new Date(season.date_end), {
      hours: 23,
      minutes: 59,
    });

    // Leaving the following comment to help when debugging date issues
    // const now = new Date("2023-08-06T22:00:00+01:00");
    // 6th august 2023 at 10pm, GMT
    const now = new Date();

    if (season.status === "FINISHED" || endDate < now) {
      key = "past";
    } else {
      const startDate = new Date(season.date_start);

      if (startDate < now && endDate > now) {
        key = "current";
      } else {
        key = "future";
      }
    }
    return {
      ...allSeasonsObject,
      [key]: [...allSeasonsObject[key], season],
    };
  }, defaultSeasonObject);

  return season;
}

export const filterAndFormatSessions = (data: RaceEvent): CalendarEvent[] => {
  return data.broadcasts.map(session => ({
    title: `${session.eventName} ${session.name}`,
    start: session.date_start, // Browser will auto-convert this for the calendar display
    className: 'motogp-event',
    extendedProps: {
      session: session.kind,
      meta: {
        round: `${data.name} Grand Prix`,
        name: session.name,
        deviceTime: session.date_start, // Browser will convert this to local time
        deviceEndTime: session.date_end,
        raceTime: session.date_start.split('+')[0] + ` (GMT${session.date_start.slice(-5)})` // Keep original time with timezone
      }
    }
  }));
};

export const getUnsortedSeasonDataLocal = (racesOnly = true) => {
  const sessions = seasonData.flatMap(s => filterAndFormatSessions(s));
  
  const filteredSessions = racesOnly 
    ? sessions.filter(session => session.extendedProps?.session === "RACE")
    : sessions;

  return filteredSessions;
};

export const getWsbkSeasonDataLocal = (racesOnly = true) => {
  const events = wsbkSeasonData.flatMap(schedule => {
    return schedule.data.flatMap(a => a).map(event => ({
      ...event, 
      title: event.name.replace('WorldSBK', 'WSBK'),
      start: event.dateTimeStart, // Browser will auto-convert this for calendar display
      end: add(new Date(event.dateTimeStart), { minutes: 5 }).toISOString(),
      className: 'wsbk-event',
      meta: {
        round: schedule.title,
        name: event.name,
        deviceTime: event.dateTimeStart, // Browser will convert this to local time
        deviceTimeEnd: event.dateTimeEnd,
        raceTime: event.dateTimeStart.split('+')[0] + ` (GMT${event.dateTimeStart.slice(-5)})` // Keep original time with timezone
      }
    }));
  });

  const formattedEvents = events.map(event => ({
    ...event,
    extendedProps: {
      ...event,
      session: event.type
    }
  }));

  const filteredEvents = racesOnly 
    ? formattedEvents.filter(event => event.extendedProps.type === "RACE")
    : formattedEvents;

  return filteredEvents;
};

export type MotoGpSeasonData = ReturnType<typeof getUnsortedSeasonDataLocal>;
export type WsbkSeasonData = ReturnType<typeof getWsbkSeasonDataLocal>;