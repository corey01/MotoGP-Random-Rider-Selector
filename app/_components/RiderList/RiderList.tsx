"use client";

import style from "./RiderList.module.scss";
import RiderCard from "../RiderCard";
import { Rider } from "@/models/rider";
import { useEffect } from "react";

const sortRidersByNumber = (a: Rider, b: Rider) => {
  return a.number - b.number;
};

const RiderList = ({
  riderList,
  guestRiders: _guestRiders,
  handleRemoveRider,
  handleResetAllRiders,
  handleAddRider: _handleAddRider,
  onEligibleRidersChange,
}: {
  riderList: Rider[];
  guestRiders: Rider[];
  handleRemoveRider: (rider: Rider) => void;
  handleResetAllRiders: () => void;
  handleAddRider: (rider: Rider) => void;
  onEligibleRidersChange?: (ids: string[] | null) => void;
}) => {
  // Grid/top-10 filtering relied on the old worker-only endpoint.
  // Keep full-rider mode while frontend is RaceCal-only.
  useEffect(() => {
    if (!onEligibleRidersChange) return;
    onEligibleRidersChange(null);
  }, [onEligibleRidersChange, riderList.length]);

  return (
    <div className={style.panel}>
      {riderList.length > 0 ? (
        riderList
          .sort(sortRidersByNumber)
          .map((rider) => (
            <RiderCard
              rider={rider}
              removeEvent={handleRemoveRider}
              key={rider.id}
            />
          ))
      ) : (
        <p>No riders to display.</p>
      )}
      <button
        onClick={() => {
          handleResetAllRiders();
          if (onEligibleRidersChange) onEligibleRidersChange(null);
        }}
        className={style.resetButton}
      >
        Reset Rider List
      </button>
      <p className={style.resetInstruct}>
        Note: Resetting the rider list will restore all removed riders.
      </p>
    </div>
  );
};

export default RiderList;
