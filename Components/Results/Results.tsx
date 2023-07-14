import { SelectedRider } from "@/models/rider";
import ResultsCard from "./ResultsCard";

interface ResultsProps {
  handleReset: () => void;
  selectedRiders: SelectedRider[];
}

const Results = ({ handleReset, selectedRiders }: ResultsProps) => {
  return (
    <>
      <div>Results:</div>
      {selectedRiders.map((selected) => (
        <ResultsCard selected={selected} key={`res-${selected.rider.id}`} />
      ))}
      <button className="pickButton" onClick={handleReset}>
        Reset
      </button>
    </>
  );
};

export default Results;
