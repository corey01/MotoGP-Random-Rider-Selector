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
    <div className={`${style.NextRace} ${isActiveNow ? style.ongoing : ""}`}>
      <h2>{isActiveNow ? "Ongoing Grand Prix" : "Next Grand Prix"}</h2>
      <p className={style.raceName}><Link href="/race-lineup">{race.name}</Link></p>
      <p>
        {race.circuit.circuitName} - {race.circuit.circuitCountry}
      </p>
      <p>
        {format(startDate, "eee do")} - {format(endDate, "eee do MMM yy")}
      </p>
      {!isActiveNow && (
        <p>
          Starts in{" "}
          {formatDistanceToNow(new Date(race.broadcasts[0].date_start)) + "!"}
        </p>
      )}
    </div>
  );
};

export default NextRace;
