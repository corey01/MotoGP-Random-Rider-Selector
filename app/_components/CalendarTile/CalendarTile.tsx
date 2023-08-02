import { Race } from "@/models/race";
import style from "./CalendarTile.module.scss";
import Image from "next/image";
import { format } from "date-fns";
import { motoGP } from "@/app/fonts";
import { localRaceTime } from "@/utils/datesTimes";

const Tile = ({ race }: { race: Race }) => {
  const sprint = race.broadcasts?.find(
    ({ name, kind, eventName }) =>
      eventName === "MotoGP" && name === "Tissot Sprint" && kind === "RACE"
  );

  const gpRace = race.broadcasts?.find(
    ({ name, kind, eventName }) =>
      eventName === "MotoGP" && name === "Race" && kind === "RACE"
  );

  return (
    <div className={style.tile}>
      <div className={style.contentBox}>
        <h2 className={motoGP.className}>{race.name}</h2>
        <p className={style.location}>
          {race.url}{" "}
          <Image
            className={style.flag}
            src={`https://flagsapi.com/${race.country}/flat/48.png`}
            width={18}
            height={18}
            alt=""
          />
        </p>
        <p>{format(new Date(race.date_start), "do MMMM y")}</p>
        <p>Sprint Race: {localRaceTime(sprint?.date_start!)}</p>
        <p>Main Race: {localRaceTime(gpRace?.date_start!)}</p>
      </div>
      <div className={style.imageContainer}>
        <Image
          src={race.circuit.simpleCircuitPath}
          alt=""
          width={200}
          height={200}
          className={style.track}
        />
      </div>
    </div>
  );
};

export default Tile;
