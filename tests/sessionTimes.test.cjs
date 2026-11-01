const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
function load(file){const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(code,{module,exports:module.exports,require,Set,Number,RegExp});return module.exports;}
const {loadSessionTimes,hasMotoSessionTimes}=load('utils/sessionTimes.ts'),{classificationDetail}=load('utils/classification.ts');
const report={sessionId:1170475,code:'FP1',label:'Free practice 1',status:'published',sourceUrl:'https://resources.motogp.com/files/results/2026/THA/MotoGP/FP1/Classification.pdf',rows:[{position:1,riderName:'Published leader',totalLaps:10,bestLapTime:'01:29.346',points:null}]};
const payload={ok:true,series:'motogp',subSeries:'motogp',year:2026,roundId:20,reports:[report]};
test('session times request exact scope, preserve source timing and pass the cancellation signal',async()=>{
 const controller=new AbortController();let request;
 const p=await loadSessionTimes(async(path,options)=>{request={path,options};return {ok:true,json:async()=>payload};},20,2026,controller.signal);
 assert.match(request.path,/roundId=20&year=2026/);assert.match(request.path,/subSeries=motogp/);assert.equal(request.options.signal,controller.signal);assert.equal(p.reports[0].sessionId,1170475);assert.equal(p.reports[0].rows[0].bestLapTime,'01:29.346');
 assert.equal(hasMotoSessionTimes([{subSeries:'motogp',sessionName:'Practice'}]),true);assert.equal(hasMotoSessionTimes([{subSeries:'motogp',sessionName:'King of the Baggers Free Practice Nr. 1'},{subSeries:'moto2',name:'Practice'}]),false);
});
test('session classifications reject another weekend/class/year and mismatched reports',async()=>{
 const variants=[{...payload,year:2025},{...payload,roundId:21},{...payload,subSeries:'moto2'},{...payload,series:'f1'},{...payload,reports:[report,report]},{...payload,reports:[{...report,status:'cancelled'}]},{...payload,reports:[{...report,sourceUrl:report.sourceUrl.replace('/FP1/','/Q1/')}]}];
 for(const p of variants)await assert.rejects(loadSessionTimes(async()=>({ok:true,json:async()=>p}),20,2026,new AbortController().signal));
 await assert.rejects(loadSessionTimes(async()=>({ok:false,json:async()=>({error:'Official import failed'})}),20,2026,new AbortController().signal),/Official import failed/);
});
test('cancelled, withdrawn and unpublished sessions stay selectable without competitor rows',async()=>{
 for(const status of ['cancelled','withdrawn','unpublished','unavailable']){
  const p=await loadSessionTimes(async()=>({ok:true,json:async()=>({...payload,reports:[{...report,status,rows:[],sourceUrl:null}]})}),20,2026,new AbortController().signal);
  assert.equal(p.reports[0].status,status);assert.equal(p.reports[0].rows.length,0);
 }
});
test('practice leaders are fastest, missing gaps never become race lap deficits, and race presentation is preserved',()=>{
 assert.equal(classificationDetail(report.rows[0],'session',10),'Fastest');assert.equal(classificationDetail(report.rows[0],'results',10),'Winner');
 const behind={position:2,riderName:'Other rider',totalLaps:4,bestLapTime:'01:29.500'};assert.equal(classificationDetail(behind,'session',10),null);assert.equal(classificationDetail({...behind,gapFirst:'0.154'},'session',10),'+0.154');assert.equal(classificationDetail({...behind,status:'DNS'},'session',10),'DNS');
});

test('Moto2 and Moto3 loaders request the selected class and validate that class in the payload and PDF link',async()=>{
 for(const [cls,title,id] of [['moto2','Moto2',1170474],['moto3','Moto3',1170485]]){
  let requested;
  const p={...payload,subSeries:cls,reports:[{...report,sessionId:id,sourceUrl:report.sourceUrl.replace('/MotoGP/','/'+title+'/')}]};
  const value=await loadSessionTimes(async(path)=>{requested=path;return {ok:true,json:async()=>p};},20,2026,new AbortController().signal,cls);
  assert.match(requested,new RegExp('subSeries='+cls+'&'));assert.equal(value.subSeries,cls);assert.equal(value.reports[0].sessionId,id);
  await assert.rejects(loadSessionTimes(async()=>({ok:true,json:async()=>p}),20,2026,new AbortController().signal,cls==='moto2'?'moto3':'moto2'),/class and season/);
  await assert.rejects(loadSessionTimes(async()=>({ok:true,json:async()=>({...p,reports:[{...p.reports[0],sourceUrl:report.sourceUrl}]})}),20,2026,new AbortController().signal,cls),/official session report/);
 }
 assert.equal(hasMotoSessionTimes([{subSeries:'moto3',sessionName:'Qualifying Nr.2'}],'moto3'),true);
 assert.equal(hasMotoSessionTimes([{subSeries:'motogp',sessionName:'Practice'}],'moto2'),false);
});


test('timed classifications display no recorded time for source-unranked qualifiers without applying a race DNF label',()=>{
 const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
 const source=ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../app/_components/Classification/ClassificationList.tsx'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const module={exports:{}};vm.runInNewContext(source,{module,exports:module.exports,require:name=>name.endsWith('.scss')?{__esModule:true,default:new Proxy({},{get:(_,k)=>String(k)})}:name==='@/utils/classification'?load('utils/classification.ts'):require(name)});
 const rows=[{position:null,riderName:'Unranked qualifier',status:'OUTSTND',totalLaps:0,bestLapTime:null}];
 const timed=renderToStaticMarkup(React.createElement(module.exports.ClassificationList,{rows,mode:'session',label:'Q2 classification'}));assert.match(timed,/No recorded time/);assert.doesNotMatch(timed,/DNF|Winner/);
 const race=renderToStaticMarkup(React.createElement(module.exports.ClassificationList,{rows,mode:'results',label:'Race classification'}));assert.match(race,/DNF/);
});
