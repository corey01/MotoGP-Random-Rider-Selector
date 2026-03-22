"use client";

import { useCallback, useEffect, useState } from "react";

import RiderList from "./RiderList";
import GridPanel from "./Grid/Grid";
import Entrants from "./Entrants/Entrants";
import { Rider } from "@/models/rider";
import { defaultEntrants } from "@/utils/entrants";
import { useRouter } from "next/navigation";
import LoadingOverlay from "./Loading/Overlay";
import {
  millisecondsToHours,
} from "date-fns";
import { RiderDataResponse } from "@/utils/getRiderData";
import style from "@/app/sweepstake/Sweepstake.module.scss";

interface HomeProps {
  allRiders: RiderDataResponse;
  seasonYear: number;
}

type SweepstakePage = "riders" | "entrants" | "grid";

const TAB_COPY: Record<SweepstakePage, { label: string; detail: string; index: string }> = {
  riders: {
    label: "Riders",
    detail: "Curate the live rider pool before the draw.",
    index: "01",
  },
  entrants: {
    label: "Entrants",
    detail: "Manage everyone going into the sweepstake.",
    index: "02",
  },
  grid: {
    label: "Grid",
    detail: "Use the qualifying picture to tighten the field.",
    index: "03",
  },
};

export default function SweepstakeApp({ allRiders, seasonYear }: HomeProps) {
  const [page, setPage] = useState<SweepstakePage>("riders");
  const [riders, setRiders] = useState<Rider[]>([]);
  const [guestRiders, setGuestRiders] = useState<Rider[]>([]);
  const [entrants, setEntrants] = useState(() => defaultEntrants);
  const [loading, setLoading] = useState<boolean>(false);
  const [eligibleRiderIds, setEligibleRiderIds] = useState<string[] | null>(null);

  const router = useRouter();

  const handleRemoveRider = (riderToRemove: Rider) => {
    if (riderToRemove.riderType === "guest") {
      setGuestRiders((prev) => [...prev, riderToRemove]);
    }
    setRiders((prevRiders) => {
      return prevRiders.filter((r) => r.id !== riderToRemove.id);
    });
  };

  useEffect(() => {
    setRiders(allRiders.standardRiders);
  }, [allRiders, seasonYear]);

  useEffect(() => {
    setGuestRiders(allRiders.guestRiders);
  }, [allRiders]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "allRidersCache",
        JSON.stringify({ riders: allRiders.allRiders, generatedDate: Date.now(), seasonYear })
      );
    } catch {}
  }, [allRiders, seasonYear]);

  const handleResetAllRiders = () => {
    setRiders(allRiders.standardRiders);
    setGuestRiders(allRiders.guestRiders);
    localStorage.removeItem('riderList');
    window.scroll({top: 0, left: 0, behavior: 'smooth' });
  };

  const handleRemoveEntrant = (entrantToRemove: string) => {
    setEntrants((prevEntrants) => {
      return prevEntrants.filter((r) => r !== entrantToRemove);
    });
  };

  const handleResetEntrants = () => {
    setEntrants(defaultEntrants);
  };

  const handleAddNewEntrant = (entrant: string) => {
    setEntrants((prevEntrants) => {
      return [...prevEntrants, entrant.trim()];
    });
  };

  const handleAddRider = (rider: Rider) => {
    setGuestRiders((prev) => {
      return prev.filter((val) => val.id !== rider.id);
    });
    setRiders((prev) => [...prev, rider]);
  };

  const handleStorage = useCallback(() => {
    const savedResults = localStorage.getItem("savedResults");
    const savedRiderList = localStorage.getItem('riderList');

    if (savedResults) {
      setLoading(true);
      const decodedResults = JSON.parse(savedResults);
      if (decodedResults.generatedDate) {
        const timeDistanceInHours = millisecondsToHours(
          Date.now() - decodedResults.generatedDate
        );
        if (timeDistanceInHours >= 24) {
          localStorage.removeItem("savedResults");
          setLoading(false);
        } else {
          router.push(`/results/${decodedResults.results}`);
        }
      }
    }

    if (savedRiderList) {
      const decodedResults = JSON.parse(savedRiderList);

      if (decodedResults?.seasonYear && Number(decodedResults.seasonYear) !== seasonYear) {
        localStorage.removeItem("riderList");
        setLoading(false);
        return;
      }

      if (decodedResults.generatedDate) {
        const timeDistanceInHours = millisecondsToHours(
          Date.now() - decodedResults.generatedDate
        );
        if (timeDistanceInHours >= 24) {
          localStorage.removeItem("riderList");
          setLoading(false);
          return;
        }
      }
      setRiders(decodedResults.riders);
    }

  }, [router, seasonYear]);

  useEffect(() => {
    handleStorage();
  }, [handleStorage]);

  const activePool = eligibleRiderIds
    ? riders.filter((rider) => eligibleRiderIds.includes(rider.id))
    : riders;
  const activeRiderCount = activePool.length;
  const canPick = entrants.length > 0 && activeRiderCount >= entrants.length;

  const pickRiders = () => {
    if (!canPick) return;
    setLoading(true);
    const tempRidersArray = [...activePool];
    localStorage.setItem(
      "riderList",
      JSON.stringify({ riders: activePool, generatedDate: Date.now(), seasonYear })
    );
    const results = [...entrants]
      .sort(() => Math.random() - 0.5)
      .reduce((acc, entrant, idx) => {
        const startsWithAmpersand = idx === 0 ? "" : "&";
        const riderIdx = Math.floor(Math.random() * tempRidersArray.length);

        const rider = tempRidersArray[riderIdx].id;

        tempRidersArray.splice(riderIdx, 1);

        return acc + startsWithAmpersand + entrant + "=" + rider;
      }, "?");

    const resultObject = {
      generatedDate: Date.now(),
      results,
    };
    window.localStorage.setItem("savedResults", JSON.stringify(resultObject));
    router.push(`/results/${results}`);
  };

  return (
    <div className={style.shell}>
      {loading && <LoadingOverlay />}

      <section className={style.hero}>
        <div className={style.heroBackdrop}>{String(seasonYear).slice(-2)}</div>
        <div className={style.heroTopline}>
          <span className={style.eyebrow}>MotoGP Sweepstake</span>
          <span className={style.heroSeason}>Legacy Mode · {seasonYear}</span>
        </div>

        <div className={style.heroGrid}>
          <div className={style.heroCopy}>
            <p className={style.heroLabel}>Kinetic Chronicle Setup</p>
            <h1 className={style.heroTitle}>Build the grid. Then let it draw.</h1>
            <p className={style.heroSummary}>
              Tune the rider pool, lock the entrant list, and launch the random assignment from
              one tonal workspace.
            </p>
          </div>

          <div className={style.metrics}>
            <div className={style.metric}>
              <span className={style.metricLabel}>Live rider pool</span>
              <strong className={style.metricValue}>{activeRiderCount}</strong>
            </div>
            <div className={style.metric}>
              <span className={style.metricLabel}>Entrants loaded</span>
              <strong className={style.metricValue}>{entrants.length}</strong>
            </div>
            <div className={style.metric}>
              <span className={style.metricLabel}>Current focus</span>
              <strong className={style.metricValue}>{TAB_COPY[page].label}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className={style.actionBar}>
        <button
          disabled={loading || !canPick}
          className={style.pickButton}
          onClick={pickRiders}
          type="button"
        >
          Randomly Assign Riders Now
        </button>
        <p className={style.actionNote}>
          {canPick
            ? `Ready to draw ${entrants.length} entrant${entrants.length === 1 ? "" : "s"} from ${activeRiderCount} eligible rider${activeRiderCount === 1 ? "" : "s"}.`
            : "You need at least one entrant and enough eligible riders to cover the draw."}
        </p>
      </section>

      <div className={style.tabRail} role="tablist" aria-label="Sweepstake panels">
        {(Object.keys(TAB_COPY) as SweepstakePage[]).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={page === tab}
            className={page === tab ? style.tabButtonActive : style.tabButton}
            onClick={() => setPage(tab)}
          >
            <span className={style.tabIndex}>{TAB_COPY[tab].index}</span>
            <span className={style.tabLabelWrap}>
              <span className={style.tabLabel}>{TAB_COPY[tab].label}</span>
              <span className={style.tabDetail}>{TAB_COPY[tab].detail}</span>
            </span>
          </button>
        ))}
      </div>

      <div className={style.panelSurface}>
        {page === "riders" && (
          <RiderList
            riderList={riders}
            guestRiders={guestRiders}
            handleRemoveRider={handleRemoveRider}
            handleResetAllRiders={handleResetAllRiders}
            handleAddRider={handleAddRider}
            onEligibleRidersChange={setEligibleRiderIds}
          />
        )}
        {page === "entrants" && (
          <Entrants
            entrants={entrants}
            handleRemoveEntrant={handleRemoveEntrant}
            handleResetEntrants={handleResetEntrants}
            handleAddNewEntrant={handleAddNewEntrant}
          />
        )}
        {page === "grid" && <GridPanel riders={[...riders, ...guestRiders]} />}
      </div>
    </div>
  );
}
