import style from "./Modal.module.scss";

const ReturnModal = ({
  isOpen,
  confirmAction,
  handleClose,
}: {
  isOpen: boolean;
  confirmAction: () => void;
  handleClose: () => void;
}) => {
  const handleOverlayClick = (e: React.MouseEvent<HTMLElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return isOpen ? (
    <div onClick={handleOverlayClick} className={style.Overlay}>
      <div className={style.Modal}>
        <p className={style.title}>Are you sure you want to reset?</p>
        <p>Resetting will lose the current generated results</p>
        <div className={style.buttonBar}>
          <button className="pickButton" onClick={confirmAction}>
            Reset Results
          </button>{" "}
          <button className="pickButton" onClick={handleClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  ) : null;
};
export default ReturnModal;
