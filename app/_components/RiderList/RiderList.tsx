"use client";

import style from "./RiderList.module.css";
import RemovableList from "../RemovableList";
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
  <div className="panel">
    {riderList.map((rider) => (
      <RiderCard rider={rider} removeEvent={handleRemoveRider} key={rider.id} />
    ))}
    <button onClick={handleResetAllRiders} className={style.resetButton}>
      Reset Rider List
    </button>
  </div>
);

export default RiderList;
