"use client";

import { useEffect, useState } from "react";

import RiderList from "./RiderList";
import Entrants from "./Entrants/Entrants";
import { Rider, SelectedRider } from "@/models/rider";
import Results from "./Results/Results";
import { defaultEntrants } from "@/utils/entrants";
import { motoGP } from "@/app/fonts";
import { Race, Season } from "@/models/race";
import NextRace from "./NextRace/NextRace";
import Header from "./Header";

interface HomeProps {
  allRiders: Rider[];
  season: Season;
}

export default function Home({ allRiders, season }: HomeProps) {
  const [page, setPage] = useState("riders");
  const [riders, setRiders] = useState<Rider[]>([]);
  const [entrants, setEntrants] = useState(() => defaultEntrants);
  const [selectedRiders, setSelectedRiders] = useState<SelectedRider[]>([]);

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
    const results = entrants.map((entrant) => {
      const riderIdx = Math.floor(Math.random() * tempRidersArray.length);

      const rider = tempRidersArray[riderIdx];

      tempRidersArray.splice(riderIdx, 1);

      return {
        entrant,
        rider,
      };
    });

    setSelectedRiders(results);
  };

  const resetResults = () => {
    setSelectedRiders([]);
  };

  return (
    <main>
      <Header season={season} />

      {selectedRiders.length ? (
        <Results handleReset={resetResults} selectedRiders={selectedRiders} />
      ) : (
        <>
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
      )}
    </main>
  );
}
