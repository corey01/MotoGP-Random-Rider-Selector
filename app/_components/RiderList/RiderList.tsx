"use client";

import style from "./RiderList.module.scss";
import RiderCard from "../RiderCard";
import { Rider } from "@/models/rider";

const sortRidersByNumber = (a: Rider, b: Rider) => {
  return a.number - b.number;
};

const RiderList = ({
  riderList,
  guestRiders,
  handleRemoveRider,
  handleResetAllRiders,
  handleAddRider,
}: {
  riderList: Rider[];
  guestRiders: Rider[];
  handleRemoveRider: (rider: Rider) => void;
  handleResetAllRiders: () => void;
  handleAddRider: (rider: Rider) => void;
}) => (
  <div className={style.panel}>
    {riderList.sort(sortRidersByNumber).map((rider) => (
      <RiderCard rider={rider} removeEvent={handleRemoveRider} key={rider.id} />
    ))}
    <button onClick={handleResetAllRiders} className={style.resetButton}>
      Reset Rider List
    </button>
    <p className={style.resetInstruct}>
      Note: Resetting the rider list will restore all removed riders.
    </p>
    {/* <p className={style.resetInstruct}>
      Note: Resetting the rider list will restore all removed riders, and remove
      any guest riders.
    </p> */}
    {/* <hr />
    <h3 className={style.guestTitle}>Guest Riders</h3>
    {guestRiders.sort(sortRidersByNumber).map((rider) => (
      <div key={rider.id}>
        <RiderCard
          rider={rider}
          removeEvent={handleRemoveRider}
          canBeAdded={true}
          addEvent={handleAddRider}
          inGuestArray={true}
        />
      </div>
    ))} */}
  </div>
);

export default RiderList;
