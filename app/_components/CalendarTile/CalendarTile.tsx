"use client";

import { Race } from "@/models/race";
import style from "./CalendarTile.module.scss";
import Image from "next/image";
import { format } from "date-fns";
import { motoGP } from "@/app/fonts";
import { localRaceTime } from "@/utils/datesTimes";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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
      eventName?.toLowerCase() === "motogp" &&
      kind === "RACE" &&
      /sprint/i.test(name)
  );

  const gpRace = race.broadcasts?.find(
    ({ name, kind, eventName }) =>
      eventName?.toLowerCase() === "motogp" &&
      kind === "RACE" &&
      /(^race$|grand prix)/i.test(name)
  );

  const countryCode = /^[A-Z]{2}$/.test(String(race.country || ""))
    ? race.country
    : "";
  const locationLabel =
    race.circuit?.circuitName ||
    race.url ||
    race.circuit?.circuitCountry ||
    race.country ||
    "";

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
            {locationLabel}
            {countryCode ? (
              <Image
                className={style.flag}
                src={`https://flagsapi.com/${countryCode}/flat/48.png`}
                width={18}
                height={18}
                alt=""
              />
            ) : null}
          </p>
          <p>{format(new Date(race.date_start), "do MMMM y")}</p>
          <p>
            <span className={style.innerTitle}>Sprint Race</span>
            <br />
            {sprint?.date_start ? localRaceTime(sprint.date_start, race.country) : "TBC"}
          </p>
          <p>
            <span className={style.innerTitle}>Main Race</span>
            <br />
            {gpRace?.date_start ? localRaceTime(gpRace.date_start, race.country) : "TBC"}
          </p>
          <p className={style.seeMore} onClick={handleToggle}>
            {expanded ? "See less -" : "See full lineup +"}
          </p>
          {race.roundId && (
            <p className={style.seeMore}>
              <Link href={`/race?roundId=${race.roundId}`}>More race info →</Link>
            </p>
          )}
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
