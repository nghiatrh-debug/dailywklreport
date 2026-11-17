const crypto = require('crypto'); const fs = require('fs'); const vm = require('vm');
const sheets = {}; const ext = {};   // file Google Sheet khác (VD sổ theo dõi hồ sơ)
function mkSS(name, tabs){ const sh = {}; Object.keys(tabs).forEach(n=>{ sh[n] = mkSheet(n); tabs[n].forEach(r=>sh[n].data.push(r)); }); return { getName:()=>name, getSheets:()=>Object.values(sh), getSheetByName:n=>sh[n]||null }; } let fileSeq = 0; const files = {}; const props = {}; const cacheStore = {}; const stats = {sheetReads:0, sheetWrites:0};
function mkSheet(name){ const data = []; const sh = {
  name, data, getName:()=>name, getLastRow:()=>data.length, getLastColumn:()=>Math.max(0, ...data.map(r=>r.length)), setFrozenRows(){}, hideColumns(){},
  appendRow(r){ data.push(r.slice()); },
  deleteRows(start, n){ data.splice(start-1, n); stats.sheetWrites++; },
  getRange(a,b,c,d){ if (typeof a==='string') return {setNumberFormat(){return this;}};
    const r0=a-1,c0=b-1,nr=c||1,nc=d||1; return {
      setValues(v){ stats.sheetWrites++; for(let i=0;i<nr;i++){ data[r0+i]=data[r0+i]||[]; for(let j=0;j<nc;j++) data[r0+i][c0+j]=v[i][j]; } return this; },
      getValues(){ stats.sheetReads++; const o=[]; for(let i=0;i<nr;i++){ const row=[]; for(let j=0;j<nc;j++) row.push((data[r0+i]||[])[c0+j] ?? ''); o.push(row);} return o; },
      clearContent(){ for(let i=0;i<nr;i++) for(let j=0;j<nc;j++) if(data[r0+i]) data[r0+i][c0+j]=''; 
        while(data.length && data[data.length-1].every(x=>x==='')) data.pop(); return this; },
      setValue(v){ data[r0][c0]=v; }, setFontWeight(){return this;}, setBackground(){return this;},
      createTextFinder(q){ let whole=false; const tf={ matchEntireCell(b){ whole=b; return tf; }, findAll(){ stats.finds=(stats.finds||0)+1; const o=[];
        for(let i=0;i<nr;i++) for(let j=0;j<nc;j++){ const v=String((data[r0+i]||[])[c0+j] ?? ''); if (whole ? v===q : v.includes(q)) o.push({getRow:()=>r0+i+1}); } return o; } }; return tf; } }; } }; return sh; }
const ss = { getSheetByName:n=>sheets[n]||null, insertSheet:n=>(sheets[n]=mkSheet(n)), getSheets:()=>Object.values(sheets), deleteSheet(){}, getId:()=>'SS1', getUrl:()=>'https://docs.google.com/spreadsheets/d/SS1' };
function mkFolder(name){ const f={ name, kids:{}, files:[], getUrl:()=>'https://drive/'+name, getName:()=>name, getId:()=>'ID_'+name,
  getFoldersByName(n){ const k=f.kids[n]; let used=false; return {hasNext:()=>!!k&&!used, next:()=>{used=true;return k;}}; },
  createFolder(n){ return f.kids[n]=mkFolder(n); },
  createFile(blob){ const id='F'+(++fileSeq); files[id]={blob, name:blob.name, trashed:false}; f.files.push(id); return {getId:()=>id, getName:()=>blob.name, getUrl:()=>'https://drive/file/'+id, setSharing(a,b){ files[id].sharing = a+'/'+b; }, setTrashed(){ files[id].trashed = true; }}; },
  getFilesByName(n){ const ids=f.files.filter(i=>files[i].name===n&&!files[i].trashed); let k=0; return {hasNext:()=>k<ids.length, next:()=>({setTrashed(){files[ids[k++]].trashed=true;}})}; } }; return f; }
