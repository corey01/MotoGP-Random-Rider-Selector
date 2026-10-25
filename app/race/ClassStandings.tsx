"use client";
import { useEffect, useState } from "react";
import style from "./RacePage.module.scss";
type Entry = { position: number; points: number; rider: { id: string; fullName: string | null }; team: string | null };
export function ClassStandings({ year, subSeries, series = "motogp", roundId }: { year: number; subSeries: string; series?: string; roundId?: number }) {
  const [snapshot, setSnapshot] = useState<{asOfDate?: string; asOfSession?: string; unchanged?: boolean; sourceUrl?: string}>({});
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setEntries(null); setFailed(false);
    fetch(`${process.env.NEXT_PUBLIC_RACECAL_URL}/standings?year=${year}&subSeries=${subSeries}&series=${series}${roundId ? `&roundId=${roundId}` : ""}`, { signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(data => { if (roundId && (data.roundId !== roundId || data.subSeries !== subSeries || !data.asOfSession)) throw new Error("Wrong standings snapshot"); if (!controller.signal.aborted) { setEntries(data.standings); setSnapshot(data); } })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [year, subSeries, series, roundId]);
  return <section className={style.scheduleSection}>
    <h2 className={style.sectionTitle}>{roundId ? (!snapshot.unchanged && snapshot.asOfSession === "SPR" ? "Championship standings after the sprint" : "Championship standings after this round") : `${year} championship standings`}</h2>
    {roundId && snapshot.asOfDate && <p>As of {new Date(snapshot.asOfDate + "T12:00:00").toLocaleDateString("en-GB", {day:"numeric",month:"short",year:"numeric"})}{snapshot.unchanged ? " · No points awarded this round" : ""}</p>}
    {failed ? <p>{roundId ? "Historical standings are not available for this round." : "Standings unavailable. Please try again later."}</p> : !entries ? <p>Loading standings…</p> : !entries.length ? <p>Standings not yet published.</p> :
    <table className={style.standingsTable}><thead><tr><th scope="col">Pos</th><th scope="col">Rider</th><th scope="col">Points</th></tr></thead><tbody>
      {entries.map(entry => <tr key={entry.rider.id}><td>{entry.position}</td><td>{entry.rider.fullName || "Unknown rider"}</td><td>{entry.points}</td></tr>)}
    </tbody></table>}
  </section>;
}
