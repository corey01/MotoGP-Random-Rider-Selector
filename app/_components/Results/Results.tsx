import { SelectedRider } from "@/models/rider";
import style from "./ResultsCard.module.scss";
import { useMemo, useState } from "react";
import ReturnModal from "../Modals/ReturnModal";
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
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  const sortedRiders = useMemo(() =>
    [...selectedRiders].sort((a, b) => a.rider.number - b.rider.number),
    [selectedRiders]
  );

  const generateShareLink = async () => {
    const url = window.location.href;

    try {
      await navigator.share({
        title: "Check out who you're backing for the Grand Prix!",
        url,
      });
      return;
    } catch {}

    try {
      await navigator.clipboard.writeText(url);
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 2000);
    } catch {
      // no-op
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
    <div className={style.page}>
      <section className={style.hero}>
        <div className={style.heroBackdrop}>DRAW</div>
        <p className={style.eyebrow}>Sweepstake Results</p>
        <h1 className={style.title}>The rider assignments are locked in.</h1>
        <p className={style.summary}>
          Share the draw, add a late entrant if needed, or reset and return to the setup panel.
        </p>

        <div className={style.heroMeta}>
          <div className={style.metaCard}>
            <span className={style.metaLabel}>Assignments</span>
            <strong className={style.metaValue}>{sortedRiders.length}</strong>
          </div>
          <div className={style.metaCard}>
            <span className={style.metaLabel}>Sorted by</span>
            <strong className={style.metaValue}>Rider number</strong>
          </div>
        </div>
      </section>

      <div className={style.results}>
        {sortedRiders.map((selected) => (
          <ResultsRiderCard
            key={`res-${selected.rider.id}`}
            selected={selected}
            participantName={selected.entrant}
          />
        ))}
      </div>

      <section className={style.actions}>
        <button className={style.primaryButton} onClick={generateShareLink} type="button">
          {shareState === "copied" ? "Link copied" : "Share results"}
        </button>
        <button
          className={style.secondaryButton}
          onClick={() => setEntrantModalOpen(true)}
          type="button"
        >
          Add entrant
        </button>
        <button
          className={style.secondaryButton}
          onClick={() => setReturnModalOpen(true)}
          type="button"
        >
          Reset sweepstake
        </button>
      </section>

      <p className={style.note}>
        Resetting clears the current draw and takes you back to the setup screen.
      </p>

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
    </div>
  );
};

export default Results;
