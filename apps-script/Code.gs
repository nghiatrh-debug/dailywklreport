/**
 * BÁO CÁO NGÀY CÔNG TRƯỜNG – Backend Google Apps Script (khuôn mẫu dùng chung, bản tối ưu tốc độ)
 * ---------------------------------------------------------------------------------------------
 * Tối ưu:
 *  - doGet nhúng sẵn cấu hình + danh mục ngày vào trang (không cần gọi máy chủ để hiện đăng nhập)
 *  - Đăng nhập trả luôn dữ liệu màn hình đầu; mỗi màn hình chỉ 1 lần gọi (apiOpen)
 *  - CacheService cho cấu hình, danh mục ngày, dữ liệu ngày; đọc Sheet có ghi nhớ trong mỗi lần chạy
 *  - Ghi theo dòng (không ghi lại cả bảng); bảng chuẩn hóa chỉ ghi khi CHỐT
 *  - Ảnh không gửi kèm dữ liệu; tải riêng theo lô (apiImages); PDF do máy chủ tự chèn ảnh
 *
 * Cài: copy Google Sheet mẫu → Tiện ích mở rộng → Apps Script → chạy setup() → Triển khai Web App.
 */

const SPREADSHEET_ID = '';
const ROOT_FOLDER_ID = '';
const ROOT_FOLDER_PREFIX = 'Dữ liệu báo cáo ', OLD_ROOT_PREFIX = 'Báo cáo ngày – ';
const KEEP_MONTHS = 3;                 // ảnh quá 3 tháng (đã chốt + xuất PDF) tự chuyển vào thùng rác
const TZ = 'Asia/Ho_Chi_Minh';
const TOKEN_DAYS = 30;
const CACHE_TTL = 21600;   // 6 giờ (tối đa của CacheService)

const SCHEMA = {
  BaoCao:    ['ngay','trang_thai','phien_ban','nguoi_chot','chot_luc','thoi_tiet_sang','thoi_tiet_chieu','nhiet_do','tong_nhan_luc','so_loai_thiet_bi','so_viec','so_viec_xong','pdf_url','cap_nhat_luc','json','tvgs_kiem_tra','ma_xac_thuc','json_2','json_3','json_4'],
  PhieuKS:   ['khoa','ngay','ma_nguoi','ten','khu_vuc','trang_thai','nop_luc','nhap_thay_boi','ghi_chu','tra_lai_ghi_chu','so_viec','so_anh','cap_nhat_luc','json','json_2','json_3','json_4'],
  CongViec:  ['ngay','loai','bo_mon','khu_vuc','stt','noi_dung','vi_tri','ma_wbs','dvt','kl_ngay','tien_do_text','tien_do_pct','tien_do_truoc','lap_lai','nguoi_bao_cao','ma_tien_do','kh_hom_nay','thuc_hien','chenh_lech','du_kien_them'],
  NhanLuc:   ['ngay','chuc_danh','so_luong'],
  ThietBi:   ['ngay','thiet_bi','so_luong'],
  NghiemThu: ['ngay','loai','khu_vuc','noi_dung','vi_tri','ket_qua_hoac_thoi_gian','nguoi_bao_cao'],
  ThiNghiem: ['ngay','khu_vuc','noi_dung','vi_tri','ket_qua','nguoi_bao_cao','loai'],
  VatTu:     ['ngay','chung_loai','quy_cach','dvt','so_luong'],
  AnToan:    ['ngay','noi_dung','bien_phap'],
  HinhAnh:   ['ngay','nguon','khu_vuc','chu_thich','chup_luc','canh_bao','file_id','url'],
  TongHopKy: ['ky_key','loai','tu_ngay','den_ngay','danh_gia','pdf_url','cap_nhat_luc','json','tuan_so','trang_thai','phien_ban','tvgs_kiem_tra','ma_xac_thuc','json_2','json_3','json_4'],
  // Báo cáo tuần: ghi khi CHỐT tuần (khóa = ky_key 'W-<ngày đầu kỳ>')
  Tuan_TienDo:   ['ky_key','tuan_so','tu_ngay','den_ngay','kh_tuan','thuc_te_tuan_truoc','thuc_te','chenh_lech','danh_gia','kh_tuan_sau','ban_tien_do','an_toan','thi_cong','nguon_luc','nhan_luc_tb','ghi_chu'],
  Tuan_CongViec: ['ky_key','tuan_so','loai','bo_mon','khu_vuc','stt','noi_dung','dvt','kl_tuan','dau_tuan','kh_pct','thuc_te','chenh_lech','ghi_chu'],
  Tuan_VatTu:    ['ky_key','tuan_so','loai','chung_loai','quy_cach','dvt','ky_truoc','ky_nay','luy_ke','ngay_du_kien'],
  Tuan_NhanLuc:  ['ky_key','tuan_so','loai','ten','tb_ngay','cao_nhat','tong'],
  Tuan_NghiemThu:['ky_key','tuan_so','loai','ngay','noi_dung','vi_tri','ket_qua'],
  Tuan_AnToan:   ['ky_key','tuan_so','loai','ngay','noi_dung','bien_phap'],
  Tuan_HoSo:     ['ky_key','tuan_so','loai','trang_tinh','ma_ho_so','noi_dung','lan_trinh','ngay_trinh','ngay_ket_qua','tinh_trang','link'],
  NhatKy:    ['thoi_gian','nguoi','hanh_dong','ngay','chi_tiet'],
  CauHinh:   ['key','json']
};
const NORMALIZED = ['CongViec', 'NhanLuc', 'ThietBi', 'NghiemThu', 'ThiNghiem', 'VatTu', 'AnToan', 'HinhAnh'];
const WEEK_SHEETS = ['Tuan_TienDo', 'Tuan_CongViec', 'Tuan_VatTu', 'Tuan_NhanLuc', 'Tuan_NghiemThu', 'Tuan_AnToan', 'Tuan_HoSo'];

