"use client";

import { Race, Season } from "@/models/race";
import React from "react";
import NextRace from "../NextRace/NextRace";
import Tile from "../CalendarTile/CalendarTile";
import Link from "next/link";
import style from "./Calendar.module.scss";
import { useSearchParams } from "next/navigation";

export function Calendar({
  season,
  races,
  currentRaceName,
}: {
  season: Season;
  races: Race[];
  currentRaceName?: string;
}) {
  // const searchParams = useSearchParams();

  // const active = searchParams.get("active");

  return (
    <div className={style.Calendar}>
      <NextRace season={season} />
      <h1>Upcoming Grand{races.length > 1 && "s"} Prix</h1>

      <p className={style.timeNote}>Note: All times shown in GMT</p>
      {races.map((race) => {
        return (
          <Tile
            key={race.name}
            race={race}
            isCurrent={race.name === currentRaceName}
            // isActive={!!active && active === race.name}
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
}
