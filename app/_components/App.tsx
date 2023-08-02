"use client";

import { useEffect, useState } from "react";

import RiderList from "./RiderList";
import Entrants from "./Entrants/Entrants";
import { Rider } from "@/models/rider";
import { defaultEntrants } from "@/utils/entrants";
import { Season } from "@/models/race";
import NextRace from "./NextRace/NextRace";
import { useRouter } from "next/navigation";

interface HomeProps {
  allRiders: Rider[];
  season: Season;
}

export default function Home({ allRiders, season }: HomeProps) {
  const [page, setPage] = useState("riders");
  const [riders, setRiders] = useState<Rider[]>([]);
  const [entrants, setEntrants] = useState(() => defaultEntrants);
  const router = useRouter();

  const handleRemoveRider = (riderToRemove: string) => {
    setRiders((prevRiders) => {
      return prevRiders.filter((r) => r.id !== riderToRemove);
    });
  };

  useEffect(() => {
    setRiders(allRiders);
  }, [allRiders]);

  const handleResetAllRiders = () => {
    setRiders(allRiders);
  };

  const handleRemoveEntrant = (entrantToRemove: string) => {
    setEntrants((prevEntrants) => {
      return prevEntrants.filter((r) => r !== entrantToRemove);
    });
  };

  const handleResetEntrants = () => {
    setEntrants(defaultEntrants);
  };

  const handleAddNewEntrant = (entrant: string) => {
    setEntrants((prevEntrants) => {
      return [...prevEntrants, entrant];
    });
  };

  useEffect(() => {
    setRiders(allRiders);
  }, [allRiders]);

  const pickRiders = () => {
    const tempRidersArray = [...riders];
    const results = entrants.reduce((acc, entrant, idx) => {
      const startsWithAmpersand = idx === 0 ? "" : "&";
      const riderIdx = Math.floor(Math.random() * tempRidersArray.length);

      const rider = tempRidersArray[riderIdx].id;

      tempRidersArray.splice(riderIdx, 1);

      return acc + startsWithAmpersand + entrant + "=" + rider;
    }, "?");

    router.push(`/results/${results}`);
  };

  return (
    <>
      <NextRace season={season} />

      <button className="pickButton" onClick={pickRiders}>
        Pick Riders!
      </button>
      <div className="panelContainer">
        {page === "riders" && (
          <RiderList
            riderList={riders}
            handleRemoveRider={handleRemoveRider}
            handleResetAllRiders={handleResetAllRiders}
          />
        )}
        {page === "entrants" && (
          <Entrants
            entrants={entrants}
            handleRemoveEntrant={handleRemoveEntrant}
            handleResetEntrants={handleResetEntrants}
            handleAddNewEntrant={handleAddNewEntrant}
          />
        )}
      </div>
      <div className="navbar">
        <div
          className={`setpage ${page === "riders" ? "active" : ""}`}
          onClick={() => setPage("riders")}
        >
          Riders
        </div>
        <div
          className={`setpage ${page === "entrants" ? "active" : ""}`}
          onClick={() => setPage("entrants")}
        >
          Entrants
        </div>
      </div>
    </>
  );
}