/* ======================= WEB APP ======================= */
function doGet(e) {
  const t = HtmlService.createTemplateFromFile('Index');
  let boot = '';
  try {
    const v = e && e.parameter && e.parameter.v;
    // ?v=<mã xác thực>: trang xác thực công khai (quét QR trên PDF) – không cần đăng nhập
    boot = JSON.stringify(v ? { config: publicCfg_(), verify: verify_(v) } : { config: cfg_(), index: idxEnc_(index_()) }).replace(/</g, '\\u003c');
  } catch (err) { boot = ''; }
  t.boot = boot;
  return t.evaluate()
    .setTitle('Lập báo cáo thi công')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Chạy 1 lần sau khi dán code: tạo đủ các tab dữ liệu. */
function setup() {
  Object.keys(SCHEMA).forEach(sheet_);
  ['Sheet1', 'Trang tính1'].forEach(n => { const sh = ss_().getSheetByName(n); if (sh && sh.getLastRow() === 0 && ss_().getSheets().length > 1) ss_().deleteSheet(sh); });
  cdel_(['cfg', 'idx']);
  Logger.log('Đã tạo cấu trúc dữ liệu. Triển khai Web App rồi mở link để khai báo dự án lần đầu.');
}

/* ======================= CẤU HÌNH, ĐĂNG NHẬP ======================= */
function apiBoot() { return JSON.stringify({ config: cfg_(), index: idxEnc_(index_()) }); }
function apiPublicConfig() { return kv_('config'); }

function apiSetup(cfgJson, pin) {
  const old = cfg_();
  if (old && old.setupDone) throw new Error('Dự án đã được khai báo. Dùng Cấu hình → Reset để khai báo lại.');
  if (!/^\d{4,6}$/.test(String(pin))) throw new Error('PIN phải gồm 4–6 chữ số');
  Object.keys(SCHEMA).forEach(sheet_);
  const c = JSON.parse(cfgJson); delete c.demoPins; delete c.pins; c.sample = false;
  const admin = c.users[0]; admin.role = 'admin';
  saveCfg_(c);
  setKv_('pins', JSON.stringify({ [admin.id]: hash_(admin.id, pin) }));
  log_(admin.id, 'KHAI_BAO_DU_AN', '', c.project.code);
  return JSON.stringify({ token: newToken_(admin.id), uid: admin.id });
}

/** Đăng nhập; trả luôn dữ liệu màn hình đầu tiên (mode: 'my' | 'day') để giao diện không phải gọi thêm. */
function apiLogin(uid, pin, mode, remember) {
  const c = cfg_(), u = c && c.users.find(x => x.id === uid);
  if (!u || u.active === false) return null;
  const pins = JSON.parse(kv_('pins') || '{}');
  if (!pins[uid] || pins[uid] !== hash_(uid, pin)) { Utilities.sleep(600); return null; }
  if (Math.random() < 0.1) cleanTokens_();
  // Thời hạn phiên: không ghi nhớ 12 giờ; ghi nhớ: Quản trị/Người chốt 7 ngày, còn lại 30 ngày
  const token = newToken_(uid, remember ? (u.role === 'admin' || u.role === 'chot' ? 7 : TOKEN_DAYS) * 864e5 : 12 * 3600e3);
  let bundle = null;
  if (mode) { try { bundle = bundle_(u, '', mode, uid); bundle.others = othersActive_(token, uid); } catch (e) {} }
  return JSON.stringify({ token: token, uid: uid, bundle: bundle });
}

function apiSaveConfig(token, json) {
  const me = auth_(token, ['admin']);
  const old = cfg_(), c = JSON.parse(json);
  delete c.pins; delete c.demoPins;
  c.setupDone = true; c.setupAt = old.setupAt;
  c.wbsMemory = Object.assign({}, old.wbsMemory || {}, c.wbsMemory || {});
  const meNew = c.users.find(u => u.id === me.id); if (meNew) { meNew.role = 'admin'; meNew.active = true; }
  saveCfg_(c);
  log_(me.id, 'SUA_CAU_HINH', '', '');
  return true;
}

function apiSetPin(token, uid, pin) {
  const me = auth_(token);
  if (me.role !== 'admin' && me.id !== uid) throw new Error('Không có quyền đặt PIN cho người khác');
  if (!/^\d{4,6}$/.test(String(pin))) throw new Error('PIN phải gồm 4–6 chữ số');
  const pins = JSON.parse(kv_('pins') || '{}'); pins[uid] = hash_(uid, pin); setKv_('pins', JSON.stringify(pins));
  log_(me.id, 'DAT_PIN', '', uid);
  return true;
}

/* ======================= DỮ LIỆU NGÀY ======================= */
/** 1 lần gọi cho 1 màn hình: {date, index, report, subs, prev:{date, report, subs}} – không kèm ảnh. */
/** Đo tốc độ (Cài đặt → ⏱): thời gian máy chủ đọc Sheet thật (bỏ qua bộ đệm) và đọc qua bộ đệm. */
function apiPing(token, heavy) {
  const t0 = Date.now(); const me = auth_(token); const t1 = Date.now();
  let sheetMs = 0, cacheMs = 0;
  if (heavy) { const a = Date.now(); col_('BaoCao', 0); col_('PhieuKS', 1); sheetMs = Date.now() - a;
    const b = Date.now(); cget_('idx'); cget_('cfg'); cacheMs = Date.now() - b; }
  return JSON.stringify({ auth: t1 - t0, sheet: sheetMs, cache: cacheMs, total: Date.now() - t0, role: me.role });
}
function apiOpen(token, date, mode, uid) {
  const me = auth_(token);
  const b = bundle_(me, date, mode, uid || me.id); b.others = othersActive_(token, me.id);
  return JSON.stringify(b);
}

function bundle_(me, date, mode, uid) {
  const idx = index_();
  const all = idx.reports.map(r => r.date).concat(idx.subs.map(s => s.date));
  const td = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  if (!date) {
    const ds = all.slice().sort();
    date = mode === 'my' ? td : (ds.indexOf(td) >= 0 || !ds.length ? td : ds[ds.length - 1]);
  }
  const day = dayData_(date);
  let subs = day.subs;
  if (me.role === 'ks') subs = subs.filter(s => s.uid === me.id);
  const before = all.filter(d => d < date).sort(), pd = before[before.length - 1] || '';
  const prev = pd ? dayData_(pd) : null;
  const out = { date: date, index: idxEnc_(idx, me.role === 'ks' ? me.id : ''), report: day.report, subs: subs, prev: prev ? { date: pd, report: prev.report, subs: prev.subs } : null };
  if (me.role === 'admin') out.links = links_();
  return out;
}

/** Ảnh theo fileId → data URL (tải riêng theo lô, sau khi chữ/số đã hiện). */
function apiImages(token, ids) {
  auth_(token);
  const out = {};
  (ids || []).slice(0, 10).forEach(id => { try { out[id] = dataUrl_(id); } catch (e) { out[id] = ''; } });
  return JSON.stringify(out);
}

function apiSaveSub(token, json) {
  const me = auth_(token, ['admin', 'chot', 'ks']);
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const s = JSON.parse(json), d = s.date;
    const day = dayData_(d); markTest_(d, day);
    if (day.report && day.report.status === 'locked') throw new Error('Báo cáo ngày ' + d + ' đã chốt – không sửa phiếu được');
    const old = day.subs.find(x => x.uid === s.uid);
    stampRev_(s, old, me);
    if (me.role === 'ks') {
      if (me.id !== s.uid) throw new Error('Không có quyền sửa phiếu của người khác');
      if (old && !(old.status === 'draft' || old.status === 'returned' || (old.status === 'submitted' && s.status === 'draft')))
        throw new Error('Phiếu đã nộp/đã nhận – không sửa được');
      if (['draft', 'submitted'].indexOf(s.status) < 0) s.status = 'draft';
    }
    mergeWbs_(s.wbsMem); delete s.wbsMem;
    const newImgs = (s.photos || []).some(p => !p.fileId && p.img);
    if (newImgs) { const folder = subFolder_(rootFolder_(), 'HinhAnh', d); (s.photos || []).forEach((p, i) => uploadImg_(p, folder, d + '_' + s.uid + '_' + (i + 1))); }
    // ảnh đã có trên Drive mà phía giao diện gửi thiếu dữ liệu → giữ nguyên fileId
    const c = cfg_();
    writeSub_(s, c, day);
    if (!old || old.status !== s.status) log_(me.id, 'PHIEU_' + String(s.status).toUpperCase(), d, userName_(c, s.uid));
    return JSON.stringify({ ok: true, rev: s.rev, photos: (s.photos || []).map(p => p.fileId || '') });
  } finally { lock.releaseLock(); }
}

/* Ô Google Sheet tối đa 50.000 ký tự → JSON dài chia sang cột json_2..json_4 (mỗi ô 45.000, tối đa ~180.000 ký tự) */
const JMAX = 45000;
function jsonCells_(o, what) {
  const s = JSON.stringify(o);
  if (s.length > JMAX * 4) throw new Error((what || 'Dữ liệu') + ' quá lớn (' + Math.round(s.length / 1000) + ' nghìn ký tự, tối đa 180) – tách bớt việc/ảnh sang ngày khác hoặc liên hệ quản trị');
  // cột phụ có tiền tố "~" để Sheet không hiểu nhầm thành công thức/số
  return [s.slice(0, JMAX)].concat([1, 2, 3].map(k => { const p = s.slice(JMAX * k, JMAX * (k + 1)); return p ? '~' + p : ''; }));
}
function jsonOf_(name, row) {
  const H = SCHEMA[name]; let s = String(row[H.indexOf('json')] || '');
  ['json_2', 'json_3', 'json_4'].forEach(k => { const v = String(row[H.indexOf(k)] || ''); if (v) s += v.charAt(0) === '~' ? v.slice(1) : v; });
  return s ? JSON.parse(s) : null;
}

/** Ghi 1 phiếu vào Sheet + cập nhật luôn bộ đệm ngày/chỉ mục (không xóa → lần mở/lưu sau khỏi đọc lại Sheet). */
function writeSub_(s, c, day) {
  const d = s.date, store = strip_(s); ensureHeader_('PhieuKS');
  const zones = c.zones.filter(z => z.owner === s.uid).map(z => z.name + ' (' + z.section + ')').join(', ');
  upsertRow_('PhieuKS', 0, s.key, [s.key, d, s.uid, userName_(c, s.uid), zones, s.status, s.submittedAt || '', s.enteredBy ? userName_(c, s.enteredBy) : '',
    s.note || '', s.returnNote || '', (s.tasks || []).length, (s.photos || []).length, now_()].concat(jsonCells_(store, 'Phiếu ' + d)));
  const i = day.subs.findIndex(x => x.uid === s.uid); if (i >= 0) day.subs[i] = store; else day.subs.push(store);
  dayPut_(d, day); idxPatch_('subs', { date: d, uid: s.uid, status: s.status });
}
function dayPut_(d, day) { cdel_(['day:' + d]); MEMO['c:day:' + d] = day; cput_('day:' + d, day); }
/** Sửa 1 dòng trong chỉ mục đang đệm (nếu có); quá lớn không đệm được thì xóa để lần sau dựng lại. */
function idxPatch_(kind, rec) {
  const idx = MEMO.idx || idxDec_(cget_('idx')); if (!idx) return;
  const L = idx[kind], i = L.findIndex(x => x.date === rec.date && (kind === 'reports' || x.uid === rec.uid));
  if (i >= 0) L[i] = Object.assign(L[i], rec); else L.push(rec);
  cdel_(['idx']); MEMO.idx = idx; cput_('idx', idxEnc_(idx));
}
/* Chỉ mục gửi/đệm dạng gọn: {r:[[ngày,tt,bản,tvgs]], s:[[ngày,người,tt]], t:[ngày thử]} – nhỏ ~3 lần */
const IDX_DAYS = 120;
const ST_ = { locked: 'l', draft: 'd', submitted: 's', returned: 'r', accepted: 'a', pending: 'p', approved: 'v' };
const TS_ = Object.keys(ST_).reduce((o, k) => (o[ST_[k]] = k, o), {});
const enc1_ = v => ST_[v] || v || '', dec1_ = v => TS_[v] || v || '';
function idxEnc_(idx, uid) {
  if (!idx) return null;
  return { r: idx.reports.map(x => [x.date, enc1_(x.status), x.version || 0, enc1_(x.review)]),
           s: idx.subs.filter(x => !uid || x.uid === uid).map(x => [x.date, x.uid, enc1_(x.status)]), t: idx.testDays || [] };
}
function idxDec_(e) {
  if (!e || !e.r) return e && e.reports ? e : null;
  return { reports: e.r.map(x => ({ date: x[0], status: dec1_(x[1]), version: x[2], review: dec1_(x[3]) })),
           subs: e.s.map(x => ({ date: x[0], uid: x[1], status: dec1_(x[2]) })), testDays: e.t || [] };
}

