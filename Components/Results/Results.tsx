import { SelectedRider } from "@/models/rider";
import ResultsCard from "./ResultsCard";
import style from "./ResultsCard.module.css";

interface ResultsProps {
  handleReset: () => void;
  selectedRiders: SelectedRider[];
}

const Results = ({ handleReset, selectedRiders }: ResultsProps) => {
  return (
    <div className={style.results}>
      {selectedRiders.map((selected) => (
        <ResultsCard selected={selected} key={`res-${selected.rider.id}`} />
      ))}
      <button className="pickButton" onClick={handleReset}>
        Reset
      </button>
    </div>
  );
};

export default Results;
