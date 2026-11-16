const { ctx: C, sheets, files, props, cacheStore, shared } = require('./gasmock.js');
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
  layouts:[{img, fileId:'', caption:'mb'},{img, fileId:'', caption:'mb2'}], extraPhotos:[], tasks:sub.tasks, plans:[], inspections:[], inspectionPlans:[], tests:[], photos:[{fileId:r.photos[0], caption:'a', by:'uK'}] };
r = J(ctx.apiSaveReport(tk, JSON.stringify(rep))); A([r.layouts && r.layouts.length===2 && r.layouts.every(Boolean),'2 ảnh mặt bằng tải lên']); r.layout = r.layouts[0];
A([sheets.CongViec.data.length===2 && sheets.CongViec.data[1][3]==='Zone A','CongViec row w/ zone (written on lock)']);
rep.status='locked'; ctx.apiSaveReport(tk, JSON.stringify(Object.assign({},rep,{layouts:r.layouts.map((f,i)=>({fileId:f,caption:'mb'+i}))}))); A([sheets.CongViec.data.length===2,'re-lock replaces rows, no dup']);
A([sheets.BaoCao.data.length===2,'BaoCao single row upsert']);
A([sheets.HinhAnh.data.length===4,'HinhAnh rows (2 mặt bằng + 1 ảnh)']);
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
A([JSON.parse(sheets.BaoCao.data[1][14]).layouts.every(l=>l.img===''),'json stripped imgs']);
const url = ctx.apiExportPdf(tk,'<img src="fid:'+r.layout+'">','20261115-TST-Daily Report.pdf','2026-11-15','day'); A([sheets.BaoCao.data[1][12]===url,'pdf url saved']);
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
  A([/\/exec\?v=[0-9A-F]{4}-[0-9A-F]{4}$/.test(ok3.url), 'link QR trỏ trang xác thực bản /exec: ' + ok3.url]);
  A([Object.values(files).some(f => f.name === 'a.pdf' && !f.trashed && f.sharing === 'ANYONE_WITH_LINK/VIEW'), 'PDF ngày chia sẻ: ai có link đều xem được']);
  const vv = J(ctx.apiVerify(tk, ok3.code)); A([vv.ok === 'current' && /drive/.test(vv.pdf) && vv.date === d && vv.project === 'TST', 'xác thực trả link PDF, ngày, dự án']);
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
// ===== Thư mục lưu PDF =====
(() => {
  let err = ''; try { ctx.apiCheckFolder(tk, 'abc'); } catch (e) { err = e.message; } A([/Link không hợp lệ/.test(err), 'link thư mục sai']);
  err = ''; try { ctx.apiCheckFolder(tk, 'https://drive.google.com/drive/folders/NOACCESSFOLDER'); } catch (e) { err = e.message; } A([/Người chỉnh sửa/.test(err), 'thư mục không có quyền']);
  const f = J(ctx.apiCheckFolder(tk, 'https://drive.google.com/drive/folders/SHAREDFOLDER01?usp=sharing')); A([f.id === 'SHAREDFOLDER01' && f.name === 'CN8-2 Shared', 'kiểm tra thư mục chia sẻ: ' + f.name]);
  const c5 = J(ctx.apiPublicConfig()); c5.settings = Object.assign({}, c5.settings, { pdfFolderId: f.id, pdfFolderName: f.name, requireReview: false }); ctx.apiSaveConfig(tk, JSON.stringify(c5));
  ctx.apiSaveReport(tk, JSON.stringify(Object.assign({}, rep, { date: '2026-11-25', status: 'locked', version: 1, tasks: [], plans: [], photos: [], layout: { caption: '' } })));
  ctx.apiExportPdf(tk, '<p>x</p>', '20261125-TST-Daily Report.pdf', '2026-11-25', 'day');
  const day = shared.kids['Báo cáo ngày'], mon = day && day.kids['2026-11'];
  A([mon && mon.files.some(i => files[i].name === '20261125-TST-Daily Report.pdf'), 'PDF ngày lưu vào <thư mục dự án>/Báo cáo ngày/2026-11']);
  ctx.apiExportPdf(tk, '<p>x</p>', 'BCT.pdf', 'W-2026-11-23', 'week'); A([shared.kids['Báo cáo tuần'] && shared.kids['Báo cáo tuần'].files.length === 1, 'PDF tuần lưu vào Báo cáo tuần']);
  const c6 = J(ctx.apiPublicConfig()); c6.settings.pdfFolderId = 'NOACCESSFOLDER'; ctx.apiSaveConfig(tk, JSON.stringify(c6));
  err = ''; try { ctx.apiExportPdf(tk, '<p>x</p>', 'x.pdf', '2026-11-25', 'day'); } catch (e) { err = e.message; } A([/thư mục lưu PDF/.test(err), 'thư mục mất quyền → báo lỗi rõ']);
})();
// ===== Đợt 5: chống ghi đè, phiên đăng nhập, nhiều ảnh mặt bằng =====
(() => {
  const d = '2026-11-27', base = { key: d + '|uK', date: d, uid: 'uK', status: 'draft', tasks: [], plans: [], inspections: [], inspectionPlans: [], tests: [], photos: [], note: '' };
  let r1 = J(ctx.apiSaveSub(tkK, JSON.stringify(Object.assign({}, base, { baseRev: 0 })))); A([r1.rev === 1, 'phiếu mới: rev 1']);
  let r2 = J(ctx.apiSaveSub(tkK, JSON.stringify(Object.assign({}, base, { note: 'máy A', baseRev: 1 })))); A([r2.rev === 2, 'lưu tiếp đúng baseRev: rev 2']);
  let err = ''; try { ctx.apiSaveSub(tkK, JSON.stringify(Object.assign({}, base, { note: 'máy B cũ', baseRev: 1 }))); } catch (e) { err = e.message; }
  A([/^CONFLICT\|.+\|KS1$/.test(err), 'máy B mở bản cũ → bị chặn ghi đè: ' + err]);
  A([J(ctx.apiOpen(tkK, d, 'my', '')).subs[0].note === 'máy A', 'dữ liệu máy A không bị mất']);
  const r3 = J(ctx.apiSaveSub(tkK, JSON.stringify(Object.assign({}, base, { note: 'máy B', baseRev: 1, force: true })))); A([r3.rev === 3, 'chọn “Giữ bản của tôi” → ghi đè được']);
  // báo cáo ngày + TVGS
  const c7 = J(ctx.apiPublicConfig()); c7.settings = Object.assign({}, c7.settings, { requireReview: true, pdfFolderId: '' }); if (!c7.users.some(u => u.role === 'tvgs')) c7.users.push({ id: 'uT5', name: 'TV5', role: 'tvgs', active: true });
  ctx.apiSaveConfig(tk, JSON.stringify(c7)); const tv = c7.users.find(u => u.role === 'tvgs'); ctx.apiSetPin(tk, tv.id, '4545'); const tkT = J(ctx.apiLogin(tv.id, '4545')).token;
  const rp = Object.assign({}, rep, { date: d, status: 'locked', version: 1, tasks: [], plans: [], photos: [], layouts: [], baseRev: 0 });
  const s1 = J(ctx.apiSaveReport(tk, JSON.stringify(rp))); A([s1.rev === 1, 'báo cáo: rev 1']);
  const rv = J(ctx.apiReview(tkT, d, 'approve')); const cur = J(ctx.apiOpen(tk, d, 'day', '')).report;
  A([cur.rev === 2, 'TVGS xác nhận cũng tăng rev']); A([J(ctx.apiVerify(tk, rv.code)).ok === 'current', 'mã xác thực không phụ thuộc rev']);
  err = ''; try { ctx.apiSaveReport(tk, JSON.stringify(Object.assign({}, rp, { status: 'draft', baseRev: 1 }))); } catch (e) { err = e.message; } A([/^CONFLICT/.test(err), 'người chốt mở bản trước khi TVGS xác nhận → bị chặn']);
  // ảnh mặt bằng: dữ liệu cũ (1 ảnh) tự chuyển
  const o = J(ctx.apiSaveReport(tk, JSON.stringify(Object.assign({}, rep, { date: '2026-11-28', status: 'draft', tasks: [], plans: [], photos: [], layouts: undefined, layout: { img, fileId: '', caption: 'cũ' } }))));
  A([o.layouts.length === 1 && o.layouts[0], 'bản cũ “layout” → layouts[1 ảnh]']);
  A([!('layout' in J(ctx.apiOpen(tk, '2026-11-28', 'day', '')).report), 'không còn trường layout cũ']);
  // phiên đăng nhập
  const exp = t => J(props['tok_' + t]).exp - Date.now();
  const tA = J(ctx.apiLogin('uA', '1234', '', false)).token, tA7 = J(ctx.apiLogin('uA', '1234', '', true)).token, tK30 = J(ctx.apiLogin('uK', '1111', '', true)).token;
  A([exp(tA) <= 12 * 3600e3 && exp(tA) > 11 * 3600e3, 'không ghi nhớ: phiên 12 giờ']);
  A([Math.round(exp(tA7) / 864e5) === 7, 'Quản trị ghi nhớ: tối đa 7 ngày']); A([Math.round(exp(tK30) / 864e5) === 30, 'Kỹ sư ghi nhớ: 30 ngày']);
  A([J(ctx.apiOpen(tA, d, 'day', '')).others >= 1, 'cùng tài khoản mở ở nơi khác → báo others']);
})();
console.log('Đợt 5: xong');
const arch = ctx.apiResetAll(tk); A([arch.includes('LƯU TRỮ_TST'),'reset archive']);
A([ctx.apiPublicConfig()===null && sheets.BaoCao.data.length===1,'reset cleared']);
threw=false; try{ ctx.apiOpen(tk,'','day',''); }catch(e){threw=/AUTH/.test(e.message);} A([threw,'tokens revoked']);
A([J(ctx.apiSetup(JSON.stringify(cfg),'5678')).token,'setup again after reset']);

const g = ctx.doGet(); A([g.html.includes('"config"'),'doGet embeds boot']);

