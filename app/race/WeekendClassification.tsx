"use client";
import {useEffect,useState} from 'react';
import {SessionTimes} from './SessionTimes';
import {hasMotoSessionTimes} from '@/utils/sessionTimes';
import {ClassificationList} from '../_components/Classification/ClassificationList';
import {classificationClasses,loadClassification,sessionLabel,standingsRows,documentForView,type ClassificationData} from '@/utils/classification';
import style from './RacePage.module.scss';
type Event={subSeries?:string;type?:string;status?:string;name?:string;sessionName?:string};
const get=(path:string,options:{signal:AbortSignal})=>fetch(process.env.NEXT_PUBLIC_RACECAL_URL+path,options);
export function WeekendClassification({roundId,year,series,events=[]}:{roundId:number;year:number;series:string;events?:Event[]}){
 const classes=classificationClasses[series]??[],[cls,setClass]=useState(classes[0]?.[0]??''),[tab,setTab]=useState<'results'|'grid'|'standings'>('results'),[race,setRace]=useState(''),[revision,setRevision]=useState(0);
 const [competition,setCompetition]=useState('riders');
 const [data,setData]=useState<ClassificationData|null>(null),[error,setError]=useState('');
 const isTestEvent=series==='wec'&&events.length>0&&events.every(event=>event.type?.toUpperCase()==='TEST');
 useEffect(()=>{const controller=new AbortController();setData(null);setError('');setRace('');if(isTestEvent)return ()=>controller.abort();void loadClassification(get,roundId,year,series,cls,controller.signal,competition).then(v=>{if(!controller.signal.aborted)setData(v);}).catch(e=>{if(!controller.signal.aborted)setError(e.message);});return ()=>controller.abort();},[roundId,year,series,cls,revision,competition,isTestEvent]);
 const cancelled:string[]=series==='motogp'?events.filter(e=>e.subSeries===cls&&e.type==='RACE'&&e.status==='CANCELLED').map(e=>/sprint/i.test(e.name??e.sessionName??'')?'SPR':'RAC'):[];
 const gridLabel=data?.gridPositionKind==='slot'?'Grid slots':'Grid';
 const views=series==='wec'?[['results','Results'],['grid',gridLabel]]:['wsbk','rookiescup','motoamerica'].includes(series)?[['results','Results'],...(Object.values(data?.grids??{}).some(rows=>rows.length)?[['grid',gridLabel]]:[]),...((data?.standings.length||data?.errors.standings)?[['standings','Standings']]:[])]:[['results','Results'],['grid',gridLabel],['standings','Standings']];
 const activeTab=views.some(([key])=>key===tab)?tab:'results';
 const available=activeTab==='grid'?Object.keys(data?.grids??{}):Array.from(new Set([...(data?.sessions.map(s=>s.label)??[]),...Object.keys(data?.results??{}),...cancelled]));
 const selected=available.includes(race)?race:available[0]??'',isCancelled=cancelled.includes(selected)||data?.sessions.some(s=>s.label===selected&&s.status==='CANCELLED');
 const documents=data?.documents.filter(d=>documentForView(d,activeTab,activeTab==='standings'?(data?.asOfSession??selected):selected))??[],rows=activeTab==='standings'?standingsRows(data?.standings??[]):activeTab==='grid'?data?.grids[selected]:data?.results[selected];
 if(isTestEvent)return <section className={style.scheduleSection} aria-label="Weekend classifications"><h2 className={style.sectionTitle}>Test event</h2><p className={style.standingsFreshness}>Race results and grids are not available for this test event. The official timetable is shown below.</p></section>;
 return <><section className={style.scheduleSection} aria-label="Weekend classifications">
  <p className={style.sectionEyebrow}>{series==='wec'?'FIA WEC':series==='f1'?'Formula 1':series==='bsb'?'British championship':series==='motoamerica'?'MotoAmerica':series==='rookiescup'?'Rookies Cup':'World championship'}</p><h2 className={style.sectionTitle}>{views.map(([,label])=>label.toLowerCase()).join(', ').replace(/^./,s=>s.toUpperCase())}</h2>
  {classes.length>1&&<div className={style.classSelector} role="group" aria-label="Championship class">{classes.map(([key,label])=><button key={key} type="button" aria-pressed={cls===key} onClick={()=>setClass(key)}>{label}</button>)}</div>}
  {series==='wec'&&<p className={style.standingsFreshness}>Overall car classifications retain the published class labels and race crews. Grid reports show only the driver printed for each car. Championship standings and race-awarded points are not available.</p>}
  {cls==='bsb-bmw'&&<p className={style.standingsFreshness}>BMW Cup session times and race-awarded points are not available. The calendar shows the shared BSB meeting schedule.</p>}
  {cls==='bsb-sidecar'&&<p className={style.standingsFreshness}>Race and grid reports cover four BSB meetings. Overall championship totals are the published cumulative totals, including other meetings. Separate GP, CUP and F2 championships and the FIM championship are not included. Grid slots retain the printed layout numbers. Sidecar session times and race-awarded points are unavailable; the calendar shows the shared BSB meeting schedule.</p>}
  {views.length>1&&<div className={style.classSelector} role="group" aria-label="Timing view">{views.map(([key,label])=><button key={key} type="button" aria-pressed={activeTab===key} onClick={()=>setTab(key as typeof tab)}>{label}</button>)}</div>}
  {series==='motogp'&&activeTab==='standings'&&<div className={style.classSelector} role="group" aria-label="Championship competition">{[['riders','Riders'],['teams','Teams'],['constructors','Constructors']].map(([key,label])=><button key={key} type="button" aria-pressed={competition===key} onClick={()=>setCompetition(key)}>{label}</button>)}</div>}
  {error?<><p role="status">{error}</p><div className={style.classSelector}><button type="button" onClick={()=>setRevision(v=>v+1)}>Try again</button></div></>:!data?<p role="status">Loading classifications…</p>:<>
   {data.warnings?.map(warning=><p key={warning} role="status" className={style.standingsFreshness}>{warning}</p>)}
   {activeTab==='standings'&&data.historicalWarnings?.map(warning=><p key={warning} role="status" className={style.standingsFreshness}>{warning}</p>)}
   {activeTab!=='standings'&&available.length>1&&<div className={style.classSelector} role="group" aria-label="Race session">{available.map(key=><button key={key} type="button" aria-pressed={selected===key} onClick={()=>setRace(key)}>{sessionLabel(key)}</button>)}</div>}
   {(data.asOfDate&&(series!=='motogp'||activeTab==='standings')||documents.some(d=>d.provisional)||data.stale)&&<p className={style.standingsFreshness}>{documents.some(d=>d.provisional)?'Provisional · ':''}{data.asOfDate&&(series!=='motogp'||activeTab==='standings')?'As of '+new Date(data.asOfDate+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):''}{data.stale?' · Refresh delayed; showing the last verified import.':''}</p>}
   {activeTab==='standings'&&data.asOfSession&&<p className={style.standingsFreshness}>Standings after {data.unchanged?'the previous points-scoring session':sessionLabel(data.asOfSession)}{data.unchanged?' · No points awarded this round':''}</p>}
   {isCancelled&&activeTab==='results'?<p role="status">Race cancelled. No classification was issued.</p>:rows?.length?<>{data.errors[activeTab]&&<p role="status" className={style.standingsFreshness}>{data.errors[activeTab]}</p>}<ClassificationList key={`${cls}:${activeTab}:${selected}:${competition}`} rows={rows} mode={activeTab} gridPositionKind={data.gridPositionKind} label={activeTab==='standings'?'Championship standings':`${sessionLabel(selected)} ${activeTab==='grid'?(data.gridPositionKind==='slot'?'grid slots':'starting grid'):'classification'}`}/></>:<p role="status">{data.errors[activeTab]??(activeTab==='standings'?'No verified championship snapshot is available for this round.':`No ${activeTab==='grid'?'grid':'results'} are available for this session.`)}</p>}
   {documents.map(d=><p key={d.url}><a href={d.url} target="_blank" rel="noopener noreferrer" className={style.backLink}>{activeTab==='standings'?'Official championship standings':d.label==='Championship standings'?`Standings after ${sessionLabel(selected)}`:d.label} ↗</a></p>)}
  </>}
 </section>{series==='motogp'&&cls==='motogp'&&hasMotoSessionTimes(events)&&<SessionTimes key={roundId} roundId={roundId} year={year}/>}</>;
}

