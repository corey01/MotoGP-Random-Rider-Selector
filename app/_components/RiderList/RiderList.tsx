"use client";

import style from "./RiderList.module.scss";
import RiderCard from "../RiderCard";
import { Rider } from "@/models/rider";

const RiderList = ({
  riderList,
  handleRemoveRider,
  handleResetAllRiders,
}: {
  riderList: Rider[];
  handleRemoveRider: (rider: string) => void;
  handleResetAllRiders: () => void;
}) => (
  <div className={style.panel}>
    {riderList.map((rider) => (
      <RiderCard rider={rider} removeEvent={handleRemoveRider} key={rider.id} />
    ))}
    <button onClick={handleResetAllRiders} className={style.resetButton}>
      Reset Rider List
    </button>
  </div>
);

export default RiderList;
