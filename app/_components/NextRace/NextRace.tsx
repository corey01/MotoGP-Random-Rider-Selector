import { Race, Season } from "@/models/race";
import { format, formatDistanceToNow } from "date-fns";
import style from "./NextRace.module.scss";

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

  console.log(race);

  return (
    <div className={style.NextRace}>
      <h2>
        {isActiveNow ? "Ongoing Race: " : "Next Race: "}
        {race.name}
      </h2>
      <p>
        {race.circuit.circuitName} - {race.circuit.circuitCountry}
      </p>
      <p>
        {format(startDate, "eeee do")} -{format(endDate, "eeee do MMM y")}
      </p>
      {!isActiveNow && <p>{formatDistanceToNow(startDate) + " away!"}</p>}
    </div>
  );
};

export default NextRace;
