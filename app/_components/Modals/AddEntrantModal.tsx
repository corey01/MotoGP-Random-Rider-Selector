import { useState } from "react";
import style from "./Modal.module.scss";

const AddEntrantModal = ({
  isOpen,
  confirmAction,
  handleClose,
}: {
  isOpen: boolean;
  confirmAction: (name: string) => void;
  handleClose: () => void;
}) => {
  const [name, setName] = useState('');

  const closeModal = () => {
    setName('');
    handleClose();
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLElement>) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  const handleSubmit = () => {
    setName('');
    confirmAction(name)
  }

  return isOpen ? (
    <div onClick={handleOverlayClick} className={style.Overlay}>
      <div className={style.Modal}>
        <p className={style.title}>Forgotten Someone?</p>
        <p>Enter the entrant name below and click 'go' to match a rider to the new entrant</p>
        <input value={name} onChange={e => setName(e.target.value)} />
        <div className={style.buttonBar}>
          <button className="pickButton" onClick={handleSubmit}>
            Go
          </button>{" "}
          <button className="pickButton" onClick={closeModal}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  ) : null;
};
export default AddEntrantModal;
