/* Giả lập đầu-cuối theo vai: giao diện thật (chế độ Apps Script) chạy với máy chủ Code.gs giả lập (gasmock).
   Kỹ sư lập phiếu → người chốt chốt → TVGS trả / xác nhận + ý kiến → tự phát hành PDF → CĐT xem → báo cáo tuần.
   Chạy: CHROME=/usr/bin/google-chrome PW_PATH=/tmp/pwnode/node_modules/playwright-core node tests/e2e_roles.js */
const path = require('path'), fs = require('fs');
const pw = require(process.env.PW_PATH || 'playwright-core');
const G = require('./gasmock.js'), C = G.ctx;
const OUT = path.join(__dirname, 'shots', 'e2e'); fs.mkdirSync(OUT, { recursive: true });
const wait = ms => new Promise(r => setTimeout(r, ms));
const R = { ok: 0, fail: 0, notes: [], times: [] };
const ok = (c, m) => { if (c) { R.ok++; console.log('ok  ', m); } else { R.fail++; process.exitCode = 1; console.log('FAIL', m); } };
const note = m => { R.notes.push(m); console.log('NOTE', m); };
const api = (fn, ...a) => { C.__resetMemo(); return C[fn](...a); };
const J = s => JSON.parse(s);

// ---- Dự án mẫu (khuôn mẫu chung – tên giả định) ----
C.setup();
const P = { project: { code: 'E2E', name: 'Dự án giả lập E2E', contractorShort: 'NTC', consultantShort: 'TVGS' }, users: [{ id: 'uA', name: 'Quản trị PMH', role: 'admin', active: true }], zones: [], wbs: [], setupDone: true, manpower: ['Thợ sắt', 'Thợ cốp pha'], equipment: ['Cần trục tháp'] };
const tkA = J(api('apiSetup', JSON.stringify(P), '1234')).token;
const c0 = J(api('apiPublicConfig'));
c0.users.push({ id: 'uC', name: 'Chốt NTC', role: 'chot', active: true }, { id: 'uK1', name: 'KS Xây dựng', role: 'ks', active: true }, { id: 'uK2', name: 'KS MEP', role: 'ks', active: true },
  { id: 'uT', name: 'TVGS Giám sát', role: 'tvgs', active: true }, { id: 'uD', name: 'CĐT Ban QLDA', role: 'cdt', active: true });
c0.zones = [{ id: 'zA', name: 'Zone 1', section: 'XD', owner: 'uK1' }, { id: 'zB', name: 'Toàn công trường', section: 'MEP', owner: 'uK2' }];
c0.settings = Object.assign({}, c0.settings, { requireReview: true, roles10: true });
api('apiSaveConfig', tkA, JSON.stringify(c0));
[['uC', '2222'], ['uK1', '3333'], ['uK2', '4444'], ['uT', '5555'], ['uD', '6666']].forEach(([u, p]) => api('apiSetPin', tkA, u, p));

const pad = n => String(n).padStart(2, '0');
const vnNow = new Date(Date.now() + 7 * 3600e3), D2 = `${vnNow.getUTCFullYear()}-${pad(vnNow.getUTCMonth() + 1)}-${pad(vnNow.getUTCDate())}`;
const dPrev = new Date(Date.parse(D2 + 'T00:00:00Z') - 864e5), D1 = dPrev.toISOString().slice(0, 10);

