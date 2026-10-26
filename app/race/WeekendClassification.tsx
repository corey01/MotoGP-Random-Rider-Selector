"use client";
import {useEffect,useState} from 'react';
import {ClassificationList} from '../_components/Classification/ClassificationList';
import {classificationClasses,loadClassification,sessionLabel,standingsRows,documentForView,type ClassificationData} from '@/utils/classification';
import style from './RacePage.module.scss';
type Event={subSeries?:string;type?:string;status?:string;name?:string;sessionName?:string};
const get=(path:string,options:{signal:AbortSignal})=>fetch(process.env.NEXT_PUBLIC_RACECAL_URL+path,options);
export function WeekendClassification({roundId,year,series,events=[]}:{roundId:number;year:number;series:string;events?:Event[]}){
 const classes=classificationClasses[series]??[],[cls,setClass]=useState(classes[0]?.[0]??''),[tab,setTab]=useState<'results'|'grid'|'standings'>('results'),[race,setRace]=useState(''),[revision,setRevision]=useState(0);
 const [competition,setCompetition]=useState('riders');
 const [data,setData]=useState<ClassificationData|null>(null),[error,setError]=useState('');
 useEffect(()=>{const controller=new AbortController();setData(null);setError('');setRace('');void loadClassification(get,roundId,year,series,cls,controller.signal,competition).then(v=>{if(!controller.signal.aborted)setData(v);}).catch(e=>{if(!controller.signal.aborted)setError(e.message);});return ()=>controller.abort();},[roundId,year,series,cls,revision,competition]);
 const cancelled:string[]=series==='motogp'?events.filter(e=>e.subSeries===cls&&e.type==='RACE'&&e.status==='CANCELLED').map(e=>/sprint/i.test(e.name??e.sessionName??'')?'SPR':'RAC'):[];
 const available=tab==='grid'?Object.keys(data?.grids??{}):Array.from(new Set([...(data?.sessions.map(s=>s.label)??[]),...Object.keys(data?.results??{}),...cancelled]));
 const selected=available.includes(race)?race:available[0]??'',isCancelled=cancelled.includes(selected)||data?.sessions.some(s=>s.label===selected&&s.status==='CANCELLED');
 const documents=data?.documents.filter(d=>documentForView(d,tab,selected))??[],rows=tab==='standings'?standingsRows(data?.standings??[]):tab==='grid'?data?.grids[selected]:data?.results[selected];
 const views=series==='wsbk'?[['results','Results']]:[['results','Results'],['grid','Grid'],['standings','Standings']];
 return <section className={style.scheduleSection} aria-label="Weekend classifications">
  <p className={style.sectionEyebrow}>{series==='f1'?'Formula 1':series==='bsb'?'British championship':'World championship'}</p><h2 className={style.sectionTitle}>Results{series==='wsbk'?'':', grids & standings'}</h2>
  {classes.length>1&&<div className={style.classSelector} role="group" aria-label="Championship class">{classes.map(([key,label])=><button key={key} type="button" aria-pressed={cls===key} onClick={()=>setClass(key)}>{label}</button>)}</div>}
  {views.length>1&&<div className={style.classSelector} role="group" aria-label="Timing view">{views.map(([key,label])=><button key={key} type="button" aria-pressed={tab===key} onClick={()=>setTab(key as typeof tab)}>{label}</button>)}</div>}
  {series==='motogp'&&tab==='standings'&&<div className={style.classSelector} role="group" aria-label="Championship competition">{[['riders','Riders'],['teams','Teams'],['constructors','Constructors']].map(([key,label])=><button key={key} type="button" aria-pressed={competition===key} onClick={()=>setCompetition(key)}>{label}</button>)}</div>}
  {error?<><p role="status">{error}</p><div className={style.classSelector}><button type="button" onClick={()=>setRevision(v=>v+1)}>Try again</button></div></>:!data?<p role="status">Loading classifications…</p>:<>
   {tab!=='standings'&&available.length>1&&<div className={style.classSelector} role="group" aria-label="Race session">{available.map(key=><button key={key} type="button" aria-pressed={selected===key} onClick={()=>setRace(key)}>{sessionLabel(key)}</button>)}</div>}
   {(data.asOfDate&&(series!=='motogp'||tab==='standings')||documents.some(d=>d.provisional)||data.stale)&&<p className={style.standingsFreshness}>{documents.some(d=>d.provisional)?'Provisional · ':''}{data.asOfDate&&(series!=='motogp'||tab==='standings')?'As of '+new Date(data.asOfDate+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):''}{data.stale?' · Refresh delayed; showing the last verified import.':''}</p>}
   {tab==='standings'&&data.asOfSession&&<p className={style.standingsFreshness}>Standings after {data.unchanged?'the previous points-scoring session':sessionLabel(data.asOfSession)}{data.unchanged?' · No points awarded this round':''}</p>}
   {isCancelled&&tab==='results'?<p role="status">Race cancelled. No classification was issued.</p>:rows?.length?<>{data.errors[tab]&&<p role="status" className={style.standingsFreshness}>{data.errors[tab]}</p>}<ClassificationList key={`${cls}:${tab}:${selected}:${competition}`} rows={rows} mode={tab} label={tab==='standings'?'Championship standings':`${sessionLabel(selected)} ${tab==='grid'?'starting grid':'classification'}`}/></>:<p role="status">{data.errors[tab]??(tab==='standings'?'No verified championship snapshot is available for this round.':`No ${tab==='grid'?'grid':'results'} are available for this session.`)}</p>}
   {documents.map(d=><p key={d.url}><a href={d.url} target="_blank" rel="noopener noreferrer" className={style.backLink}>{tab==='standings'?'Official championship standings':d.label==='Championship standings'?`Standings after ${sessionLabel(selected)}`:d.label} ↗</a></p>)}
  </>}
 </section>;
}
