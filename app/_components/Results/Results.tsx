import { SelectedRider } from "@/models/rider";
import ResultsCard from "./ResultsCard";
import style from "./ResultsCard.module.scss";
import { useState } from "react";
import ReturnModal from "../Modals/ReturnModal";
// import ShareIcon from "../Icons/Share";
// import ShareIcon from "../../share.svg";
import Image from "next/image";

interface ResultsProps {
  handleReset: () => void;
  selectedRiders: SelectedRider[];
}

const Results = ({ handleReset, selectedRiders }: ResultsProps) => {
  const [returnModalOpen, setReturnModalOpen] = useState(false);

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

  const handleResetEvFromModal = () => {
    handleReset();
    setReturnModalOpen(false);
  };

  return (
    <div className={style.results}>
      {selectedRiders.map((selected) => (
        <ResultsCard selected={selected} key={`res-${selected.rider.id}`} />
      ))}
      <button className={style.shareButton} onClick={generateShareLink}>
        <p>Share Results</p>{" "}
        {/* <Image
          alt=" "
          width={26}
          src={require("/public/share.png?resize&webp")}
        /> */}
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
    </div>
  );
};

export default Results;
