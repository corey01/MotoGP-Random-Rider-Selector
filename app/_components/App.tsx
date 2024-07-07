"use client";

import { useCallback, useEffect, useState } from "react";

import RiderList from "./RiderList";
import Entrants from "./Entrants/Entrants";
import { Rider, SelectedRider } from "@/models/rider";
import { defaultEntrants } from "@/utils/entrants";
import { Season } from "@/models/race";
import NextRace from "./NextRace/NextRace";
import { useRouter } from "next/navigation";
import LoadingOverlay from "./Loading/Overlay";
import {
  formatDistance,
  millisecondsToHours,
  millisecondsToMinutes,
} from "date-fns";
import { RiderDataResponse } from "@/utils/getRiderDataLocal";

interface HomeProps {
  allRiders: RiderDataResponse;
  season: Season;
}

export default function Home({ allRiders, season }: HomeProps) {
  const [page, setPage] = useState("riders");
  const [riders, setRiders] = useState<Rider[]>([]);
  const [guestRiders, setGuestRiders] = useState<Rider[]>([]);
  const [entrants, setEntrants] = useState(() => defaultEntrants);
  const [loading, setLoading] = useState<boolean>(false);

  const router = useRouter();

  const handleRemoveRider = (riderToRemove: Rider) => {
    if (riderToRemove.riderType === "guest") {
      setGuestRiders((prev) => [...prev, riderToRemove]);
    }
    setRiders((prevRiders) => {
      return prevRiders.filter((r) => r.id !== riderToRemove.id);
    });
  };

  useEffect(() => {
    setRiders(allRiders.standardRiders);
  }, [allRiders]);

  useEffect(() => {
    setGuestRiders(allRiders.guestRiders);
  }, [allRiders]);

  const handleResetAllRiders = () => {
    setRiders(allRiders.standardRiders);
    setGuestRiders(allRiders.guestRiders);
    localStorage.removeItem('riderList');
    window.scroll({top: 0, left: 0, behavior: 'smooth' })
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
      return [...prevEntrants, entrant.trim()];
    });
  };

  const handleAddRider = (rider: Rider) => {
    setGuestRiders((prev) => {
      return prev.filter((val) => val.id !== rider.id);
    });
    setRiders((prev) => [...prev, rider]);
  };

  const handleStorage = useCallback(() => {
    const savedResults = localStorage.getItem("savedResults");
    const savedRiderList = localStorage.getItem('riderList');

    if (savedResults) {
      setLoading(true);
      const decodedResults = JSON.parse(savedResults);
      if (decodedResults.generatedDate) {
        const timeDistanceInHours = millisecondsToHours(
          Date.now() - decodedResults.generatedDate
        );
        if (timeDistanceInHours >= 24) {
          localStorage.removeItem("savedResults");
          setLoading(false);
        } else {
          router.push(`/results/${decodedResults.results}`);
        }
      }
    }

    if(savedRiderList){
      const decodedResults = JSON.parse(savedRiderList);


      if (decodedResults.generatedDate) {
        const timeDistanceInHours = millisecondsToHours(
          Date.now() - decodedResults.generatedDate
        );
        if (timeDistanceInHours >= 24) {
          localStorage.removeItem("riderList");
          setLoading(false);
          return;
        } 
      }
      setRiders(decodedResults.riders)
    }

  }, [router]);

  useEffect(() => {
    handleStorage();
  }, [handleStorage]);

  const pickRiders = () => {
    setLoading(true);
    const tempRidersArray = [...riders];
    localStorage.setItem('riderList', JSON.stringify({riders, generatedDate: Date.now()}));
    const results = entrants
      .sort(() => Math.random() - 0.5)
      .reduce((acc, entrant, idx) => {
        const startsWithAmpersand = idx === 0 ? "" : "&";
        const riderIdx = Math.floor(Math.random() * tempRidersArray.length);

        const rider = tempRidersArray[riderIdx].id;

        tempRidersArray.splice(riderIdx, 1);

        return acc + startsWithAmpersand + entrant + "=" + rider;
      }, "?");

    const resultObject = {
      generatedDate: Date.now(),
      results,
    };
    window.localStorage.setItem("savedResults", JSON.stringify(resultObject));
    router.push(`/results/${results}`);
  };

  return (
    <>
      {loading && <LoadingOverlay />}
      <NextRace season={season} />

      <button disabled={loading} className="pickButton" onClick={pickRiders}>
        Randomly Assign Riders Now!
      </button>
      <div className="panelContainer">
        {page === "riders" && (
          <RiderList
            riderList={riders}
            guestRiders={guestRiders}
            handleRemoveRider={handleRemoveRider}
            handleResetAllRiders={handleResetAllRiders}
            handleAddRider={handleAddRider}
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
