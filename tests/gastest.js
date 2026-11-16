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
A([ob.links && ob.links.sheet.includes('spreadsheets') && ob.links.folder,'admin gets Sheet + Drive folder links']);
A([!J(ctx.apiOpen(tkK,'2026-11-15','my','')).links,'KS gets no links']);
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
// Đợt 2: cột so sánh KH + kỳ gồm ngày chưa chốt
const cvh = sheets.CongViec.data[0]; A([cvh.indexOf('chenh_lech')>0 && cvh.length===20,'CongViec header has new cols']);
const sub2 = { key:'2026-11-16|uK', date:'2026-11-16', uid:'uK', status:'submitted', tasks:[{zoneId:'z1',desc:'Đào',prevProgress:'50%',planToday:5,dayPct:3,progress:'53%',carried:true}], plans:[{zoneId:'z1',desc:'Đào',add:4,target:'57%'}], inspections:[], inspectionPlans:[], tests:[], photos:[], note:'' };
ctx.apiSaveSub(tkK, JSON.stringify(sub2));
const pr2 = J(ctx.apiPeriod(tkK,'2026-11-09','2026-11-22',''));
A([pr2.reports.length===1 && pr2.subs.length===1 && pr2.subs[0].date==='2026-11-16','period returns subs of unlocked days only']);
const rep2 = Object.assign({}, rep, {date:'2026-11-16', status:'locked', tasks:sub2.tasks.map(t=>Object.assign({by:'uK'},t)), plans:sub2.plans, photos:[], layout:{caption:''}});
ctx.apiSaveReport(tk, JSON.stringify(rep2));
const row = sheets.CongViec.data.find(r=>r[0]==='2026-11-16' && r[1]==='THUC_HIEN'); A([row && row[16]===5 && row[17]===3 && row[18]===-2,'CongViec KH/thực hiện/chênh lệch']);
const prow = sheets.CongViec.data.find(r=>r[0]==='2026-11-16' && r[1]==='KE_HOACH'); A([prow && prow[19]===4,'CongViec dự kiến làm thêm']);
A([J(ctx.apiPeriod(tkK,'2026-11-09','2026-11-22','')).subs.length===0,'locked day → no subs in period']);
A([JSON.parse(sheets.BaoCao.data[1][14]).layout.img==='','json stripped imgs']);
const url = ctx.apiExportPdf(tk,'<img src="fid:'+r.layout+'">','BCN_TST_2026-11-15.pdf','2026-11-15','day'); A([sheets.BaoCao.data[1][12]===url,'pdf url saved']);
ctx.apiSavePeriod(tk, JSON.stringify({key:'W-2026-11-09',kind:'week',from:'2026-11-09',to:'2026-11-15',evaluation:'Đạt'})); A([J(ctx.apiPeriod(tkK,'2026-11-09','2026-11-15','W-2026-11-09')).manual.evaluation==='Đạt','period manual']);
A([sheets.NhatKy.data.length>3,'audit log rows: '+(sheets.NhatKy.data.length-1)]);
// ===== Đợt 3: TVGS kiểm tra nội dung, mã xác thực, ngày thử, logo =====
(() => {
  const c3 = J(ctx.apiPublicConfig()); c3.users.push({ id:'uT', name:'TVGS', role:'tvgs', active:true }); ctx.apiSaveConfig(tk, JSON.stringify(c3)); ctx.__resetMemo && ctx.__resetMemo();
  ctx.apiSetPin(tk, 'uT', '3333'); const tkT = J(ctx.apiLogin('uT', '3333')).token;
  const d = '2026-11-20', base = Object.assign({}, rep, { date:d, status:'locked', version:1, tasks:[], plans:[], photos:[], layout:{caption:''} });
  ctx.apiSaveReport(tk, JSON.stringify(base));
  let r = J(ctx.apiOpen(tk, d, 'day')).report;
  A([r.review && r.review.status === 'pending', 'chốt khi có TVGS → chờ kiểm tra']);
  let err = ''; try { ctx.apiExportPdf(tk, '<p>x</p>', 'a.pdf', d, 'day'); } catch (e) { err = e.message; }
  A([/TVGS/.test(err), 'chưa xác nhận → chặn xuất PDF']);
  err = ''; try { ctx.apiReview(tk.replace(/./,'x'), d, 'approve'); } catch (e) { err = e.message; } A([/AUTH/.test(err), 'review cần đăng nhập']);
  const kId = J(ctx.apiLogin('uK','1111')).token; err = ''; try { ctx.apiReview(kId, d, 'approve'); } catch (e) { err = e.message; } A([/quyền/.test(err), 'kỹ sư không xác nhận được']);
  err = ''; try { ctx.apiReview(tkT, d, 'return', ''); } catch (e) { err = e.message; } A([/Ghi rõ/.test(err), 'yêu cầu sửa bắt buộc ghi chú']);
  const ret = J(ctx.apiReview(tkT, d, 'return', 'Sai nhân lực'));
  r = J(ctx.apiOpen(tk, d, 'day')).report; A([ret.status === 'returned' && r.status === 'draft' && r.review.note === 'Sai nhân lực', 'TVGS yêu cầu sửa → mở lại cho nhà thầu']);
  const idx3 = J(ctx.apiOpen(tk, d, 'day')).index; A([idx3.reports.find(x=>x.date===d).review === 'returned', 'index có trạng thái TVGS']);
  ctx.apiSaveReport(tk, JSON.stringify(Object.assign({}, r, { status:'locked', version:2, review:{ status:'approved', code:'GIAM-AO00' } })));
  r = J(ctx.apiOpen(tk, d, 'day')).report; A([r.review.status === 'pending' && r.review.lastNote === 'Sai nhân lực', 'chốt lại → chờ kiểm tra lại; giao diện không tự đặt “đã xác nhận”']);
  const ok3 = J(ctx.apiReview(tkT, d, 'approve')); A([/^[0-9A-F]{4}-[0-9A-F]{4}$/.test(ok3.code), 'xác nhận → mã xác thực ' + ok3.code]);
  A([typeof ctx.apiExportPdf(tk, '<p>x</p>', 'a.pdf', d, 'day') === 'string', 'đã xác nhận → xuất PDF được']);
  A([J(ctx.apiVerify(tk, ok3.code.toLowerCase())).ok === 'current', 'tra mã: bản hiện hành']);
  err = ''; try { ctx.apiSaveReport(tk, JSON.stringify(Object.assign({}, r, { status:'locked', note:'sửa lén' }))); } catch (e) { err = e.message; } A([/mở khóa/.test(err), 'đã xác nhận → không sửa thẳng được']);
  ctx.apiSaveReport(tk, JSON.stringify(Object.assign({}, r, { status:'draft' })));
  A([J(ctx.apiVerify(tk, ok3.code)).ok === 'old' && J(ctx.apiOpen(tk, d, 'day')).report.review === null, 'mở khóa → hủy dấu; mã cũ báo “bản cũ”']);
  A([J(ctx.apiVerify(tk, '0000-0000')).ok === false, 'tra mã sai']);
  const bh = sheets.BaoCao.data[0]; A([bh.indexOf('ma_xac_thuc') > 0, 'BaoCao có cột mã xác thực']);
  // ngày thử
  const c4 = J(ctx.apiPublicConfig()); c4.settings = Object.assign({}, c4.settings, { testMode:true }); ctx.apiSaveConfig(tk, JSON.stringify(c4));
  ctx.apiSaveSub(kId, JSON.stringify({ key:'2027-01-05|uK', date:'2027-01-05', uid:'uK', status:'draft', tasks:[], plans:[], inspections:[], inspectionPlans:[], tests:[], testPlans:[{zoneId:'z1',desc:'Nén mẫu',time:'Chiều'}], photos:[] }));
  ctx.apiSaveSub(kId, JSON.stringify({ key:'2026-11-20|uK', date:'2026-11-20', uid:'uK', status:'draft', tasks:[], plans:[], inspections:[], inspectionPlans:[], tests:[], photos:[] }));
  const td = J(ctx.apiOpen(tk, '2027-01-05', 'day')).index.testDays; A([td.length === 1 && td[0] === '2027-01-05', 'chế độ thử: chỉ ngày chưa có dữ liệu mới là ngày thử']);
  A([ctx.apiClearTestDays(tk) === 1 && J(ctx.apiOpen(tk, '2027-01-05', 'day')).index.subs.every(x=>x.date !== '2027-01-05') && J(ctx.apiOpen(tk, '2026-11-20', 'day')).index.subs.some(x=>x.date === '2026-11-20'), 'xóa ngày thử, giữ ngày thật']);
  // logo
  const lid = ctx.apiSaveLogo(tk, 'client', 'data:image/png;base64,iVBORw0KGgo=', ''); A([!!lid, 'lưu logo lên Drive']);
  err = ''; try { ctx.apiSaveLogo(kId, 'client', 'data:image/png;base64,iVBORw0KGgo=', ''); } catch (e) { err = e.message; } A([/quyền/.test(err), 'chỉ Quản trị đổi logo']);
})();
console.log('Đợt 3: xong');
const arch = ctx.apiResetAll(tk); A([arch.includes('LƯU TRỮ_TST'),'reset archive']);
A([ctx.apiPublicConfig()===null && sheets.BaoCao.data.length===1,'reset cleared']);
threw=false; try{ ctx.apiOpen(tk,'','day',''); }catch(e){threw=/AUTH/.test(e.message);} A([threw,'tokens revoked']);
A([J(ctx.apiSetup(JSON.stringify(cfg),'5678')).token,'setup again after reset']);

const g = ctx.doGet(); A([g.html.includes('"config"'),'doGet embeds boot']);

