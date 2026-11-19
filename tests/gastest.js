const { ctx: C, sheets, files, props, cacheStore, shared, weekF, stats, ext, mkSS } = require('./gasmock.js');
const ctx = new Proxy(C, { get(o,k){ const f=o[k]; return typeof f==='function' && String(k).startsWith('api') ? (...a)=>{ o.__resetMemo(); return f(...a); } : f; } });
const A = (c)=>{ if(!c[0]) { console.log('FAIL', c[1]); process.exitCode=1; } else console.log('ok', c[1]); };
const J = s=>{ const o = JSON.parse(s); if (o && o.index && o.index.r) o.index = C.idxDec_(o.index); return o; };
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
  /* Đợt 9: ý kiến theo từng việc + gửi bổ sung + đánh dấu đã sửa */
  err = ''; try { ctx.apiReview(tkT, d, 'append', '', JSON.stringify([{ label:'x', text:'y' }])); } catch (e) { err = e.message; } A([/không còn ở trạng thái chờ/.test(err), 'chưa trả lại → không gửi bổ sung được']);
  const it1 = { id:'c1', scope:'S:uK', path:'tasks', ref:'t1', label:'Lắp đặt cốt thép dầm sàn GF', owner:'KS K', tags:['% chưa đúng'], pct:'3', note:'', text:'% chưa đúng – đề nghị 3%' };
  const ret = J(ctx.apiReview(tkT, d, 'return', 'Sai nhân lực', JSON.stringify([it1])));
  r = J(ctx.apiOpen(tk, d, 'day')).report; A([ret.status === 'returned' && r.status === 'draft' && r.review.note === 'Sai nhân lực', 'TVGS yêu cầu sửa → mở lại cho nhà thầu']);
  A([r.review.items.length === 1 && r.review.items[0].pct === '3' && r.review.items[0].path === 'tasks', 'Yêu cầu sửa kèm ý kiến theo từng việc (đề nghị %)']);
  const ap = J(ctx.apiReview(tkT, d, 'append', 'Bổ sung: thiếu ảnh', JSON.stringify([{ id:'c2', scope:'R', path:'materials', ref:'i0', label:'Thép D32', text:'Khối lượng chưa đúng' }])));
  r = J(ctx.apiOpen(tk, d, 'day')).report;
  A([ap.items.length === 2 && r.review.items.length === 2 && /Sai nhân lực\nBổ sung: thiếu ảnh/.test(r.review.note) && r.status === 'draft', 'Đã trả lại vẫn gửi bổ sung ý kiến được (cộng dồn)']);
  err = ''; try { ctx.apiReview(kId, d, 'append', 'x'); } catch (e) { err = e.message; } A([/quyền/.test(err), 'kỹ sư không gửi ý kiến TVGS được']);
  ctx.apiSaveReport(tk, JSON.stringify(Object.assign({}, r, { reviewFix: { c1: true }, review: { status:'approved' } })));
  r = J(ctx.apiOpen(tk, d, 'day')).report; A([r.review.status === 'returned' && r.review.items.length === 2 && r.reviewFix.c1 === true, 'Người chốt đánh dấu đã sửa; lưu không ghi đè ý kiến TVGS']);
  const idx3 = J(ctx.apiOpen(tk, d, 'day')).index; A([idx3.reports.find(x=>x.date===d).review === 'returned', 'index có trạng thái TVGS']);
  ctx.apiSaveReport(tk, JSON.stringify(Object.assign({}, r, { status:'locked', version:2, review:{ status:'approved', code:'GIAM-AO00' } })));
  r = J(ctx.apiOpen(tk, d, 'day')).report; A([r.review.status === 'pending' && /^Sai nhân lực/.test(r.review.lastNote), 'chốt lại → chờ kiểm tra lại; giao diện không tự đặt “đã xác nhận”']);
  A([r.review.lastItems.length === 2 && r.review.lastItems.find(x=>x.id==='c1').fixed === true && r.review.lastItems.find(x=>x.id==='c2').fixed === false && !r.reviewFix, 'Chốt lại → TVGS thấy ý kiến lần trước: dòng nào đã sửa / chưa sửa']);
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
  ctx.apiSavePeriod(tk, JSON.stringify({ v: 2, key: 'W-2026-11-20', kind: 'week', from: '2026-11-20', to: '2026-11-26', no: 35, status: 'locked', version: 1, overall: {}, tasks: [] }));
  ctx.apiExportPdf(tk, '<p>x</p>', 'BCT.pdf', 'W-2026-11-20', 'week'); A([shared.files.some(i => files[i].name === 'BCT.pdf') && !shared.kids['Báo cáo tuần'], 'PDF tuần lưu thẳng vào thư mục đã chọn (không thư mục con)']);
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
// ===== Tốc độ: bộ đệm ghi xuyên, chốt gộp nhận phiếu, đo tốc độ =====
(() => {
  const d = '2026-11-29', mk = (u, st) => ({ key: d + '|' + u, date: d, uid: u, status: st, tasks: [{ zoneId: 'z1', desc: 'Việc ' + u, progress: '10%', by: u }], plans: [], inspections: [], inspectionPlans: [], tests: [], photos: [], note: '' });
  ctx.apiSaveSub(tkK, JSON.stringify(Object.assign(mk('uK', 'submitted'), { baseRev: 0 })));
  ctx.apiOpen(tk, d, 'day', '');
  let r0 = stats.sheetReads; const b1 = J(ctx.apiOpen(tk, d, 'day', '')); A([stats.sheetReads === r0 && b1.subs[0].status === 'submitted', 'mở lại ngày: lấy từ bộ đệm, không đọc Sheet']);
  r0 = stats.sheetReads; ctx.apiSaveSub(tkK, JSON.stringify(Object.assign(mk('uK', 'draft'), { baseRev: 1, note: 'rút lại sửa' })));
  const lr = stats.sheetReads - r0; r0 = stats.sheetReads; const b2 = J(ctx.apiOpen(tk, d, 'day', ''));
  A([stats.sheetReads === r0 && b2.subs[0].note === 'rút lại sửa' && b2.index.subs.some(x => x.date === d && x.status === 'draft'), 'lưu xong: bộ đệm cập nhật ngay (mở lại không đọc Sheet), chỉ mục đúng trạng thái']);
  A([lr <= 3, 'lưu phiếu chỉ đọc Sheet ' + lr + ' lần (trước đây 6–8)']);
  ctx.apiSaveSub(tkK, JSON.stringify(Object.assign(mk('uK', 'submitted'), { baseRev: 2 })));
  const rp = Object.assign({}, rep, { date: d, status: 'locked', version: 1, tasks: [], plans: [], photos: [], layouts: [], baseRev: 0, acceptSubs: ['uK'] });
  const sr = J(ctx.apiSaveReport(tk, JSON.stringify(rp)));
  const b3 = J(ctx.apiOpen(tk, d, 'day', ''));
  A([sr.accepted.join() === 'uK' && sr.subRevs[0] === 4 && b3.subs[0].status === 'accepted' && b3.report.status === 'locked' && !('acceptSubs' in b3.report), 'chốt: nhận phiếu trong cùng 1 lần gọi']);
  A([sheets.PhieuKS.data.some(r => r[0] === d + '|uK' && r[5] === 'accepted'), 'Sheet PhieuKS ghi trạng thái đã nhận']);
  ctx.__resetMemo(); Object.keys(cacheStore).forEach(k => delete cacheStore[k]);
  const b4 = J(ctx.apiOpen(tk, d, 'day', '')); A([b4.subs[0].status === 'accepted' && b4.report.rev === sr.rev && b4.subs[0].rev === 4, 'xóa bộ đệm → đọc lại Sheet ra đúng như bộ đệm']);
  const pg = J(ctx.apiPing(tk, true)); A([pg.role === 'admin' && pg.total >= 0 && 'sheet' in pg, 'đo tốc độ (apiPing)']);
})();
console.log('Tốc độ: xong');
// ===== Nặng dần theo thời gian: chỉ mục gọn, ô 50.000 ký tự, TextFinder =====
(() => {
  const raw = JSON.parse(ctx.apiOpen(tk, '2026-11-15', 'day', '')).index;
  A([Array.isArray(raw.r) && Array.isArray(raw.s) && !raw.reports, 'chỉ mục gửi dạng gọn {r,s,t}']);
  const full = C.index_(); A([JSON.stringify(raw).length * 2 < JSON.stringify({ reports: full.reports, subs: full.subs }).length, 'chỉ mục gọn nhỏ hơn ≥2 lần: ' + JSON.stringify(raw).length + ' / ' + JSON.stringify({ reports: full.reports, subs: full.subs }).length]);
  const ks = JSON.parse(ctx.apiOpen(tkK, '2026-11-15', 'my', '')).index; A([ks.s.every(x => x[1] === 'uK'), 'kỹ sư chỉ nhận chỉ mục phiếu của mình']);
  // ngày rất lớn: báo cáo > 50.000 ký tự
  const d = '2026-11-30', long = 'x'.repeat(380);
  const big = Object.assign({}, rep, { date: d, status: 'draft', version: 0, layouts: [], photos: [], plans: [], baseRev: 0, tasks: Array.from({ length: 300 }, (_, i) => ({ zoneId: 'z1', desc: 'Việc ' + i + ' ' + long, progress: '10%', by: 'uK' })) });
  ctx.apiSaveReport(tk, JSON.stringify(big));
  const row = sheets.BaoCao.data.find(r => r[0] === d), H = sheets.BaoCao.data[0];
  A([row[H.indexOf('json')].length <= 45000 && String(row[H.indexOf('json_2')]).charAt(0) === '~' && row.every(v => String(v).length <= 50000), 'báo cáo > 50.000 ký tự: tự chia sang cột phụ, mỗi ô ≤ 50.000']);
  ctx.__resetMemo(); Object.keys(cacheStore).forEach(k => delete cacheStore[k]);
  const back = J(ctx.apiOpen(tk, d, 'day', '')).report; A([back.tasks.length === 300 && back.tasks[299].desc.endsWith(long), 'đọc lại ghép đủ 300 việc']);
  A([J(ctx.apiPeriod(tk, d, d, '')).reports[0].tasks.length === 300, 'báo cáo tuần đọc được ngày lớn']);
  let err = ''; try { ctx.apiSaveReport(tk, JSON.stringify(Object.assign({}, big, { baseRev: 1, tasks: Array.from({ length: 600 }, (_, i) => ({ zoneId: 'z1', desc: long, by: 'uK' })) }))); } catch (e) { err = e.message; }
  A([/quá lớn/.test(err), 'vượt 180.000 ký tự → báo lỗi rõ, không ghi hỏng']);
  // chốt ngày: tìm dòng bằng TextFinder, thay đúng dòng
  const f0 = stats.finds || 0; const nCV = sheets.CongViec.data.length;
  ctx.apiSaveReport(tk, JSON.stringify(Object.assign({}, rep, { date: '2026-11-15', status: 'locked', version: 3, baseRev: null, force: true, layouts: [] })));
  A([(stats.finds || 0) > f0 && sheets.CongViec.data.length === nCV, 'chốt lại: tìm dòng bằng TextFinder, không nhân đôi dòng']);
})();
console.log('Dung lượng: xong');
// ===== Báo cáo tuần (đợt 6A) =====
(() => {
  const c8 = J(ctx.apiPublicConfig()); c8.settings = Object.assign({}, c8.settings, { requireReview: true, pdfFolderId: 'SHAREDFOLDER01', pdfFolderName: 'CN8-2 Shared' });
  if (!c8.users.some(u => u.role === 'tvgs')) c8.users.push({ id: 'uT6', name: 'TV6', role: 'tvgs', active: true });
  ctx.apiSaveConfig(tk, JSON.stringify(c8)); const tv = c8.users.find(u => u.role === 'tvgs'); ctx.apiSetPin(tk, tv.id, '4646'); const tkT = J(ctx.apiLogin(tv.id, '4646')).token;
  const base = { v: 2, kind: 'week', key: 'W-2026-11-06', from: '2026-11-06', to: '2026-11-12', no: 34, status: 'draft', version: 1,
    overall: { plan: 10.47, actualPrev: 10.2, actual: 10.68, planNext: 10.92, rev: 'Rev02', note: '', eval: 'Đạt' }, ratings: { safety: 'mid', work: 'good', resource: 'good' },
    tasks: [{ section: 'XD', zoneId: 'z1', desc: 'Cột vách B1', unit: 'm3', qty: 50, startPct: 60, planPct: 80, actual: 100, note: '' }], nextPlans: [{ section: 'XD', zoneId: 'z1', desc: 'Sàn GF', add: 30, target: 50 }],
    manpower: [{ title: 'Thép', avg: 32, max: 34, total: 224 }], equipment: [{ name: 'Cẩu tháp', avg: 2, max: 2 }], materials: [{ name: 'Bê tông', spec: 'B50', unit: 'm3', prev: 693.5, now: 93 }, { sec: 'MEP', mode: 'lot', name: 'Ống UPVC', spec: 'Ống nước D27, D34', unit: 'm', date: '2026-11-11', note: '120 cây' }],
    matPlans: [], inspections: [{ date: '2026-11-07', desc: 'NT thép sàn', loc: 'Z2', result: 'Đạt' }], tests: [], inspPlans: [], safety: { summary: 'Ổn', activities: [{ date: '2026-11-06', desc: 'Toolbox' }], issues: [] },
    layouts: [], photos: [], gantt: [{ img, fileId: '', caption: 'Gantt 1' }], msp: null };
  let r = J(ctx.apiSavePeriod(tk, JSON.stringify(base)));
  A([r.ok && r.gantt[0], 'lưu tuần nháp: tải ảnh Gantt lên Drive']);
  { const r2 = J(ctx.apiSavePeriod(tk, JSON.stringify(Object.assign({}, base, { gantt: [{ fileId: r.gantt[0], caption: 'Gantt 1' }], layouts: [{ img, fileId: '', caption: 'MB thêm tay' }] }))));
    A([r2.ok && r2.layouts && r2.layouts[0] && !JSON.stringify(sheets.TongHopKy.data.find(x => x[0] === base.key) || []).includes('data:image'), 'lưu tuần: ảnh mặt bằng thêm tay tải lên Drive, không lưu ảnh vào bảng']); }
  { const r3 = J(ctx.apiSavePeriod(tk, JSON.stringify(Object.assign({}, base, { gantt: [{ fileId: r.gantt[0], caption: 'Gantt 1' }], photos: [{ img, fileId: '', caption: 'ảnh tự thêm', manual: true }] }))));
    A([r3.photos && r3.photos[0], 'lưu tuần: ảnh tiêu biểu tự thêm tải lên Drive']); }
  let err = ''; try { ctx.apiExportPdf(tk, '<p>x</p>', 'w.pdf', base.key, 'week'); } catch (e) { err = e.message; } A([/Chốt/.test(err), 'chưa chốt tuần → chặn xuất PDF']);
  r = J(ctx.apiSavePeriod(tk, JSON.stringify(Object.assign({}, base, { status: 'locked', gantt: [{ fileId: r.gantt[0], caption: 'Gantt 1' }] }))));
  A([r.review && r.review.status === 'pending', 'chốt tuần → chờ TVGS']);
  const td = sheets.Tuan_TienDo.data.find(x => x[0] === base.key), hd = sheets.Tuan_TienDo.data[0];
  { const hv = sheets.Tuan_VatTu.data[0], lo = sheets.Tuan_VatTu.data.find(x => x[0] === base.key && x[2] === 'LO_HANG'), nv = sheets.Tuan_VatTu.data.find(x => x[0] === base.key && x[2] === 'NHAP_VE');
    A([lo && lo[hv.indexOf('bo_mon')] === 'MEP' && lo[hv.indexOf('ngay_nhap')] === '2026-11-11' && lo[hv.indexOf('ghi_chu')] === '120 cây' && nv[hv.indexOf('bo_mon')] === 'XD', 'Tuan_VatTu: lô hàng MEP (ngày nhập, ghi chú), vật tư khối lượng ghi bộ môn']); }
  { const hc = sheets.Tuan_CongViec.data[0], r = sheets.Tuan_CongViec.data.find(x => x[0] === base.key && x[2] === 'KE_HOACH_TUAN_SAU');
    A([hc[hc.length - 1] === 'du_kien_tuan' && r[hc.indexOf('du_kien_tuan')] === 30 && r[hc.indexOf('kh_pct')] === 50, 'Tuan_CongViec: cột cuối du_kien_tuan = % dự kiến trong tuần, kh_pct = lũy kế dự kiến']); }
  A([td && td[hd.indexOf('thuc_te')] === 10.68 && td[hd.indexOf('kh_tuan_sau')] === 10.92 && td[hd.indexOf('chenh_lech')] === 0.21 && td[hd.indexOf('an_toan')] === 'Trung bình', 'Tuan_TienDo: KH, thực tế, chênh lệch, xếp loại']);
  A([sheets.Tuan_CongViec.data.filter(x => x[0] === base.key).length === 2 && sheets.Tuan_VatTu.data.some(x => x[0] === base.key && x[8] === 786.5) && sheets.Tuan_NhanLuc.data.some(x => x[0] === base.key && x[3] === 'Thép') && sheets.Tuan_AnToan.data.some(x => x[0] === base.key && x[2] === 'HOAT_DONG'), 'Tuan_CongViec / VatTu (lũy kế) / NhanLuc / AnToan ghi khi chốt']);
  err = ''; try { ctx.apiExportPdf(tk, '<p>x</p>', 'w.pdf', base.key, 'week'); } catch (e) { err = e.message; } A([/TVGS/.test(err), 'chưa TVGS xác nhận → chặn xuất PDF tuần']);
  err = ''; try { ctx.apiReviewPeriod(tkT, base.key, 'return', ''); } catch (e) { err = e.message; } A([/Ghi rõ/.test(err), 'TVGS trả lại phải ghi chú']);
  { /* Đợt 9 – báo cáo tuần: ý kiến theo từng dòng, gửi bổ sung, đánh dấu đã sửa, chốt lại */
    let e2 = ''; try { ctx.apiReviewPeriod(tkT, base.key, 'append', 'x'); } catch (e) { e2 = e.message; } A([/không còn ở trạng thái chờ/.test(e2), 'Tuần chưa trả lại → không gửi bổ sung được']);
    const w1 = J(ctx.apiReviewPeriod(tkT, base.key, 'return', '', JSON.stringify([{ id:'w1', scope:'W', path:'overall', ref:'i0', label:'Tiến độ tổng', text:'% chưa đúng – đề nghị 10.5%', pct:'10.5' }])));
    A([w1.status === 'returned' && w1.items.length === 1 && ctx.weekGet_(base.key).status === 'draft', 'TVGS trả tuần kèm ý kiến theo dòng (không cần ghi chú chung)']);
    const w2 = J(ctx.apiReviewPeriod(tkT, base.key, 'append', 'Bổ sung ảnh', JSON.stringify([{ id:'w2', scope:'W', path:'tasks', ref:'i0', label:'Cột vách B1', text:'Khối lượng chưa đúng' }])));
    A([w2.items.length === 2 && /Bổ sung ảnh/.test(w2.note), 'Tuần: gửi bổ sung ý kiến cộng dồn']);
    J(ctx.apiSavePeriod(tk, JSON.stringify(Object.assign({}, base, { status: 'draft', version: 2, reviewFix: { w1: true }, review: { status: 'approved' }, gantt: [{ fileId: r.gantt[0], caption: 'Gantt 1' }] }))));
    const wk = ctx.weekGet_(base.key);
    A([(wk.review || {}).status === 'returned' && (wk.review.items || []).length === 2, 'Tuần: người chốt lưu không ghi đè ý kiến TVGS']);
    const rl = J(ctx.apiSavePeriod(tk, JSON.stringify(Object.assign({}, base, { status: 'locked', version: 2, reviewFix: { w1: true }, gantt: [{ fileId: r.gantt[0], caption: 'Gantt 1' }] }))));
    A([rl.review.status === 'pending' && rl.review.lastItems.length === 2 && rl.review.lastItems.find(x => x.id === 'w1').fixed === true && rl.review.lastItems.find(x => x.id === 'w2').fixed === false, 'Tuần chốt lại → TVGS thấy ý kiến lần trước: đã sửa / chưa sửa']); }
  const rv = J(ctx.apiReviewPeriod(tkT, base.key, 'approve'));
  A([rv.status === 'approved' && /^[0-9A-F]{4}-[0-9A-F]{4}$/.test(rv.code), 'TVGS xác nhận tuần: mã ' + rv.code]);
  const vf = J(ctx.apiVerify(tk, rv.code)); A([vf.ok === 'current' && vf.kind === 'week' && vf.no === 34 && vf.date === '2026-11-12', 'tra mã: báo cáo tuần 34']);
  r = J(ctx.apiSavePeriod(tk, JSON.stringify(Object.assign({}, base, { status: 'locked', note: 'ghi đè' })))); A([r.noop && r.review.status === 'approved', 'tuần đã chốt: lưu lại không ghi đè, giữ xác nhận TVGS']);
  const url = ctx.apiExportPdf(tk, '<p>x</p>', '20261112-TST-VC-WR-34-Weekly report and Tracking MSP(checked).pdf', base.key, 'week');
  const fid = shared.files.find(i => files[i].name.indexOf('WR-34') > 0);
  A([fid && files[fid].sharing === 'ANYONE_WITH_LINK/VIEW' && sheets.TongHopKy.data.some(x => x[0] === base.key && x[5] === url), 'xuất PDF tuần: thư mục đã chọn, ai có link xem được, ghi link vào TongHopKy']);
  { const c9 = J(ctx.apiPublicConfig()); c9.settings = Object.assign({}, c9.settings, { weekFolderId: 'WEEKFOLDER01', weekFolderName: 'CN8-2 Weekly' }); ctx.apiSaveConfig(tk, JSON.stringify(c9));
    ctx.apiExportPdf(tk, '<p>x</p>', '20261112-TST-VC-WR-34b.pdf', base.key, 'week');
    A([weekF.files.some(i => files[i].name.indexOf('WR-34b') > 0) && !shared.files.some(i => files[i].name.indexOf('WR-34b') > 0), 'chọn thư mục riêng cho báo cáo tuần → PDF tuần lưu vào đó']);
    c9.settings.weekFolderId = ''; ctx.apiSaveConfig(tk, JSON.stringify(c9)); }
  const pw = J(ctx.apiPeriod(tk, '2026-11-13', '2026-11-19', 'W-2026-11-13')).prevWeek;
  A([pw && pw.no === 34 && pw.overall.planNext === 10.92 && pw.nextPlans[0].target === 50, 'mở tuần sau: trả kèm báo cáo tuần trước']);
  r = J(ctx.apiSavePeriod(tk, JSON.stringify(Object.assign({}, base, { status: 'draft', version: 2 })))); A([!r.review.status && ctx.apiVerify(tk, rv.code) && J(ctx.apiVerify(tk, rv.code)).ok !== 'current', 'mở khóa tuần → mã cũ không còn là bản hiện hành']);
  const up = J(ctx.apiUploadFile(tk, 'data:application/pdf;base64,' + Buffer.from('%PDF-1.4').toString('base64'), 'MSP Rev02.pdf'));
  A([up.fileId && files[up.fileId].sharing === 'ANYONE_WITH_LINK/VIEW', 'tải PDF MS Project lên Drive, ai có link xem được']);
})();
console.log('Báo cáo tuần: xong');
// ===== Hồ sơ đệ trình (B.3) + văn bản (B.4) từ sổ theo dõi =====
(() => {
  const H1 = ['Date ', 'MC Code', 'Description', 'Submission Count', 'MC planned Date', 'Returned Date', 'DSPCONS Date', 'To PMH Date', 'PMH approved', 'SPM Date', 'Status', 'Checked by', 'Comment', 'Comment link '];
  const top = [['', 'Total submission'], ['', 55], ['DỰ ÁN: CN8-2 SỔ THEO DÕI TRÌNH DUYỆT'], ['Người lập:'], ['Ghi chú: ...'], ['']];
  ext.REGSHEET01234567890123 = mkSS('CN8-2_Follow-up', {
    DS: top.concat([H1,
      [new Date('2026-11-07T00:00:00'), 'CN8-2/VC/Civil/DS/40', 'HSNL thầu phụ hồ bơi\nPool contractor', 1, '', '', '', '', '', '', '', '', '', 'https://drive/x'],   // trình trong tuần, chờ
      ['09/11/26', 'CN8-2/VC/Civil/DS/41', 'Biện pháp cốp pha bể', 2, '', '', '10/11/26', '10/11/26', '11/11/26', '', 'B/A', '', '', ''],                          // trình + duyệt trong tuần
      ['20/10/26', 'CN8-2/VC/Civil/DS/30', 'Hồ sơ cũ có kết quả trong tuần', 1, '', '', '08/11/26', '', '', '', 'C', '', '', ''],                                  // cũ, trả về trong tuần
      ['15/10/26', 'CN8-2/VC/Civil/DS/20', 'Hồ sơ cũ đã duyệt', 1, '', '', '18/10/26', '', '20/10/26', '', 'A/A', '', '', ''],                                     // cũ, không đổi → bỏ
      ['10/11/26', 'CN8-2/VC/Civil/DS/42', 'Hồ sơ hủy', 1, '', '', '', '', '', '', 'hủy hồ sơ', '', '', '']]),                                                    // hủy → bỏ
    'SDW-MEP': top.concat([['Date file', 'MC Code', 'Description', 'DSPCONS Date File', 'Vicons (Hard copy)', 'Returned Date', 'DSPCONS Date (Hard copy)', 'To PMH Date (Hard copy)', 'PMH approved (Hard copy)', 'SPM Date', 'Status'],
      ['12/11/26', 'CN8-2/VC/MEP/SDW/50', 'Mặt bằng sleeve hầm B1', '12/11/26', '', '', '12/11/26', '', '', '', '']]),
    SI: top.slice(2).concat([['Date ', 'MC Code', 'Description', 'Returned Date', 'DSPCONS Date', 'To PMH Date', 'PMH approved', 'SPM Date', 'Status'],
      ['11/11/2026', 'CN8-2/DSPC/VC/SI.40', 'Chỉ thị an toàn điện'], ['01/10/2026', 'CN8-2/DSPC/VC/SI.30', 'Chỉ thị cũ']]),
    Notes: [['ghi chú tự do']] });
  let err = ''; try { ctx.apiCheckRegister(tk, 'https://docs.google.com/spreadsheets/d/NOPE'); } catch (e) { err = e.message; } A([/Link không hợp lệ|quyền/.test(err), 'link sổ sai / không có quyền → báo rõ']);
  const r = J(ctx.apiCheckRegister(tk, 'https://docs.google.com/spreadsheets/d/REGSHEET01234567890123/edit?gid=336890647'));
  const ty = {}; r.tabs.forEach(t => ty[t.name] = t.type);
  A([r.name === 'CN8-2_Follow-up' && ty.DS === 'sub' && ty['SDW-MEP'] === 'sub' && ty.SI === 'doc' && ty.Notes === 'off', 'nhận trang tính: DS/SDW-MEP = hồ sơ, SI = văn bản, trang khác bỏ qua']);
  const c9 = J(ctx.apiPublicConfig()); c9.settings.register = { id: r.id, name: r.name, url: r.url, tabs: r.tabs }; ctx.apiSaveConfig(tk, JSON.stringify(c9));
  const w = J(ctx.apiRegisterWeek(tk, '2026-11-06', '2026-11-12')), by = {}; w.subs.forEach(x => by[x.code] = x);
  A([w.subs.length === 4 && !by['CN8-2/VC/Civil/DS/20'] && !by['CN8-2/VC/Civil/DS/42'], 'B.3: chỉ hồ sơ phát sinh trong tuần (bỏ hồ sơ cũ không đổi, bỏ hồ sơ hủy): ' + w.subs.map(x => x.code).join(', ')]);
  A([by['CN8-2/VC/Civil/DS/40'].st === 'pending' && by['CN8-2/VC/Civil/DS/40'].date === '2026-11-07' && by['CN8-2/VC/Civil/DS/40'].desc === 'HSNL thầu phụ hồ bơi', 'ô ngày kiểu Date + mô tả 2 dòng lấy dòng đầu → Chờ duyệt']);
  A([by['CN8-2/VC/Civil/DS/41'].st === 'approved' && by['CN8-2/VC/Civil/DS/30'].st === 'returned' && by['CN8-2/VC/Civil/DS/30'].resDate === '2026-11-08', 'B/A → Đã duyệt; hồ sơ cũ C có kết quả trong tuần → Trả về chỉnh sửa']);
  A([by['CN8-2/VC/MEP/SDW/50'].st === 'review' && by['CN8-2/VC/MEP/SDW/50'].group === 'MEP', 'MEP: TVGS đã nhận, chưa có kết quả → TVGS đang kiểm tra']);
  A([w.docs.length === 1 && w.docs[0].code === 'CN8-2/DSPC/VC/SI.40', 'B.4: văn bản phát hành trong tuần']);
  const wk = { v: 2, kind: 'week', key: 'W-2026-10-30', from: '2026-10-30', to: '2026-11-05', no: 33, status: 'locked', version: 1, overall: {}, tasks: [], submittals: w.subs, docs: w.docs };
  const c10 = J(ctx.apiPublicConfig()); c10.settings.requireReview = false; ctx.apiSaveConfig(tk, JSON.stringify(c10));
  ctx.apiSavePeriod(tk, JSON.stringify(wk));
  A([sheets.Tuan_HoSo.data.filter(x => x[0] === wk.key).length === 5 && sheets.Tuan_HoSo.data.some(x => x[0] === wk.key && x[9] === 'Đã duyệt'), 'chốt tuần ghi bảng Tuan_HoSo (hồ sơ + văn bản)']);
})();
console.log('Hồ sơ đệ trình: xong');
const arch = ctx.apiResetAll(tk); A([arch.includes('LƯU TRỮ_TST'),'reset archive']);
A([ctx.apiPublicConfig()===null && sheets.BaoCao.data.length===1,'reset cleared']);
threw=false; try{ ctx.apiOpen(tk,'','day',''); }catch(e){threw=/AUTH/.test(e.message);} A([threw,'tokens revoked']);
A([J(ctx.apiSetup(JSON.stringify(cfg),'5678')).token,'setup again after reset']);

