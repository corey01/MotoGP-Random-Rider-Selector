import { Season } from "@/models/race";
import seasonData from "./seasonData.json";
import wsbkSeasonData from './wsbkSeason2025.json';
import bsbSeasonData from './bsbSeason2025.json';
import { add } from "date-fns";


interface Broadcast {
  kind?: string;
  type?: string;
  date_start?: string;
  date_end?: string;
  eventName?: string;
  event_name?: string;
  name?: string;
  title?: string;
  shortname?: string;
  category?: { name?: string };
}

interface RaceEvent {
  name?: string;
  country?: string;
  countryName?: string;
  venue?: string;
  city?: string;
  grandPrixName?: string;
  title?: string;
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
  deviceTime: string;    
  deviceEndTime?: string;
  raceTime: string;      
}

const defaultSeasonObject = {
  past: [],
  future: [],
  current: [],
};

const COUNTRY_LABEL_OVERRIDES: Record<string, string> = {
  TH: "Thailand",
  ES: "Spain",
  FR: "France",
  IT: "Italy",
  PT: "Portugal",
  GB: "United Kingdom",
  NL: "Netherlands",
  AT: "Austria",
  CZ: "Czechia",
  DE: "Germany",
  AR: "Argentina",
  US: "United States",
  JP: "Japan",
  AU: "Australia",
  QA: "Qatar",
  IN: "India",
  MY: "Malaysia",
  ID: "Indonesia",
};


const REGION_OVERRIDES_BY_COUNTRY: Record<string, Record<string, string>> = {
  ES: {
    ARAGON: "Aragon",
    CATALUNYA: "Catalunya",
    CATALUNA: "Catalunya",
    VALENCIA: "Valencia",
    SPAIN: "Spain",
  },
  IT: {
    "SAN MARINO": "San Marino",
    ITALY: "Italy",
  },
};

const inferRegionFromName = (countryCode?: string, eventName?: string) => {
  const code = (countryCode || "").trim().toUpperCase();
  const key = (eventName || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z\s]/g, "")
    .replace(/\s+/g, " ");
  if (!code || !key) return "";
  return REGION_OVERRIDES_BY_COUNTRY[code]?.[key] || "";
};

const countryLabelFromCode = (countryCode?: string) => {
  if (!countryCode) return "";
  const code = countryCode.trim().toUpperCase();
  if (!code) return "";
  if (COUNTRY_LABEL_OVERRIDES[code]) return COUNTRY_LABEL_OVERRIDES[code];
  try {
    const dn = new Intl.DisplayNames(["en"], { type: "region" });
    return dn.of(code) || code;
  } catch {
    return code;
  }
};

