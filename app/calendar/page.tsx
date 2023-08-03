import { Calendar } from "./../_components/Calendar/Calendar";
import { getSeasonDataLocal } from "@/utils/getSeasonDataLocal";

const CalendarPage = async () => {
  const season = await getSeasonDataLocal();

  const currentRace = season.current;
  const sortedFutureRaces = season.future.sort((a, b) => {
    return new Date(a.date_start).valueOf() - new Date(b.date_start).valueOf();
  });

  const races = [...currentRace, ...sortedFutureRaces];
  return (
    <Calendar
      season={season}
      races={races}
      currentRaceName={currentRace[0]?.name || undefined}
    />
  );
};

export default CalendarPage;
