import { Race, Season } from "@/models/race";
import { format, formatDistanceToNow } from "date-fns";
import style from "./NextRace.module.scss";
import Link from "next/link";

const NextRace = ({ season }: { season: Season }) => {
  let race: Race;
  const currentRace = season.current;
  const isActiveNow = season.current.length > 0;
  const sortedFutureRaces = season.future.sort((a, b) => {
    return new Date(a.date_start).valueOf() - new Date(b.date_start).valueOf();
  });
  if (isActiveNow) {
    race = currentRace[0];
  } else {
    race = sortedFutureRaces[0];
  }

  const startDate = new Date(race.date_start);
  const endDate = new Date(race.date_end);

  return (
    <div className={style.NextRace}>
      <Link href="/calendar">
        <h2>{isActiveNow ? "Ongoing Race" : "Next Race"}</h2>
      </Link>
      <p>{race.name}</p>
      <p>
        {race.circuit.circuitName} - {race.circuit.circuitCountry}
      </p>
      <p>
        {format(startDate, "eeee do")} - {format(endDate, "eeee do MMM y")}
      </p>
      {!isActiveNow && <p>{formatDistanceToNow(startDate) + " away!"}</p>}
    </div>
  );
};

export default NextRace;
