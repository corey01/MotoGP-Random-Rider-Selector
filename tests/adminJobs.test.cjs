const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ts=require('typescript'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const filename=path.resolve(__dirname,'../app/admin/JobTable.tsx'),mod={exports:{}};
const code=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
vm.runInNewContext(code,{module:mod,exports:mod.exports,Date,require:name=>name.endsWith('.scss')?{__esModule:true,default:new Proxy({},{get:(_,key)=>String(key)})}:require(name)},{filename});
const JobTable=mod.exports.default;
const base={id:1,jobName:'motogp:standings-sync',status:'error',startedAt:'2026-10-31T07:42:00Z',completedAt:'2026-10-31T07:42:10Z',errorMessage:'Official championship document HTTP 404'};
const render=(runs=[base],cols=4)=>renderToStaticMarkup(React.createElement(JobTable,{runs,cols})).replace(/<!--[\s\S]*?-->/g,'');

test('recent runs expose complete errors without a dedicated Error column',()=>{
 const html=render();assert.match(html,/<summary>Error details<\/summary>/);assert.match(html,/Official championship document HTTP 404/);assert.doesNotMatch(html,/<th>Error<\/th>/);
});
test('MotoGP details retain class and round outcomes without generic zero timing totals',()=>{
 const html=render([{...base,meta:{year:2026,scope:'season',snapshotsWritten:2,teamRows:22,constructorRows:10,riderClasses:[{subSeries:'motogp',count:32},{subSeries:'moto2',count:34},{subSeries:'moto3',error:'HTTP 502 rider refresh'}],results:[{roundId:42,subSeries:'motogp',status:'success',teamRows:11,constructorRows:5,unchanged:true},{roundId:43,subSeries:'motogp',status:'error',error:'Official championship document HTTP 404'},{roundId:43,subSeries:'moto2',status:'awaiting_publication'}]}}]);
 assert.match(html,/2 snapshots written/);assert.match(html,/22 team rows · 10 constructor rows/);assert.match(html,/Year 2026/);assert.match(html,/Rider standings refresh/);assert.match(html,/32 rider entries/);assert.match(html,/34 rider entries/);assert.match(html,/HTTP 502 rider refresh/);
 assert.match(html,/Round ID 43 · motogp · error: Official championship document HTTP 404/);
 assert.match(html,/Round ID 43 · moto2 · awaiting_publication: Awaiting official publication/);
 assert.match(html,/Official standings unchanged/);assert.doesNotMatch(html,/0 results|0 grid rows|0 standings rows/);
});
test('latest status keeps its Error column and expandable untruncated error',()=>{
 const error='Upstream failed: https://official.example/'+('document-'.repeat(50))+'HTTP 404',html=render([{...base,errorMessage:error}],5);
 assert.match(html,/<th>Error<\/th>/);assert(html.includes(error));assert.match(html,/title="Upstream failed/);assert.match(html,/<summary>Error details<\/summary>/);
});
test('source error text is escaped instead of interpreted as HTML',()=>{
 const html=render([{...base,errorMessage:'<script>alert("source")</script>',meta:{results:[{roundId:43,status:'error',error:'<img src=x onerror=alert(1)>'}]}}]);
 assert.doesNotMatch(html,/<script>|<img src=x/);assert.match(html,/&lt;script&gt;/);assert.match(html,/&lt;img src=x/);
});
test('WEC and existing timing jobs retain counts and distinguish round numbers from IDs',()=>{
 for(const jobName of ['timing:wec','timing:bsb']){
  const html=render([{...base,jobName,status:'success',errorMessage:null,meta:{snapshotsWritten:7,resultRows:272,gridRows:272,standingsRows:0,results:[{roundId:98100,roundNumber:1,subSeries:'wec',status:'success',resultRows:35,gridRows:35,standingsRows:0}]}}]);
  assert.match(html,/272 results · 272 grid rows/);assert.match(html,/Round 1 · wec/);assert.doesNotMatch(html,/Error details/);
 }
});
test('empty lists and old jobs without metadata remain readable',()=>{
 assert.match(render([]),/No runs yet/);const html=render([{...base,jobName:'motogp:events-sync',status:'running',completedAt:null,startedAt:null,errorMessage:null,meta:null}]);
 assert.match(html,/motogp:events-sync/);assert.match(html,/>running</);assert.doesNotMatch(html,/<details|Invalid Date|snapshots written/);
});
