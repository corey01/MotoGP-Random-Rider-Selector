import { getSeasonDataLocal } from "@/utils/getSeasonDataLocal";
import Tile from "../_components/CalendarTile/CalendarTile";
import style from "./Calendar.module.scss";
import Link from "next/link";
import NextRace from "../_components/NextRace/NextRace";

const CalendarPage = async () => {
  const season = await getSeasonDataLocal();

  const currentRace = season.current;
  const sortedFutureRaces = season.future.sort((a, b) => {
    return new Date(a.date_start).valueOf() - new Date(b.date_start).valueOf();
  });

  const races = [...currentRace, ...sortedFutureRaces];
  return (
    <div className={style.Calendar}>
      <NextRace season={season} />
      <h1>Upcoming Races</h1>

      <p>Note: All times shown in GMT</p>
      {races.map((race) => {
        return (
          <Tile
            key={race.name}
            race={race}
            isCurrent={race.name === currentRace[0]?.name}
          />
        );
      })}

      <div className={style.buttonBar}>
        <button className={style.home}>
          <Link href="/">Return Home</Link>
        </button>
      </div>
    </div>
  );
};

export default CalendarPage;