const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const extractRegionFromGrandPrix = (grandPrixName?: string) => {
  if (!grandPrixName) return "";
  const clean = grandPrixName.replace(/\s+/g, " ").trim();

  const ofMatch = clean.match(/\bOF\s+(.+)$/i);
  if (ofMatch?.[1]) return toTitleCase(ofMatch[1]);

  const deMatch = clean.match(/\bDE\s+(.+)$/i);
  if (deMatch?.[1]) return toTitleCase(deMatch[1]);

  const diMatch = clean.match(/\bDI\s+(.+)$/i);
  if (diMatch?.[1]) {
    const shortened = diMatch[1].split(/\s+E\s+DELLA\s+/i)[0];
    return toTitleCase(shortened);
  }

  return "";
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
  const countryCode = (data.country || "").trim().toUpperCase();
  const countryLabel =
    (data.countryName || "").trim() ||
    countryLabelFromCode(countryCode) ||
    "";
  const venueLabel = (data.venue || data.city || "").trim() || "";
  const gpBase =
    (data.grandPrixName || data.title || (countryLabel ? `Grand Prix of ${countryLabel}` : "")).trim() ||
    `${venueLabel || countryLabel || "Grand Prix"} Grand Prix`;

  // Prefer GP region naming (Catalunya, Aragon, San Marino, etc.) over generic country labels.
  const gpRegionLabel = extractRegionFromGrandPrix(gpBase);
  const regionalNameOverride = inferRegionFromName(countryCode, data.name);
  const eventLabel =
    (gpRegionLabel || regionalNameOverride || countryLabel || venueLabel || data.title || "Grand Prix").trim();

  const roundLabel =
    venueLabel && !gpBase.toLowerCase().includes(venueLabel.toLowerCase())
      ? `${gpBase} in ${venueLabel}`
      : gpBase;

  return (data.broadcasts || []).flatMap((session) => {
    const series =
      session.eventName ||
      session.event_name ||
      session.category?.name ||
      "MotoGP";

    const rawSessionName =
      session.name ||
      session.title ||
      session.shortname ||
      session.kind ||
      session.type ||
      "Session";

    const sessionName = rawSessionName.replace(/^Tissot\s+Sprint$/i, "Sprint");
    const sessionKind = (session.kind || session.type || "SESSION").toUpperCase();
    const start = session.date_start || "";
    const end = session.date_end;

    if (!start) return [];

    const isSprint = /SPRINT/i.test(sessionName);
    const isRace = /RACE|GRAND PRIX/i.test(sessionName) || sessionKind === "RACE";
    const sessionDescriptor = isSprint
      ? "Sprint"
      : isRace
      ? "Grand Prix"
      : sessionName;
    const sessionLabel = `${series} ${sessionDescriptor}`.replace(/\s+/g, " ").trim();
    const tzSuffix = start.includes("+") ? ` (GMT${start.slice(-5)})` : "";
    const displayName = `${eventLabel} ${sessionLabel}`.replace(/\s+/g, " ").trim();

    return [{
      title: displayName,
      start, // Browser will auto-convert this for the calendar display
      className: "motogp-event",
      extendedProps: {
        session: sessionKind,
        meta: {
          round: roundLabel,
          name: sessionLabel,
          deviceTime: start, // Browser will convert this to local time
          deviceEndTime: end,
          raceTime: start.split("+")[0] + tzSuffix // Keep original time with timezone
        }
      }
    }];
  });
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

export const getBsbSeasonDataLocal = (racesOnly = true) => {
  const events = bsbSeasonData.flatMap(schedule => {
    // Use "circuit" as the round/location name
    const circuit = schedule.circuit || "";
    const roundLabel = schedule.title && circuit
      ? `${schedule.title} - ${circuit}`
      : circuit || schedule.title || "";

    return schedule.data.flatMap((a: any) => a).map((event: any) => {
      const dateTimeStart = event.dateTimeStart || "";
      const type = event.type || event.kind || "";

      return {
        // Use the session name as the event title, but you could also use `${circuit} ${event.name}` if you want both
        title: event.name ? `${circuit} ${event.name}` : circuit,
        start: dateTimeStart,
        end: dateTimeStart ? add(new Date(dateTimeStart), { minutes: 30 }).toISOString() : undefined,
        className: 'bsb-event',
        extendedProps: {
          session: type,
          type,
          meta: {
            round: roundLabel,
            name: event.name || "",
            deviceTime: dateTimeStart,
            deviceEndTime: dateTimeStart ? add(new Date(dateTimeStart), { minutes: 30 }).toISOString() : undefined,
            raceTime: dateTimeStart && dateTimeStart.includes('+')
              ? dateTimeStart.split('+')[0] + ` (GMT${dateTimeStart.slice(-5)})`
              : dateTimeStart
          }
        }
      } as CalendarEvent;
    });
  });

  const filteredEvents = racesOnly 
    ? events.filter(event => event.extendedProps?.type === "RACE")
    : events;

  return filteredEvents;
};

export type MotoGpSeasonData = ReturnType<typeof getUnsortedSeasonDataLocal>;
export type WsbkSeasonData = ReturnType<typeof getWsbkSeasonDataLocal>;
export type BsbSeasonData = ReturnType<typeof getBsbSeasonDataLocal>;
