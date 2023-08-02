import { getSeasonDataLocal } from "@/utils/getSeasonDataLocal";
import Tile from "../_components/CalendarTile/CalendarTile";
import style from "./Calendar.module.scss";
import Link from "next/link";

const CalendarPage = async () => {
  const season = await getSeasonDataLocal();

  const currentRace = season.current;
  const sortedFutureRaces = season.future.sort((a, b) => {
    return new Date(a.date_start).valueOf() - new Date(b.date_start).valueOf();
  });
  console.log(sortedFutureRaces);

  const races = [...currentRace, ...sortedFutureRaces];
  return (
    <div className={style.Calendar}>
      <h1>Upcoming Races</h1>

      {races.map((race) => (
        <Tile key={race.name} race={race} />
      ))}

      <div className={style.buttonBar}>
        <button className={style.home}>
          <Link href="/">Return Home</Link>
        </button>
      </div>
    </div>
  );
};

export default CalendarPage;