function apiSaveReport(token, json) {
  const me = auth_(token, ['admin', 'chot']);
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const r = JSON.parse(json), d = r.date, c = cfg_();
    const dd = dayData_(d), old = dd.report; markTest_(d, dd);
    stampRev_(r, old, me);
    // Trạng thái TVGS do máy chủ quản lý – giao diện không tự đặt được
    const kept = old && old.review ? old.review : null;
    if (old && old.status === 'locked' && old.review && old.review.status === 'approved' && r.status === 'locked') throw new Error('Báo cáo đã được TVGS xác nhận – mở khóa trước khi sửa');
    if (r.status === 'locked') r.review = (!old || old.status !== 'locked') ? (reviewOn_(c) ? { status: 'pending', since: now_(), lastNote: kept && kept.status === 'returned' ? kept.note : '' } : null) : kept;
    else r.review = kept && kept.status === 'returned' ? kept : null;
    mergeWbs_(r.wbsMem); delete r.wbsMem;
    if (!Array.isArray(r.layouts)) r.layouts = r.layout && (r.layout.img || r.layout.fileId) ? [r.layout] : [];
    delete r.layout;
    const need = r.layouts.concat(r.extraPhotos || []).some(p => p && !p.fileId && p.img);
    if (need) { const folder = subFolder_(rootFolder_(), 'HinhAnh', d);
      r.layouts.forEach((p, i) => uploadImg_(p, folder, d + '_mat_bang_' + (i + 1))); (r.extraPhotos || []).forEach((p, i) => uploadImg_(p, folder, d + '_bo_sung_' + (i + 1))); }
    // ảnh bổ sung vừa tải lên → cập nhật fileId trong mảng gộp
    const ex = {}; (r.extraPhotos || []).forEach(p => { if (p.id) ex[p.id] = p.fileId; });
    (r.photos || []).forEach(p => { if (!p.fileId && p.id && ex[p.id]) p.fileId = ex[p.id]; });
    // Chốt ngày: nhận luôn các phiếu đã nộp trong cùng 1 lần gọi (trước đây mỗi phiếu 1 lần gọi)
    const acc = []; (r.acceptSubs || []).forEach(uid => { const sb = dd.subs.find(x => x.uid === uid && x.status === 'submitted');
      if (sb) { sb.status = 'accepted'; sb.rev = (sb.rev || 0) + 1; sb.savedAt = now_(); sb.savedBy = me.id; writeSub_(sb, c, dd); acc.push(uid); } });
    if (acc.length) log_(me.id, 'PHIEU_ACCEPTED', d, acc.map(u => userName_(c, u)).join(', '));
    delete r.acceptSubs;
    writeReport_(r, c);
    if (r.status === 'locked') writeNormalized_(r, c, pctOf_);     // bảng chuẩn hóa = số liệu đã chốt
    dd.report = strip_(r); dayPut_(d, dd);
    idxPatch_('reports', { date: d, status: r.status, version: r.version, review: (r.review || {}).status || '' });
    if (!old || old.status !== r.status) log_(me.id, r.status === 'locked' ? 'CHOT_BAO_CAO_V' + r.version : 'MO_KHOA', d, '');
    return JSON.stringify({ ok: true, rev: r.rev, accepted: acc, subRevs: acc.map(u => dd.subs.find(x => x.uid === u).rev), review: r.review || null, layouts: r.layouts.map(p => p.fileId || ''), extra: (r.extraPhotos || []).map(p => p.fileId || '') });
  } finally { lock.releaseLock(); }
}

const pctOf_ = v => { const s = String(v == null ? '' : v).trim(); return /^-?\d+([.,]\d+)?\s*%?$/.test(s) ? parseFloat(s.replace(',', '.')) : ''; };
const REVIEW_TXT = { pending: 'CHO_KIEM_TRA', returned: 'YEU_CAU_SUA', approved: 'DA_XAC_NHAN' };
/** Ghi 1 dòng BaoCao (dùng chung cho người chốt và TVGS). */
function writeReport_(r, c) {
  const d = r.date, store = strip_(r), tasks = r.tasks || [], rv = r.review || {}, jc = jsonCells_(store, 'Báo cáo ngày ' + d);
  const pdf = (rowOf_('BaoCao', 0, d) || [])[12] || '';
  ensureHeader_('BaoCao');
  upsertRow_('BaoCao', 0, d, [d, r.status, r.version || 0, r.lockedBy ? userName_(c, r.lockedBy) : '', r.lockedAt || '', r.weather.am, r.weather.pm, r.weather.temp,
    (r.manpower || []).reduce((s, m) => s + (Number(m.qty) || 0), 0), (r.equipment || []).filter(m => Number(m.qty) > 0).length,
    tasks.length, tasks.filter(t => pctOf_(t.progress) !== '' && pctOf_(t.progress) >= 100).length, pdf, now_(), jc[0],
    REVIEW_TXT[rv.status] || '', rv.status === 'approved' ? rv.code : '', jc[1], jc[2], jc[3]]);
}

/** Chống ghi đè: bản gửi lên mang baseRev = rev lúc mở. Máy chủ đã có rev khác → từ chối (CONFLICT|giờ|người).
 *  force = người dùng chọn "Giữ bản của tôi". Không có baseRev (bản app cũ) → bỏ qua kiểm tra. */
function stampRev_(o, old, me) {
  const base = o.baseRev, force = o.force; delete o.baseRev; delete o.force;
  const cur = old ? (old.rev || 0) : 0;
  if (old && !force && base !== undefined && base !== null && Number(base) !== cur)
    throw new Error('CONFLICT|' + (old.savedAt || '') + '|' + (old.savedBy ? userName_(cfg_(), old.savedBy) : ''));
  o.rev = cur + 1; o.savedAt = now_(); o.savedBy = me.id;
}

/* ======================= TVGS KIỂM TRA NỘI DUNG ======================= */
/** Bắt buộc TVGS kiểm tra khi: công tắc bật (mặc định) và có ít nhất 1 tài khoản TVGS đang hoạt động. */
function reviewOn_(c) { return !!c && (c.settings || {}).requireReview !== false && c.users.some(u => u.role === 'tvgs' && u.active !== false); }
/** Mã xác thực = 8 ký tự đầu SHA-256 của nội dung báo cáo (không gồm trạng thái kiểm tra, link PDF). */
function vcode_(r) {
  const o = JSON.parse(JSON.stringify(r)); delete o.review; delete o.pdfUrl; delete o.rev; delete o.savedAt; delete o.savedBy;
  const b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, JSON.stringify(o), Utilities.Charset.UTF_8);
  const h = b.map(x => ((x + 256) % 256).toString(16).padStart(2, '0')).join('').toUpperCase();
  return h.slice(0, 4) + '-' + h.slice(4, 8);
}
/** TVGS: action = 'approve' (xác nhận nội dung đúng) | 'return' (yêu cầu nhà thầu sửa, bắt buộc ghi chú). */
function apiReview(token, date, action, note) {
  const me = auth_(token, ['admin', 'tvgs']), c = cfg_();
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const r = dayData_(date).report;
    if (!r || r.status !== 'locked') throw new Error('Báo cáo ngày ' + date + ' chưa được nhà thầu chốt');
    if (r.review && r.review.status === 'approved' && action === 'approve') throw new Error('Báo cáo đã được xác nhận');
    r.rev = (r.rev || 0) + 1;
    if (action === 'approve') {
      r.review = { status: 'approved', by: me.id, at: now_(), code: vcode_(r), version: r.version || 1 };
      r.review.url = verifyUrl_(r.review.code);
      log_(me.id, 'TVGS_XAC_NHAN', date, r.review.code + ' · v' + r.review.version);
    } else {
      if (!String(note || '').trim()) throw new Error('Ghi rõ nội dung cần nhà thầu sửa');
      r.review = { status: 'returned', by: me.id, at: now_(), note: String(note).trim(), version: r.version || 1 };
      r.status = 'draft';
      log_(me.id, 'TVGS_YEU_CAU_SUA', date, r.review.note);
    }
    writeReport_(r, c);
    const dd = dayData_(date); dd.report = strip_(r); dayPut_(date, dd);
    idxPatch_('reports', { date: date, status: r.status, version: r.version, review: r.review.status });
    return JSON.stringify(r.review);
  } finally { lock.releaseLock(); }
}
/** Tra mã xác thực in trên PDF (trong app – cần đăng nhập). */
function apiVerify(token, code) { auth_(token); return JSON.stringify(verify_(code)); }
/** Kết quả xác thực: chỉ thông tin tối thiểu, dùng chung cho trang công khai (quét QR). */
function verify_(code) {
  const c = cfg_(), k = String(code || '').toUpperCase().replace(/[^0-9A-F]/g, '');
  const base = { code: code, project: c ? c.project.code : '', projectName: c ? c.project.name : '', consultant: c ? (c.project.consultantShort || c.project.consultant || '') : '' };
  if (k.length !== 8) return Object.assign(base, { ok: false });
  const cd = k.slice(0, 4) + '-' + k.slice(4), i = col_('BaoCao', SCHEMA.BaoCao.indexOf('ma_xac_thuc')).indexOf(cd);
  base.code = cd;
  if (i >= 0) { const d = col_('BaoCao', 0)[i], r = dayData_(d).report, row = rowOf_('BaoCao', 0, d) || [];
    return Object.assign(base, { ok: 'current', date: r.date, version: r.review.version, by: userName_(c, r.review.by), at: r.review.at,
      lockedAt: r.lockedAt || '', lockedBy: userName_(c, r.lockedBy), pdf: row[SCHEMA.BaoCao.indexOf('pdf_url')] || '' }); }
  const wi = col_('TongHopKy', SCHEMA.TongHopKy.indexOf('ma_xac_thuc')).indexOf(cd);
  if (wi >= 0) { const wk = col_('TongHopKy', 0)[wi], w = weekGet_(wk), row = rowOf_('TongHopKy', 0, wk) || [];
    return Object.assign(base, { ok: 'current', kind: 'week', no: w.no, from: w.from, date: w.to, version: w.review.version, by: userName_(c, w.review.by), at: w.review.at,
      lockedAt: w.lockedAt || '', lockedBy: userName_(c, w.lockedBy), pdf: row[SCHEMA.TongHopKy.indexOf('pdf_url')] || '' }); }
  const sh = sheet_('NhatKy'), n = sh.getLastRow() - 1, rows = n > 0 ? sh.getRange(2, 1, n, 5).getValues() : [];
  const h = rows.filter(x => /^TVGS_XAC_NHAN(_TUAN)?$/.test(x[2]) && String(x[4]).indexOf(cd) === 0).pop();
  return Object.assign(base, h ? { ok: 'old', date: String(h[3]), by: h[1], at: h[0] } : { ok: false });
}
/** Cấu hình rút gọn cho trang công khai: không có người dùng, khu vực… */
function publicCfg_() { const c = cfg_(); return c ? { setupDone: true, project: c.project, users: [], zones: [], settings: {} } : null; }
/** Link trang xác thực (luôn dùng bản chính thức /exec). */
function verifyUrl_(code) { let u = ''; try { u = ScriptApp.getService().getUrl() || ''; } catch (e) {} return u ? u.replace(/\/dev$/, '/exec') + '?v=' + code : ''; }

