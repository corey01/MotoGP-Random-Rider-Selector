import { SelectedRider } from "@/models/rider";
import ResultsCard from "./ResultsCard";
import style from "./ResultsCard.module.css";

interface ResultsProps {
  handleReset: () => void;
  selectedRiders: SelectedRider[];
}

const Results = ({ handleReset, selectedRiders }: ResultsProps) => {
  const generateShareLink = () => {
    const url = window.location.href;

    try {
      navigator.share({
        title: "Check out who you're backing for the next GP race!",
        url,
      });
    } catch (error) {
      console.log(url);
    }
  };
  return (
    <div className={style.results}>
      {selectedRiders.map((selected) => (
        <ResultsCard selected={selected} key={`res-${selected.rider.id}`} />
      ))}
      <button onClick={generateShareLink}>Generate Share Link</button>
      <button className="pickButton" onClick={handleReset}>
        Reset
      </button>
    </div>
  );
};

export default Results;