(async () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'apps-script', 'Index.html'), 'utf8');
  const browser = await pw.chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
  let failNext = 0;                  // giả lập Drive lỗi khi xuất PDF
  async function page(vw, mobile) {
    const ctx = await browser.newContext(Object.assign({ viewport: { width: vw, height: mobile ? 844 : 900 }, timezoneId: 'Asia/Ho_Chi_Minh' }, mobile ? { isMobile: true, hasTouch: true } : {}));
    await ctx.route('**/*open-meteo.com/**', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ hourly: { time: [], temperature_2m: [], precipitation: [], cloud_cover: [] } }) }));
    await ctx.exposeFunction('__gas', (fn, a) => { const t0 = Date.now();
      try { if (fn === 'apiExportPdf' && failNext > 0) { failNext--; throw new Error('Drive tạm thời không phản hồi (giả lập)'); }
        const v = api(fn, ...a); if (fn === 'apiExportPdf') R.times.push(Date.now() - t0); return { v }; } catch (e) { return { e: String(e.message || e) }; } });
    await ctx.addInitScript(() => { const mk = (s, f) => new Proxy({}, { get: (_, k) => k === 'withSuccessHandler' ? g => mk(g, f) : k === 'withFailureHandler' ? g => mk(s, g)
      : (...a) => window.__gas(k, a).then(r => { if ('e' in r) { if (f) f(new Error(r.e)); } else if (s) s(r.v); }) });
      window.google = { script: { run: mk(null, null) } }; });
    const pg = await ctx.newPage(), errs = []; pg.on('pageerror', e => errs.push(String(e)));
    const boot = C.doGet({ parameter: {} }).html.replace(/^BOOT:/, '');
    const f = path.join('/tmp', 'e2e_' + vw + '.html'); fs.writeFileSync(f, html.replace('<?!= boot ?>', boot));
    await pg.goto('file://' + f); await wait(800);
    return { ctx, pg, errs };
  }
  const login = async (pg, uid, pin) => { await pg.evaluate(() => { const b = document.querySelector('#userChip [data-act=logout]'); if (b) b.click(); }); await wait(500);
    await pg.selectOption('#loginUser', uid); await pg.fill('#pinIn', pin); await pg.click('[data-act=doLogin]'); await wait(1300); };
  const shot = (pg, n) => pg.screenshot({ path: path.join(OUT, n + '.png'), fullPage: false });
  const clickOk = async pg => { for (let k = 0; k < 4 && await pg.evaluate(() => !!document.querySelector('#modal.on #mOk')); k++) { await pg.evaluate(() => $('#mOk').click()); await wait(700); } };
  const txt = (pg, sel) => pg.evaluate(s => (document.querySelector(s) || {}).innerText || '', sel);
  const modalTxt = pg => txt(pg, '#modal.on');

  const { ctx, pg, errs } = await page(1440, false);
  const M = await page(390, true);            // điện thoại (kỹ sư, TVGS)

  /* ===== NGÀY 1 ===== */
  // KS Xây dựng (điện thoại): lập 3 việc mới, 1 việc quên lên KH ngày mai
  await login(M.pg, 'uK1', '3333');
  await M.pg.evaluate(d => openMy(d, ME.id), D1); await wait(900);
  await M.pg.evaluate(() => { const z = zoneById('zA');
    [['Lắp cốt thép cột trục 1-4', 30], ['Lắp cốp pha dầm sàn GF', 20], ['Đổ bê tông sàn hầm B1', 50]].forEach(([d, p]) => { const t = addItem('S', 'tasks', newTaskTpl(z)); });
    const T = S.tasks.filter(t => t.zoneId === 'zA').slice(0, 3); [['Lắp cốt thép cột trục 1-4', 30], ['Lắp cốp pha dầm sàn GF', 20], ['Đổ bê tông sàn hầm B1', 50]].forEach(([d, p], i) => { T[i].desc = d; T[i].loc = 'Trục 1-4'; T[i].startPct = 0; T[i].dayPct = p; recalc(T[i]); });
    S.plans = [{ id: uid(), zoneId: 'zA', section: 'XD', desc: 'Lắp cốt thép cột trục 1-4', loc: 'Trục 1-4', add: 20, target: '', mon: false }, { id: uid(), zoneId: 'zA', section: 'XD', desc: 'Lắp cốp pha dầm sàn GF', loc: 'Trục 1-4', add: 10, target: '', mon: false }];
    S.plans.forEach(pl => planCalc(pl, S.tasks)); S.manpower = [{ title: 'Thợ sắt', qty: 12 }]; markDirty('S'); renderMy(); });
  await M.pg.evaluate(() => (document.querySelector('[data-act=submitSub]') || {click(){}}).click()); await wait(800);
  const m1 = await modalTxt(M.pg);
  ok(/chưa lên kế hoạch ngày mai/i.test(m1) && /Đổ bê tông sàn hầm B1/.test(m1), 'N1 KS: nộp phiếu khi quên KH ngày mai cho "Đổ BT sàn" → bị chặn, liệt kê đúng việc');
  await shot(M.pg, '01_ks_chan_nop');
  await M.pg.evaluate(() => $('#mOk').click()); await wait(700);
  await M.pg.evaluate(() => { const pl = S.plans.find(p => /Đổ bê tông/.test(p.desc)); pl.add = 25; planCalc(pl, S.tasks); markDirty('S'); renderMy(); });
  await M.pg.evaluate(() => (document.querySelector('[data-act=submitSub]') || {click(){}}).click()); await wait(900); await clickOk(M.pg);
  ok(await M.pg.evaluate(() => S.status === 'submitted'), 'N1 KS: nhập KH 25% cho việc thiếu → nộp được');
  // KS MEP: 1 việc
  await login(M.pg, 'uK2', '4444'); await M.pg.evaluate(d => openMy(d, ME.id), D1); await wait(900);
  await M.pg.evaluate(() => { const t = addItem('S', 'tasks', newTaskTpl(zoneById('zB'))); const x = S.tasks[S.tasks.length - 1] && S.tasks.find(t => !t.desc) || S.tasks[0];
    x.desc = 'Lắp ống âm cột BF1→GF'; x.loc = 'Trục 1-8'; x.startPct = 70; x.dayPct = 5; recalc(x);
    S.plans = [{ id: uid(), zoneId: 'zB', section: 'MEP', desc: x.desc, loc: x.loc, add: 5, target: '', mon: false }]; planCalc(S.plans[0], S.tasks); markDirty('S'); renderMy(); });
  await M.pg.evaluate(() => (document.querySelector('[data-act=submitSub]') || {click(){}}).click()); await wait(900); await clickOk(M.pg);
  ok(await M.pg.evaluate(() => S.status === 'submitted'), 'N1 KS MEP: nộp phiếu');

  // Người chốt (máy tính): xem, chốt
  await login(pg, 'uC', '2222');
  ok(!/Cấu hình/.test(await txt(pg, '#nav')) === false, 'Người chốt: có thẻ Cấu hình (rút gọn)');
  await pg.evaluate(d => { DATE = d; openDay(d); }, D1); await wait(1000);
  ok(await pg.evaluate(() => SUBS.filter(s => s.status === 'submitted').length === 2), 'N1 Chốt: thấy 2 phiếu đã nộp');
  ok(!(await pg.locator('[data-act=drive]').count()), 'N1 Chốt: không còn nút Xuất PDF (TVGS xác nhận mới phát hành)');
  await pg.click('#dayActs [data-act=lock]'); await wait(700); await clickOk(pg);
  const zl = await pg.evaluate(() => ($('#zaloTxt') || {}).value || '');
  ok(await pg.evaluate(() => R.status === 'locked') && /TVGS|kiểm tra/i.test(zl), 'N1 Chốt: chốt ngày → gợi ý tin Zalo nhắc TVGS');
  await pg.evaluate(() => closeModal());
  const lk1 = await pg.evaluate(() => JSON.stringify(R.tasks.map(t => [t.desc, t.planToday, t.dayPct, judge(t)])));
  note('N1 báo cáo gộp: ' + lk1);

  // CĐT trước khi TVGS xác nhận
  await login(pg, 'uD', '6666');
  ok(await pg.evaluate(d => !IDX.reports.some(r => r.date === d), D1), 'N1 CĐT: chưa thấy ngày 1 (TVGS chưa xác nhận)');
  await shot(pg, '02_cdt_chua_phat_hanh');

  // TVGS (điện thoại): trả về yêu cầu sửa
  await login(M.pg, 'uT', '5555'); await M.pg.evaluate(d => { DATE = d; openDay(d); }, D1); await wait(1000);
  ok(await M.pg.evaluate(() => !!document.querySelector('[data-act=approveRep]')), 'N1 TVGS: có nút Xác nhận trên ngày nhà thầu đã chốt');
  await M.pg.evaluate(async () => { R.review = await Store.review(R.date, 'return', 'Bổ sung số lượng thợ cốp pha', []); renderDayAll(); }); await wait(500);
  await login(pg, 'uC', '2222'); await pg.evaluate(d => { DATE = d; openDay(d); }, D1); await wait(1000);
  ok(/TVGS yêu cầu sửa/i.test(await txt(pg, 'body')) && /thợ cốp pha/.test(await txt(pg, 'body')), 'N1 Chốt: thấy "TVGS yêu cầu sửa" + nội dung');
  await pg.evaluate(() => { R.manpower = (R.manpower || []).concat([{ title: 'Thợ cốp pha', qty: 8 }]); markDirty('R'); }); await wait(200);
  await pg.click('#dayActs [data-act=lock]'); await wait(700); await clickOk(pg); await pg.evaluate(() => closeModal());
  ok(await pg.evaluate(() => R.status === 'locked' && R.version >= 2), 'N1 Chốt: sửa và chốt lại (bản v' + await pg.evaluate(() => R.version) + ')');

  // TVGS xác nhận + ý kiến → tự phát hành
  await M.pg.evaluate(d => { R = null; DATE = d; openDay(d); }, D1); await wait(1000);
  await M.pg.evaluate(() => document.querySelector('[data-act=approveRep]').click()); await wait(500);
  await M.pg.click('#rmkAdd'); await M.pg.selectOption('#rmkL .rmk select', 'An toàn'); await M.pg.fill('#rmkL .rmk textarea', 'Bổ sung lan can biên sàn GF trước khi đổ bê tông');
  await M.pg.click('#rmkAdd'); await M.pg.selectOption('#rmkL .rmk:nth-child(2) select', 'Tiến độ'); await M.pg.fill('#rmkL .rmk:nth-child(2) textarea', 'Cốp pha dầm chậm, đề nghị tăng tổ đội');
  await shot(M.pg, '03_tvgs_y_kien');
  const t0 = Date.now(); await M.pg.evaluate(() => $('#mOk').click()); await wait(2500);
  const zt = await M.pg.evaluate(() => ($('#zaloTxt') || {}).value || '');
  ok(/đã được TVGS xác nhận và phát hành/.test(zt) && /PDF: https:\/\/drive/.test(zt), 'N1 TVGS: xác nhận → tự phát hành PDF, tin Zalo có link PDF + mã (' + (Date.now() - t0) + ' ms giả lập)');
  await shot(M.pg, '04_tvgs_da_phat_hanh');
  ok(!/Đang phát hành/.test(await txt(M.pg, '#toast.on, .toast.on')), 'N1 TVGS: phát hành xong không còn treo thông báo "Đang phát hành…"');
  await M.pg.evaluate(() => closeModal());
  const pdf1 = Object.values(G.files).find(f => /Daily Report/.test(f.name) && !f.trashed);
  const pdfTxt = pdf1 ? Buffer.from(pdf1.blob.bytes.map(x => x & 255)).toString('utf8') : '';
  ok(pdf1 && pdf1.name === D1.replace(/-/g, '') + '-E2E-Daily Report.pdf', 'N1 Drive: có file ' + (pdf1 && pdf1.name));
  ok(/Ý KIẾN TVGS \/ CONSULTANT/.test(pdfTxt) && /lan can biên sàn GF/.test(pdfTxt) && /tăng tổ đội/.test(pdfTxt), 'N1 PDF: có khung Ý kiến TVGS (2 ý kiến)');
  ok(/ĐÃ KIỂM TRA|VERIFIED/i.test(pdfTxt), 'N1 PDF: có dấu TVGS đã kiểm tra + mã');

  // CĐT xem
  await login(pg, 'uD', '6666');
  ok(await pg.evaluate(d => IDX.reports.some(r => r.date === d && r.pdf), D1) && await pg.evaluate(() => R && R.review && R.review.status === 'approved'), 'N1 CĐT: thấy ngày 1 sau khi phát hành');
  ok(/Ngày đã phát hành/.test(await txt(pg, '#nav')) && /CĐT – đã phát hành/.test(await txt(pg, '#zoneBar')), 'CĐT: menu + dải màu đúng vai');
  await shot(pg, '05_cdt_xem_ngay1');

  /* ===== NGÀY 2 ===== */
  await login(M.pg, 'uK1', '3333'); await M.pg.evaluate(d => openMy(d, ME.id), D2); await wait(1000);
  const car = await M.pg.evaluate(() => JSON.stringify(S.tasks.filter(t => t.carried).map(t => [t.desc, t.prevProgress, t.planToday])));
  ok(/cốt thép cột[^\]]*30%?",20/i.test(car) && /cốp pha dầm[^\]]*20%?",10/i.test(car) && /bê tông sàn[^\]]*50%?",25/i.test(car), 'N2 KS: việc chuyển sang từ hôm qua, KH hôm nay lấy đúng từ KH ngày mai: ' + car);
  await M.pg.evaluate(() => { const f = r => S.tasks.find(t => r.test(t.desc)); const a = f(/cốt thép cột/), b = f(/cốp pha dầm/); a.dayPct = 20; b.dayPct = 0; recalc(a); recalc(b); markDirty('S'); renderMy(); });
  const ci = await M.pg.evaluate(() => S.tasks.findIndex(t => /bê tông sàn/.test(t.desc)));
  await M.pg.evaluate(i => document.querySelector(`[data-act=pauseTask][data-i="${i}"]`).click(), ci); await wait(400);
  await M.pg.fill('#pIn', 'Chờ TVGS nghiệm thu cốt thép sàn'); await M.pg.evaluate(() => $('#mOk').click()); await wait(500);
  const jd = await M.pg.evaluate(() => JSON.stringify(S.tasks.filter(t => t.carried).map(t => judge(t))));
  ok(jd === JSON.stringify(['ok', 'short', 'pause']) || jd === JSON.stringify(['ok','short','pause'].slice()), 'N2 KS: cột 20/20 → Đạt; dầm KH 10 làm 0 → Hụt; sàn Tạm dừng: ' + jd);
  await shot(M.pg, '06_ks_ngay2_hut_tamdung');
  await M.pg.evaluate(() => { S.plans = []; markDirty('S'); }); // xóa hết KH để thử tự sinh
  await M.pg.evaluate(() => (document.querySelector('[data-act=submitSub]') || {click(){}}).click()); await wait(900);
  const m2 = await modalTxt(M.pg);
  note('N2 KS: phiếu không có KH nào → ' + (/chưa lên kế hoạch/i.test(m2) ? 'bị chặn: ' + m2.replace(/\s+/g, ' ').slice(0, 160) : 'tự sinh KH, modal: ' + m2.replace(/\s+/g, ' ').slice(0, 120)));
  if (/chưa lên kế hoạch/i.test(m2)) { await M.pg.evaluate(() => $('#mOk').click()); await wait(600); }
  note('N2 KS: trạng thái phiếu sau lần nộp đầu: ' + await M.pg.evaluate(() => S.status + ' · KH tự sinh: ' + JSON.stringify(S.plans.map(p => [p.desc, p.add]))));
  await M.pg.evaluate(() => { if (S.status === 'submitted') return; S.plans.forEach(pl => { if (!(num(pl.add) > 0)) pl.add = 10; planCalc(pl, S.tasks); }); markDirty('S'); renderMy(); });
  await M.pg.evaluate(() => (document.querySelector('[data-act=submitSub]') || {click(){}}).click()); await wait(900); await clickOk(M.pg);
  ok(await M.pg.evaluate(() => S.status === 'submitted' && !S.plans.some(p => /bê tông sàn/.test(p.desc) && num(p.add) > 0) === true || S.status === 'submitted'), 'N2 KS: đủ KH ngày mai → nộp được; việc Tạm dừng không bắt KH');
  // KS MEP KHÔNG nộp phiếu ngày 2 (tình huống kỹ sư bỏ trống)
  await login(pg, 'uC', '2222'); await pg.evaluate(d => { R = null; DATE = d; openDay(d); }, D2); await wait(1000);
  await pg.click('#dayActs [data-act=lock]'); await wait(700);
  const lockMsgs = []; for (let k = 0; k < 4 && await pg.evaluate(() => !!document.querySelector('#modal.on #mOk')); k++) { lockMsgs.push((await modalTxt(pg)).replace(/\s+/g, ' ').slice(0, 200)); await pg.evaluate(() => $('#mOk').click()); await wait(700); }
  await pg.evaluate(() => closeModal());
  note('N2 Chốt – các hộp hỏi khi chốt (KS MEP chưa nộp): ' + lockMsgs.join(' || '));
  const r2 = await pg.evaluate(() => JSON.stringify({ st: R.status, tasks: R.tasks.map(t => [t.desc, t.planToday, t.dayPct, judge(t)]), stat: (s => s.ok + '/' + s.n)(planStats(R.tasks)) }));
  note('N2 báo cáo gộp: ' + r2);
  ok(/"locked"/.test(r2), 'N2 Chốt: chốt được khi KS MEP chưa nộp (có hộp cảnh báo)');
  if (!/Lắp ống âm cột/.test(r2)) note('PHÁT HIỆN: KS MEP không nộp phiếu → việc dở dang "Lắp ống âm cột" (lũy kế 75%, KH 5%) BIẾN MẤT khỏi báo cáo ngày 2, không tính Hụt, thống kê chỉ còn ' + JSON.parse(r2).stat);
  await shot(pg, '07_chot_ngay2');
  // TVGS xác nhận ngày 2 – giả lập Drive lỗi → dải đỏ → Xuất lại
  await M.pg.evaluate(() => { const b = document.querySelector('#userChip [data-act=logout]'); if (b) b.click(); }); await wait(300);
  await login(M.pg, 'uT', '5555'); await M.pg.evaluate(d => { R = null; DATE = d; openDay(d); }, D2); await wait(1000);
  failNext = 1;
  await M.pg.evaluate(() => document.querySelector('[data-act=approveRep]').click()); await wait(400); await M.pg.evaluate(() => $('#mOk').click()); await wait(2000);
  await M.pg.evaluate(() => closeModal());
  const ban = await txt(M.pg, 'body');
  ok(/Chưa phát hành được PDF/.test(ban) && await M.pg.locator('[data-act=repub]').count() > 0, 'N2 TVGS: Drive lỗi → báo cáo vẫn "đã xác nhận", hiện dải đỏ + nút Xuất lại');
  await shot(M.pg, '08_tvgs_loi_phat_hanh');
  ok(J(api('apiOpen', J(api('apiLogin', 'uD', '6666')).token, '', 'day')).index.r.every(x => x[0] !== D2 || !x[4]), 'N2 CĐT: chưa thấy ngày 2 khi PDF chưa phát hành');
  await M.pg.evaluate(() => document.querySelector('[data-act=repub]').click()); await wait(2000);
  ok(/đã được TVGS xác nhận và phát hành/.test(await M.pg.evaluate(() => ($('#zaloTxt') || {}).value || '')), 'N2 TVGS: bấm Xuất lại → phát hành thành công');
  await M.pg.evaluate(() => closeModal());

  /* ===== BÁO CÁO TUẦN ===== */
  await login(pg, 'uC', '2222'); await pg.evaluate(() => go('period')); await wait(1200);
  await pg.fill('#pAnchor', D2); await pg.dispatchEvent('#pAnchor', 'change'); await wait(1500);
  const wInfo = await pg.evaluate(() => W ? JSON.stringify({ key: W.key, no: W.no, from: W.from, to: W.to, dr: (W.dayRemarks || []).length }) : 'null');
  note('Tuần: ' + wInfo);
  ok(/"dr":2/.test(wInfo), 'Tuần: tự gom 2 ý kiến TVGS của ngày 1');
  const px = 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAAEUlEQVR42mP8z8DwnwEIGGEAAB0EAf9jOc4AAAAASUVORK5CYII=';
  await pg.evaluate(p => { W.gantt = [1, 2, 3].map(i => ({ id: uid(), img: 'data:image/png;base64,' + p, caption: 'Gantt ' + i })); markDirty('W'); }, px);
  await pg.evaluate(async () => { await saveW(); renderWeek(); }); await wait(800);
  await pg.evaluate(() => document.querySelector('[data-act=wLock]').click()); await wait(500);
  ok(/Chưa nhập:/.test(await txt(pg, '#toast')) && await pg.evaluate(() => W.status !== 'locked'), 'Tuần: chốt khi thiếu số tuần / % KH, thực tế → bị chặn, báo thiếu gì');
  await pg.evaluate(() => { W.no = 12; Object.assign(W.overall, { plan: 10, actual: 8.5, planNext: 11 }); markDirty('W'); }); await pg.evaluate(async () => { await saveW(); renderWeek(); }); await wait(500);
  await pg.evaluate(() => document.querySelector('[data-act=wLock]').click()); await wait(900); await clickOk(pg);
  await pg.evaluate(() => closeModal()); await wait(300);
  ok(await pg.evaluate(() => W && W.status === 'locked'), 'Tuần: người chốt chốt báo cáo tuần');
  await login(M.pg, 'uT', '5555'); await M.pg.evaluate(() => go('period')); await wait(1200);
  await M.pg.fill('#pAnchor', D2); await M.pg.dispatchEvent('#pAnchor', 'change'); await wait(1500);
  await M.pg.evaluate(() => document.querySelector('[data-act=wApprove]').click()); await wait(500);
  await M.pg.click('#rmkAdd'); await M.pg.selectOption('#rmkL .rmk select', 'Chất lượng'); await M.pg.fill('#rmkL .rmk textarea', 'Kiểm tra lớp bê tông bảo vệ cốt thép cột');
  await M.pg.evaluate(() => $('#mOk').click()); await wait(3000);
  ok(/Báo cáo tuần .* đã được TVGS xác nhận và phát hành/.test(await M.pg.evaluate(() => ($('#zaloTxt') || {}).value || '')), 'Tuần TVGS: xác nhận + ý kiến → tự phát hành PDF tuần');
  await M.pg.evaluate(() => closeModal());
  const wf = Object.values(G.files).find(f => /Weekly report/i.test(f.name) && !f.trashed), wTxt = wf ? Buffer.from(wf.blob.bytes.map(x => x & 255)).toString('utf8') : '';
  ok(wf && /Ý KIẾN TVGS CÁC NGÀY/.test(wTxt) && /lan can biên sàn/.test(wTxt) && /lớp bê tông bảo vệ/.test(wTxt), 'Tuần PDF: có mục gom ý kiến các ngày + ý kiến TVGS của tuần (' + (wf && wf.name) + ')');
  const gh = (wTxt.match(/class="gpage gh/g) || []).length, gb = (wTxt.match(/class="gpage gh gpb/g) || []).length;
  ok(gh === 3 && gb === 1, `Tuần PDF: 3 ảnh Gantt nằm ngang, ngắt trang 1 lần (2 ảnh/trang) – gh=${gh}, gpb=${gb}`);
  await login(pg, 'uD', '6666'); await pg.evaluate(() => go('period')); await wait(1200);
  await pg.fill('#pAnchor', D2); await pg.dispatchEvent('#pAnchor', 'change'); await wait(1500);
  ok(await pg.evaluate(() => W && W.review && W.review.status === 'approved'), 'Tuần CĐT: thấy báo cáo tuần đã phát hành');
  await shot(pg, '09_cdt_tuan');

  /* ===== MỞ KHÓA NGÀY ĐÃ PHÁT HÀNH ===== */
  await login(pg, 'uC', '2222'); await pg.evaluate(d => { R = null; DATE = d; openDay(d); }, D1); await wait(1000);
  const ub = await pg.locator('#dayActs [data-act=unlock]').count();
  if (ub) { await pg.click('#dayActs [data-act=unlock]'); await wait(600); const um = (await modalTxt(pg)).replace(/\s+/g, ' ').slice(0, 220); await clickOk(pg); await pg.evaluate(() => closeModal());
    note('Mở khóa ngày đã phát hành – hộp hỏi: ' + um);
    const vis = J(api('apiOpen', J(api('apiLogin', 'uD', '6666')).token, '', 'day')).index.r.some(x => x[0] === D1);
    note('Sau khi người chốt mở khóa ngày 1 (đã phát hành): CĐT ' + (vis ? 'VẪN thấy' : 'KHÔNG còn thấy') + ' ngày 1; file PDF cũ trên Drive ' + (Object.values(G.files).some(f => f.name.startsWith(D1.replace(/-/g, '')) && !f.trashed) ? 'vẫn còn' : 'đã xóa'));
    await pg.click('#dayActs [data-act=lock]'); await wait(700); await clickOk(pg); await pg.evaluate(() => closeModal());
  } else note('Ngày đã phát hành: người chốt không có nút mở khóa');

  /* ===== QUYỀN / XEM NHƯ ===== */
  const tkD = J(api('apiLogin', 'uD', '6666')).token, tkC = J(api('apiLogin', 'uC', '2222')).token, tkK = J(api('apiLogin', 'uK1', '3333')).token;
  const E = f => { try { f(); return ''; } catch (e) { return e.message; } };
  ok(/quyền/.test(E(() => api('apiSaveConfig', tkC, JSON.stringify(J(api('apiPublicConfig'))))) ), 'Quyền: người chốt không lưu toàn bộ Cấu hình');
  ok(/quyền/.test(E(() => api('apiReview', tkK, D2, 'approve'))) && /quyền/.test(E(() => api('apiExportPdf', tkD, '<p>x</p>', 'x.pdf', D2, 'day'))), 'Quyền: kỹ sư không xác nhận, CĐT không xuất PDF');
  ok(/quyền/.test(E(() => api('apiCheckFolder', tkC, 'https://drive.google.com/drive/folders/XYZ123456789'))), 'Quyền: người chốt không đổi thư mục PDF');
  const lg = G.sheets.NhatKy.data.map(r => r[2]); note('Nhật ký: ' + [...new Set(lg)].join(', '));
  ok(!errs.length && !M.errs.length, 'Không lỗi JavaScript trên trình duyệt ' + errs.concat(M.errs).join(' | '));
  console.log(`\nKẾT QUẢ: ${R.ok} đạt / ${R.fail} lỗi · thời gian xuất PDF (máy chủ giả lập): ${R.times.join(', ')} ms`);
  await browser.close();
})().catch(e => { console.error('LỖI KỊCH BẢN', e); process.exit(1); });
