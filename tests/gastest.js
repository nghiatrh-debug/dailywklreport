const { ctx: C, sheets, files, props, cacheStore } = require('./gasmock.js');
const ctx = new Proxy(C, { get(o,k){ const f=o[k]; return typeof f==='function' && String(k).startsWith('api') ? (...a)=>{ o.__resetMemo(); return f(...a); } : f; } });
const A = (c)=>{ if(!c[0]) { console.log('FAIL', c[1]); process.exitCode=1; } else console.log('ok', c[1]); };
const J = s=>JSON.parse(s);
ctx.setup();
const cfg = { project:{code:'TST',name:'Test'}, users:[{id:'uA',name:'Admin',role:'admin',active:true}], zones:[], wbs:[], setupDone:true, manpower:[], equipment:[] };
const s1 = J(ctx.apiSetup(JSON.stringify(cfg), '1234')); A([s1.token, 'setup token']);
let threw=false; try{ ctx.apiSetup(JSON.stringify(cfg),'1234'); }catch(e){threw=true;} A([threw,'setup twice blocked']);
A([ctx.apiLogin('uA','9999')===null,'bad pin']); const lg = J(ctx.apiLogin('uA','1234','day')); const tk = lg.token; A([lg.bundle && lg.bundle.index,'login returns bundle']); A([tk,'login']);
const c2 = J(ctx.apiPublicConfig()); c2.users.push({id:'uK',name:'KS1',role:'ks',active:true}); c2.zones=[{id:'z1',name:'Zone A',section:'XD',owner:'uK'}];
ctx.apiSaveConfig(tk, JSON.stringify(c2)); ctx.apiSetPin(tk,'uK','1111');
A([!('pins' in J(ctx.apiPublicConfig())),'public config has no pins']);
const tkK = J(ctx.apiLogin('uK','1111')).token;
threw=false; try{ ctx.apiSaveConfig(tkK, JSON.stringify(c2)); }catch(e){threw=/quyền/.test(e.message);} A([threw,'KS cannot save config']);
threw=false; try{ ctx.apiOpen('bad','','day',''); }catch(e){threw=/AUTH/.test(e.message);} A([threw,'bad token AUTH']);
const img = 'data:image/jpeg;base64,' + Buffer.from('hello').toString('base64');
const sub = { key:'2026-11-15|uK', date:'2026-11-15', uid:'uK', status:'draft', tasks:[{zoneId:'z1',desc:'Đào',progress:'50%',by:'uK'}], plans:[], inspections:[], inspectionPlans:[], tests:[], photos:[{img, fileId:'', caption:'a'}], note:'n' };
let r = J(ctx.apiSaveSub(tkK, JSON.stringify(sub))); A([r.photos[0],'photo uploaded']);
sub.photos[0].fileId = r.photos[0]; sub.status='submitted'; ctx.apiSaveSub(tkK, JSON.stringify(sub));
const nfiles = Object.keys(files).length; ctx.apiSaveSub(tkK, JSON.stringify(Object.assign({},sub,{status:'draft'}))); A([Object.keys(files).length===nfiles,'no re-upload; withdraw ok']);
sub.status='submitted'; ctx.apiSaveSub(tkK, JSON.stringify(sub));
const sk = Object.assign({}, sub, {uid:'uA', key:'2026-11-15|uA'}); threw=false; try{ ctx.apiSaveSub(tkK, JSON.stringify(sk)); }catch(e){threw=true;} A([threw,'KS cannot save others']);
let ob = J(ctx.apiOpen(tk,'2026-11-15','day','')); A([ob.index.subs.length===1 && ob.index.subs[0].status==='submitted','index sub (cache invalidated)']);
A([ob.subs[0].photos[0].img==='' && ob.subs[0].photos[0].fileId,'bundle has no image data']);
const im = J(ctx.apiImages(tk,[ob.subs[0].photos[0].fileId])); A([Object.values(im)[0].startsWith('data:image/jpeg'),'apiImages']);
const obK = J(ctx.apiOpen(tkK,'2026-11-16','my','')); A([obK.prev && obK.prev.date==='2026-11-15' && obK.prev.subs.length===1,'prev day in bundle']);

// chot accepts + lock
sub.status='accepted'; ctx.apiSaveSub(tk, JSON.stringify(sub));
threw=false; try{ ctx.apiSaveSub(tkK, JSON.stringify(Object.assign({},sub,{status:'draft'}))); }catch(e){threw=true;} A([threw,'KS cannot edit accepted']);
const rep = { date:'2026-11-15', status:'locked', version:1, lockedBy:'uA', weather:{am:'Nắng',pm:'',temp:''}, manpower:[{title:'CN',qty:5}], equipment:[], materials:[{name:'Thép',spec:'',unit:'t',qty:2}], safety:{summary:'ok',issues:[]},
  layout:{img, fileId:'', caption:'mb'}, extraPhotos:[], tasks:sub.tasks, plans:[], inspections:[], inspectionPlans:[], tests:[], photos:[{fileId:r.photos[0], caption:'a', by:'uK'}] };
r = J(ctx.apiSaveReport(tk, JSON.stringify(rep))); A([r.layout,'layout uploaded']);
A([sheets.CongViec.data.length===2 && sheets.CongViec.data[1][3]==='Zone A','CongViec row w/ zone (written on lock)']);
rep.status='locked'; ctx.apiSaveReport(tk, JSON.stringify(Object.assign({},rep,{layout:{fileId:r.layout,caption:'mb'}}))); A([sheets.CongViec.data.length===2,'re-lock replaces rows, no dup']);
A([sheets.BaoCao.data.length===2,'BaoCao single row upsert']);
A([sheets.HinhAnh.data.length===3,'HinhAnh rows (layout+photo)']);
threw=false; try{ ctx.apiSaveSub(tk, JSON.stringify(sub)); }catch(e){threw=/chốt/.test(e.message);} A([threw,'locked day blocks sub save']);
A([J(ctx.apiPeriod(tkK,'2026-11-01','2026-11-30','')).reports.length===1,'period range']);
A([JSON.parse(sheets.BaoCao.data[1][14]).layout.img==='','json stripped imgs']);
const url = ctx.apiExportPdf(tk,'<img src="fid:'+r.layout+'">','BCN_TST_2026-11-15.pdf','2026-11-15','day'); A([sheets.BaoCao.data[1][12]===url,'pdf url saved']);
ctx.apiSavePeriod(tk, JSON.stringify({key:'W-2026-11-09',kind:'week',from:'2026-11-09',to:'2026-11-15',evaluation:'Đạt'})); A([J(ctx.apiPeriod(tkK,'2026-11-09','2026-11-15','W-2026-11-09')).manual.evaluation==='Đạt','period manual']);
A([sheets.NhatKy.data.length>3,'audit log rows: '+(sheets.NhatKy.data.length-1)]);
const arch = ctx.apiResetAll(tk); A([arch.includes('LƯU TRỮ_TST'),'reset archive']);
A([ctx.apiPublicConfig()===null && sheets.BaoCao.data.length===1,'reset cleared']);
threw=false; try{ ctx.apiOpen(tk,'','day',''); }catch(e){threw=/AUTH/.test(e.message);} A([threw,'tokens revoked']);
A([J(ctx.apiSetup(JSON.stringify(cfg),'5678')).token,'setup again after reset']);

const g = ctx.doGet(); A([g.html.includes('"config"'),'doGet embeds boot']);
