export type Pictures={portrait?:string|null;profile?:string|null};
export type ClassificationRow={position:number|null;riderExternalId?:string|null;riderName:string;riderNumber?:number|null;teamName?:string|null;teamColor?:string|null;pictures?:Pictures|null;points?:number|null;status?:string|null;gapFirst?:string|null;bestLapTime?:string|null;totalLaps?:number|null};
export type ChampionshipEntry={position:number;points:number;rider:{id:string;fullName:string|null;number?:number|null;pictures?:Pictures|null};team?:string|null;teamColor?:string|null};
export type ClassificationDocument={label:string;url:string;session?:string;provisional?:boolean};
export type ClassificationData={results:Record<string,ClassificationRow[]>;grids:Record<string,ClassificationRow[]>;standings:ChampionshipEntry[];sessions:Array<{id:string;label:string;status:string}>;documents:ClassificationDocument[];asOfDate?:string;asOfSession?:string;stale?:boolean;unchanged?:boolean;warnings?:string[];errors:Partial<Record<'results'|'grid'|'standings',string>>};
export const classificationClasses:Record<string,Array<[string,string]>>={motogp:[['motogp','MotoGP'],['moto2','Moto2'],['moto3','Moto3']],bsb:[['bsb','Superbike'],['bsb-supersport','Supersport'],['bsb-superstock','National Superstock'],['bsb-sportbike','British Sportbike'],['bsb-bmw','BMW F 900 R Cup']],wsbk:[['worldsbk','WorldSBK'],['worldssp','WorldSSP'],['worldspb','WorldSPB'],['worldwcr','WorldWCR']],f1:[['f1','Formula 1']],rookiescup:[['rookiescup','Rookies Cup']],motoamerica:[['superbike','Superbike'],['supersport','Supersport'],['talent-cup','Talent Cup'],['king-of-the-baggers','King of the Baggers'],['twins-cup','Twins Cup'],['super-hooligan','Super Hooligan'],['build-train-race','Build.Train.Race']]};
export const sessionLabel=(key:string)=>(({RAC:'Race',SPR:'Sprint'} as Record<string,string>)[key]??key);
export function classificationStatus(status?:string|null){
 if(!status)return null;const raw=status.trim(),value=raw.toUpperCase();
 const mapped=({OUTSTND:'DNF',RETIRED:'DNF',RET:'DNF','NOT FINISHED':'DNF','DID NOT FINISH':'DNF',NS:'DNS','NOT STARTED':'DNS','DID NOT START':'DNS',DSQ:'DSQ',DQ:'DSQ',DISQUALIFIED:'DSQ',DNF:'DNF',DNS:'DNS',NC:'NC','NOT CLASSIFIED':'NC','PIT LANE':'Pit lane'} as Record<string,string>)[value];
 if(mapped)return mapped;if(!raw||['INSTND','CLASSIFIED','FINISHED','FIN','OK'].includes(value)||/^[+\d:—-]/.test(raw))return null;return raw;
}
export function classificationDetail(row:ClassificationRow,mode:'results'|'grid'|'standings',leaderLaps?:number|null){
 if(mode==='standings')return null;const status=classificationStatus(row.status);if(status)return status;
 if(mode==='grid')return row.bestLapTime?`Qualifying ${row.bestLapTime}`:null;
 if(row.position===1)return 'Winner';
 if(row.gapFirst){const gap=row.gapFirst.trim();return /^\d+(?:\.\d+)?(?:s|\s+laps?)?$/.test(gap)?'+'+gap:gap;}
 if(row.position!==null&&row.totalLaps!=null&&leaderLaps!=null&&row.totalLaps<leaderLaps){const laps=leaderLaps-row.totalLaps;return `+${laps} lap${laps===1?'':'s'}`;}return null;
}
export const standingsRows=(entries:ChampionshipEntry[]):ClassificationRow[]=>entries.map(e=>({position:e.position,riderExternalId:e.rider.id,riderName:e.rider.fullName||'Unknown competitor',riderNumber:e.rider.number,teamName:e.team,teamColor:e.teamColor,pictures:e.rider.pictures,points:e.points}));
export function documentForView(d:ClassificationDocument,view:string,session:string){
 if(d.session&&d.session!==session)return false;
 // An explicit API session is authoritative. BMW's numbered reports can describe
 // heats, LCQ, Sprint or Main; their file/race numbers do not identify the phase.
 if(!d.session){
  if(/^sprint[- ]/i.test(d.label)&&!['Sprint','SPR'].includes(session))return false;
  if(/^(race-result|starting-grid)$/i.test(d.label)&&!['Race','RAC'].includes(session))return false;
 }
 if(view==='standings')return /championship|standings/i.test(d.label);
 if(/championship|standings/i.test(d.label))return false;
 return (view==='grid'?/grid/i.test(d.label):!/grid/i.test(d.label))&&(!!d.session||!/Race \d+/i.test(d.label)||d.label.includes(session));
}
// Persisted JSON objects do not preserve publication order. Keep named phases
// chronological without adding phases that the source did not publish.
function orderedBmwPhases(rows:Record<string,ClassificationRow[]>){
 const phases=['Heat 1','Heat 2','LCQ','Sprint','Main'];
 const rank=(label:string)=>{const index=phases.indexOf(label);return index<0?phases.length:index;};
 return Object.fromEntries(Object.entries(rows).sort(([a],[b])=>rank(a)-rank(b)));
}
export type ClassificationFetcher=(path:string,options:{signal:AbortSignal})=>Promise<Response>;
export async function loadClassification(fetcher:ClassificationFetcher,roundId:number,year:number,series:string,cls:string,signal:AbortSignal,competition='riders'):Promise<ClassificationData>{
 const empty:ClassificationData={results:{},grids:{},standings:[],sessions:[],documents:[],errors:{}};
 const get=async(path:string,historical=false)=>{const res=await fetcher(path,{signal}),data=await res.json();if(!res.ok)throw new Error(typeof data.error==='string'?data.error:'Classification is unavailable. Please try again later.');if(data.roundId!==roundId||data.subSeries!==cls||(historical&&(!data.asOfSession||data.year!==year||(competition!=='riders'&&data.competition!==competition))))throw new Error('The classification does not match this round, class and season.');return data;};
 if(series==='motogp'){
  const query=`roundId=${roundId}&subSeries=${encodeURIComponent(cls)}`;
  const [r,g,s]=await Promise.allSettled([get('/results?'+query),get('/grid?'+query),get(`/standings?${query}&series=motogp&year=${year}&competition=${encodeURIComponent(competition)}`,true)]);
  if(r.status==='fulfilled')empty.results=r.value.sessions??{};else empty.errors.results=r.reason.message;
  if(g.status==='fulfilled'&&g.value.grid?.length)empty.grids.RAC=g.value.grid;else if(g.status==='rejected')empty.errors.grid=g.reason.message;
  if(s.status==='fulfilled'){const d=s.value;empty.standings=d.standings??[];empty.asOfDate=d.asOfDate;empty.asOfSession=d.asOfSession;empty.unchanged=d.unchanged;empty.stale=d.stale;if(d.sourceUrl)empty.documents.push({label:'Championship standings',url:d.sourceUrl});}else empty.errors.standings='Historical standings are unavailable for this round.';
  return empty;
 }
 const d=await get(`/classifications?roundId=${roundId}&subSeries=${encodeURIComponent(cls)}`);if(d.series!==series||d.year!==year)throw new Error('The classification does not match this championship and season.');
 return {...empty,results:cls==='bsb-bmw'?orderedBmwPhases(d.results??{}):d.results??{},grids:cls==='bsb-bmw'?orderedBmwPhases(d.grids??{}):d.grids??{},standings:d.standings??[],sessions:d.sessions??[],documents:d.documents??[],asOfDate:d.asOfDate,asOfSession:d.asOfSession,stale:d.stale,warnings:d.coverageErrors?.length?['Some official data could not be refreshed. Showing verified data where available.']:[],errors:d.historicalError?{standings:'Historical standings could not be refreshed. Showing a verified earlier import where available.'}:{}};
}
