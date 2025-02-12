import { SelectedRider } from "@/models/rider";
import ResultsCard from "./ResultsCard";
import style from "./ResultsCard.module.scss";
import { useState } from "react";
import ReturnModal from "../Modals/ReturnModal";
import RiderCard from "../RiderCard";
import ResultsRiderCard from "./ResultsRiderCard";
import AddEntrantModal from "../Modals/AddEntrantModal";

interface ResultsProps {
  handleReset: () => void;
  selectedRiders: SelectedRider[];
  addEntrant: (name: string) => void;
}

const Results = ({ handleReset, selectedRiders, addEntrant }: ResultsProps) => {
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [addEntrantModalOpen, setEntrantModalOpen] = useState(false);

  console.log(selectedRiders)

  const generateShareLink = () => {
    const url = window.location.href;

    try {
      navigator.share({
        title: "Check out who you're backing for the Grand Prix!",
        url,
      });
    } catch (error) {
      console.log(url);
    }
  };

  const handleResetEvFromModal = () => {
    handleReset();
    setReturnModalOpen(false);
    setEntrantModalOpen(false);
  };

  const handleAddEntrantFromModal = (entrantName: string) => {
    addEntrant(entrantName);
    setEntrantModalOpen(false);
  }


  return (
    <div className={style.results}>
      {selectedRiders.map((selected) => (
        <ResultsRiderCard
          key={`res-${selected.rider.id}`}
          selected={selected}
        />
      ))}
      <button className={style.shareButton} onClick={generateShareLink}>
        <p>Share Results</p>
      </button>
      <p>
        Something wrong? Need to change the riders or people entering?
        <br />
        Use the button below to clear the results and return to the setup screen
      </p>
      <button className="pickButton" onClick={() => setReturnModalOpen(true)}>
        Reset
      </button>
      <ReturnModal
        confirmAction={handleResetEvFromModal}
        isOpen={returnModalOpen}
        handleClose={() => setReturnModalOpen(false)}
      />
      <AddEntrantModal
        confirmAction={handleAddEntrantFromModal}
        isOpen={addEntrantModalOpen}
        handleClose={() => setEntrantModalOpen(false)}
      />
      <p>
        Forgotten anyone?
      </p>
      <button onClick={() => setEntrantModalOpen(true)} className="pickButton">
        Add Entrant
      </button>
    </div>
  );
};

export default Results;
