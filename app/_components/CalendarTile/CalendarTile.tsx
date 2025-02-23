"use client";

import { Race } from "@/models/race";
import style from "./CalendarTile.module.scss";
import Image from "next/image";
import { format } from "date-fns";
import { motoGP } from "@/app/fonts";
import { localRaceTime } from "@/utils/datesTimes";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Expanded } from "./Expanded";

const Tile = ({
  race,
  isCurrent,
}: // isActive = false,
{
  race: Race;
  isCurrent: boolean;
  // isActive: boolean;
}) => {
  const searchParams = useSearchParams()!;
  // const [expanded, setExpanded] = useState(() => isActive);
  const [expanded, setExpanded] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  // useEffect(() => {
  //   if (isActive) {
  //     ref.current?.scrollIntoView({ behavior: "smooth" });
  //   }
  // }, [isActive]);

  useEffect(() => {
    if (expanded) {
      ref.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [expanded]);

  const sprint = race.broadcasts?.find(
    ({ name, kind, eventName }) =>
      eventName === "MotoGP" && name === "Sprint" && kind === "RACE"
  );

  const gpRace = race.broadcasts?.find(
    ({ name, kind, eventName }) =>
      eventName === "MotoGP" && name === "Race" && kind === "RACE"
  );

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams]
  );

  const handleToggle = () => {
    setExpanded((cur) => !cur);
  };

  return (
    <>
      <div
        ref={ref}
        className={`${style.tile} ${isCurrent ? style.current : undefined}`}
      >
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
            {localRaceTime(sprint?.date_start!, race.country)}
          </p>
          <p>
            <span className={style.innerTitle}>Main Race</span>
            <br />
            {localRaceTime(gpRace?.date_start!, race.country)}
          </p>
          <p className={style.seeMore} onClick={handleToggle}>
            {expanded ? "See less -" : "See full lineup +"}
          </p>
        </div>
        <div className={style.imageContainer}>
          {race.circuit.simpleCircuitPath && (

            <Image
            src={race.circuit.simpleCircuitPath}
            alt=""
            width={200}
            height={200}
            className={style.track}
            />
          )}
        </div>
      </div>

      {expanded && <Expanded race={race} handleToggle={handleToggle} />}
    </>
  );
};

export default Tile;