const root = mkFolder('root'), shared = mkFolder('CN8-2 Shared');
function blob(bytes, mime, name){ return { bytes, mime, name, getContentType:()=>mime, getBytes:()=>bytes, getAs(){ return blob(bytes,'application/pdf',name); }, setName(n){ this.name=n; return this; } }; }
const ctx = {
  console, JSON, Date, Math, Object, Array, String, Number, Error,
  SpreadsheetApp:{ getActive:()=>ss, openById:id=>{ if (ext[id]) return ext[id]; if (id === 'NOPE') throw new Error('no access'); return ss; } },
  ScriptApp:{ getService:()=>({ getUrl:()=>'https://script.google.com/macros/s/TEST/dev' }) },
  DriveApp:{ Access:{ANYONE_WITH_LINK:'ANYONE_WITH_LINK'}, Permission:{VIEW:'VIEW'}, getFoldersByName:n=>root.getFoldersByName(n), createFolder:n=>root.createFolder(n), getFolderById:id=>{ if (id==='SHAREDFOLDER01') return shared; if (id==='NOACCESSFOLDER') throw new Error('No item with the given ID could be found'); return root; },
    getFileById:id=>({ getBlob:()=>files[id].blob, setTrashed(){files[id].trashed=true;}, makeCopy:(n)=>({getUrl:()=>'https://drive/copy/'+n}) }) },
  Utilities:{ getUuid:()=>crypto.randomUUID(), sleep(){}, formatDate:(d,tz,f)=>{ const p=n=>String(n).padStart(2,'0'); const v=new Date(d.getTime()+7*3600e3); const Y=v.getUTCFullYear(),M=p(v.getUTCMonth()+1),D=p(v.getUTCDate()),h=p(v.getUTCHours()),m=p(v.getUTCMinutes()); return f==='yyyy-MM-dd'?Y+'-'+M+'-'+D:f==='dd/MM/yyyy HH:mm'?D+'/'+M+'/'+Y+' '+h+':'+m:''+Y+M+D+'_'+h+m; },
    computeDigest:(alg,s)=>[...crypto.createHash('sha256').update(s,'utf8').digest()].map(x=>x>127?x-256:x),
    DigestAlgorithm:{SHA_256:1}, Charset:{UTF_8:1},
    base64Decode:s=>[...Buffer.from(s,'base64')], base64Encode:b=>Buffer.from(b.map(x=>x&255)).toString('base64'), newBlob:(b,m,n)=>blob(typeof b==='string'?[...Buffer.from(b)]:b,m,n) },
  LockService:{ getScriptLock:()=>({waitLock(){}, releaseLock(){}}) },
  PropertiesService:{ getScriptProperties:()=>({ getProperty:k=>props[k]??null, setProperty:(k,v)=>{props[k]=v}, deleteProperty:k=>{delete props[k]}, getProperties:()=>({...props}) }) },
  Session:{ getActiveUser:()=>({getEmail:()=>''}) }, Logger:{log(){}},
  CacheService:{ getScriptCache:()=>({ get:k=>cacheStore[k]??null, put:(k,v)=>{cacheStore[k]=v}, removeAll:ks=>ks.forEach(k=>delete cacheStore[k]) }) },
  HtmlService:{ XFrameOptionsMode:{ALLOWALL:1}, createTemplateFromFile:()=>{ const t={ evaluate(){ const o={ html:'BOOT:'+t.boot, setTitle(){return o;}, addMetaTag(){return o;}, setXFrameOptionsMode(){return o;} }; return o; } }; return t; },
    createHtmlOutputFromFile:()=>{ const o={ setTitle(){return o;}, addMetaTag(){return o;}, setXFrameOptionsMode(){return o;} }; return o; } }
};
const CODE = process.env.GAS_CODE || require('path').join(__dirname, '..', 'apps-script', 'Code.gs');
vm.createContext(ctx); vm.runInContext(fs.readFileSync(CODE,'utf8'), ctx);
ctx.__resetMemo = () => { try { vm.runInContext('if (typeof MEMO!=="undefined") Object.keys(MEMO).forEach(k=>delete MEMO[k]);', ctx); } catch(e){} };
module.exports = { shared, ctx, sheets, files, props, cacheStore, stats, ext, mkSS };