/* ======================= THƯ MỤC LƯU PDF ======================= */
/** Thư mục đã chọn trong Cấu hình (thường là thư mục Drive chia sẻ của dự án); chưa chọn → thư mục mặc định của app. */
function pdfFolder_(c, kind, key) {
  const st = (c && c.settings) || {}, mon = String(key).slice(0, 7);
  if (kind === 'week' && st.weekFolderId) {     // báo cáo tuần: thư mục riêng đã chọn
    try { return DriveApp.getFolderById(st.weekFolderId); } catch (e) { throw new Error('Không mở được thư mục lưu báo cáo tuần đã chọn (“' + (st.weekFolderName || st.weekFolderId) + '”). Quản trị kiểm tra quyền truy cập trong Cấu hình → Cài đặt.'); }
  }
  if (!st.pdfFolderId) return subFolder_(rootFolder_(), 'PDF', kind === 'day' ? mon : (kind === 'week' ? 'Tuan' : 'Thang'));
  let base; try { base = DriveApp.getFolderById(st.pdfFolderId); } catch (e) { throw new Error('Không mở được thư mục lưu PDF đã chọn (“' + (st.pdfFolderName || st.pdfFolderId) + '”). Quản trị kiểm tra quyền truy cập trong Cấu hình → Cài đặt.'); }
  if (kind === 'week') return base;     // báo cáo tuần: lưu thẳng vào thư mục đã chọn
  const sub = kind === 'day' ? 'Báo cáo ngày' : 'Báo cáo tháng';
  return kind === 'day' && st.pdfMonthly !== false ? subFolder_(base, sub, mon) : subFolder_(base, sub);
}
/** Lấy mã thư mục từ link Drive (…/folders/<id>, ?id=<id>) hoặc mã dán trực tiếp. */
function folderId_(s) {
  s = String(s || '').trim(); const m = s.match(/\/folders\/([\w-]{10,})/) || s.match(/[?&]id=([\w-]{10,})/);
  return m ? m[1] : (/^[\w-]{10,}$/.test(s) ? s : '');
}
/** Kiểm tra thư mục: mở được + ghi được (tạo rồi xóa 1 file thử). Trả {id, name, url}. */
function apiCheckFolder(token, link) {
  auth_(token, ['admin']);
  const id = folderId_(link); if (!id) throw new Error('Link không hợp lệ – mở thư mục trên Google Drive, sao chép link trên thanh địa chỉ (dạng …/folders/…)');
  let f; try { f = DriveApp.getFolderById(id); f.getName(); } catch (e) { throw new Error('Không mở được thư mục. Tài khoản triển khai app phải được chia sẻ thư mục này với quyền **Người chỉnh sửa** (Editor).'); }
  try { f.createFile(Utilities.newBlob('test', 'text/plain', '_kiem_tra_quyen_ghi.txt')).setTrashed(true); }
  catch (e) { throw new Error('Thư mục “' + f.getName() + '” chỉ có quyền xem – cần quyền **Người chỉnh sửa** (Editor) để lưu PDF.'); }
  return JSON.stringify({ id: id, name: f.getName(), url: f.getUrl() });
}

/* ======================= LOGO, NGÀY THỬ ======================= */
/** Logo đơn vị (đã thu nhỏ ở giao diện) → thư mục Drive "Logo"; trả fileId. */
function apiSaveLogo(token, kind, dataUrl, oldId) {
  auth_(token, ['admin']);
  if (['consultant', 'client', 'contractor'].indexOf(kind) < 0) throw new Error('Loại logo không hợp lệ');
  if (oldId) { try { DriveApp.getFileById(oldId).setTrashed(true); } catch (e) {} }
  if (!dataUrl) return '';
  const m = String(dataUrl).match(/^data:(.+?);base64,(.*)$/); if (!m) throw new Error('Ảnh logo không hợp lệ');
  return subFolder_(rootFolder_(), 'Logo').createFile(Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], 'logo_' + kind + (m[1].indexOf('png') > 0 ? '.png' : '.jpg'))).getId();
}
const testDays_ = () => JSON.parse(kv_('testDays') || '[]');
/** Chế độ thử nghiệm: ghi nhận ngày THỬ (chỉ những ngày trước đó chưa có dữ liệu thật). */
function markTest_(d, day) {
  const c = cfg_(); if (!c || !(c.settings || {}).testMode) return;
  const L = testDays_(); if (L.indexOf(d) >= 0) return;
  if (day.report || (day.subs || []).length) return;
  L.push(d); setKv_('testDays', JSON.stringify(L)); cdel_(['idx']); delete MEMO.idx;
}
function apiClearTestDays(token) {
  const me = auth_(token, ['admin']), L = testDays_();
  L.forEach(d => { NORMALIZED.concat(['BaoCao']).forEach(n => replaceDay_(n, d, [])); replaceDay_('PhieuKS', d, [], 1); });
  setKv_('testDays', '[]');
  cdel_(['idx'].concat(L.map(d => 'day:' + d)));
  log_(me.id, 'XOA_NGAY_THU', '', L.join(', '));
  return L.length;
}

function writeNormalized_(r, c, pctOf) {
  const d = r.date;
  const zn = id => { const z = c.zones.find(x => x.id === id); return z ? z.name : ''; };
  const secOf = t => { const z = c.zones.find(x => x.id === t.zoneId); return z ? z.section : (t.section || ''); };
  const cv = [], nb = v => (v === '' || v == null || isNaN(Number(v))) ? '' : Number(v);
  (r.tasks || []).forEach((t, i) => { const kh = t.recurring ? '' : nb(t.planToday), th = t.recurring ? '' : nb(t.dayPct);
    cv.push([d, 'THUC_HIEN', secOf(t), zn(t.zoneId), i + 1, t.desc, t.loc, t.wbs, t.unit, t.qtyDay, t.progress, pctOf(t.progress), t.prevProgress, t.recurring ? 'x' : '', userName_(c, t.by), t.scheduleId || '',
      kh, th, kh !== '' && th !== '' ? Math.round((th - kh) * 10) / 10 : '', '']); });
  (r.plans || []).forEach((t, i) => cv.push([d, 'KE_HOACH', secOf(t), zn(t.zoneId), i + 1, t.desc, t.loc, t.wbs, '', '', t.target, pctOf(t.target), '', t.mon ? 'x' : '', userName_(c, t.by), t.scheduleId || '', '', '', '', t.mon ? '' : nb(t.add)]));
  ensureHeader_('CongViec');
  replaceDay_('CongViec', d, cv);
  replaceDay_('NhanLuc', d, (r.manpower || []).map(m => [d, m.title, Number(m.qty) || 0]));
  replaceDay_('ThietBi', d, (r.equipment || []).map(m => [d, m.name, Number(m.qty) || 0]));
  replaceDay_('NghiemThu', d, (r.inspections || []).map(x => [d, 'TRONG_NGAY', zn(x.zoneId), x.desc, x.loc, x.result, userName_(c, x.by)])
    .concat((r.inspectionPlans || []).map(x => [d, 'KE_HOACH', zn(x.zoneId), x.desc, x.loc, x.time, userName_(c, x.by)])));
  ensureHeader_('ThiNghiem');
  replaceDay_('ThiNghiem', d, (r.tests || []).map(x => [d, zn(x.zoneId), x.desc, x.loc, x.result, userName_(c, x.by), 'TRONG_NGAY'])
    .concat((r.testPlans || []).map(x => [d, zn(x.zoneId), x.desc, x.loc, x.time, userName_(c, x.by), 'KE_HOACH'])));
  replaceDay_('VatTu', d, (r.materials || []).map(x => [d, x.name, x.spec, x.unit, Number(x.qty) || 0]));
  replaceDay_('AnToan', d, [[d, (r.safety && r.safety.summary) || '', '']].concat(((r.safety && r.safety.issues) || []).map(x => [d, x.desc, x.action])));
  const img = [];
  (r.layouts || (r.layout ? [r.layout] : [])).forEach(l => { if (l && l.fileId) img.push([d, 'MAT_BANG', '', l.caption || '', '', '', l.fileId, driveUrl_(l.fileId)]); });
  (r.photos || []).forEach(p => { if (p.fileId) img.push([d, p.by ? userName_(c, p.by) : 'Người chốt', zn(p.zoneId), p.caption || '', p.takenAt || '', p.warn || '', p.fileId, driveUrl_(p.fileId)]); });
  replaceDay_('HinhAnh', d, img);
}

function apiDeleteDay(token, date) {
  const me = auth_(token, ['admin']);
  NORMALIZED.concat(['BaoCao']).forEach(n => replaceDay_(n, date, []));
  replaceDay_('PhieuKS', date, [], 1);
  const L = testDays_(); if (L.indexOf(date) >= 0) setKv_('testDays', JSON.stringify(L.filter(x => x !== date)));
  cdel_(['idx', 'day:' + date]);
  log_(me.id, 'XOA_NGAY', date, '');
  return true;
}

