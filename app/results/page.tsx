"use client";
import { Suspense, useState, useEffect, useCallback } from "react";
import { getRiderData } from "@/utils/getRiderData";
import { useSearchParams } from "next/navigation";
import { Rider } from "../../models/rider";
import Results from "../_components/Results/Results";
import { useRouter } from "next/navigation";

interface SelectedRider {
  entrant: string;
  rider: Rider;
}

const ResultsContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [allRiders, setAllRiders] = useState<Rider[] | null>(null);

  useEffect(() => {
    getRiderData()
      .then((data) => setAllRiders(data.allRiders))
      .catch(() => setAllRiders([]));
  }, []);

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

  if (allRiders === null) return null;

  const resultsData: SelectedRider[] = [];
  searchParams.forEach((riderID, name) => {
    const rider = allRiders.find((r) => r.id === riderID);
    if (rider) resultsData.push({ entrant: name, rider });
  });

  const handleReset = () => {
    localStorage.removeItem("savedResults");
    router.push("/sweepstake");
  };

  const handleAddEntrantAndGenerate = (entrant: string) => {
    const savedRiderList = localStorage.getItem("riderList");
    const previousResultsJson = localStorage.getItem("savedResults");

    if (!savedRiderList || !previousResultsJson) return;

    const riders = JSON.parse(savedRiderList);
    const previousResults = JSON.parse(previousResultsJson);
    const currentResults = resultsData.map(({ rider }) => rider.id);
    const remainingRiders = (riders.riders as Rider[]).filter(
      ({ id }) => !currentResults.includes(id)
    );

    const riderIdx = Math.floor(Math.random() * remainingRiders.length);
    const selectedRider = remainingRiders[riderIdx].id;

    const newResults = previousResults.results + `&${entrant}=${selectedRider}`;
    localStorage.setItem(
      "savedResults",
      JSON.stringify({ generatedDate: Date.now(), results: newResults })
    );
    router.push(`/results/${newResults}`);
  };

  return (
    <Results
      handleReset={handleReset}
      selectedRiders={resultsData}
      addEntrant={handleAddEntrantAndGenerate}
    />
  );
};

export default function ResultsPage() {
  return (
    <Suspense>
      <ResultsContent />
    </Suspense>
  );
}
