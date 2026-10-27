"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSubscriptions } from "@/utils/SubscriptionsContext";
import { getStandings, type StandingsData } from "@/utils/getStandings";
import { championshipForValue, followedChampionships } from "@/utils/championships";
import { standingsRows } from "@/utils/classification";
import { ClassificationList } from "../Classification/ClassificationList";
import style from "./ChampionshipStandings.module.scss";

export function ChampionshipStandings({ championship, year }: { championship: string; year?: number }) {
  const { subscribedSeries, disabledSubSeries, isLoaded } = useSubscriptions();
  const [data, setData] = useState<StandingsData | null>(null);
  const option = championshipForValue(championship);
  const followed = followedChampionships(subscribedSeries, disabledSubSeries).some((value) => value.value === championship);

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    if (isLoaded && followed && option) {
      void getStandings(option.series, year, option.subSeries, option.competition, controller.signal)
        .then((result) => { if (!controller.signal.aborted) setData(result); });
    }
    return () => controller.abort();
  }, [championship, year, isLoaded, followed, option]);

  if (!isLoaded || !option) return null;

  const rows = standingsRows(data?.standings ?? []).map((row) => ({
    ...row,
    teamName: option.competition !== "riders" || option.subSeries === "f1-constructors" ? null : row.teamName,
  }));

  return <section className={`${style.section} ${style[`series_${option.series}`] ?? ""}`} aria-label={`${option.label} championship`}>
    <div className={style.header}>
      <div className={style.headingBlock}>
        <span className={style.heading}>{option.label}</span>
        <span className={style.season}>Favourite championship{data?.year ? ` · ${data.year}` : ""}</span>
      </div>
      <Link href="/standings" className={style.browseLink}>Browse championships <span aria-hidden="true">→</span></Link>
    </div>
    {!followed ? <p className={style.empty}>You no longer follow this class. <Link href="/settings">Choose a favourite in settings</Link> or follow it again.</p>
      : !data ? <p className={style.empty} role="status">Loading standings…</p>
      : !data.ok ? <p className={style.empty}>{data.error ?? "Standings are currently unavailable."}</p>
      : !rows.length ? <p className={style.empty}>Standings not yet published for this championship.</p>
      : <>
        {data.stale || data.refreshFailed ? <p className={style.empty}>Refresh delayed; showing the last verified import.</p> : data.asOfDate ? <p className={style.empty}>As of {data.asOfDate}</p> : null}
        <ClassificationList key={championship} rows={rows} mode="standings" label={`${option.label} standings`} />
      </>}
  </section>;
}
