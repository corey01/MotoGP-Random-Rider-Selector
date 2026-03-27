"use client";

import { useEffect, useState } from "react";
import type { SeriesKey } from "@/consts/series";
import { useSubscriptions } from "@/utils/SubscriptionsContext";
import { getStandings, type StandingsData, type StandingsEntry } from "@/utils/getStandings";
import { getSeriesDisplayLabel } from "@/utils/series";
import style from "./ChampionshipStandings.module.scss";

const PREVIEW_COUNT = 5;

interface ChampionshipStandingsProps {
  series: SeriesKey;
  year?: number;
}

function SkeletonRow() {
  return (
    <div className={style.row}>
      <span className={style.pos}>&mdash;</span>
      <span className={`${style.name} ${style.skeleton}`} />
      <span className={`${style.points} ${style.skeleton}`} />
    </div>
  );
}

function RiderRow({ entry }: { entry: StandingsEntry }) {
  const portrait = entry.rider.pictures?.portrait ?? entry.rider.pictures?.profile ?? null;
  const flag = entry.rider.country?.iso
    ? `https://flagcdn.com/24x18/${entry.rider.country.iso.toLowerCase()}.png`
    : null;

  return (
    <div className={style.row}>
      <span className={style.pos}>{entry.position}</span>
      {portrait && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={style.portrait} src={portrait} alt="" aria-hidden />
      )}
      <span className={style.name}>
        {flag && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={style.flag} src={flag} alt={entry.rider.country?.name ?? ""} />
        )}
        <span className={style.fullName}>{entry.rider.fullName}</span>
        {entry.rider.number != null && (
          <span className={style.number}>#{entry.rider.number}</span>
        )}
      </span>
      <span className={style.team}>{entry.team}</span>
      <span className={style.points}>{entry.points} pts</span>
    </div>
  );
}

export function ChampionshipStandings({ series, year }: ChampionshipStandingsProps) {
  const { subscribedSeries, isLoaded } = useSubscriptions();
  const [data, setData] = useState<StandingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const isSubscribed = subscribedSeries.includes(series);

  useEffect(() => {
    if (!isLoaded || !isSubscribed) return;
    getStandings(series, year)
      .then(setData)
      .finally(() => setLoading(false));
  }, [series, year, isLoaded, isSubscribed]);

  if (!isLoaded || !isSubscribed) return null;

  const label = getSeriesDisplayLabel(series);
  const allStandings = data?.standings ?? [];
  const visibleStandings = showAll ? allStandings : allStandings.slice(0, PREVIEW_COUNT);
  const hasMore = allStandings.length > PREVIEW_COUNT;

  return (
    <section className={`${style.section} ${style[`series_${series}`] ?? ""}`}>
      <div className={style.header}>
        <span className={style.heading}>{label} Championship</span>
        {data?.year && <span className={style.season}>{data.year}</span>}
      </div>

      <div className={style.list}>
        {loading ? (
          Array.from({ length: PREVIEW_COUNT }, (_, i) => <SkeletonRow key={i} />)
        ) : !allStandings.length ? (
          <p className={style.empty}>No standings available</p>
        ) : (
          <>
            {visibleStandings.map((entry) => (
              <RiderRow key={entry.rider.id} entry={entry} />
            ))}
            {hasMore && (
              <button className={style.toggle} onClick={() => setShowAll((v) => !v)}>
                {showAll ? "Show less" : `Show all ${allStandings.length} riders`}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
