import { getSeasonDataLocal, getUnsortedSeasonDataLocal, getWsbkSeasonDataLocal } from "@/utils/getSeasonDataLocal";
import { Calendar } from "../_components/Calendar/Calendar";

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

export const convertToLocalTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toISOString();
};

const filterAndFormatSessions = (data: RaceEvent): CalendarEvent[] => {
  return data.broadcasts
    .filter(session => session.kind === "RACE")
    .map(session => ({
      title: `${data.name} ${session.eventName} ${session.name}`,
      start: convertToLocalTime(session.date_start),
      className: 'motogp-event'
    }));
};

const CalendarPage = async () => {
  const season = await getUnsortedSeasonDataLocal();
  const wsbkSeason = await getWsbkSeasonDataLocal();

  const raceData = season.flatMap(s => filterAndFormatSessions(s));

  return (
    <Calendar motoGPData={raceData} wsbkData={wsbkSeason} />
  );
}

export default CalendarPage;