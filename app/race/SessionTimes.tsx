"use client";
import {useEffect,useState} from 'react';
import {loadSessionTimes,type SessionTimesData} from '@/utils/sessionTimes';
import {ClassificationList} from '../_components/Classification/ClassificationList';
import style from './RacePage.module.scss';
const get=(path:string,options:{signal:AbortSignal})=>fetch(process.env.NEXT_PUBLIC_RACECAL_URL+path,options);
export function SessionTimes({roundId,year}:{roundId:number;year:number}){
 const [data,setData]=useState<SessionTimesData|null>(null),[error,setError]=useState(''),[selected,setSelected]=useState(''),[revision,setRevision]=useState(0);
 useEffect(()=>{const controller=new AbortController();setData(null);setError('');setSelected('');void loadSessionTimes(get,roundId,year,controller.signal).then(value=>{if(!controller.signal.aborted)setData(value);}).catch(error=>{if(!controller.signal.aborted)setError(error.message);});return ()=>controller.abort();},[roundId,year,revision]);
 const report=data?.reports.find(r=>String(r.sessionId)===selected)??data?.reports[0];
 return <section className={style.scheduleSection} aria-label="MotoGP session times"><p className={style.sectionEyebrow}>Practice and qualifying</p><h2 className={style.sectionTitle}>MotoGP session times</h2><p className={style.standingsFreshness}>Practice, qualifying and warm-up classifications. Qualifying times are separate from the final starting grid.</p>
  {error?<><p role="status">{error}</p><div className={style.classSelector}><button type="button" onClick={()=>setRevision(v=>v+1)}>Try again</button></div></>:!data?<p role="status">Loading session times…</p>:<>
   <div className={style.classSelector} role="group" aria-label="Practice or qualifying session">{data.reports.map(r=><button type="button" key={r.sessionId} aria-pressed={r.sessionId===report?.sessionId} onClick={()=>setSelected(String(r.sessionId))}>{r.label}{r.status==='cancelled'?' · Cancelled':''}</button>)}</div>
   {(report?.refreshFailed||(data.stale&&!data.refreshFailed))&&!!report?.rows.length&&<p role="status" className={style.standingsFreshness}>Refresh delayed. Showing the last verified session classification.</p>}
   {report?.status==='published'?<><ClassificationList key={report.sessionId} rows={report.rows} mode="session" label={report.label+' classification'}/>{report.sourceUrl&&<p><a className={style.backLink} href={report.sourceUrl} target="_blank" rel="noopener noreferrer">Official {report.label.toLowerCase()} classification ↗</a></p>}</>:<p role="status">{report?.status==='cancelled'?'Session cancelled. No classification was issued.':report?.status==='withdrawn'?'Session withdrawn from the current timetable.':report?.status==='unavailable'?'The official classification could not be imported.':'No official classification has been published for this session.'}</p>}
  </>}
 </section>;
}
