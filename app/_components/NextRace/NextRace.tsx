import { Race, Season } from "@/models/race";
import { add, format, formatDistanceToNow } from "date-fns";
import style from "./NextRace.module.scss";
import Link from "next/link";

const NextRace = ({ season }: { season: Season }) => {
  // Recompute current/next at render time so static exports stay fresh
  const now = new Date();
  const all: Race[] = [
    ...(season.past || []),
    ...(season.current || []),
    ...(season.future || []),
  ];
  const isOngoing = (ev: Race) => {
    const start = new Date(ev.date_start);
    const end = add(new Date(ev.date_end), { hours: 23, minutes: 59 });
    return start <= now && now <= end;
  };
  const current = all.find(isOngoing) || null;
  const upcoming =
    all
      .filter((ev) => new Date(ev.date_start) > now)
      .sort(
        (a, b) =>
          new Date(a.date_start).valueOf() - new Date(b.date_start).valueOf()
      )[0] || null;

  const race = (current || upcoming)!;
  const isActiveNow = !!current;

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
