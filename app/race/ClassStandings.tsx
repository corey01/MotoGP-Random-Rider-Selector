"use client";
import { useEffect, useState } from "react";
import style from "./RacePage.module.scss";
import { CompetitorName } from "../_components/Classification/ClassificationList";
import { StandingsTable } from "../standings/StandingsTable";
import type { StandingsEntry } from "@/utils/getStandings";
type Entry = StandingsEntry;
export function ClassStandings({ year, subSeries, series = "motogp", roundId, standalone = false, competition = "riders" }: { year: number; subSeries: string; series?: string; roundId?: number; standalone?: boolean; competition?: string }) {
  const [snapshot, setSnapshot] = useState<{asOfDate?: string; asOfSession?: string; unchanged?: boolean; sourceUrl?: string; fetchedAt?: string; stale?: boolean; refreshFailed?: boolean; historicalWarnings?: string[]}>({});
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setEntries(null); setFailed(false); setSnapshot({});
    fetch(`${process.env.NEXT_PUBLIC_RACECAL_URL}/standings?year=${year}&subSeries=${subSeries}&series=${series}${roundId ? `&roundId=${roundId}` : ""}&competition=${encodeURIComponent(competition)}`, { signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(data => { if (competition !== "riders" && data.competition !== competition) throw new Error("Wrong championship competition"); if (data.year !== year || data.subSeries !== subSeries || (data.series !== undefined && data.series !== series)) throw new Error("Wrong championship and season"); if (roundId && (data.roundId !== roundId || !data.asOfSession)) throw new Error("Wrong standings snapshot"); if (!controller.signal.aborted) { setEntries(data.standings); setSnapshot(data); } })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [year, subSeries, series, roundId, competition]);
  return <section className={standalone ? undefined : style.scheduleSection} aria-label="Championship standings" aria-busy={!failed && entries === null}>
    {!standalone && <h2 className={style.sectionTitle}>{roundId ? (!snapshot.unchanged && snapshot.asOfSession === "SPR" ? "Championship standings after the sprint" : "Championship standings after this round") : `${year} championship standings`}</h2>}
    {(roundId || competition !== "riders") && snapshot.asOfDate && <p>As of {new Date(snapshot.asOfDate + "T12:00:00").toLocaleDateString("en-GB", {day:"numeric",month:"short",year:"numeric"})}{snapshot.unchanged ? " · No points awarded this round" : ""}</p>}
    {!roundId && entries && snapshot.fetchedAt && <p className={style.standingsFreshness}>
      Updated {new Date(snapshot.fetchedAt).toLocaleString("en-GB")}
      {snapshot.refreshFailed ? " · The latest refresh failed. Showing the last successful update." : snapshot.stale ? " · The next standings update is overdue." : ""}
    </p>}
    {entries&&snapshot.historicalWarnings?.map(warning=><p key={warning} role="status" className={style.standingsFreshness}>{warning}</p>)}
    {subSeries==="bsb-sidecar"&&<p className={style.standingsFreshness}>Overall crew standings. Race and grid reports cover four BSB meetings. Overall championship totals are the published cumulative totals, including other meetings. Separate GP, CUP and F2 championships and the FIM championship are not included.</p>}
    {failed ? <p>{roundId ? "Historical standings are not available for this round." : "Standings unavailable. Please try again later."}</p> : !entries ? <p>Loading standings…</p> : !entries.length ? <p>Standings not yet published.</p> :
    standalone ? <StandingsTable entries={entries} competitorLabel={competition === "teams" ? "Team" : competition === "constructors" ? "Constructor" : series === "f1" ? subSeries === "f1-constructors" ? "Team" : "Driver" : subSeries === "bsb-sidecar" ? "Crew" : "Rider"} /> : <table className={style.standingsTable}><thead><tr><th scope="col">Pos</th><th scope="col">{subSeries === "bsb-sidecar" ? "Crew" : "Rider"}</th><th scope="col">Points</th></tr></thead><tbody>
      {entries.map(entry => <tr key={entry.rider.id}><td>{entry.position}</td><td><CompetitorName name={entry.rider.fullName || "Unknown competitor"} crew={entry.crew}/></td><td>{entry.points}</td></tr>)}
    </tbody></table>}
  </section>;
}