const g = ctx.doGet(); A([g.html.includes('"config"'),'doGet embeds boot']);


// Apps Script tự xóa chú thích /* … */ và // khi phục vụ trang, nhưng nhận diện chuỗi sai (nhất là chuỗi `…`) →
// trong khối JS không được có "/*" hay "://" nằm trong chuỗi (vd. accept="image/*", "https://…"); ghi image/\* và https:\/\/
{ const src = require('fs').readFileSync(__dirname + '/../apps-script/Index.html', 'utf8');
  const js = src.slice(src.lastIndexOf('<script>')).split('\n');
  const bad = js.filter(l => /:\/\//.test(l) || /['"`=][^'"`]*\/\*/.test(l));
  A([bad.length === 0, 'không có "/*" hay "://" trong chuỗi JS (GAS cắt nhầm): ' + bad.map(l=>l.trim().slice(0,60)).join(' | ')]); }

// ===== Đợt 6E: đổi tên thư mục dữ liệu + tự dọn ảnh cũ =====
(() => {
  const { root } = require('./gasmock.js');
  const code = J(ctx.apiPublicConfig()).project.code;
  Object.keys(root.kids).forEach(k => { if (root.kids[k].name.indexOf(code) > 0) delete root.kids[k]; });
  const oldF = root.createFolder('Báo cáo ngày – ' + code); oldF.files.push('OLDMARK');
  C.__resetMemo(); const f = C.rootFolder_();
  A([f === oldF && f.getName() === 'Dữ liệu báo cáo ' + code, 'thư mục cũ "Báo cáo ngày – mã" tự đổi tên thành "Dữ liệu báo cáo mã", giữ nội dung']);
  const mk = n => f.createFile({ name: n }).getId();
  const a1 = mk('old1.jpg'), a2 = mk('old2.jpg'), mb = mk('mb.jpg'), u1 = mk('unl.jpg'), r1 = mk('recent.jpg');
  const BW = sheets.BaoCao.data[0].length, row = (d, st, pdf) => { const x = Array(BW).fill(''); x[0] = d; x[1] = st; x[SCHEMA_IDX_PDF] = pdf; return x; };
  const SCHEMA_IDX_PDF = sheets.BaoCao.data[0].indexOf('pdf_url');
  sheets.BaoCao.data.push(row('2026-01-05', 'locked', 'https://pdf/1'), row('2026-01-06', 'draft', ''), row('2026-11-10', 'locked', 'https://pdf/2'));
  const HW = sheets.HinhAnh.data[0].length, hi = sheets.HinhAnh.data[0].indexOf('file_id'), h = (d, src, id) => { const x = Array(HW).fill(''); x[0] = d; x[1] = src; x[hi] = id; return x; };
  sheets.HinhAnh.data.push(h('2026-01-05', 'Người chốt', a1), h('2026-01-05', 'KS A', a2), h('2026-01-05', 'MAT_BANG', mb), h('2026-01-06', 'KS A', u1), h('2026-11-10', 'MAT_BANG', mb), h('2026-11-10', 'KS A', r1));
  C.__resetMemo(); props['CLEAN_UPTO'] = ''; const n = C.cleanOld_(25000, '2026-11-17T10:00:00+07:00');
  A([files[a1].trashed && files[a2].trashed && n >= 2, 'tự dọn: ảnh ngày quá 3 tháng, đã chốt + xuất PDF → thùng rác (' + n + ' file)']);
  A([!files[mb].trashed && !files[u1].trashed && !files[r1].trashed, 'tự dọn: giữ ảnh mặt bằng còn kế thừa, ngày chưa chốt, ảnh trong 3 tháng']);
  C.__resetMemo(); A([C.cleanOld_(25000, '2026-11-17T10:00:00+07:00') === 0, 'tự dọn: không quét lại ngày đã dọn']);
  const adm = J(ctx.apiPublicConfig()).users.find(u => u.role === 'admin'), tka = J(ctx.apiLogin(adm.id, '5678')).token;
  const t1 = J(ctx.apiCleanup(tka)), t2 = J(ctx.apiCleanup(tka)); A([!t1.skipped && t2.skipped, 'apiCleanup chạy tối đa 1 lần/ngày']);
})();

// ===== Đợt 7: danh mục vật tư =====
(() => {
  const adm = J(ctx.apiPublicConfig()).users.find(u => u.role === 'admin'), tka = J(ctx.apiLogin(adm.id, '5678')).token;
  const c0 = J(ctx.apiPublicConfig()); c0.materials = [{ id: 'mBT', name: 'Bê tông', unit: 'm3', sec: 'XD', mode: 'qty', specs: ['B30'], alias: [] }];
  if (!c0.users.some(u => u.id === 'uC7')) c0.users.push({ id: 'uC7', name: 'Chốt 7', role: 'chot', active: true });
  ctx.apiSaveConfig(tka, JSON.stringify(c0)); ctx.apiSetPin(tka, 'uC7', '7777'); const tkc = J(ctx.apiLogin('uC7', '7777')).token;
  const r1 = J(ctx.apiCatalogAdd(tkc, JSON.stringify({ name: 'Ống UPVC', unit: 'm', sec: 'MEP', mode: 'lot' }))), r2 = J(ctx.apiCatalogAdd(tkc, JSON.stringify({ name: '  bê   TÔNG ', unit: 'm3' })));
  A([r1.item && r1.item.mode === 'lot' && r1.item.sec === 'MEP' && r2.dup && r2.item.id === 'mBT', 'apiCatalogAdd: người chốt thêm chủng loại; trùng tên (hoa thường, khoảng trắng) → dùng mục có sẵn']);
  const rp = { date: '2026-12-01', status: 'draft', version: 0, weather: { am: '', pm: '', temp: '' }, manpower: [], equipment: [], safety: { summary: '', issues: [] }, tasks: [], plans: [], inspections: [], inspectionPlans: [], tests: [], testPlans: [], photos: [], layouts: [], extraPhotos: [], log: [],
    materials: [{ name: 'Bê tông', spec: 'B50R28', unit: 'm3', qty: 10 }], matMem: [{ name: 'Bê tông', spec: 'B50R28' }] };
  ctx.apiSaveReport(tkc, JSON.stringify(rp));
  const bt = J(ctx.apiPublicConfig()).materials.find(x => x.id === 'mBT');
  A([bt.specs.includes('B50R28') && bt.specs.includes('B30'), 'lưu báo cáo ngày: chi tiết mới tự thêm vào danh mục']);
  const stale = c0; stale.materials[0].unit = 'm³'; ctx.apiSaveConfig(tka, JSON.stringify(stale));
  const c3 = J(ctx.apiPublicConfig()).materials;
  A([c3.some(x => x.name === 'Ống UPVC') && c3.find(x => x.id === 'mBT').specs.includes('B50R28') && c3.find(x => x.id === 'mBT').unit === 'm³', 'admin lưu cấu hình cũ: giữ chủng loại / chi tiết người chốt vừa thêm, nhận sửa của admin']);
  const c4 = J(ctx.apiPublicConfig()); if (!c4.users.some(u => u.id === 'uK7')) { c4.users.push({ id: 'uK7', name: 'KS 7', role: 'ks', active: true }); ctx.apiSaveConfig(tka, JSON.stringify(c4)); } ctx.apiSetPin(tka, 'uK7', '7171');
  const tkK = J(ctx.apiLogin('uK7', '7171')).token; let err = ''; try { ctx.apiCatalogAdd(tkK, JSON.stringify({ name: 'X', unit: 'kg' })); } catch (e) { err = e.message; }
  A([/quyền/.test(err), 'kỹ sư không thêm được chủng loại']);
})();
