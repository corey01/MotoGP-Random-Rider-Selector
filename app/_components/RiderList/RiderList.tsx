"use client";

import style from "./RiderList.module.scss";
import RiderCard from "../RiderCard";
import { Rider } from "@/models/rider";
import { useEffect, useMemo, useState } from "react";

const sortRidersByNumber = (a: Rider, b: Rider) => {
  return a.number - b.number;
};

const RiderList = ({
  riderList,
  guestRiders,
  handleRemoveRider,
  handleResetAllRiders,
  handleAddRider,
  onEligibleRidersChange,
}: {
  riderList: Rider[];
  guestRiders: Rider[];
  handleRemoveRider: (rider: Rider) => void;
  handleResetAllRiders: () => void;
  handleAddRider: (rider: Rider) => void;
  onEligibleRidersChange?: (ids: string[] | null) => void;
}) => {
  const [grid, setGrid] = useState<any[]>([]);
  const [gridLoading, setGridLoading] = useState(false);
  const [showTop10, setShowTop10] = useState(false);

  useEffect(() => {
    async function fetchGrid() {
      setGridLoading(true);
      try {
        const res = await fetch(
          "https://cascading-monkeys.corey-obeirne.workers.dev/get_next_grandprix"
        );
        const data = await res.json();
        if (data?.links?.grid) {
          const gridRes = await fetch(data.links.grid);
          const gridData = await gridRes.json();
          setGrid(gridData.grid || []);
        }
      } catch (e) {
        setGrid([]);
      }
      setGridLoading(false);
    }
    fetchGrid();
  }, []);

  // Try matching by legacy_id, riders_api_uuid, or id
  const gridTop10Ids = grid
    .slice(0, 10)
    .map((entry) => ({
      id: entry.rider?.id,
      legacy_id: entry.rider?.legacy_id,
      riders_api_uuid: entry.rider?.riders_api_uuid,
    }))
    .filter((r) => r.id || r.legacy_id || r.riders_api_uuid);

  const filteredRiderList =
    showTop10 && gridTop10Ids.length > 0
      ? riderList.filter((rider) =>
          gridTop10Ids.some(
            (gridRider) =>
              rider.id === gridRider.id ||
              rider.id === gridRider.riders_api_uuid ||
              rider.id === String(gridRider.legacy_id)
          )
        )
      : riderList;

  // Sync eligible rider IDs to parent so sweepstake uses the same pool
  useEffect(() => {
    if (!onEligibleRidersChange) return;
    if (showTop10) {
      onEligibleRidersChange(filteredRiderList.map((r) => r.id));
    } else {
      onEligibleRidersChange(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTop10, gridTop10Ids.length, riderList.length]);

  // Map any known grid rider id (api id, riders_api_uuid, legacy_id) to qualifying position
  const gridPositionByAnyId = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of grid) {
      const pos = Number(entry?.qualifying_position);
      if (!pos) continue;
      const id = entry?.rider?.id;
      const uuid = entry?.rider?.riders_api_uuid;
      const legacy = entry?.rider?.legacy_id;
      const legacyStr =
        legacy !== undefined && legacy !== null ? String(legacy) : undefined;
      const ids = [id, uuid, legacyStr].filter(Boolean) as string[];
      for (const i of ids) {
        if (!map.has(i)) map.set(i, pos);
      }
    }
    return map;
  }, [grid]);

  const sortRiders = (a: Rider, b: Rider) => {
    if (showTop10) {
      const pa = gridPositionByAnyId.get(a.id);
      const pb = gridPositionByAnyId.get(b.id);
      if (pa !== undefined && pb !== undefined) return pa - pb;
      if (pa !== undefined) return -1;
      if (pb !== undefined) return 1;
    }
    return sortRidersByNumber(a, b);
  };

  return (
    <div className={style.panel}>
      {filteredRiderList.length > 0 ? (
        filteredRiderList
          .sort(sortRiders)
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
      {!gridLoading && grid.length > 0 && (
        <button
          className={style.resetButton}
          style={{ marginBottom: 12 }}
          onClick={() => setShowTop10((v) => !v)}
        >
          {showTop10 ? "Show All Riders" : "Only show top 10"}
        </button>
      )}
      <button
        onClick={() => {
          handleResetAllRiders();
          setShowTop10(false);
          setGrid([]);
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
