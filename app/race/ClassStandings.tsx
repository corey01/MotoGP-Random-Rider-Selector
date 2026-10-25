"use client";
import { useEffect, useState } from "react";
import style from "./RacePage.module.scss";
type Entry = { position: number; points: number; rider: { id: string; fullName: string | null }; team: string | null };
export function ClassStandings({ year, subSeries }: { year: number; subSeries: string }) {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setEntries(null); setFailed(false);
    fetch(`${process.env.NEXT_PUBLIC_RACECAL_URL}/standings?year=${year}&subSeries=${subSeries}`, { signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(data => { if (!controller.signal.aborted) setEntries(data.standings); })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [year, subSeries]);
  return <section className={style.scheduleSection}>
    <h2 className={style.sectionTitle}>{year} championship standings</h2>
    {failed ? <p>Standings unavailable. Please try again later.</p> : !entries ? <p>Loading standings…</p> : !entries.length ? <p>Standings not yet published.</p> :
    <table className={style.standingsTable}><thead><tr><th scope="col">Pos</th><th scope="col">Rider</th><th scope="col">Points</th></tr></thead><tbody>
      {entries.map(entry => <tr key={entry.rider.id}><td>{entry.position}</td><td>{entry.rider.fullName || "Unknown rider"}</td><td>{entry.points}</td></tr>)}
    </tbody></table>}
  </section>;
}
