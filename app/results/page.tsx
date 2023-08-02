"use client";
import { getRiderById } from "@/utils/getSelectedRidersByID";
import { useSearchParams } from "next/navigation";
import { Rider } from "../../models/rider";
import Results from "../_components/Results/Results";
import { useRouter } from "next/navigation";

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

  const handleReset = () => {
    localStorage.removeItem("savedResults");
    router.push("/");
  };

  return <Results handleReset={handleReset} selectedRiders={resultsData} />;
};

export default ResultsPage;