/** Báo cáo trong khoảng ngày (không ảnh) + phần nhập tay của kỳ – 1 lần gọi. */
function apiPeriod(token, from, to, key) {
  auth_(token);
  const W = SCHEMA.BaoCao.length, sh = sheet_('BaoCao'), keys = col_('BaoCao', 0);
  const rowsIdx = []; keys.forEach((k, i) => { if (k >= from && k <= to) rowsIdx.push(i); });
  let reports = [];
  if (rowsIdx.length) {
    const a = Math.min.apply(null, rowsIdx), b = Math.max.apply(null, rowsIdx);
    const vals = sh.getRange(a + 2, 1, b - a + 1, Math.min(W, sh.getLastColumn())).getValues();
    reports = rowsIdx.map(i => ({ d: keys[i], r: jsonOf_('BaoCao', vals[i - a]) })).sort((x, y) => x.d < y.d ? -1 : 1).map(x => x.r);
  }
  let manual = null, prevWeek = null;
  if (key) { const row = rowOf_('TongHopKy', 0, key); manual = row ? jsonOf_('TongHopKy', row) : null; }
  if (String(key).indexOf('W-') === 0) prevWeek = prevWeek_(from);
  // Phiếu kỹ sư của các ngày CHƯA CHỐT trong kỳ → giao diện tự gộp, đánh dấu "số liệu tạm"
  const locked = {}; reports.forEach(r => { if (r && r.status === 'locked') locked[r.date] = 1; });
  const pk = col_('PhieuKS', 1), PW = SCHEMA.PhieuKS.length, pi = [];
  pk.forEach((k, i) => { if (k >= from && k <= to && !locked[k]) pi.push(i); });
  let subs = [];
  if (pi.length) { const a = Math.min.apply(null, pi), b = Math.max.apply(null, pi);
    const ps = sheet_('PhieuKS'), vals = ps.getRange(a + 2, 1, b - a + 1, Math.min(PW, ps.getLastColumn())).getValues(); subs = pi.map(i => jsonOf_('PhieuKS', vals[i - a])); }
  return JSON.stringify({ reports: reports, manual: manual, subs: subs, prevWeek: prevWeek });
}
/** Báo cáo tuần gần nhất TRƯỚC kỳ bắt đầu từ ngày `from` (đã lưu, bản mới - v2). */
function prevWeek_(from) {
  const ks = col_('TongHopKy', 0).filter(k => k.indexOf('W-') === 0 && k.slice(2) < from).sort().reverse().slice(0, 6);
  for (const k of ks) { const w = jsonOf_('TongHopKy', rowOf_('TongHopKy', 0, k)); if (w && w.v === 2) return w; }   // bỏ qua bản tuần kiểu cũ
  return null;
}
function weekGet_(key) { const row = rowOf_('TongHopKy', 0, key); return row ? jsonOf_('TongHopKy', row) : null; }
function weekWrite_(w) {
  const old = rowOf_('TongHopKy', 0, w.key), rv = w.review || {}, jc = jsonCells_(strip_(w), 'Báo cáo tuần ' + (w.no || ''));
  ensureHeader_('TongHopKy');
  upsertRow_('TongHopKy', 0, w.key, [w.key, 'week', w.from, w.to, (w.overall || {}).eval || '', old ? old[5] : '', now_(), jc[0], w.no || '', w.status || 'draft', w.version || 0,
    REVIEW_TXT[rv.status] || '', rv.status === 'approved' ? rv.code : '', jc[1], jc[2], jc[3]]);
}
function apiSavePeriod(token, json) {
  const me = auth_(token, ['admin', 'chot']);
  const p = JSON.parse(json);
  if (p.v === 2) return saveWeek_(me, p);
  const old = rowOf_('TongHopKy', 0, p.key);
  upsertRow_('TongHopKy', 0, p.key, [p.key, p.kind, p.from, p.to, p.evaluation || '', old ? old[5] : '', now_(), json]);
  return true;
}

/** Lưu báo cáo tuần. Chốt → ghi bảng Tuan_*. Giữ trạng thái TVGS do máy chủ quản lý; tuần đã chốt không sửa được (mở khóa trước). */
function saveWeek_(me, w) {
  const c = cfg_(), lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const old = weekGet_(w.key);
    if (old && old.status === 'locked' && w.status === 'locked') return JSON.stringify({ ok: true, review: old.review || null, noop: true });
    w.review = old ? old.review || null : null;
    if (old && old.status === 'locked' && w.status !== 'locked') {           // mở khóa
      if (w.review) w.review = { lastNote: w.review.note || '', lastStatus: w.review.status }; log_(me.id, 'MO_KHOA_TUAN', w.to, w.key + ' → v' + w.version); }
    if (w.status === 'locked' && !(old && old.status === 'locked')) { w.lockedAt = now_(); w.lockedBy = me.id; if (reviewOn_(c)) w.review = { status: 'pending', version: w.version };
      log_(me.id, 'CHOT_TUAN', w.to, 'Tuần ' + w.no + ' v' + w.version); }
    const imgs = (w.gantt || []).filter(g => g && g.img && !g.fileId);
    if (imgs.length) { const f = subFolder_(rootFolder_(), 'Tuan'); (w.gantt || []).forEach((g, i) => uploadImg_(g, f, w.key + '_gantt_' + (i + 1))); }
    if ((w.layouts || []).some(l => l && l.img && !l.fileId)) { const f = subFolder_(rootFolder_(), 'Tuan'); w.layouts.forEach((l, i) => uploadImg_(l, f, w.key + '_mb_' + (i + 1) + '_' + Date.now())); }
    if ((w.photos || []).some(x => x && x.img && !x.fileId)) { const f = subFolder_(rootFolder_(), 'Tuan'); w.photos.forEach((x, i) => uploadImg_(x, f, w.key + '_anh_' + (i + 1) + '_' + Date.now())); }
    weekWrite_(w);
    if (w.status === 'locked') writeWeekTables_(w, c);
    return JSON.stringify({ ok: true, review: w.review || null, gantt: (w.gantt || []).map(g => g.fileId || ''), layouts: (w.layouts || []).map(l => (l && l.fileId) || ''), photos: (w.photos || []).map(x => (x && x.fileId) || ''), lockedAt: w.lockedAt || '' });
  } finally { lock.releaseLock(); }
}
const pctW_ = v => (v === '' || v == null || isNaN(Number(v))) ? '' : Math.round(Number(v) * 100) / 100;
function writeWeekTables_(w, c) {
  const k = w.key, n = w.no || '', o = w.overall || {}, zn = id => { const z = c.zones.find(x => x.id === id); return z ? z.name : ''; };
  const diff = o.actual !== '' && o.plan !== '' && o.actual != null && o.plan != null ? pctW_(Number(o.actual) - Number(o.plan)) : '';
  const mpAvg = (w.manpower || []).reduce((a, m) => a + (Number(m.avg) || 0), 0);
  const RT = { good: 'Tốt', mid: 'Trung bình', bad: 'Kém' }, rt = w.ratings || {};
  WEEK_SHEETS.forEach(ensureHeader_);
  replaceDay_('Tuan_TienDo', k, [[k, n, w.from, w.to, pctW_(o.plan), pctW_(o.actualPrev), pctW_(o.actual), diff, o.eval || '', pctW_(o.planNext), o.rev || '',
    RT[rt.safety] || '', RT[rt.work] || '', RT[rt.resource] || '', Math.round(mpAvg * 10) / 10, o.note || '']]);
  const cv = [];
  (w.tasks || []).forEach((t, i) => cv.push([k, n, 'THUC_HIEN', t.section || '', zn(t.zoneId) || t.zone || '', i + 1, t.desc, t.unit || '', t.qty === '' ? '' : Number(t.qty) || 0,
    pctW_(t.startPct), pctW_(t.planPct), pctW_(t.actual), t.actual !== '' && t.planPct !== '' && t.actual != null && t.planPct != null ? pctW_(t.actual - t.planPct) : '', t.note || '']));
  (w.nextPlans || []).forEach((t, i) => cv.push([k, n, 'KE_HOACH_TUAN_SAU', t.section || '', zn(t.zoneId) || t.zone || '', i + 1, t.desc, '', '', '', pctW_(t.target), '', '', t.note || '']));
  replaceDay_('Tuan_CongViec', k, cv);
  replaceDay_('Tuan_VatTu', k, (w.materials || []).map(m => [k, n, 'NHAP_VE', m.name, m.spec || '', m.unit || '', Number(m.prev) || 0, Number(m.now) || 0, (Number(m.prev) || 0) + (Number(m.now) || 0), ''])
    .concat((w.matPlans || []).map(m => [k, n, 'KE_HOACH', m.name, m.spec || '', m.unit || '', '', Number(m.qty) || 0, '', m.date || ''])));
  replaceDay_('Tuan_NhanLuc', k, (w.manpower || []).map(m => [k, n, 'NHAN_LUC', m.title, m.avg, m.max, m.total])
    .concat((w.equipment || []).map(m => [k, n, 'THIET_BI', m.name, m.avg, m.max, ''])));
  replaceDay_('Tuan_NghiemThu', k, (w.inspections || []).map(x => [k, n, 'NGHIEM_THU', x.date || '', x.desc, x.loc || '', x.result || ''])
    .concat((w.tests || []).map(x => [k, n, 'THI_NGHIEM', x.date || '', x.desc, x.loc || '', x.result || '']))
    .concat((w.inspPlans || []).map(x => [k, n, 'KE_HOACH', x.date || '', x.desc, x.loc || '', ''])));
  const sf = w.safety || {};
  replaceDay_('Tuan_AnToan', k, [[k, n, 'NHAN_XET', '', sf.summary || '', '']]
    .concat((sf.activities || []).map(x => [k, n, 'HOAT_DONG', x.date || '', x.desc, '']))
    .concat((sf.issues || []).map(x => [k, n, 'VI_PHAM', x.date || '', x.desc, x.action || ''])));
  replaceDay_('Tuan_HoSo', k, (w.submittals || []).map(x => [k, n, 'HO_SO', x.tab || '', x.code || '', x.desc || '', x.count || '', x.date || '', x.resDate || '', REG_TXT_[x.st] || x.raw || '', x.link || ''])
    .concat((w.docs || []).map(x => [k, n, 'VAN_BAN', x.tab || '', x.code || '', x.desc || '', '', x.date || '', '', '', ''])));
}

