import { getSeasonDataLocal } from "@/utils/getSeasonDataLocal";
import Tile from "../_components/CalendarTile/CalendarTile";

const CalendarPage = async () => {
  const season = await getSeasonDataLocal();

  const currentRace = season.current;
  const sortedFutureRaces = season.future.sort((a, b) => {
    return new Date(a.date_start).valueOf() - new Date(b.date_start).valueOf();
  });

  const races = [...currentRace, ...sortedFutureRaces];
  return (
    <div>
      <h1>Calendar</h1>
      {races.map((race) => (
        <Tile key={race.name} race={race} />
      ))}
    </div>
  );
};

export default CalendarPage;
