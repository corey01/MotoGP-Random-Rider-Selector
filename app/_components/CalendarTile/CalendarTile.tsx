import { Race } from "@/models/race";
import style from "./CalendarTile.module.scss";
import Image from "next/image";
import { format } from "date-fns";
import { motoGP } from "@/app/fonts";

const Tile = ({ race }: { race: Race }) => (
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

export default Tile;
