"use client";
import {useEffect, useState} from "react";
import style from "./RacePage.module.scss";
const classes = [["worldsbk","WorldSBK"],["worldssp","WorldSSP"],["worldspb","WorldSPB"],["worldwcr","WorldWCR"]];
type Row = {position:number|null;riderExternalId:string;riderName:string;riderNumber:number;teamName:string|null;status:string;totalLaps:number;bestLapTime:string|null};
type Payload = {series:string;roundId:number;subSeries:string;stale:boolean;results:Record<string,Row[]>;sessions:Array<{id:string;label:string;status:string}>;documents:Array<{label:string;url:string;session:string}>};
export function WsbkClassification({roundId}:{roundId:number}) {
  const [cls,setClass]=useState("worldsbk"),[race,setRace]=useState("");
  const [data,setData]=useState<Payload|null>(null),[error,setError]=useState("");
  useEffect(()=>{
    const controller=new AbortController();setData(null);setError("");setRace("");
    fetch(`${process.env.NEXT_PUBLIC_RACECAL_URL}/classifications?roundId=${roundId}&subSeries=${cls}`,{signal:controller.signal})
      .then(async response=>{const value=await response.json();if(!response.ok)throw new Error(value.error||"Race results are unavailable for this weekend and class.");return value;})
      .then(value=>{if(value.series!=="wsbk"||value.roundId!==roundId||value.subSeries!==cls)throw new Error("The results do not match this weekend.");if(!controller.signal.aborted)setData(value);})
      .catch(error=>{if(!controller.signal.aborted)setError(error.message);});
    return ()=>controller.abort();
  },[roundId,cls]);
  const selected=data?.sessions.find(session=>session.label===race)??data?.sessions[0];
  const rows=selected?data?.results[selected.label]:undefined;
  return <section className={style.scheduleSection} aria-label="WorldSBK race results">
    <p className={style.sectionEyebrow}>World championship</p><h2 className={style.sectionTitle}>Race results</h2>
    <div className={style.classSelector} role="group" aria-label="Championship class">{classes.map(([key,label])=><button key={key} type="button" aria-pressed={cls===key} onClick={()=>setClass(key)}>{label}</button>)}</div>
    {error?<p role="status">{error}</p>:!data?<p role="status">Loading race results…</p>:<>
      {data.stale&&<p className={style.standingsFreshness}>Refresh delayed. Showing the last successful import.</p>}
      <div className={style.classSelector} role="group" aria-label="Race session">{data.sessions.map(session=><button key={session.id} type="button" aria-pressed={selected?.id===session.id} onClick={()=>setRace(session.label)}>{session.label}</button>)}</div>
      {selected?.status==="CANCELLED"?<p>Race cancelled. No classification was issued.</p>:!rows?<p>No verified classification is available for this session.</p>:<table className={style.standingsTable}>
        <caption>{selected?.label} classification</caption><thead><tr><th scope="col">Pos</th><th scope="col">Rider</th><th scope="col">Laps</th><th scope="col">Best lap</th></tr></thead>
        <tbody>{rows.map(row=><tr key={row.riderExternalId}><td>{row.position??"—"}</td><td>{row.riderName} <span className={style.standingsFreshness}>#{row.riderNumber}</span><div className={style.standingsFreshness}>{row.teamName}{row.status!=="Classified"?` · ${row.status}`:""}</div></td><td>{row.totalLaps}</td><td>{row.bestLapTime??"—"}</td></tr>)}</tbody>
      </table>}
      {selected&&<div>{data.documents.filter(document=>document.session===selected.label).map(document=><p key={document.url}><a href={document.url} target="_blank" rel="noopener noreferrer" className={style.backLink}>{document.label==="Championship standings"?`Standings after ${selected.label}`:"Official race results"} ↗</a></p>)}</div>}
    </>}
  </section>;
}
