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

  return <Results handleReset={handleReset} selectedRiders={resultsData} />;
};

export default ResultsPage;
