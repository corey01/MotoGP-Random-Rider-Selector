import { Season } from "@/models/race";
import seasonData from "./seasonData.json";
import wsbkSeasonData from './wsbkSeason2025.json';
import { add } from "date-fns";

interface Broadcast {
  kind: string;
  date_start: string;
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
}

type EventMeta = {
  round: string;
  name: string;
}


const defaultSeasonObject = {
  past: [],
  future: [],
  current: [],
};

export const convertToLocalTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toISOString();
};

export const filterAndFormatSessions = (data: RaceEvent): CalendarEvent[] => {
  return data.broadcasts
    .filter(session => session.kind === "RACE")
    .map(session => ({
      title: `${session.eventName} ${session.name}`,
      start: convertToLocalTime(session.date_start),
      className: 'motogp-event',
      meta: {
        round: `${data.name} Grand Prix`,
        name: session.name
      }
    }));
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

export async function getUnsortedSeasonDataLocal() {  
  return seasonData.flatMap(s => filterAndFormatSessions(s));
}


export async function getWsbkSeasonDataLocal() {
  return wsbkSeasonData.flatMap(schedule => {
    return schedule.data.flatMap(a => a).map(event => ({
      ...event, 
      title: event.name.replace('WorldSBK', 'WSBK'),
      start: convertToLocalTime(event.dateTimeStart),
      className: 'wsbk-event',
      meta: {
        round: schedule.title,
        name: event.name
      }
    })).filter(event => event.type === "RACE")
  })
}

export type MotoGpSeasonData = Awaited<ReturnType<typeof getUnsortedSeasonDataLocal>>;
export type WsbkSeasonData = Awaited<ReturnType<typeof getWsbkSeasonDataLocal>>;