/* ======================= HỒ SƠ ĐỆ TRÌNH (đọc file theo dõi Google Sheet, chỉ đọc) ======================= */
const REG_TXT_ = { approved: 'Đã duyệt', returned: 'Trả về chỉnh sửa', rejected: 'Từ chối', pending: 'Chờ duyệt', review: 'TVGS đang kiểm tra' };
const nrm_ = v => String(v == null ? '' : v).toLowerCase().replace(/\s+/g, ' ').trim();
function sheetIdOf_(s) { s = String(s || '').trim(); const m = s.match(/\/d\/([\w-]{20,})/) || s.match(/[?&]id=([\w-]{20,})/); return m ? m[1] : (/^[\w-]{20,}$/.test(s) ? s : ''); }
/** Ngày trong sổ: ô kiểu ngày → giữ nguyên; chữ dd/mm/yy(yy) hoặc m/d/yyyy (khi số đầu ≤ 12 coi là ngày/tháng). */
function regDate_(v) {
  if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  const m = String(v || '').trim().match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/); if (!m) return '';
  let d = +m[1], mo = +m[2], y = +m[3]; if (y < 100) y += 2000; if (mo > 12 && d <= 12) { const t = d; d = mo; mo = t; }
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return '';
  return y + '-' + String(mo).padStart(2, '0') + '-' + String(d).padStart(2, '0');
}
/** Tìm dòng tiêu đề (có cột Date… và Description / MC Code) + nhận cột theo tên. */
function regScan_(vals, c) {
  const cs = nrm_((c.project || {}).consultantShort), hi = vals.slice(0, 25).findIndex(r => r.some(x => /^date/.test(nrm_(x))) && r.some(x => /description|mc code|nội dung/.test(nrm_(x))));
  if (hi < 0) return null;
  const H = vals[hi].map(nrm_), f = re => H.findIndex(re);
  const col = { date: f(h => /^date/.test(h)), code: f(h => /code|số hiệu/.test(h)), desc: f(h => /description|nội dung/.test(h)), count: f(h => /submission count|lần trình/.test(h)),
    status: f(h => /^status/.test(h)), link: f(h => /link/.test(h)), ret: f(h => /returned/.test(h)),
    tvgs: f(h => /date/.test(h) && (/tvgs|consultant/.test(h) || (cs && h.indexOf(cs) >= 0)) && !/to pmh|pmh/.test(h)), pmh: f(h => /approved/.test(h)) };
  // không thấy tên TVGS trong tiêu đề → cột ngày đầu tiên sau "Description" không phải ngày trình/dự kiến/trả về/gửi đi/SPM
  if (col.tvgs < 0) col.tvgs = H.findIndex((h, i) => i > col.desc && i !== col.date && /date/.test(h) && !/planned|returned|^to |spm|hard copy\)?$/.test(h) && i !== col.pmh);
  return { hi: hi, col: col, H: H };
}
function regStatus_(raw, hasTvgs) {
  const s = String(raw || '').trim(); if (!s) return hasTvgs ? 'review' : 'pending';
  if (/hủy|huỷ|huy |cancel/i.test(s)) return 'cancel';
  const fin = s.split('/').pop().trim().toUpperCase();
  if (/^[AB]$/.test(fin)) return 'approved'; if (fin === 'C') return 'returned'; if (fin === 'D') return 'rejected';
  return 'other';
}
/** Quản trị dán link file theo dõi → nhận các trang tính, đoán loại (đệ trình / văn bản / bỏ qua). */
function apiCheckRegister(token, link) {
  auth_(token, ['admin']); const c = cfg_();
  const id = sheetIdOf_(link); if (!id) throw new Error('Link không hợp lệ – mở file Google Sheet, sao chép link trên thanh địa chỉ (dạng …/spreadsheets/d/…)');
  let ss; try { ss = SpreadsheetApp.openById(id); ss.getName(); } catch (e) { throw new Error('Không mở được file. Tài khoản triển khai app cần có quyền **xem** file theo dõi hồ sơ này.'); }
  const tabs = ss.getSheets().map(sh => { const name = sh.getName(), n = Math.min(sh.getLastRow(), 40), vals = n ? sh.getRange(1, 1, n, Math.max(1, sh.getLastColumn())).getValues() : [];
    const sc = regScan_(vals, c); if (!sc) return { name: name, type: 'off', note: 'không thấy dòng tiêu đề' };
    const isDoc = /^(si|warning|nrc|ncr|penalty|letter)|bc nl/i.test(name.trim()) || sc.col.status < 0;
    return { name: name, type: isDoc ? 'doc' : 'sub', rows: Math.max(0, sh.getLastRow() - sc.hi - 1), cols: Object.keys(sc.col).filter(k => sc.col[k] >= 0).map(k => k + ': ' + vals[sc.hi][sc.col[k]]).join(' · ') }; });
  return JSON.stringify({ id: id, name: ss.getName(), url: 'https://docs.google.com/spreadsheets/d/' + id, tabs: tabs });
}
/** Hồ sơ phát sinh trong tuần: trình trong tuần (mọi tình trạng) + trình trước nhưng có kết quả trong tuần; văn bản phát hành trong tuần. */
function apiRegisterWeek(token, from, to) {
  auth_(token); const c = cfg_(), reg = (c.settings || {}).register;
  if (!reg || !reg.id) throw new Error('Chưa khai báo file theo dõi hồ sơ (Cấu hình → Cài đặt)');
  let ss; try { ss = SpreadsheetApp.openById(reg.id); } catch (e) { throw new Error('Không mở được file theo dõi hồ sơ – kiểm tra quyền xem'); }
  const inR = d => d && d >= from && d <= to, subs = [], docs = [];
  (reg.tabs || []).filter(t => t.type === 'sub' || t.type === 'doc').forEach(t => {
    const sh = ss.getSheetByName(t.name); if (!sh || sh.getLastRow() < 2) return;
    const vals = sh.getRange(1, 1, Math.min(sh.getLastRow(), 3000), Math.max(1, sh.getLastColumn())).getValues(), sc = regScan_(vals, c); if (!sc) return;
    const C = sc.col, g = (r, k) => C[k] >= 0 ? r[C[k]] : '';
    vals.slice(sc.hi + 1).forEach(r => {
      const code = String(g(r, 'code') || '').replace(/\s*\n\s*/g, ' ').trim(), desc = String(g(r, 'desc') || '').split('\n')[0].trim(); if (!code && !desc) return;
      const d = regDate_(g(r, 'date'));
      if (t.type === 'doc') { if (inR(d)) docs.push({ tab: t.name, code: code, desc: desc, date: d }); return; }
      const tv = regDate_(g(r, 'tvgs')), pm = regDate_(g(r, 'pmh')), rt = regDate_(g(r, 'ret')), raw = String(g(r, 'status') || '').trim(), st = regStatus_(raw, !!tv);
      if (st === 'cancel') return;
      const res = [tv, pm, rt].filter(Boolean).sort().pop() || '';
      if (inR(d) || (['approved', 'returned', 'rejected'].indexOf(st) >= 0 && inR(res)))
        subs.push({ tab: t.name, group: /mep|pccc|hvac/i.test(t.name) ? 'MEP' : 'XD', code: code, desc: desc, count: g(r, 'count') === '' ? '' : String(g(r, 'count')), date: d, resDate: res, st: st, raw: raw, link: String(g(r, 'link') || '') });
    });
  });
  subs.sort((a, b) => (a.date || a.resDate) < (b.date || b.resDate) ? -1 : 1); docs.sort((a, b) => a.date < b.date ? -1 : 1);
  return JSON.stringify({ subs: subs, docs: docs, at: now_() });
}
/** TVGS kiểm tra báo cáo tuần: 'approve' | 'return' (bắt buộc ghi chú). */
function apiReviewPeriod(token, key, action, note) {
  const me = auth_(token, ['admin', 'tvgs']), c = cfg_();
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const w = weekGet_(key);
    if (!w || w.status !== 'locked') throw new Error('Báo cáo tuần chưa được nhà thầu chốt');
    if (w.review && w.review.status === 'approved' && action === 'approve') throw new Error('Báo cáo tuần đã được xác nhận');
    if (action === 'approve') {
      w.review = { status: 'approved', by: me.id, at: now_(), code: vcode_(w), version: w.version || 1 };
      w.review.url = verifyUrl_(w.review.code);
      log_(me.id, 'TVGS_XAC_NHAN_TUAN', w.to, w.review.code + ' · Tuần ' + w.no + ' v' + w.review.version);
    } else {
      if (!String(note || '').trim()) throw new Error('Ghi rõ nội dung cần nhà thầu sửa');
      w.review = { status: 'returned', by: me.id, at: now_(), note: String(note).trim(), version: w.version || 1 };
      w.status = 'draft';
      log_(me.id, 'TVGS_YEU_CAU_SUA_TUAN', w.to, w.review.note);
    }
    weekWrite_(w);
    return JSON.stringify(w.review);
  } finally { lock.releaseLock(); }
}
/** Tải file (PDF MS Project) lên Drive – ai có link đều xem được (mở từ QR). */
function apiUploadFile(token, dataUrl, name) {
  auth_(token, ['admin', 'chot']);
  const m = String(dataUrl).match(/^data:(.+?);base64,(.*)$/); if (!m) throw new Error('File không hợp lệ');
  const f = subFolder_(rootFolder_(), 'MSP').createFile(Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], String(name || 'MSP.pdf')));
  try { f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
  return JSON.stringify({ fileId: f.getId(), url: f.getUrl(), name: f.getName() });
}

