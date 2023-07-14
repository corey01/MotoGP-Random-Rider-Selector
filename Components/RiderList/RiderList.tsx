import style from "./RiderList.module.css";
import RemovableList from "../RemovableList";
import RiderElement from "../RiderElement";

const RiderList = ({
  riderList,
  handleRemoveRider,
  handleResetAllRiders,
}: {
  riderList: string[];
  handleRemoveRider: (rider: string) => void;
  handleResetAllRiders: () => void;
}) => (
  <div className="panel">
    {riderList.map((rider) => (
      <RiderElement value={rider} removeEvent={handleRemoveRider} key={rider} />
    ))}
    <button onClick={handleResetAllRiders} className={style.resetButton}>
      Reset Rider List
    </button>
  </div>
);

export default RiderList;
