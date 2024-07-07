"use client";
import { getRiderById } from "@/utils/getSelectedRidersByID";
import { useSearchParams } from "next/navigation";
import { Rider } from "../../models/rider";
import Results from "../_components/Results/Results";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

interface SelectedRider {
  entrant: string;
  rider: Rider;
}

const ResultsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  let resultsData: SelectedRider[] = [];
  searchParams.forEach((riderID, name) => {
    resultsData.push({
      entrant: name,
      rider: getRiderById(riderID)!,
    });
  });

  const setStorageOnArrive = useCallback(() => {
    const previous = localStorage.getItem("savedResults");
    if (previous) localStorage.removeItem("savedResults");

    localStorage.setItem(
      "savedResults",
      JSON.stringify({
        generatedDate: Date.now(),
        results: "?" + searchParams.toString(),
      })
    );
  }, [searchParams]);

  useEffect(() => {
    setStorageOnArrive();
  }, [setStorageOnArrive]);

  const handleReset = () => {
    localStorage.removeItem("savedResults");
    router.push("/");
  };

  const handleAddEntrantAndGenerate = (entrant: string) => {
    const savedRiderList = localStorage.getItem('riderList');
    const previousResultsJson = localStorage.getItem('savedResults');

    if(!savedRiderList || !previousResultsJson){
      return;
    }

    const riders = JSON.parse(savedRiderList);
    const previousResults = JSON.parse(previousResultsJson)
    const currentResults = resultsData.map(({rider}) => rider.id);
    const remainingRiders = (riders.riders as Rider[]).filter(({ id } )=> !currentResults.includes(id));

    const riderIdx = Math.floor(Math.random() * remainingRiders.length);
    const selectedRider = remainingRiders[riderIdx].id;

    const newResults = previousResults.results + `&${entrant}=${selectedRider}`
    const resultObject = {
      generatedDate: Date.now(),
      results: newResults
    };
    localStorage.setItem("savedResults", JSON.stringify(resultObject));
    router.push(`/results/${newResults}`);
  }

  return <Results handleReset={handleReset} selectedRiders={resultsData} addEntrant={handleAddEntrantAndGenerate} />;
};

export default ResultsPage;