/** HTML → PDF. Ảnh được giao diện đánh dấu src="fid:<fileId>" → máy chủ tự chèn từ Drive (đỡ gửi dữ liệu nặng từ điện thoại). */
function apiExportPdf(token, html, fileName, key, kind) {
  const me = auth_(token, ['admin', 'chot']), c = cfg_();
  if (kind === 'day' && reviewOn_(c)) { const r = dayData_(key).report;
    if (!r || !r.review || r.review.status !== 'approved') throw new Error('Báo cáo chưa được TVGS xác nhận nội dung – chưa xuất PDF chính thức được'); }
  if (kind === 'week') { const w = weekGet_(key);
    if (!w || w.status !== 'locked') throw new Error('Chốt báo cáo tuần trước khi xuất PDF');
    if (reviewOn_(c) && (!w.review || w.review.status !== 'approved')) throw new Error('Báo cáo tuần chưa được TVGS xác nhận nội dung – chưa xuất PDF chính thức được'); }
  const got = {};   // ảnh trình duyệt chưa gửi kèm → đọc từ Drive (mỗi ảnh 1 lần)
  html = String(html).replace(/src="fid:([\w-]+)"/g, (m, id) => { try { return 'src="' + (got[id] = got[id] || dataUrl_(id)) + '"'; } catch (e) { return 'src=""'; } });
  const folder = pdfFolder_(c, kind, key);
  const old = folder.getFilesByName(fileName); while (old.hasNext()) old.next().setTrashed(true);
  const pdf = Utilities.newBlob(html, 'text/html', 'bc.html').getAs('application/pdf').setName(fileName);
  const file = folder.createFile(pdf), url = file.getUrl();
  // Báo cáo ngày đã được TVGS xác nhận: ai có link đều xem được (chỉ xem) – để mở từ QR trên điện thoại
  if (kind === 'day' || kind === 'week') { try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {} }
  if (kind === 'day') { setCell_('BaoCao', key, 'pdf_url', url); cdel_(['day:' + key]); }
  else setCell_('TongHopKy', key, 'pdf_url', url);
  log_(me.id, 'XUAT_PDF', kind === 'day' ? key : '', fileName);
  return url;
}

/** Chuyển dự án: copy Google Sheet làm lưu trữ → xóa dữ liệu (giữ tiêu đề), thu hồi phiên, xóa bộ đệm. */
function apiResetAll(token) {
  auth_(token, ['admin']);
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const idx = index_();
    let url = '';
    if (kv_('config')) {
      const name = 'LƯU TRỮ_' + (projectCode_() || 'DU_AN') + '_' + Utilities.formatDate(new Date(), TZ, 'yyyyMMdd_HHmm');
      url = DriveApp.getFileById(ss_().getId()).makeCopy(name, rootFolder_()).getUrl();
    }
    Object.keys(SCHEMA).forEach(n => { const sh = sheet_(n); if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, SCHEMA[n].length).clearContent(); forget_(n); });
    const props = PropertiesService.getScriptProperties(); Object.keys(props.getProperties()).filter(k => k.indexOf('tok_') === 0).forEach(k => props.deleteProperty(k));
    const dates = idx.reports.map(r => 'day:' + r.date).concat(idx.subs.map(s => 'day:' + s.date));
    cdel_(['cfg', 'idx'].concat(dates));
    return url;
  } finally { lock.releaseLock(); }
}

