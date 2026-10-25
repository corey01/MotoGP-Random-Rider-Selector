"use client";
import { useState } from "react";
import Link from "next/link";
import { ClassStandings } from "../race/ClassStandings";
import style from "../race/RacePage.module.scss";
const classes = [
 ["motogp:motogp","MotoGP"],["motogp:moto2","Moto2"],["motogp:moto3","Moto3"], ["rookiescup:rookiescup","Red Bull Rookies Cup"],
 ...["superbike","superbike-cup","supersport","talent-cup","king-of-the-baggers","twins-cup","super-hooligan","build-train-race"].map(cls=>["motoamerica:"+cls,"MotoAmerica "+cls.split("-").map(s=>s[0].toUpperCase()+s.slice(1)).join(" ")])
];
export default function StandingsPage() {
 const [choice,setChoice]=useState("motogp:motogp");
 const [year,setYear]=useState(new Date().getFullYear());
 const [series,subSeries]=choice.split(":");
 return <main className={style.page}>
  <Link href="/" className={style.backLink}>Back to dashboard</Link>
  <h1 className={style.sectionTitle}>Championship standings</h1>
  <div className={style.classSelector}>
   <label>Championship <select value={choice} onChange={event=>setChoice(event.target.value)} style={{minHeight:44,padding:10,background:"#262626",color:"#fff"}}>{classes.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
   <label>Season <input type="number" min="1949" max={new Date().getFullYear()+1} value={year} onChange={event=>setYear(Number(event.target.value))} style={{minHeight:44,width:100,padding:10,background:"#262626",color:"#fff"}}/></label>
  </div>
  <ClassStandings key={choice+year} series={series} subSeries={subSeries} year={year}/>
 </main>;
}
