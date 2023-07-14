"use client";

import { useEffect, useState } from "react";
import defaultRiders from "./riders";
import RiderList from "../Components/RiderList";
import Entrants from "@/Components/Entrants/Entrants";
import { getRiderData } from "@/utils/getRiderData";

const defaultEntrants = ["Mum", "Dad", "Corey", "Norma"];

export default async function Home() {
  const [page, setPage] = useState("riders");
  const [riders, setRiders] = useState([]);
  const [entrants, setEntrants] = useState(() => defaultEntrants);
  const [selectedRiders, setSelectedRiders] = useState<string[]>([]);

  const handleRemoveRider = (riderToRemove: string) => {
    setRiders((prevRiders) => {
      return prevRiders.filter((r) => r !== riderToRemove);
    });
  };

  const resetRiders = async () => {
    setRiders(await getRiderData());
  };

  const handleResetAllRiders = () => {
    resetRiders;
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
    resetRiders();
  }, []);

  const pickRiders = () => {
    const tempRidersArray = [...riders];
    const results = entrants.map((entrant) => {
      const riderIdx = Math.floor(Math.random() * tempRidersArray.length);

      const rider = tempRidersArray[riderIdx];

      tempRidersArray.splice(riderIdx, 1);

      return entrant + " - " + rider;
    });

    setSelectedRiders(results);
  };

  return (
    <main>
      <h1>MotoGP Random Rider Selector</h1>

      {selectedRiders.length ? (
        <>
          <div>Results:</div>
          {selectedRiders.map((rider) => (
            <div key={rider}>{rider}</div>
          ))}
          <button className="pickButton" onClick={() => setSelectedRiders([])}>
            Reset
          </button>
        </>
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
