"use client";

import { Race } from "@/models/race";
import style from "./CalendarTile.module.scss";
import Image from "next/image";
import { format } from "date-fns";
import { motoGP } from "@/app/fonts";
import { localRaceTime } from "@/utils/datesTimes";
import { useState } from "react";

const Tile = ({ race, isCurrent }: { race: Race; isCurrent: boolean }) => {
  const [expanded, setExpanded] = useState(false);

  const sprint = race.broadcasts?.find(
    ({ name, kind, eventName }) =>
      eventName === "MotoGP" && name === "Tissot Sprint" && kind === "RACE"
  );

  const gpRace = race.broadcasts?.find(
    ({ name, kind, eventName }) =>
      eventName === "MotoGP" && name === "Race" && kind === "RACE"
  );

  return (
    <>
      <div className={`${style.tile} ${isCurrent ? style.current : undefined}`}>
        <div className={style.contentBox}>
          {isCurrent && <p className={style.ongoing}>Ongoing Grand Prix</p>}
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
          <p>
            <span className={style.innerTitle}>Sprint Race</span>
            <br />
            {localRaceTime(sprint?.date_start!)}
          </p>
          <p>
            <span className={style.innerTitle}>Main Race</span>
            <br />
            {localRaceTime(gpRace?.date_start!)}
          </p>
          <p className={style.seeMore} onClick={() => setExpanded(!expanded)}>
            {expanded ? "See less -" : "See full lineup +"}
          </p>
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

      {expanded && (
        <div className={style.expanded}>
          <table className={style.allEvents}>
            <thead>
              <tr className={style.headerRow}>
                <th>Class</th>
                <th>Type</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {race.broadcasts.map((broadcast) => (
                <tr
                  key={broadcast.date_start + broadcast.eventName}
                  className={
                    broadcast.eventName === "MotoGP"
                      ? style.highlight
                      : undefined
                  }
                >
                  <td>{broadcast.eventName}</td>
                  <td>{broadcast.name}</td>
                  <td>{localRaceTime(broadcast.date_start)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => setExpanded(false)}>
            Close expanded view
          </button>
        </div>
      )}
    </>
  );
};

export default Tile;
