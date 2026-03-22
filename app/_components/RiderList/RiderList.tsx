"use client";

import style from "./RiderList.module.scss";
import RiderCard from "../RiderCard";
import { Rider } from "@/models/rider";
import { useEffect, useState } from "react";
import { fetchCalendarEvents } from "@/utils/getCalendarData";
import { fetchGridData } from "@/utils/getGridData";

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
  const [gridTopIds, setGridTopIds] = useState<string[] | null>(null);
  const [gridTopActive, setGridTopActive] = useState(false);

  useEffect(() => {
    let alive = true;
    const year = Number(process.env.NEXT_PUBLIC_MOTOGP_SEASON_YEAR || new Date().getFullYear());

    async function load() {
      try {
        const events = await fetchCalendarEvents({ year, series: ["motogp"], subSeries: ["motogp"] });

        const now = Date.now();
        const upcomingRaces = events
          .filter((e) => {
            const start = new Date(e.start);
            return !Number.isNaN(start.getTime()) && start.getTime() >= now && e.type?.toUpperCase() === "RACE";
          })
          .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

        if (!upcomingRaces.length || !alive) return;

        const roundId = upcomingRaces[0].round?.id;
        if (!roundId) return;

        const grid = await fetchGridData(roundId);
        if (!alive || !grid || grid.grid.length === 0) return;

        const top10Ids = grid.grid
          .slice(0, 10)
          .map((item) => item.riderExternalId)
          .filter((id): id is string => !!id);

        if (alive && top10Ids.length > 0) setGridTopIds(top10Ids);
      } catch {
        // Grid not available — silent fail, button simply won't appear
      }
    }

    void load();
    return () => { alive = false; };
  }, []);

  const handleGridTopToggle = () => {
    const next = !gridTopActive;
    setGridTopActive(next);
    if (onEligibleRidersChange) onEligibleRidersChange(next ? gridTopIds : null);
  };

  const handleReset = () => {
    handleResetAllRiders();
    setGridTopActive(false);
    if (onEligibleRidersChange) onEligibleRidersChange(null);
  };

  const displayedRiders = gridTopActive && gridTopIds
    ? riderList.filter((r) => gridTopIds.includes(r.id))
    : riderList;

  return (
    <div className={style.panel}>
      <div className={style.header}>
        <div>
          <p className={style.eyebrow}>Rider Pool</p>
          <h2 className={style.title}>Available riders</h2>
        </div>
        <div className={style.actions}>
          {gridTopIds && (
            <button
              onClick={handleGridTopToggle}
              className={gridTopActive ? style.gridTopActive : style.gridTop}
              type="button"
            >
              {gridTopActive ? "Show full field" : "Grid top 10"}
            </button>
          )}
          <button onClick={handleReset} className={style.resetButton} type="button">
            Reset list
          </button>
        </div>
      </div>

      <p className={style.summary}>
        {displayedRiders.length} rider{displayedRiders.length === 1 ? "" : "s"} available for the
        draw. Remove anyone you do not want in the hat.
      </p>

      {displayedRiders.length > 0 ? (
        <div className={style.grid}>
          {[...displayedRiders]
            .sort(sortRidersByNumber)
            .map((rider) => (
              <RiderCard
                rider={rider}
                removeEvent={handleRemoveRider}
                key={rider.id}
              />
            ))}
        </div>
      ) : (
        <p className={style.empty}>No riders available in the current selection.</p>
      )}

      <p className={style.resetInstruct}>
        Resetting the rider list restores every removed rider to the active pool.
      </p>
    </div>
  );
};

export default RiderList;
