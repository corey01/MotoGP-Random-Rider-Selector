"use client";
import {useState,type CSSProperties} from 'react';
import {classificationDetail,classificationStatus,type ClassificationRow} from '@/utils/classification';
import style from './Classification.module.scss';
export function CompetitorPortrait({name,pictures,compact=false}:{name:string;pictures?:ClassificationRow['pictures'];compact?:boolean}){
 const url=pictures?.portrait||pictures?.profile,[failed,setFailed]=useState<string|null>(null);const parts=name.trim().split(/\s+/),initials=[parts[0]?.[0],parts.length>1?parts.at(-1)?.[0]:''].join('');
 return <span className={`${style.portrait} ${compact?style.compact:""}`} aria-hidden="true">{url&&url!==failed?
  // eslint-disable-next-line @next/next/no-img-element
  <img src={url} alt="" loading="lazy" onError={()=>setFailed(url)}/>:<span>{initials||'?'}</span>}</span>;
}
export function CompetitorName({name,crew,crewLabel='Crew'}:{name:string;crew?:ClassificationRow['crew'];crewLabel?:ClassificationRow['crewLabel']}){
 return crew?.length?<span className={style.crewNames}><span className={style.crewLabel}>{crewLabel}</span>{crew.map((member,index)=><span key={`${member.name}:${index}`}>{member.name}{member.role&&<span className={style.crewRole}> · {member.role}</span>}</span>)}</span>:<>{name}</>;
}
export function CrewPortrait({count}:{count:number}){return <span className={`${style.portrait} ${style.crewPortrait}`} aria-hidden="true">{count}×</span>;}
export function ClassificationList({rows,mode='results',label,gridPositionKind}:{rows:ClassificationRow[];mode?:'results'|'grid'|'standings';label:string;gridPositionKind?:'slot'}){
 const [expanded,setExpanded]=useState(false),visible=expanded?rows:rows.slice(0,3),leaderLaps=rows.find(r=>r.position===1)?.totalLaps;
 return <div className={style.list}><ol aria-label={label} className={style.rows}>{visible.map((r,i)=>{
 const accent=r.teamColor&&/^#?[0-9a-f]{6}$/i.test(r.teamColor)?'#'+r.teamColor.replace('#',''):'#555',detail=classificationDetail(r,mode,leaderLaps),status=classificationStatus(r.status);
 return <li key={r.riderExternalId??`${r.riderName}:${r.riderNumber??i}`} className={style.row} style={{'--team-accent':accent} as CSSProperties}>
  <span className={`${style.position} ${r.position===1?style.first:''}`} aria-label={mode==='grid'&&gridPositionKind==='slot'?`Grid slot ${r.position??'unknown'}`:undefined}>{r.position??status??'—'}</span>{r.crew?.length?<CrewPortrait count={r.crew.length}/>:<CompetitorPortrait name={r.riderName} pictures={r.pictures}/>}
  <div className={style.identity}><span className={style.name}><CompetitorName name={r.riderName} crew={r.crew} crewLabel={r.crewLabel}/></span>{r.teamName&&<span className={style.team} title={r.teamName}>{r.teamName}</span>}{r.machine&&<span className={style.team}>{r.machine}</span>}{r.category&&<span className={style.secondary}>{r.category}{r.classPosition!=null?` · Class position ${r.classPosition}`:''}</span>}</div>
  {(r.entryNumber??r.riderNumber)!=null?<span className={style.number}>#{r.entryNumber??r.riderNumber}</span>:<span className={style.noNumber}/>}
  <div className={style.metrics}>{r.points!=null&&<span className={style.points}>{r.points.toLocaleString('en-GB')} pts</span>}{detail&&<span className={status?style.status:undefined}>{detail}</span>}{mode==='results'&&r.bestLapTime&&<span className={style.secondary}>Best {r.bestLapTime}</span>}{mode==='results'&&r.totalLaps!=null&&<span className={style.secondary}>{r.totalLaps} laps</span>}</div>
 </li>;})}</ol>{rows.length>3&&<button type="button" className={style.expand} aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}>{expanded?'Show top three':'Show full '+(mode==='grid'?'grid':mode==='standings'?'standings':'classification')} <span aria-hidden="true">{expanded?'↑':'↓'}</span></button>}</div>;
}