/* ======================= HÀM PHỤ: DỮ LIỆU ======================= */
const MEMO = {};                      // ghi nhớ trong 1 lần chạy
function ss_() { return MEMO._ss || (MEMO._ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActive()); }
function now_() { return Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy HH:mm'); }
function cache_() { return CacheService.getScriptCache(); }
function cget_(k) { try { const v = cache_().get(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
function cput_(k, o) { try { const s = JSON.stringify(o); if (s.length < 95000) cache_().put(k, s, CACHE_TTL); } catch (e) {} }
function cdel_(keys) { try { cache_().removeAll(keys); } catch (e) {} keys.forEach(k => { delete MEMO['c:' + k]; }); }

function cfg_() {
  if (MEMO.cfg !== undefined) return MEMO.cfg;
  let c = cget_('cfg');
  if (!c) { const s = kv_('config'); c = s ? JSON.parse(s) : null; if (c) cput_('cfg', c); }
  return (MEMO.cfg = c);
}
function saveCfg_(c) { setKv_('config', JSON.stringify(c)); MEMO.cfg = c; delete MEMO.root; cdel_(['cfg', 'links']); }
function mergeWbs_(add) {
  if (!add || !Object.keys(add).length) return;
  const c = cfg_(); c.wbsMemory = c.wbsMemory || {}; let ch = false;
  Object.keys(add).forEach(k => { if (c.wbsMemory[k] !== add[k]) { c.wbsMemory[k] = add[k]; ch = true; } });
  if (ch) saveCfg_(c);
}
function index_() {
  if (MEMO.idx) return MEMO.idx;
  let idx = idxDec_(cget_('idx'));
  if (!idx) {
    const rb = sheet_('BaoCao'), nb = rb.getLastRow() - 1, rp = sheet_('PhieuKS'), np = rp.getLastRow() - 1;
    const b = nb > 0 ? rb.getRange(2, 1, nb, 3).getValues() : [], p = np > 0 ? rp.getRange(2, 2, np, 5).getValues() : [];
    const rc = SCHEMA.BaoCao.indexOf('tvgs_kiem_tra'), rv = nb > 0 && rb.getLastColumn() > rc ? rb.getRange(2, rc + 1, nb, 1).getValues() : [];
    const RV = { CHO_KIEM_TRA: 'pending', YEU_CAU_SUA: 'returned', DA_XAC_NHAN: 'approved' };
    idx = { reports: b.map((r, i) => ({ date: String(r[0]), status: r[1], version: r[2], review: RV[(rv[i] || [])[0]] || '' })).filter(r => r.date),
            subs: p.filter(r => r[0]).map(r => ({ date: String(r[0]), uid: r[1], status: r[4] })), testDays: testDays_() };
    // Phiếu của ngày đã chốt quá IDX_DAYS ngày: bỏ chi tiết (ngày vẫn còn trong danh sách báo cáo) → chỉ mục không phình theo thời gian
    const cut = Utilities.formatDate(new Date(Date.now() - IDX_DAYS * 864e5), TZ, 'yyyy-MM-dd'), lk = {};
    idx.reports.forEach(r => { if (r.status === 'locked') lk[r.date] = 1; });
    idx.subs = idx.subs.filter(x => !(x.date < cut && lk[x.date]));
    cput_('idx', idxEnc_(idx));
  }
  return (MEMO.idx = idx);
}
/** {report, subs} của 1 ngày – đọc đúng các dòng cần thiết, có bộ đệm. */
function dayData_(d) {
  const ck = 'day:' + d;
  if (MEMO['c:' + ck]) return MEMO['c:' + ck];
  let v = cget_(ck);
  if (!v) {
    const row = rowOf_('BaoCao', 0, d);
    const report = row ? jsonOf_('BaoCao', row) : null;
    const keys = col_('PhieuKS', 1), sh = sheet_('PhieuKS'), W = SCHEMA.PhieuKS.length;
    const ri = []; keys.forEach((k, i) => { if (k === String(d)) ri.push(i); });
    let subs = [];
    if (ri.length) { const a = Math.min.apply(null, ri), b = Math.max.apply(null, ri);
      const vals = sh.getRange(a + 2, 1, b - a + 1, Math.min(W, sh.getLastColumn())).getValues(); subs = ri.map(i => jsonOf_('PhieuKS', vals[i - a])); }
    v = { report: report, subs: subs };
    cput_(ck, v);
  }
  return (MEMO['c:' + ck] = v);
}

function sheet_(name) {
  if (MEMO['sh:' + name]) return MEMO['sh:' + name];
  let sh = ss_().getSheetByName(name);
  if (!sh) {
    sh = ss_().insertSheet(name);
    const h = SCHEMA[name];
    sh.getRange(1, 1, 1, h.length).setValues([h]).setFontWeight('bold').setBackground('#eef2ff');
    sh.setFrozenRows(1);
    sh.getRange('A:B').setNumberFormat('@');
    if (name === 'TongHopKy') sh.getRange('C:D').setNumberFormat('@');
    ['json', 'json_2', 'json_3', 'json_4'].forEach(k => { const i = h.indexOf(k); if (i >= 0) sh.hideColumns(i + 1); });
  }
  return (MEMO['sh:' + name] = sh);
}
/** Một cột (dạng chuỗi) – ghi nhớ trong lần chạy. */
function col_(name, c) {
  const k = 'col:' + name + ':' + c; if (MEMO[k]) return MEMO[k];
  const sh = sheet_(name), n = sh.getLastRow() - 1;
  return (MEMO[k] = n > 0 ? sh.getRange(2, c + 1, n, 1).getValues().map(r => String(r[0])) : []);
}
function rowOf_(name, keyCol, key) {
  const i = col_(name, keyCol).indexOf(String(key)); if (i < 0) return null;
  return sheet_(name).getRange(i + 2, 1, 1, SCHEMA[name].length).getValues()[0];
}
function forget_(name) { Object.keys(MEMO).forEach(k => { if (k.indexOf('col:' + name + ':') === 0) delete MEMO[k]; }); }
/** Sửa đúng 1 dòng theo khóa, chưa có thì thêm cuối bảng. */
function upsertRow_(name, keyCol, key, row) {
  const sh = sheet_(name), w = SCHEMA[name].length, i = col_(name, keyCol).indexOf(String(key));
  const r = row.map(v => v == null ? '' : v);
  if (i >= 0) sh.getRange(i + 2, 1, 1, w).setValues([r]);
  else sh.getRange(sh.getLastRow() + 1, 1, 1, w).setValues([r]);
  forget_(name);
}
/** Xóa các dòng có cột keyCol = d (xóa theo khối liền nhau, từ dưới lên) rồi thêm các dòng mới cuối bảng. */
function replaceDay_(name, d, rows, keyCol) {
  keyCol = keyCol || 0;
  const sh = sheet_(name), w = SCHEMA[name].length, n = sh.getLastRow() - 1;
  // tìm dòng của ngày bằng TextFinder (Google tìm phía máy chủ) – không đọc cả cột, bảng lớn vẫn nhanh
  const idx = n > 0 ? sh.getRange(2, keyCol + 1, n, 1).createTextFinder(String(d)).matchEntireCell(true).findAll().map(c => c.getRow()).sort((a, b) => a - b) : [];
  for (let e = idx.length - 1; e >= 0;) { let s = e; while (s > 0 && idx[s - 1] === idx[s] - 1) s--; sh.deleteRows(idx[s], e - s + 1); e = s - 1; }
  if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, w).setValues(rows.map(r => r.map(v => v == null ? '' : v)));
  forget_(name);
}
/** Bảng cũ thiếu cột mới (nâng cấp phiên bản) → ghi lại dòng tiêu đề. */
function ensureHeader_(name) {
  const sh = sheet_(name), h = SCHEMA[name];
  if (sh.getLastColumn() < h.length) { sh.getRange(1, 1, 1, h.length).setValues([h]).setFontWeight('bold').setBackground('#eef2ff');
    const j2 = h.indexOf('json_2'); if (j2 >= 0) try { sh.hideColumns(j2 + 1, 3); } catch (e) {} }
}
function setCell_(name, key, col, val) {
  const i = col_(name, 0).indexOf(String(key));
  if (i >= 0) sheet_(name).getRange(i + 2, SCHEMA[name].indexOf(col) + 1).setValue(val);
}
function kv_(k) { const r = rowOf_('CauHinh', 0, k); return r ? r[1] : null; }
function setKv_(k, v) { upsertRow_('CauHinh', 0, k, [k, v]); }
function log_(uid, act, d, detail) { try { sheet_('NhatKy').appendRow([now_(), userName_(cfg_(), uid), act, d || '', detail || '']); } catch (e) {} }

/* ======================= HÀM PHỤ: QUYỀN, ẢNH, DRIVE ======================= */
/** Link nhanh cho Quản trị: file Google Sheet dữ liệu + thư mục Drive ảnh/PDF của dự án (có bộ đệm). */
function links_() {
  let l = cget_('links');
  if (!l) { l = { sheet: ss_().getUrl(), folder: '', pdf: '' }; try { l.folder = rootFolder_().getUrl(); } catch (e) {}
    const st = (cfg_() || {}).settings || {}; if (st.pdfFolderId) { try { l.pdf = DriveApp.getFolderById(st.pdfFolderId).getUrl(); } catch (e) {} }
    cput_('links', l); }
  return l;
}
function userName_(c, uid) { const u = c && c.users.find(x => x.id === uid); return u ? u.name : (uid || ''); }
function projectCode_() { const c = cfg_(); return c ? (c.project.code || '') : ''; }
function driveUrl_(id) { return 'https://drive.google.com/file/d/' + id + '/view'; }
function salt_() {
  const p = PropertiesService.getScriptProperties(); let s = p.getProperty('salt');
  if (!s) { s = Utilities.getUuid(); p.setProperty('salt', s); }
  return s;
}
function hash_(uid, pin) {
  const b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt_() + '|' + uid + '|' + pin, Utilities.Charset.UTF_8);
  return b.map(x => ((x + 256) % 256).toString(16).padStart(2, '0')).join('');
}
function newToken_(uid, ttl) {
  const t = Utilities.getUuid().replace(/-/g, '');
  PropertiesService.getScriptProperties().setProperty('tok_' + t, JSON.stringify({ uid: uid, exp: Date.now() + (ttl || TOKEN_DAYS * 864e5), seen: Date.now() }));
  return t;
}
/** Số phiên KHÁC của cùng tài khoản có hoạt động trong 10 phút qua. */
function othersActive_(token, uid) {
  const all = PropertiesService.getScriptProperties().getProperties(), now = Date.now(); let n = 0;
  Object.keys(all).forEach(k => { if (k.indexOf('tok_') !== 0 || k === 'tok_' + token) return;
    try { const t = JSON.parse(all[k]); if (t.uid === uid && t.exp > now && t.seen && now - t.seen < 600000) n++; } catch (e) {} });
  return n;
}
function cleanTokens_() {
  const p = PropertiesService.getScriptProperties(), all = p.getProperties(), now = Date.now();
  Object.keys(all).forEach(k => { if (k.indexOf('tok_') === 0) { try { if (JSON.parse(all[k]).exp < now) p.deleteProperty(k); } catch (e) { p.deleteProperty(k); } } });
}
function auth_(token, roles) {
  const raw = token && PropertiesService.getScriptProperties().getProperty('tok_' + token);
  if (!raw) throw new Error('AUTH: phiên đăng nhập không hợp lệ');
  const t = JSON.parse(raw); if (t.exp < Date.now()) throw new Error('AUTH: phiên đăng nhập hết hạn');
  if (!t.seen || Date.now() - t.seen > 120000) { t.seen = Date.now(); PropertiesService.getScriptProperties().setProperty('tok_' + token, JSON.stringify(t)); }
  const c = cfg_(), u = c && c.users.find(x => x.id === t.uid);
  if (!u || u.active === false) throw new Error('AUTH: tài khoản không còn hoạt động');
  if (roles && roles.indexOf(u.role) < 0) throw new Error('Không có quyền thực hiện thao tác này');
  return u;
}
/* ======================= TỰ DỌN FILE CŨ ======================= */
/** Gọi ngầm sau khi chốt ngày (giao diện không chờ). Tối đa 1 lần/ngày. */
function apiCleanup(token) {
  auth_(token, ['admin', 'chot']);
  const p = PropertiesService.getScriptProperties(), today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  if (p.getProperty('CLEAN_DAY') === today) return JSON.stringify({ skipped: true });
  p.setProperty('CLEAN_DAY', today);
  const n = cleanOld_(25000); if (n) log_('', 'TU_DON_FILE', today, n + ' file quá ' + KEEP_MONTHS + ' tháng → thùng rác');
  return JSON.stringify({ trashed: n });
}
/** Chuyển vào thùng rác ảnh của ngày/tuần quá KEEP_MONTHS tháng, đã chốt + đã xuất PDF. Giữ ảnh mặt bằng còn được kế thừa. */
function cleanOld_(budgetMs, now) {
  const t0 = Date.now(), p = PropertiesService.getScriptProperties(), d0 = now ? new Date(now) : new Date();
  const cut = Utilities.formatDate(new Date(d0.getFullYear(), d0.getMonth() - KEEP_MONTHS, d0.getDate()), TZ, 'yyyy-MM-dd');
  const trash = id => { try { DriveApp.getFileById(id).setTrashed(true); return 1; } catch (e) { return 0; } };
  const hk = col_('HinhAnh', 0), hsrc = col_('HinhAnh', 1), hid = col_('HinhAnh', SCHEMA.HinhAnh.indexOf('file_id'));
  const keep = {}; hk.forEach((d, i) => { if (d >= cut && hsrc[i] === 'MAT_BANG' && hid[i]) keep[hid[i]] = 1; });
  let n = 0;
  // Ngày
  let upto = p.getProperty('CLEAN_UPTO') || '';
  const bk = col_('BaoCao', 0), bst = col_('BaoCao', 1), bpdf = col_('BaoCao', SCHEMA.BaoCao.indexOf('pdf_url'));
  const days = bk.map((d, i) => [d, i]).filter(([d]) => d > upto && d < cut).sort((a, b) => a[0] < b[0] ? -1 : 1);
  for (const [d, i] of days) {
    if (Date.now() - t0 > budgetMs) break;
    if (bst[i] === 'locked' && bpdf[i]) hk.forEach((x, j) => { if (x === d && hid[j] && !keep[hid[j]]) n += trash(hid[j]); });
    upto = d;
  }
  p.setProperty('CLEAN_UPTO', upto);
  // Tuần: ảnh Gantt + mặt bằng của báo cáo tuần
  let wup = p.getProperty('WCLEAN_UPTO') || '';
  const tk = col_('TongHopKy', 0), tto = col_('TongHopKy', 3), tst = col_('TongHopKy', SCHEMA.TongHopKy.indexOf('trang_thai')), tpdf = col_('TongHopKy', SCHEMA.TongHopKy.indexOf('pdf_url'));
  const weeks = tk.map((k, i) => [k, i]).filter(([k, i]) => k.indexOf('W-') === 0 && tto[i] < cut && k > wup).sort((a, b) => a[0] < b[0] ? -1 : 1);
  for (const [k, i] of weeks) {
    if (Date.now() - t0 > budgetMs) break;
    if (tst[i] === 'locked' && tpdf[i]) { const w = weekGet_(k) || {}; (w.gantt || []).concat(w.layouts || [], (w.photos || []).filter(x => x && x.manual)).forEach(x => { if (x && x.fileId && !keep[x.fileId]) n += trash(x.fileId); }); }
    wup = k;
  }
  p.setProperty('WCLEAN_UPTO', wup);
  return n;
}
function strip_(o) {
  const c = JSON.parse(JSON.stringify(o));
  (c.layouts || [c.layout]).concat(c.photos || [], c.extraPhotos || [], c.gantt || []).forEach(p => { if (p && p.fileId) p.img = ''; });
  return c;
}
function uploadImg_(o, folder, name) {
  if (!o || o.fileId || !o.img || String(o.img).indexOf('data:') !== 0) return;
  const m = o.img.match(/^data:(.+?);base64,(.*)$/);
  o.fileId = folder.createFile(Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], name + '.jpg')).getId();
}
function dataUrl_(id) { const b = DriveApp.getFileById(id).getBlob(); return 'data:' + b.getContentType() + ';base64,' + Utilities.base64Encode(b.getBytes()); }
function rootFolder_() {
  if (MEMO.root) return MEMO.root;
  const code = projectCode_() || 'DU_AN', name = ROOT_FOLDER_PREFIX + code, base = ROOT_FOLDER_ID ? DriveApp.getFolderById(ROOT_FOLDER_ID) : DriveApp;
  const find = n => { const it = base.getFoldersByName(n); return it.hasNext() ? it.next() : null; };
  let f = find(name);
  if (!f) { f = find(OLD_ROOT_PREFIX + code); if (f) f.setName(name); }      // thư mục tên cũ → đổi tên, giữ nội dung
  return (MEMO.root = f || base.createFolder(name));
}
function subFolder_(parent) {
  let f = parent;
  for (let i = 1; i < arguments.length; i++) { const it = f.getFoldersByName(arguments[i]); f = it.hasNext() ? it.next() : f.createFolder(arguments[i]); }
  return f;
}
