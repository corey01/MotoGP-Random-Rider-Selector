import type {ClassificationFetcher,ClassificationRow} from './classification';
export type SessionTimeReport={sessionId:number;code:string;label:string;providerSessionId:string|null;sourceUrl:string|null;sourceDate:string|null;status:'published'|'cancelled'|'withdrawn'|'unpublished'|'unavailable';rows:ClassificationRow[];fetchedAt?:string;refreshFailed?:boolean;error?:string};
export type SessionTimesData={ok:true;series:'motogp';subSeries:'motogp';roundId:number;year:number;reports:SessionTimeReport[];stale?:boolean;refreshFailed?:boolean};
export function hasMotoSessionTimes(events:Array<{subSeries?:string;name?:string;sessionName?:string}>){
 return events.some(e=>e.subSeries==='motogp'&&/^(Free Practice Nr\. [12]|Practice|Qualifying Nr\. [12]|Warm Up)$/.test(e.name??e.sessionName??''));
}
export async function loadSessionTimes(fetcher:ClassificationFetcher,roundId:number,year:number,signal:AbortSignal):Promise<SessionTimesData>{
 const response=await fetcher(`/session-classifications?series=motogp&subSeries=motogp&roundId=${roundId}&year=${year}`,{signal}),data=await response.json();
 if(!response.ok)throw new Error(typeof data.error==='string'?data.error:'Session times are unavailable. Please try again later.');
 const codes=['FP1','PR','FP2','Q1','Q2','WUP'],states=['published','cancelled','withdrawn','unpublished','unavailable'];
 if(data.ok!==true||data.series!=='motogp'||data.subSeries!=='motogp'||data.roundId!==roundId||data.year!==year||!Array.isArray(data.reports))throw new Error('Session times do not match this weekend, class and season.');
 const ids=new Set<number>(),seen=new Set<string>();
 for(const r of data.reports){
  if(!Number.isSafeInteger(r.sessionId)||r.sessionId<1||ids.has(r.sessionId)||!codes.includes(r.code)||seen.has(r.code)||typeof r.label!=='string'||!states.includes(r.status)||!Array.isArray(r.rows)||(r.status!=='published'&&r.rows.length))throw new Error('The session classification has an invalid identity or status.');
  ids.add(r.sessionId);seen.add(r.code);
  if(r.status==='published'&&(!r.rows.length||typeof r.sourceUrl!=='string'||!new RegExp(`^https://resources\\.motogp\\.com/files/results/${year}/[A-Z0-9]+/MotoGP/${r.code}/Classification\\.pdf$`).test(r.sourceUrl)))throw new Error('The official session report does not match this classification.');
  if(r.rows.some((row:ClassificationRow)=>typeof row.riderName!=='string'||!row.riderName.trim()||(row.position!==null&&(!Number.isSafeInteger(row.position)||row.position<1))))throw new Error('The session classification has invalid competitor data.');
 }
 return data as SessionTimesData;
}
