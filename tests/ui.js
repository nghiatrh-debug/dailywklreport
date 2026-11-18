/**
 * Kiểm thử giao diện (Playwright, Chromium headless) – chạy bản độc lập (dữ liệu demo CN8-2 trong trình duyệt).
 *   node tests/ui.js            → ảnh chụp ở tests/shots/
 * Biến môi trường: CHROME (đường dẫn trình duyệt có sẵn), PW_PATH (gói playwright-core nếu không cài 'playwright').
 */
const path = require('path'), fs = require('fs');
let pw; try { pw = require('playwright'); } catch (e) { pw = require(process.env.PW_PATH || 'playwright-core'); }
const URL = 'file://' + path.join(__dirname, '..', 'apps-script', 'Index.html');
const OUT = path.join(__dirname, 'shots'); fs.mkdirSync(OUT, { recursive: true });
let fails = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));

async function fresh(browser, opt) {
  const ctx = await browser.newContext(opt), pg = await ctx.newPage(), errs = [];
  // Giả lập Open-Meteo: sáng nắng, chiều mưa 3 mm, 26–33 °C
  await ctx.route('**/*open-meteo.com/**', r => { const T = [], tp = [], pr = [], cc = [];
    for (let h = 0; h < 24; h++) { T.push('2026-06-27T' + String(h).padStart(2,'0') + ':00'); tp.push(h < 6 ? 25 : h <= 14 ? 26 + (h - 6) * 0.875 : 30); pr.push(h >= 13 && h <= 15 ? 1 : 0); cc.push(h < 12 ? 15 : 80); }
    r.fulfill({ contentType: 'application/json', body: JSON.stringify({ hourly: { time: T, temperature_2m: tp, precipitation: pr, cloud_cover: cc } }) }); });
  pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto(URL); await pg.waitForSelector('[data-act=suSample]');
  await pg.click('[data-act=suSample]'); await pg.click('[data-act=suStart]'); await wait(1800);
  return { ctx, pg, errs };
}
async function login(pg, uid, pin) {
  await pg.evaluate(() => { const b = document.querySelector('#userChip [data-act=logout]'); if (b) b.click(); }); await wait(400);
  if (!login.copyOk) login.copyOk = /© 2026 H\.T\.N/.test(await pg.innerText('#login'));
  await pg.selectOption('#loginUser', uid); await pg.fill('#pinIn', pin); await pg.click('[data-act=doLogin]'); await wait(1000);
}
const shot = (pg, n) => pg.screenshot({ path: path.join(OUT, n + '.png') });

(async () => {
  const browser = await pw.chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });

  /* ---------- MÁY TÍNH ---------- */
  {
    const { ctx, pg, errs } = await fresh(browser, { viewport: { width: 1440, height: 900 } });
    const lg = await pg.evaluate(() => { const s = normSub({ date:'2026-11-10', uid:'u_than',
      tasks:[{zoneId:'zA',desc:'X',progress:'60%',prevProgress:'50%',target:'58%',carried:true},{zoneId:'zA',desc:'Y',progress:'20%'}], plans:[{zoneId:'zA',desc:'X',target:'70%'}] });
      return JSON.stringify([s.tasks[0].dayPct, s.tasks[0].planToday, judge(s.tasks[0]), s.tasks[1].dayPct, s.tasks[1].startPct, s.plans[0].add]); });
    ok(lg === JSON.stringify([10, 8, 'over', 20, 0, 10]), 'Đổi dữ liệu cũ sang mô hình % mới ' + lg);
    await pg.click('[data-tab=general]'); await wait(200); await pg.click('[data-act=wxFetch]'); await wait(600);
    const wx = await pg.evaluate(() => R.weather);
    ok(wx.am === 'Nắng / Sunny' && wx.pm === 'Mưa / Rain' && wx.temp === '26oC- 33oC', 'Thời tiết tự động: sáng nắng, chiều mưa, 26–33 °C ' + JSON.stringify(wx));
    ok(/Thời tiết: Open-Meteo/.test(await pg.innerText('#doc')), 'PDF ghi nguồn thời tiết');
    await pg.click('[data-tab=people]'); await wait(200);
    const n0 = await pg.evaluate(() => R.manpower.length);
    await pg.click('[data-act=add][data-path=manpower]'); await wait(300);
    ok(await pg.evaluate(n => R.manpower.length === n + 1 && !R.manpower[n].title && R.manpower[0].title && document.activeElement.dataset.path === 'manpower.' + n + '.title', n0), 'Nhân lực mới thêm vào CUỐI danh sách, con trỏ ở dòng mới');
    await pg.fill(`[data-path="manpower.${n0}.title"]`, 'Tổ cốp pha'); await wait(100);
    await pg.click(`[data-act=mv][data-path=manpower][data-i="${n0}"][data-d="-1"]`); await wait(200);
    ok(await pg.evaluate(n => R.manpower[n - 1].title === 'Tổ cốp pha', n0), 'Nút ▲ đưa dòng lên trên');
    const pdfRows = await pg.$$eval('#doc table.grid', t => (t.find(x => /Chức vụ/.test(x.innerText)) || {}).innerText || '');
    ok(pdfRows.indexOf('Tổ cốp pha') > pdfRows.indexOf('Chỉ huy trưởng'), 'PDF: tổ đội mới nằm dưới Quản lý dự án / Chỉ huy trưởng');
    await pg.click('[data-tab=status]'); await wait(200);
    const doc = await pg.innerText('#doc');
    ok(/LŨY KẾ HÔM QUA/i.test(doc) && /CHÊNH LỆCH/i.test(doc), 'PDF ngày có cột Lũy kế hôm qua / Chênh lệch');
    ok(/KẾ HOẠCH NGÀY MAI/i.test(doc) && /BẢN NHÁP/.test(doc), 'PDF có bảng kế hoạch riêng + dấu BẢN NHÁP khi chưa chốt');
    ok(/1\. CÔNG VIỆC THỰC HIỆN[\s\S]*2\. KẾ HOẠCH NGÀY MAI[\s\S]*3\. NGHIỆM THU[\s\S]*4\. VẬT TƯ NHẬP VỀ[\s\S]*5\. NHÂN LỰC[\s\S]*6\. THIẾT BỊ[\s\S]*7\. SỨC KHỎE[\s\S]*8\. MẶT BẰNG[\s\S]*9\. HÌNH ẢNH/i.test(doc), 'PDF ngày: thứ tự mục 1 Công việc … 4 Vật tư, 5 Nhân lực, 6 Thiết bị, 7 An toàn');
    ok(/Việc đạt kế hoạch/.test(await pg.innerText('#pane')), 'Tình trạng phiếu: thống kê đạt KH');
    await pg.click('[data-tab=tasks]'); await wait(200);
    ok(await pg.locator('#pane .jd.short').count() > 0 && /ngày liên tiếp/.test(await pg.innerText('#pane')), 'Chốt: có việc Hụt + “ngày liên tiếp”');
    await shot(pg, 'desk_chot_tasks');
    // ngày cũ đã chốt: dòng chốt
    await pg.selectOption('#dateSel', '2026-06-26'); await wait(600);
    ok(!/Chốt bởi/.test(await pg.innerText('#doc')), 'PDF ngày đã chốt: không còn dòng “Chốt bởi…”');

    await login(pg, 'u_than', '1111');
    ok(await pg.locator('#myPane table.ed').count() > 0, 'Kỹ sư (máy tính): bảng nhập');
    const prev = await pg.locator('#myPane .cumv').first().innerText();
    await pg.fill('#pg-0', '5'); await wait(200);
    const cum = await pg.innerText('#cv-0');
    ok(parseFloat(cum) === Math.min(100, parseFloat(prev) + 5), `Lũy kế tự tính: ${prev} + 5 = ${cum}`);
    await pg.fill('#pg-0', '500'); await wait(200);
    ok(parseFloat(await pg.innerText('#cv-0')) === 100, 'Chặn lũy kế > 100%');
    await pg.click('[data-act=add][data-path=tasks]'); await wait(300);
    ok(await pg.evaluate(() => document.activeElement && document.activeElement.dataset.path === 'tasks.0.desc'), 'Thêm việc: dòng mới ở đầu, con trỏ ở ô nội dung');
    ok(await pg.locator('#st-0').count() === 1, 'Việc mới có ô “% đã làm trước đó”');
    await shot(pg, 'desk_ks');

    /* ---- Đợt 3: TVGS kiểm tra nội dung ---- */
    await login(pg, 'u_tvgs', '3333');
    ok(/Kiểm tra báo cáo ngày/.test(await pg.innerText('#nav')), 'TVGS: menu “Kiểm tra báo cáo ngày”');
    await pg.selectOption('#dateSel', '2026-06-26'); await wait(600);
    ok(/CHƯA KIỂM TRA – TVGS/.test(await pg.innerText('#doc')), 'PDF đã chốt chưa kiểm tra: dải “CHƯA KIỂM TRA – TVGS”');
    ok(await pg.isVisible('#pane [data-act=approveRep]'), 'TVGS: có nút Xác nhận ở ngày chờ kiểm tra');
    await pg.click('#pane [data-act=approveRep]'); await wait(300); await pg.click('#mOk'); await wait(700);
    const zt = await pg.inputValue('#zaloTxt'); const code = (zt.match(/Mã xác thực: ([0-9A-F]{4}-[0-9A-F]{4})/) || [])[1];
    ok(!!code, 'Xác nhận → tin nhắn Zalo soạn sẵn có mã xác thực ' + code);
    await pg.evaluate(() => closeModal());
    const d26 = await pg.innerText('#doc');
    ok(/Verified by Consultant/.test(d26) && d26.includes(code) && await pg.locator('#doc .ttl .qrst img').count() === 1, 'PDF: chữ “Verified by Consultant” + mã QR + mã ' + code);
    { await pg.evaluate(() => printFill()); await pg.emulateMedia({ media: 'print' });
      const pr = await pg.evaluate(() => { const r = $('#printRoot'), d = r && r.querySelector('.doc'); if (!d) return 'no-doc';
        const others = [...document.body.children].filter(e => e !== r && getComputedStyle(e).display !== 'none').map(e => e.id || e.className);
        return others.length ? 'others:' + others.join(',') : d.getBoundingClientRect().top < 40 && d.innerText.length > 300 ? true : 'top:' + d.getBoundingClientRect().top; });
      await pg.emulateMedia({ media: 'screen' }); if (pr !== true) console.log('PRINT', pr);
      ok(pr === true, 'In báo cáo ngày: chỉ in bản báo cáo, nằm ngay đầu trang (không còn trang trắng)'); }
    const vurl = await pg.evaluate(() => verifyLink(R.review));
    const vp = await ctx.newPage(); await vp.goto(vurl); await wait(1200);
    const vt = await vp.innerText('body');
    ok(/ĐÃ ĐƯỢC TVGS XÁC NHẬN/.test(vt) && vt.includes(code) && /26\/06\/2026/.test(vt) && /DSPCons/.test(vt), 'Quét QR → trang xác thực: ngày, TVGS, mã (không cần đăng nhập)');
    await vp.screenshot({ path: path.join(OUT, 'verify_page.png') }); await vp.close();
    await pg.click('[data-act=verify]'); await wait(300); await pg.fill('#pIn', code.toLowerCase()); await pg.click('#mOk'); await wait(500);
    ok(/Mã hợp lệ/.test(await pg.innerText('#modalBody')), 'Tra mã xác thực: hợp lệ');
    await pg.evaluate(() => closeModal());
    await pg.click('[data-act=verify]'); await wait(300); await pg.fill('#pIn', 'ABCD-1234'); await pg.click('#mOk'); await wait(500);
    ok(/Không tìm thấy mã/.test(await pg.innerText('#modalBody')), 'Tra mã sai: báo không tìm thấy');
    await pg.evaluate(() => closeModal());
    await shot(pg, 'desk_tvgs_approved');
    // Nhà thầu chốt 27/06 → TVGS yêu cầu sửa → nhà thầu thấy ghi chú
    await login(pg, 'u_chot', '1234');
    await pg.selectOption('#dateSel', '2026-06-27'); await wait(600);
    await pg.click('#dayActs [data-act=lock]'); await wait(300);
    for (let k = 0; k < 3 && await pg.isVisible('#mOk'); k++) { await pg.click('#mOk'); await wait(500); }
    ok(await pg.isVisible('#zaloTxt'), 'Chốt khi bật TVGS → gợi ý tin nhắn nhắc TVGS');
    ok(await pg.evaluate(async () => { const s = await IDB.get('subs', '2026-06-27|u_than'); return s && s.status === 'accepted' && SUBS.find(x=>x.uid==='u_than').rev === s.rev && !ACCEPT.length; }), 'Chốt: phiếu đã nộp được nhận trong cùng lần lưu báo cáo');
    await pg.evaluate(() => closeModal());
    await pg.click('#dayPrevBar [data-act=drive]'); await wait(300);
    ok(/Chờ TVGS xác nhận/.test(await pg.innerText('body')), 'Chưa xác nhận → chặn xuất PDF chính thức');
    await login(pg, 'u_tvgs', '3333');
    await pg.selectOption('#dateSel', '2026-06-27'); await wait(600);
    await pg.click('#pane [data-act=returnRep]'); await wait(300); await pg.fill('#pIn', 'Zone B thiếu nghiệm thu cốt thép giằng'); await pg.click('#mOk'); await wait(700);
    await pg.evaluate(() => closeModal());
    await login(pg, 'u_chot', '1234');
    await pg.selectOption('#dateSel', '2026-06-27'); await wait(600);
    const pn27 = await pg.innerText('#pane');
    ok(/TVGS .* yêu cầu sửa/.test(pn27) && /thiếu nghiệm thu cốt thép/.test(pn27) && await pg.isVisible('#dayActs [data-act=lock]'), 'Nhà thầu thấy yêu cầu sửa của TVGS, ngày mở lại để chốt lại');
    ok(/TVGS YÊU CẦU SỬA/.test(await pg.innerText('#doc')), 'PDF bị trả lại: dải “TVGS YÊU CẦU SỬA”');
    await shot(pg, 'desk_chot_returned');

    /* ---- Đợt 5: nhiều ảnh mặt bằng ---- */
    await pg.click('[data-view=day]'); await wait(500);
    if (await pg.inputValue('#dateSel') !== '2026-06-27') { await pg.selectOption('#dateSel', '2026-06-27'); await wait(700); }
    await pg.click('[data-tab=layout]'); await wait(300);
    const PNG5 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAICAIAAAB/FOjAAAAAH0lEQVR42mNk+M+ABzAxEAEYGRgYGBkZGBj/MxDUMAMAqwgCCTL0vDMAAAAASUVORK5CYII=', 'base64');
    await pg.setInputFiles('input[data-img=layouts]', [{ name: 'MB tang ham.png', mimeType: 'image/png', buffer: PNG5 }, { name: 'MB tang 1.png', mimeType: 'image/png', buffer: PNG5 }]); await wait(900);
    ok(await pg.evaluate(() => R.layouts.length === 2 && R.layouts[0].caption === 'MB tang ham'), 'Mặt bằng: thêm 2 ảnh một lần, chú thích theo tên file');
    ok(await pg.locator('#doc .lyt').count() === 2 && await pg.locator('#doc .lysec > .sec + .lyt').count() === 1, 'PDF: mỗi mặt bằng 1 ô (1/3 trang), tiêu đề mục 8 dính với ảnh đầu');
    ok(await pg.evaluate(() => [...document.querySelectorAll('#doc .sec, #doc .lysec, #doc .wsec1')].every(e => !/page|always/.test(getComputedStyle(e).breakBefore))), 'PDF: mục mặt bằng không ép sang trang mới (không để trống nửa trang)');
    await pg.click('[data-act=mv][data-path=layouts][data-i="0"][data-d="1"]'); await wait(300);
    ok(await pg.evaluate(() => R.layouts[0].caption === 'MB tang 1'), 'Mặt bằng: ▼ đổi thứ tự');
    await pg.fill('[data-path="layouts.0.caption"]', 'Mặt bằng tầng 1'); await wait(300);
    ok(/Mặt bằng tầng 1/.test(await pg.innerText('#doc')), 'Mặt bằng: sửa chú thích hiện ngay trên PDF');
    const files6 = Array.from({ length: 5 }, (_, i) => ({ name: 'mb' + i + '.png', mimeType: 'image/png', buffer: PNG5 }));
    await pg.setInputFiles('input[data-img=layouts]', files6); await wait(1200);
    ok(await pg.evaluate(() => R.layouts.length === 6) && await pg.locator('input[data-img=layouts]').count() === 0, 'Mặt bằng: tối đa 6 ảnh, đủ thì ẩn ô thêm');
    await shot(pg, 'desk_layouts');
    const ly2 = await pg.evaluate(() => { const r = normReport({date:'2026-06-28', layout:{img:'data:x', caption:'cũ'}}); return r.layouts.length === 1 && r.layouts[0].caption === 'cũ' && !('layout' in r); });
    ok(ly2, 'Dữ liệu cũ (1 ảnh mặt bằng) tự chuyển sang danh sách');
    ok(await pg.evaluate(() => { const r = clone(R), a = !/HOÀN THIỆN/.test(docHTML(r)); CFG.zones.push({id:'zH', name:'Tầng 5', section:'HT', owner:''});
      r.tasks.push(Object.assign(clone(r.tasks[0]), {zoneId:'zH', desc:'Trát tường tầng 5'})); const b = /C\. HOÀN THIỆN/.test(docHTML(r)) && !/D\. CÔNG VIỆC KHÁC/.test(docHTML(r)); CFG.zones.pop();
      return SECTIONS.length === 4 && a && b; }), 'Khu vực 4 loại: báo cáo ngày hiện C. Hoàn thiện khi có việc, nhóm trống tự ẩn');
    /* ---- Đợt 5: chống ghi đè ---- */
    await pg.evaluate(async () => { await saveR(true); const r = await IDB.get('reports', R.date); r.rev = (r.rev || 0) + 3; r.savedBy = 'u_than'; r.savedAt = '27/06/2026 10:42'; await IDB.put('reports', R.date, r); });
    await pg.click('[data-tab=general]'); await wait(200);
    await pg.evaluate(() => { R.weather.am = 'Mưa / Rain'; saveR(true); }); await wait(600);
    ok(/vừa được sửa ở nơi khác/.test(await pg.innerText('#modal')) && /Thân/.test(await pg.innerText('#modal')), 'Chống ghi đè: báo trùng, nêu người và giờ đã lưu');
    await shot(pg, 'desk_conflict');
    await pg.click('#cfKeep'); await wait(600);
    ok(await pg.evaluate(async () => (await IDB.get('reports', R.date)).weather.am === 'Mưa / Rain' && !CONFL.R), 'Chống ghi đè: “Giữ bản của tôi” → lưu được');
    /* ---- Dung lượng: chỉ mục gọn, dọn ảnh đệm ---- */
    ok(await pg.evaluate(() => { const x = idxDec({r:[['2026-11-01','l',2,'v']], s:[['2026-11-01','u1','a']], t:['2026-12-01']}); return x.reports[0].status==='locked' && x.reports[0].review==='approved' && x.subs[0].status==='accepted' && x.testDays[0]==='2026-12-01' && idxDec(IDX)===IDX; }), 'Giải mã chỉ mục gọn từ máy chủ');
    ok(await pg.evaluate(async () => { const d = await IDB.open(); const old = Date.now() - 90*864e5;
      await new Promise(r => { const st = d.transaction('imgs','readwrite').objectStore('imgs'); st.put({key:'oldimg', v:'data:x', t:old}); st.put({key:'lg_keep', v:'data:x', t:old}).onsuccess = r; });
      await IDB.put('imgs', 'newimg', 'data:y'); const n = await pruneImgs();
      return n >= 1 && !(await IDB.get('imgs','oldimg')) && (await IDB.get('imgs','lg_keep')) && (await IDB.get('imgs','newimg')); }), 'Dọn ảnh đệm > 60 ngày, giữ logo và ảnh mới');
    /* ---- Đợt 5: tuần, phiên đăng nhập ---- */
    ok(await pg.evaluate(() => { CFG.settings.weekEnd = '4'; P.kind = 'week'; P.anchor = '2026-11-19'; const a = periodRange(); P.anchor = '2026-11-20'; const b = periodRange(); return a.from === '2026-11-13' && a.to === '2026-11-19' && b.from === '2026-11-20'; }), 'Kỳ tuần: Thứ 6 13/11 → Thứ 5 19/11; 20/11 sang kỳ mới');
    await login(pg, 'u_lam', '2222'); await wait(300);
    ok(await pg.evaluate(() => !!sessionStorage.getItem('bcn_session') && !localStorage.getItem('bcn_session')), 'Không chọn “Ghi nhớ” → phiên chỉ trong trình duyệt (sessionStorage)');
    if (await pg.locator('[data-act=submitSub]').count()) {
      await pg.click('[data-act=submitSub] >> nth=0'); await wait(500);
      if (await pg.locator('#mOk').count() && await pg.isVisible('#mOk')) { await pg.click('#mOk'); await wait(700); }
      ok(await pg.locator('#toast [data-act=logout]').count() === 1, 'Nộp phiếu xong: thông báo có nút Đăng xuất');
      await shot(pg, 'desk_submit_logout');
      await pg.click('#toast [data-act=logout]'); await wait(500);
      ok(await pg.isVisible('#login') && await pg.locator('#remember').count() === 1 && !(await pg.isChecked('#remember')), 'Đăng xuất từ thông báo; màn hình đăng nhập có ô “Ghi nhớ” (mặc định bỏ chọn)');
    } else ok(false, 'Lâm: không thấy nút Nộp');
    await pg.selectOption('#loginUser', 'u_chot'); await pg.fill('#pinIn', '1234'); await pg.check('#remember'); await pg.click('[data-act=doLogin]'); await wait(1000);
    ok(await pg.evaluate(() => !!localStorage.getItem('bcn_session') && !sessionStorage.getItem('bcn_session')), 'Chọn “Ghi nhớ” → lưu phiên trên máy (localStorage)');
    ok(await pg.evaluate(() => { localStorage.setItem('bcn_act', String(Date.now() - 9 * 3600e3)); return idleOver(); }), 'Không thao tác > 8 giờ → tự đăng xuất');
    await pg.evaluate(() => idleCheck()); await wait(500);
    ok(await pg.isVisible('#login') && /tự đăng xuất/.test(await pg.innerText('#toast')), 'Tự đăng xuất hiện thông báo');
    await login(pg, 'u_chot', '1234');
    ok(await pg.evaluate(() => !idleOver() && Date.now() - +localStorage.getItem('bcn_act') < 60000), 'Đăng nhập lại ngay sau khi tự đăng xuất: ghi mốc thao tác mới (không bị đăng xuất tiếp)');

    /* ---- Cấu hình: thứ tự thẻ, logo, chế độ thử nghiệm ---- */
    await pg.click('[data-view=config]'); await wait(300);
    const tabsTxt = await pg.innerText('#cfgTabs');
    ok(tabsTxt.indexOf('Người dùng') < tabsTxt.indexOf('Khu vực') && /Cài đặt/.test(tabsTxt), 'Cấu hình: Người dùng & PIN đứng trước Khu vực; có thẻ Cài đặt');
    const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAICAIAAAB/FOjAAAAAH0lEQVR42mNk+M+ABzAxEAEYGRgYGBkZGBj/MxDUMAMAqwgCCTL0vDMAAAAASUVORK5CYII=', 'base64');
    await pg.setInputFiles('input[data-logo=consultant]', { name: 'tvgs.png', mimeType: 'image/png', buffer: PNG }); await wait(700);
    ok(await pg.locator('.lbox img').count() === 1, 'Tải logo TVGS: hiện xem trước');
    await pg.click('[data-view=day]'); await wait(600);
    ok(await pg.evaluate(() => { const td = document.querySelectorAll('#doc .logos2 td'); return td.length === 3 && !!td[0].querySelector('img') && /TƯ VẤN GIÁM SÁT/.test(td[0].innerText) && /CHỦ ĐẦU TƯ/.test(td[1].innerText) && /NHÀ THẦU/.test(td[2].innerText); }), 'PDF: logo TVGS (trái) – CĐT (giữa) – Nhà thầu (phải)');
    await pg.click('[data-view=config]'); await wait(300); await pg.click('[data-cfgtab=project]'); await wait(300);
    await pg.click('[data-cfg="project.contractorAbbr"]'); await wait(200);
    ok(/Sửa thông tin/.test(await pg.innerText('#toast')) && await pg.evaluate(() => getComputedStyle(document.querySelector('[data-cfg="project.contractorAbbr"]')).cursor === 'not-allowed'), 'Cấu hình dự án: ô khóa hiện xám, bấm vào nhắc “Sửa thông tin”');
    await pg.click('[data-act=editProj]'); await wait(300); await pg.fill('[data-cfg="project.contractorAbbr"]', 'VC'); await pg.click('#configPane [data-act=saveCfg]'); await wait(500);
    ok(await pg.evaluate(async () => CFG.project.contractorAbbr === 'VC' && (await IDB.get('kv','config')).project.contractorAbbr === 'VC'), 'Cấu hình dự án: nhập và lưu được mã viết tắt nhà thầu');
    await pg.click('[data-cfgtab=settings]'); await wait(300);
    ok(/Thư mục lưu PDF/i.test(await pg.innerText('#configPane')) && await pg.isVisible('#pdfLink') && await pg.isVisible('[data-cfgchk="settings.pdfMonthly"]'), 'Cài đặt: chọn thư mục lưu PDF (dán link Drive) + chia thư mục theo tháng');
    ok(await pg.locator('[data-cfg="settings.weekEnd"]').count() === 1 && await pg.inputValue('[data-cfg="settings.weekEnd"]') === '4' && await pg.locator('[data-cfg="settings.idleHours"]').count() === 1, 'Cài đặt: ngày chốt tuần (mặc định Thứ 5) + giờ tự đăng xuất');
    ok(await pg.locator('[data-act=speedTest]').count() === 1, 'Cài đặt: có nút Đo tốc độ');
    ok(/Thư mục lưu báo cáo tuần/i.test(await pg.innerText('#configPane')) && await pg.isVisible('#weekLink') && await pg.locator('[data-act=weekFolderSet]').count() === 1, 'Cài đặt: chọn thư mục riêng lưu báo cáo tuần');
    ok(/Tự dọn dữ liệu/.test(await pg.innerText('#configPane')) && /quá 3 tháng/.test(await pg.innerText('#configPane')) && /Thùng rác/i.test(await pg.innerText('#configPane')), 'Cài đặt: ghi chú tự dọn ảnh quá 3 tháng vào thùng rác Drive');
    ok(login.copyOk, 'Màn đăng nhập: dòng © 2026 H.T.N');
    ok(await pg.evaluate(() => { const d = '2026-11-17', T = [], P = [], C = [], K = []; for (let h = 0; h < 24; h++) { T.push(d + 'T' + String(h).padStart(2,'0') + ':00'); P.push(h === 18 ? 5 : 0); C.push(10); K.push(25 + (h === 18 ? 9 : 0)); }
      const j = {hourly:{time:T, precipitation:P, cloud_cover:C, temperature_2m:K}}, at = h => wxSummary(j, d, new Date(2026, 10, 17, h, 20));
      const a16 = at(16), a17 = at(17), a19 = at(19), past = wxSummary(j, d, new Date(2026, 10, 18, 9, 0));
      return a16.am && !a16.pm && /Nắng/.test(a17.pm) && a17.pmEnd === 17 && /Mưa/.test(a19.pm) && a19.pmEnd === 19 && /34oC/.test(a19.temp) && /Nắng/.test(past.pm) && !/34/.test(past.temp); }),
      'Thời tiết: chiều có sau 17h (12–17h); bấm lúc 19h tính đến 19h; ngày đã qua tính 12–17h');
    ok(/Tác giả: Huỳnh Trọng Nghĩa/.test(await pg.innerText('#configPane')) && /© 2026 H\.T\.N\. Bảo lưu mọi quyền/.test(await pg.innerText('#configPane')), 'Cấu hình: mục Giới thiệu có tác giả, bản quyền © 2026 H.T.N');
    await pg.click('[data-act=contact]'); await wait(200);
    ok(await pg.evaluate(() => { const m = $('#modalBody'); return /HUỲNH TRỌNG NGHĨA/.test(m.innerText) && !!m.querySelector('a[href="tel:0976820909"]') && !!m.querySelector('a[href="mailto:nghia.tr.h@gmail.com"]'); }), 'Nút Liên hệ: hiện tên, điện thoại (bấm gọi), email (bấm gửi thư)');
    ok(await pg.evaluate(() => { const ok = i => i && i.complete && i.naturalWidth > 100; return ok($('#configPane .about img.htnlogo')) && ok($('#modalBody img.htnlogo')); }), 'Logo H.T.N hiện ở mục Giới thiệu và hộp Liên hệ');
    await shot(pg, 'desk_contact'); await pg.evaluate(() => closeModal());
    /* ---- Đợt 8.1: khóa tạm nút khi app đang bận ---- */
    const SC = '#configPane [data-act=saveCfg]', scTxt = await pg.locator(SC).first().innerText();
    await pg.evaluate(() => { window._bp = busyRun('Đang đọc file hồ sơ…', () => new Promise(r=>setTimeout(r, 1500))); }); await wait(150);
    ok(await pg.evaluate(s => { const b = document.querySelector(s); return b.disabled && /⏳ Đang đọc file hồ sơ/.test(b.innerText); }, SC), 'Đang bận: nút Lưu mờ, ghi lý do “Đang đọc file hồ sơ…”');
    await pg.evaluate(() => renderConfig()); await wait(100);
    ok(await pg.evaluate(s => document.querySelector(s).disabled, SC), 'Đang bận: vẽ lại màn hình vẫn giữ nút mờ');
    ok(await pg.evaluate(async s => { let n = 0; const f = Store.saveConfig; Store.saveConfig = async c => { n++; return f(c); };
      const b = document.querySelector(s); b.disabled = false; b.click(); await new Promise(r=>setTimeout(r, 200)); Store.saveConfig = f; return n === 0; }, SC), 'Đang bận: bấm cũng không chạy');
    await pg.evaluate(() => window._bp); await wait(100);
    ok(await pg.evaluate(([s, t]) => { const b = document.querySelector(s); return !b.disabled && b.innerText === t && !BUSY.size; }, [SC, scTxt]), 'Xong việc: nút sáng lại, đúng chữ cũ');
    ok(await pg.evaluate(async s => { let n = 0; const f = Store.saveConfig; Store.saveConfig = async c => { n++; await new Promise(r=>setTimeout(r, 300)); return f(c); };
      const b = document.querySelector(s); b.click(); b.disabled = false; b.click(); await new Promise(r=>setTimeout(r, 900)); Store.saveConfig = f; return n === 1; }, SC), 'Bấm nhanh 2 lần: chỉ chạy 1 lần');
    await wait(600);
    ok(await pg.evaluate(async s => { BUSY_MAX = 400; const p = busyRun('Đang lưu…', () => new Promise(r=>setTimeout(r, 1200))); await new Promise(r=>setTimeout(r, 700));
      const b = document.querySelector(s), r = !b.disabled && /Kết nối chậm/.test($('#toast').innerText); BUSY_MAX = 60000; await p; return r; }, SC), 'Quá thời gian chờ: nút sáng lại + báo “Kết nối chậm”');
    ok(await pg.evaluate(() => ['saveReport','saveSub','savePeriod','register','exportPdf','catalogAdd','uploadFile','reviewPeriod'].every(k => /busyRun/.test(String(Store[k])))), 'Các lệnh lưu / đọc hồ sơ / tải file / tạo PDF / TVGS đều được theo dõi “đang bận”');
    await shot(pg, 'desk_settings');
    /* ---- Đợt 7: danh mục vật tư ---- */
    await pg.click('[data-cfgtab=lists]'); await wait(300);
    await pg.fill('#matPaste', 'Bộ môn\tChủng loại\tĐVT\tKiểu ghi\tChi tiết\nXây dựng\tBê tông\tm3\tKhối lượng\tB30(M400)R7\nXây dựng\tbê  tông\tm3\tKhối lượng\tB50R28(M650)\nMEP\tỐng UPVC\tm\tTheo lô\t');
    await pg.click('[data-act=matPasteGo]'); await wait(300);
    ok(await pg.evaluate(() => MATS().length === 2 && catOf('BÊ TÔNG').specs.length === 2 && catOf('Ống UPVC').mode === 'lot' && catOf('Ống UPVC').sec === 'MEP'), 'Danh mục vật tư: dán từ Excel, gộp trùng chủng loại (hoa thường, khoảng trắng), nhận bộ môn & kiểu ghi');
    await pg.setInputFiles('input[data-matfile]', { name: 'dm.csv', mimeType: 'text/csv', buffer: Buffer.from('﻿"Bộ môn","Chủng loại","ĐVT","Kiểu ghi","Chi tiết"\r\n"Xây dựng","Thép","kg","Khối lượng","Ø16"\r\n"Xây dựng","Thép","kg","Khối lượng","Ø20"\r\n') }); await wait(500);
    ok(await pg.evaluate(() => catOf('Thép') && catOf('Thép').specs.join() === 'Ø16,Ø20'), 'Danh mục vật tư: nạp file CSV (file mẫu)');
    const XLD = (() => { for (const q of ['xlsx/package.json', '/tmp/pwnode/node_modules/xlsx/package.json']) { try { return path.dirname(require.resolve(q)); } catch (e) {} } return ''; })(); const XL = require(XLD); const wbx = XL.utils.book_new(); XL.utils.book_append_sheet(wbx, XL.utils.aoa_to_sheet([['Bộ môn','Chủng loại','ĐVT','Kiểu ghi','Chi tiết'], ['MEP','Cáp điện','m','Khối lượng','CVV 4x16']]), 'DM');
    await pg.route('**/cdn.jsdelivr.net/npm/xlsx**', r => r.fulfill({ contentType: 'application/javascript', body: require('fs').readFileSync(path.join(XLD, 'dist/xlsx.full.min.js'), 'utf8') }));
    await pg.setInputFiles('input[data-matfile]', { name: 'dm.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: XL.write(wbx, { type: 'buffer', bookType: 'xlsx' }) }); await wait(1500);
    ok(await pg.evaluate(() => catOf('Cáp điện') && catOf('Cáp điện').sec === 'MEP' && catOf('Cáp điện').specs[0] === 'CVV 4x16'), 'Danh mục vật tư: nạp file Excel .xlsx');
    await pg.selectOption('[data-matmerge="0"]', String(await pg.evaluate(() => MATS().findIndex(c=>c.name==='Thép')))); await wait(200); await pg.click('#mOk'); await wait(300);
    ok(await pg.evaluate(() => !MATS().some(c=>c.name==='Bê tông') && catOf('Bê tông') && catOf('Bê tông').name === 'Thép' && catOf('Thép').specs.includes('B30(M400)R7')), 'Danh mục vật tư: gộp mục – tên cũ thành bí danh, chi tiết gộp lại');
    await pg.evaluate(() => { const t = catOf('Thép'); t.specs = t.specs.filter(x=>/Ø/.test(x)); t.alias = []; MATS().unshift({id:'mBT', name:'Bê tông', unit:'m3', sec:'XD', mode:'qty', specs:['B30(M400)R7'], alias:[]}); renderConfig(); });
    await pg.click('#configPane [data-act=saveCfg]'); await wait(500);
    ok(await pg.evaluate(async () => (await IDB.get('kv','config')).materials.length === 4), 'Danh mục vật tư: lưu cấu hình');
    await shot(pg, 'desk_cfg_materials');
    ok(await pg.evaluate(() => { const a = matCells({name:'bê tông', spec:'', qty:''}, 0).join(''), b = matCells({name:'Ống UPVC'}, 0).join(''), o = matNameOpts('Gạch cũ').map(x=>x.v);
      return /list="dl-mBT"/.test(a) && /m3/.test(a) && /Nội dung lô hàng/.test(b) && /Ghi chú/.test(b) && o.includes('Gạch cũ') && o.includes('__new') && /B30\(M400\)R7/.test(matDatalists()); }), 'Báo cáo ngày – vật tư: chọn chủng loại từ danh mục, ĐVT tự điền, gợi ý chi tiết; theo lô nhập nội dung + ghi chú; giữ tên cũ ngoài danh mục');
    ok(await pg.evaluate(() => { const R0 = {materials:[{name:'Bê tông', spec:'B35 mới', qty:3}, {name:'Ống UPVC', spec:'D27'}]}; const add = rememberMat(R0.materials); return add.length === 1 && catOf('Bê tông').specs.includes('B35 mới'); }), 'Lưu báo cáo ngày: chi tiết mới tự vào danh mục (kiểu theo lô không thêm)');
    await pg.evaluate(() => newMatType(-1)); await wait(200);
    await pg.fill('#nmName', ' bê tông '); await pg.fill('#nmUnit', 'm3'); await pg.click('[data-act=matNewGo]'); await wait(300);
    ok(/Đã có “Bê tông”/.test(await pg.innerText('#toast')) && await pg.evaluate(() => MATS().length === 4), 'Thêm chủng loại mới trùng tên → báo đã có, dùng mục có sẵn');
    await pg.evaluate(() => newMatType(-1)); await wait(200);
    await pg.fill('#nmName', 'Gạch block'); await pg.fill('#nmUnit', 'viên'); await pg.click('[data-act=matNewGo]'); await wait(300);
    ok(await pg.evaluate(async () => catOf('gạch BLOCK') && catOf('Gạch block').unit === 'viên' && (await IDB.get('kv','config')).materials.some(c=>c.name==='Gạch block')), 'Người chốt thêm chủng loại mới (Gạch block, viên) → lưu vào danh mục');
    ok(await pg.evaluate(() => { const pw = {matCum:{[matKey({name:'Bê tông', spec:'B30(M400)R7', unit:'m3'})]:314, [matKey({name:'Thép', spec:'Ø16', unit:'kg'})]:289656}};
      const reps = [normReport({date:'2026-06-26', materials:[{name:'bê tông', spec:'B30(M400)R7', unit:'m3', qty:5}, {name:'Bê tông', spec:'B50 mới', unit:'m3', qty:10}, {name:'Ống UPVC', spec:'Ống nước D27, D34', unit:'m', note:'120 cây'}]}),
        normReport({date:'2026-06-27', materials:[{name:'Bê tông', spec:'B30(M400)R7', unit:'m3', qty:2}]})];
      const w = normWeek({key:'W-x', from:'2026-06-26', to:'2026-07-02'}); genWeek(w, reps, pw); window.__wt = w;
      const b30 = w.materials.find(m=>m.spec==='B30(M400)R7'), b50 = w.materials.find(m=>m.spec==='B50 mới'), lot = w.materials.find(m=>m.mode==='lot');
      return w.materials.length === 3 && b30.prev === 314 && b30.now === 7 && b50.prev === 0 && lot.date === '2026-06-26' && lot.sec === 'MEP' && lot.note === '120 cây'
        && w.matCum[matKey(b30)] === 321 && w.matCum[matKey({name:'Thép', spec:'Ø16', unit:'kg'})] === 289656 && !w.materials.some(m=>m.name==='Thép'); }),
      'Tuần: gom vật tư theo danh mục; chỉ chi tiết có hàng về; kỳ trước = lũy kế còn lại; chi tiết không về vẫn giữ lũy kế; lô hàng MEP theo ngày');
    ok(await pg.evaluate(() => { const box = document.createElement('div'); box.innerHTML = weekDocHTML(window.__wt, {}); const t = box.innerText;
      return /C\.1\.1 VẬT TƯ XÂY DỰNG/.test(t) && /C\.1\.2 VẬT TƯ MEP/.test(t) && /I\s*Bê tông \(m3\)/.test(t) && /Tổng/.test(t) && /321/.test(t) && /Ống nước D27, D34/.test(t) && /26\/06\/2026/.test(t) && !/Ø16/.test(t); }),
      'PDF tuần: C.1.1 nhóm theo chủng loại có dòng Tổng; C.1.2 MEP lô hàng có ngày nhập; chi tiết không về trong tuần không in');
    await pg.click('[data-cfgtab=settings]'); await wait(300);
    await pg.check('[data-cfgchk="settings.testMode"]'); await pg.click('#configPane [data-act=saveCfg]'); await wait(500);
    ok(await pg.isVisible('#testBar'), 'Bật chế độ thử nghiệm → dải vàng');
    await pg.click('[data-view=day]'); await wait(600);
    const next = await pg.evaluate(() => addDays([...document.querySelectorAll('#dateSel option')].map(o=>o.value).filter(v=>v!=='__pick').sort().pop(), 0));
    ok(next > await pg.evaluate(() => today()) && await pg.locator('#dateSel option[value=__pick]').count() === 1, 'Chế độ thử: có ngày tương lai ' + next + ' + “Chọn ngày bất kỳ”');
    await pg.selectOption('#dateSel', next); await wait(700);
    await pg.click('#dayPrevBar [data-act=saveDay]'); await wait(500);
    ok(/BẢN THỬ/.test(await pg.innerText('#doc')), 'Ngày thử: PDF ghi BẢN THỬ');
    await pg.click('[data-view=config]'); await wait(300); await pg.click('[data-cfgtab=settings]'); await wait(300);
    await pg.click('[data-act=clearTest]'); await wait(300); await pg.click('#mOk'); await wait(700);
    ok(await pg.evaluate(() => !(IDX.testDays||[]).length && !IDX.reports.some(r=>r.date>today())), 'Xóa toàn bộ ngày thử');
    await pg.uncheck('[data-cfgchk="settings.testMode"]'); await pg.click('#configPane [data-act=saveCfg]'); await wait(400);

    await login(pg, 'u_chot', '1234');
    await pg.click('[data-view=period]'); await wait(500);
    await pg.fill('#pAnchor', '2026-06-25'); await pg.dispatchEvent('#pAnchor', 'change'); await wait(600);
    ok(/19\/06\/2026 → 25\/06\/2026/.test(await pg.innerText('#periodPane')) && /T6 → T5/.test(await pg.innerText('#perNav')) && !(await pg.locator('#pKind').count()), 'Tuần mặc định Thứ 6 → Thứ 5 (25/06 thuộc tuần 19–25/06), không còn chọn tháng');
    ok(/© 2026 H\.T\.N/.test(await pg.innerText('#pdoc')) && !/Lập bằng ứng dụng/.test(await pg.innerText('#pdoc')) && !/Huỳnh Trọng Nghĩa/.test(await pg.innerText('#pdoc')), 'PDF tuần: chân trang chỉ còn © 2026 H.T.N (dưới phần ký)');
    ok(await pg.locator('#pdoc img.htnlogo').count() === 0, 'PDF tuần: không in logo tác giả (chân trang giữ © 2026 H.T.N)');
    ok(/LẬP BÁO CÁO THI CÔNG/.test(await pg.innerText('.brand h1')) && /Báo cáo tuần/.test(await pg.innerText('#nav')) && !/Tuần \/ Tháng/.test(await pg.innerText('#nav')), 'Tên app LẬP BÁO CÁO THI CÔNG, mục Báo cáo tuần');
    await pg.fill('#pAnchor', '2026-06-26'); await pg.dispatchEvent('#pAnchor', 'change'); await wait(600);
    /* ---- Báo cáo tuần (đợt 6A) ---- */
    const pn = await pg.innerText('#periodPane'), wd = await pg.innerText('#pdoc');
    ok(/ngày chưa chốt/.test(pn) && /chưa lưu/.test(pn), 'Tuần: tự tổng hợp khi mở, báo ngày chưa chốt');
    ok(/BÁO CÁO TUẦN/.test(wd) && /THÔNG TIN CHUNG/.test(wd) && /OVERALL SCHEDULE/.test(wd) && /A\.1 CÔNG VIỆC XÂY DỰNG/.test(wd) && /Địa điểm \/ Location/.test(wd), 'PDF tuần: đầu trang thông tin dự án, thông tin chung, overall, A.1');
    ok(await pg.locator('#pdoc .wchart svg rect').count() > 3, 'PDF tuần: biểu đồ cột nhân sự');
    await pg.click('[data-wtab=gen]'); await pg.fill('[data-root=W][data-path="no"]', '34'); await wait(200);
    await pg.click('[data-wtab=prog]');
    for (const [k, v] of [['plan','10'],['actualPrev','9.5'],['actual','10.4'],['planNext','11']]) await pg.fill(`[data-root=W][data-path="overall.${k}"]`, v);
    await wait(300);
    ok(/Đạt/.test(await pg.innerText('#wEval')) && /10\.4%/.test(await pg.innerText('#pdoc .wovr')), 'Tiến độ tổng: tự đánh giá Đạt, hiện trên PDF');
    const ovSave = await pg.evaluate(() => JSON.stringify(W.overall));
    for (const [act, re] of [['8', /Chậm nhẹ/], ['3', /^Chậm$/]]) {
      await pg.evaluate(a => { W.overall.actual = a; renderWeekDoc(); }, act); await wait(250);
      const ovr = await pg.evaluate(re => { const tds = [...document.querySelectorAll('#pdoc .wovr tr:nth-child(2) td')], w = tds.map(t => Math.round(t.getBoundingClientRect().width)), ev = document.querySelector('#pdoc .wovr td.ev'), b = ev.querySelector('b');
        const r = new RegExp(re).test(b.innerText.trim()) && Math.max(...w) - Math.min(...w) <= 2 && b.scrollWidth <= ev.clientWidth && b.getBoundingClientRect().height < 26; return r || JSON.stringify([b.innerText, w, b.scrollWidth, ev.clientWidth, b.getBoundingClientRect().height]); }, re.source); if (ovr !== true) console.log('OVR', ovr); ok(ovr === true, 'Overall Schedule: “' + re.source.replace('$','') + '” nằm gọn 1 dòng, 4 ô đều nhau');
    }
    await pg.locator('#pdoc .wovr').screenshot({ path: path.join(OUT, 'desk_week_ovr.png') });
    ok(await pg.evaluate(() => { const p = [...document.querySelectorAll('#pdoc .ttl .proj')]; return p.length === 2 && /^Tuần \d+ – Tháng \d+\/\d{4}$/.test(p[0].innerText.trim()) && /^KỲ BÁO CÁO \/ PERIOD: .+ → .+/.test(p[1].innerText.trim())
      && p.every(e => getComputedStyle(e).textAlign === 'center') && p[1].getBoundingClientRect().height < 24; }), 'Tiêu đề tuần: dòng “Tuần – Tháng” và dòng “Kỳ báo cáo” tách 2 dòng, canh giữa, kỳ báo cáo nằm 1 dòng');
    await pg.evaluate(o => { W.overall = JSON.parse(o); renderWeekDoc(); }, ovSave);
    await pg.fill('[data-root=W][data-path="overall.actual"]', '4'); await wait(300);
    ok(/Chậm</.test(await pg.innerHTML('#wEval')) || /Chậm \(/.test(await pg.innerText('#wEval')) || /→ Chậm/.test(await pg.innerText('#wEval')), 'Chênh lệch < −5% → Chậm');
    await pg.fill('[data-root=W][data-path="overall.actual"]', '10.4'); await wait(200);
    await pg.click('[data-wtab=gen]');
    ok(await pg.locator('[data-root=W][data-path^="ratings."]').count() === 0 && await pg.locator('#periodPane .wrategood, #periodPane .wratemid, #periodPane .wratebad').count() === 3 && /căn cứ/.test(await pg.innerText('#periodPane')), 'Đánh giá tuần: tự xếp loại, không có ô sửa, hiện căn cứ');
    await shot(pg, 'desk_week_gen');
    await pg.click('[data-wtab=task]'); const nT = await pg.locator('#periodPane tr.wauto').count();
    ok(nT > 0 && await pg.locator('#periodPane .zhead').count() > 0 && await pg.locator('#wTabs [data-wtab=task]').count() === 1 && await pg.locator('#wActs [data-act=wLock]').count() === 1, 'Công việc tuần: bảng theo khu vực như phiếu ngày, thẻ ở đầu, nút Chốt ở thanh cuối (' + nT + ' việc tổng hợp)');
    ok(await pg.evaluate(() => { const i = W.tasks.findIndex(t=>t.auto); return i >= 0 && !document.querySelector(`[data-root=W][data-path="tasks.${i}.desc"]`) && !document.querySelector(`[data-root=W][data-path="tasks.${i}.actual"]`) && !!document.querySelector(`[data-root=W][data-path="tasks.${i}.note"]`) && !document.querySelector(`[data-act=del][data-path=tasks][data-i="${i}"]`); }), 'Dòng tổng hợp khóa: nội dung, % không sửa/xóa được; ghi chú sửa được');
    await pg.fill('[data-root=W][data-path="tasks.0.note"]', 'ghi chú tay'); await wait(200);
    await pg.click('#periodPane .zhead [data-act=add][data-path=tasks] >> nth=0'); await wait(300);
    const nNew = await pg.evaluate(() => W.tasks.length - 1);
    await pg.fill(`[data-root=W][data-path="tasks.${nNew}.desc"]`, 'Việc thêm tay tuần'); await pg.fill(`[data-root=W][data-path="tasks.${nNew}.actual"]`, '40'); await wait(200);
    await pg.click('[data-act=wGen]'); await wait(400);
    ok(await pg.evaluate(() => W.tasks[0].note === 'ghi chú tay' && W.tasks.some(t=>!t.auto && t.desc === 'Việc thêm tay tuần' && t.actual === 40)), 'Tổng hợp lại: giữ ghi chú dòng tổng hợp và dòng thêm mới (sửa được)');
    await shot(pg, 'desk_week_task');
    await pg.click('[data-wtab=plan]'); await pg.click('[data-act=wPlanFromTasks]'); await wait(300);
    await pg.fill('[data-root=W][data-path="nextPlans.0.add"]', '20'); await wait(200);
    ok(await pg.evaluate(() => { const p = W.nextPlans[0]; return W.nextPlans.length > 0 && p.add === 20 && p.target === Math.min(100, Math.round((p.base + 20) * 10) / 10) && $('#wpt-0') && $('#wpt-0').innerText.trim() === wPct(p.target); }), 'KH tuần sau: tự sinh từ việc <100%, nhập % dự kiến → lũy kế dự kiến tự tính');
    ok(/II\.1 Thi công xây dựng/i.test(await pg.innerText('#periodPane')) && await pg.locator('#periodPane .zhead [data-act=add][data-path=nextPlans]').count() > 0 && await pg.locator('#periodPane .zhead').count() > 0, 'KH tuần sau: tách II.1 xây dựng / II.2 MEP, chia theo khu vực, nút thêm từng khu vực');
    await pg.fill('[data-root=W][data-path="nextPlans.0.add"]', '50'); await wait(200);
    await shot(pg, 'desk_week_plan');
    await pg.click('[data-wtab=mp]'); ok(await pg.locator('.wpane .wchart svg').count() === 1 && await pg.locator('#periodPane tr.wauto').count() > 0 && await pg.locator('[data-root=W][data-path^="manpower."]').count() === 0, 'Nhân lực: biểu đồ + bảng bình quân (dòng tổng hợp khóa)');
    ok(await pg.evaluate(() => { const t = $('#pdoc').innerText; return /TỔNG BÌNH QUÂN/.test(t) && !/Tổng công/.test(t) && !/Cao nhất/.test(t.split('C.2')[0]); }), 'Bảng nhân lực tuần chỉ có số bình quân, tổng = cộng bình quân');
    const wd2 = await pg.innerText('#pdoc');
    ok(/I – CÁC HOẠT ĐỘNG THI CÔNG TRONG TUẦN/.test(wd2) && /B – CÔNG TÁC CHẤT LƯỢNG/.test(wd2) && /C\.2 THIẾT BỊ MÁY MÓC/.test(wd2) && /D – NHÂN LỰC NHÀ THẦU/.test(wd2) && /II – KẾ HOẠCH CHO TUẦN TIẾP THEO/.test(wd2) && /III – MẶT BẰNG/.test(wd2), 'PDF tuần theo cấu trúc I – II – III (A–E, B.1–B.3, C.1–C.2)');
    ok(!/A\.3 CÔNG VIỆC HOÀN THIỆN/.test(wd2) && !/B\.4 VĂN BẢN/.test(wd2) && !/IV – TIẾN ĐỘ MSP/.test(wd2), 'Mục trống tự ẩn (A.3 hoàn thiện, B.4 văn bản, IV MSP)');
    await pg.evaluate(() => { W.submittals = [{tab:'DS', code:'CN8-2/VC/Civil/DS/40', desc:'HSNL thầu phụ hồ bơi', count:'1', date:'2026-06-29', st:'pending'}, {tab:'SD', code:'CN8-2/VC/Civil/SDW/09', desc:'Bản vẽ thép sàn GF', count:'2', date:'2026-06-30', resDate:'2026-07-01', st:'approved'}, {tab:'MAT', code:'CN8-2/VC/MEP/MAT/05', desc:'Ống PCCC', count:'1', date:'2026-06-20', st:'review'}];
      W.docs = [{tab:'SI', code:'CN8-2/DSPC/VC/SI.40', desc:'Chỉ thị an toàn điện', date:'2026-07-01'}]; W.regAt = nowStr(); W.regStat = regStatLine(W); renderWeek(); });
    const wd3 = await pg.innerText('#pdoc');
    ok(/DS\/40/.test(wd3) && /Chờ duyệt/.test(wd3) && /Đã duyệt/.test(wd3) && /B\.4 VĂN BẢN/.test(wd3) && /Trình mới 2 · Đã duyệt 1/.test(wd3), 'B.3 bảng hồ sơ phát sinh trong tuần + tình trạng; B.4 văn bản');
    await pg.click('[data-wtab=qa]'); ok(await pg.locator('.wpane .badge').count() === 3, 'Thẻ I.B: danh sách hồ sơ có nhãn tình trạng');
    ok(await pg.evaluate(() => { const hs = [...document.querySelectorAll('#periodPane .ph h3')].map(e=>e.innerText); const i3 = hs.findIndex(t=>/B\.3/.test(t)), i4 = hs.findIndex(t=>/B\.4/.test(t));
      return i3 >= 0 && i4 > i3 && !/B\.4/.test(hs[i3]) && document.querySelectorAll('#periodPane table').length >= 4 && /Trình mới/.test($('#periodPane .regsum').innerText); }), 'B.3 hồ sơ và B.4 văn bản là 2 mục riêng, mỗi mục 1 bảng, có dòng tổng hợp tình trạng');
    ok(await pg.evaluate(() => { const r = [...document.querySelectorAll('#periodPane table')].find(t=>/Mã hồ sơ/i.test(t.innerText)); return r && /MAT\/05/.test(r.rows[1].innerText) && /chờ 12 ngày/.test(r.rows[1].innerText) && /Đã duyệt/.test(r.rows[r.rows.length - 1].innerText); }), 'B.3: hồ sơ chưa duyệt xếp trước, chờ quá 7 ngày tô đỏ “chờ 12 ngày”');
    ok(/Chờ quá 7 ngày 1/.test(await pg.innerText('#pdoc')) && /chờ 12 ngày/.test(await pg.innerText('#pdoc')), 'PDF B.3: ghi số hồ sơ chờ quá 7 ngày và số ngày chờ');
    ok(/20\/06\/2026/.test(await pg.innerText('#pdoc')), 'PDF B.3: ngày trình ghi đủ năm (20/06/2026)');
    await shot(pg, 'desk_week_qa');
    await pg.click('[data-wtab=photo]');
    ok(await pg.evaluate(() => WPHOTO_N === 30 && WLAYOUT_MAX === 10 && !!document.querySelector('input[data-img=wphotos]')), 'Ảnh tiêu biểu tối đa 30, có ô thêm ảnh; mặt bằng tuần tối đa 10');
    const nP0 = await pg.evaluate(() => W.photos.length);
    await pg.setInputFiles('input[data-img=wphotos]', [{ name: 'Anh tu them.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAICAIAAAB/FOjAAAAAH0lEQVR42mNk+M+ABzAxEAEYGRgYGBkZGBj/MxDUMAMAqwgCCTL0vDMAAAAASUVORK5CYII=', 'base64') }]); await wait(800);
    ok(await pg.evaluate(n => W.photos.length === n + 1 && W.photos[n].manual && W.photos[n].caption === 'Anh tu them', nP0), 'Ảnh tiêu biểu: người chốt thêm ảnh');
    await pg.click('[data-act=wShuffle]'); await wait(300);
    ok(await pg.evaluate(() => W.photos.some(p=>p.manual && p.caption === 'Anh tu them') && W.photos.length <= 30), 'Đổi bộ ảnh khác: giữ ảnh tự thêm');
    await pg.evaluate(() => { W.photos.unshift({id:uid(), fileId:'', img:'', caption:'Zone A – đổ bê tông', date:W.from, zoneId:CFG.zones[0].id}); renderWeek(); });
    ok(await pg.evaluate(() => document.querySelectorAll('#pdoc td.phz').length >= 2 && /Ảnh khác/.test([...document.querySelectorAll('#pdoc td.phz')].pop().innerText)), 'PDF: ảnh tiêu biểu nhóm theo khu vực, ảnh tự thêm vào nhóm Ảnh khác');
    const im = await pg.evaluate(() => W.photos.findIndex(p=>p.manual && p.caption === 'Anh tu them')); const z1 = await pg.evaluate(() => CFG.zones[0].id);
    await pg.selectOption(`[data-root=W][data-path="photos.${im}.zoneId"]`, z1); await wait(300);
    ok(await pg.evaluate(() => ![...document.querySelectorAll('#pdoc td.phz')].some(t=>/Ảnh khác/.test(t.innerText)) && /Zone A \(2 ảnh\)/.test($('#pdoc').innerText)), 'Ảnh tự thêm chọn khu vực → chuyển sang nhóm khu vực đó');
    ok(await pg.evaluate(async () => { const c = document.createElement('canvas'); c.width = 2000; c.height = 1000; c.getContext('2d').fillRect(0,0,10,10);
      const s = await shrinkImg(c.toDataURL('image/png'), 900, 0.72); const im = await new Promise(r=>{ const i = new Image(); i.onload = ()=>r(i); i.src = s; }); return im.width === 900 && /^data:image\/jpeg/.test(s); }), 'Xuất PDF tuần: ảnh được nén còn cạnh dài 900 px (JPEG)');
    const PNGW = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAICAIAAAB/FOjAAAAAH0lEQVR42mNk+M+ABzAxEAEYGRgYGBkZGBj/MxDUMAMAqwgCCTL0vDMAAAAASUVORK5CYII=', 'base64');
    if (await pg.evaluate(() => W.layouts.length >= WLAYOUT_MAX)) { ok(/Đã đủ 10 ảnh/.test(await pg.innerText('#periodPane')), 'Mặt bằng tuần: đủ 10 ảnh thì báo, không cho thêm'); await pg.click('[data-act=del][data-root=W][data-path=layouts] >> nth=0'); await wait(300); }
    const nL0 = await pg.evaluate(() => W.layouts.length);
    await pg.setInputFiles('input[data-img=wlayouts]', [{ name: 'MB tuan san GF.png', mimeType: 'image/png', buffer: PNGW }]); await wait(800);
    ok(await pg.evaluate(n => W.layouts.length === n + 1 && W.layouts[n].caption === 'MB tuan san GF', nL0), 'Mặt bằng tuần: thêm ảnh như báo cáo ngày');
    await pg.click('[data-act=wGen]'); await wait(400);
    ok(await pg.evaluate(n => W.layouts.length === n + 1, nL0), 'Mặt bằng tuần: Tổng hợp lại không ghi đè bộ mặt bằng đã chỉnh');
    await pg.click(`[data-act=mv][data-root=W][data-path=layouts][data-i="${nL0}"][data-d="-1"]`); await wait(300);
    ok(await pg.evaluate(n => W.layouts[n - 1].caption === 'MB tuan san GF', nL0), 'Mặt bằng tuần: ▲ đổi thứ tự');
    await pg.click('[data-act=del][data-root=W][data-path=layouts] >> nth=0'); await wait(300);
    ok(await pg.evaluate(n => W.layouts.length === n, nL0) && !/BÁO CÁO TUẦN \?/i.test(await pg.innerText('#periodPane')), 'Mặt bằng tuần: xóa được; tiêu đề không còn dấu ?');
    await shot(pg, 'desk_week_photo');
    ok(await pg.evaluate(() => { const m0 = W.msp; W.msp = {fileId:'x', url:'https:' + '//drive.google.com/file/d/x/view', name:'MSP Rev02.pdf'}; renderWeekDoc();
      const q = document.querySelector('#pdoc .wmsp img'), ok = !!q && q.getBoundingClientRect().width <= 44 && !/File MS Project/.test($('#pdoc').innerText) && GANTT_MAX === 6; W.msp = m0; renderWeekDoc(); return ok; }), 'IV MSP: chỉ in mã QR cỡ như QR TVGS (không chữ); Gantt tối đa 6 ảnh');
    ok(await pg.evaluate(() => { CFG.project.contractorAbbr = 'VC'; return weekFileName(W) === '20260702-' + CFG.project.code + '-VC-WR-34-Weekly report and Tracking MSP(checked).pdf'; }), 'Tên file PDF tuần đúng mẫu …-VC-WR-34-Weekly report and Tracking MSP(checked).pdf');
    await pg.click('[data-act=wLock]'); await wait(700);
    ok(await pg.evaluate(async () => { const w = await IDB.get('periods', W.key); return W.status === 'locked' && w.status === 'locked' && w.review && w.review.status === 'pending'; }), 'Chốt tuần → chờ TVGS kiểm tra');
    await pg.click('[data-wtab=prog]'); await shot(pg, 'desk_week_locked');
    await login(pg, 'u_tvgs', '3333');
    await pg.click('[data-view=period]'); await wait(500);
    await pg.fill('#pAnchor', '2026-06-26'); await pg.dispatchEvent('#pAnchor', 'change'); await wait(700);
    await pg.click('[data-act=wApprove]'); await wait(700);
    const wcode = await pg.evaluate(() => W.review && W.review.code);
    ok(wcode && /Verified by Consultant/.test(await pg.innerText('#pdoc')), 'TVGS xác nhận tuần → mã xác thực + QR trên PDF');
    ok(await pg.evaluate(() => { const q = document.querySelector('#pdoc .qrst'); if (!q) return false; const k = [...q.childNodes].filter(n=>n.nodeType===1 || n.textContent.trim());
      const t = q.getBoundingClientRect(), im = q.querySelector('img').getBoundingClientRect(), cd = q.querySelector('.cd').getBoundingClientRect(), mid = x => x.left + x.width / 2;
      return /^Verified by Consultant$/.test(k[0].textContent.trim()) && k[1].tagName === 'IMG' && k[2].classList.contains('cd') && Math.abs(mid(im) - mid(cd)) < 2 && Math.abs(mid(im) - mid(t)) < 2 && !/Consultant -/.test(q.innerText); }),
      'Dấu TVGS: chữ Verified by Consultant ở trên, QR giữa, mã ở dưới – canh giữa theo trục QR');
    ok(await pg.evaluate(() => { const on = [...document.querySelectorAll('#pdoc .wrate td.on')]; const bg = e => getComputedStyle(e).backgroundColor;
      return on.length === 3 && !document.querySelector('#pdoc .wrate .x') .textContent.includes('X') && on.every(td => /r-(good|mid|bad)/.test(td.className) && bg(td) !== 'rgb(254, 249, 195)')
        && on.filter(td=>td.classList.contains('r-good')).every(td => bg(td) === 'rgb(220, 252, 231)' && td.querySelector('.x').textContent === '✔'); }),
      'Bảng đánh giá: bỏ dấu X nền vàng; Tốt = nền xanh lá + ✔ (Trung bình vàng ●, Kém đỏ ✖)');
    ok(await pg.evaluate(() => { const bg = s => { const e = document.querySelector('#pdoc ' + s); return e && getComputedStyle(e).backgroundColor; };
      return bg('.wsec1') === 'rgb(30, 58, 138)' && bg('.wsec2') === 'rgb(219, 234, 254)' && bg('.wsec3') === 'rgb(241, 245, 249)'; }), 'Đầu mục báo cáo tuần 3 cấp màu: navy / xanh nhạt / xám xanh nhạt');
    await pg.evaluate(() => { W.ratings = {safety:'good', work:'mid', resource:'bad'}; renderWeekDoc(); });
    ok(await pg.evaluate(() => { const on = [...document.querySelectorAll('#pdoc .wrate td.on')]; return on.map(td=>td.querySelector('.x').textContent).join('') === '✔●✖' && getComputedStyle(on[2]).backgroundColor === 'rgb(254, 226, 226)'; }), 'Bảng đánh giá: đủ 3 mức Tốt ✔ / Trung bình ● / Kém ✖ đúng màu');
    await pg.locator('#pdoc .wrate').screenshot({ path: path.join(OUT, 'desk_week_rate.png') });
    await pg.locator('#pdoc .ttl').screenshot({ path: path.join(OUT, 'desk_week_qr.png') });
    { await pg.evaluate(() => printFill()); await pg.emulateMedia({ media: 'print' });
      const pr = await pg.evaluate(() => { const r = $('#printRoot'), d = r && r.querySelector('.doc'); if (!d) return 'no-doc';
        const others = [...document.body.children].filter(e => e !== r && getComputedStyle(e).display !== 'none').map(e => e.id || e.className);
        return others.length ? 'others:' + others.join(',') : d.getBoundingClientRect().top < 40 && d.innerText.length > 300 ? true : 'top:' + d.getBoundingClientRect().top; });
      await pg.emulateMedia({ media: 'screen' }); if (pr !== true) console.log('PRINT', pr);
      ok(pr === true, 'In báo cáo tuần: chỉ in bản báo cáo, nằm ngay đầu trang (không còn trang trắng)'); }
    ok(await pg.evaluate(async c => { const v = await Store.verify(c); return v.ok === 'current' && v.kind === 'week' && v.no == 34; }, wcode), 'Tra mã xác thực báo cáo tuần');
    await shot(pg, 'desk_week_doc', { fullPage: true });
    await login(pg, 'u_chot', '1234'); await pg.click('[data-view=period]'); await wait(500);
    await pg.fill('#pAnchor', '2026-07-03'); await pg.dispatchEvent('#pAnchor', 'change'); await wait(700);
    ok(await pg.evaluate(() => W.no === 35 && W.overall.plan === 11 && W.overall.actualPrev === 10.4 && !PW === false), 'Tuần sau: số tuần 35, KH tuần này & thực tế tuần trước tự lấy');
    await pg.fill('#pAnchor', '2026-06-26'); await pg.dispatchEvent('#pAnchor', 'change'); await wait(700);
    ok(await pg.locator('[data-act=drivePeriod]').count() === 1 && await pg.locator('[data-root=W]:not([disabled])').count() === 0, 'Tuần đã xác nhận: khóa nhập, hiện nút xuất PDF');
    await pg.click('[data-wtab=mat]'); await wait(300); await shot(pg, 'desk_week_mat');
    await pg.click('[data-view=day]'); await wait(600); await pg.click('[data-tab=mat]'); await wait(300);
    if (await pg.locator('[data-act=add][data-path=materials]').count()) { await pg.click('[data-act=add][data-path=materials]'); await wait(300);
      await pg.selectOption('[data-root=R][data-path="materials.0.name"]', 'Bê tông'); await wait(300);
      ok(await pg.evaluate(() => R.materials[0].unit === 'm3' && !!document.querySelector('[data-root=R][data-path="materials.0.spec"][list]')), 'Báo cáo ngày: chọn “Bê tông” → ĐVT m3 tự điền, ô chi tiết có gợi ý');
      await pg.fill('[data-root=R][data-path="materials.0.spec"]', 'B30(M400)R7'); await pg.fill('[data-root=R][data-path="materials.0.qty"]', '12'); await wait(300); }
    await shot(pg, 'desk_day_mat');
    ok(!errs.length, 'Không lỗi JavaScript (máy tính) ' + errs.join(' | '));
    await ctx.close();
  }

  /* ---------- ĐIỆN THOẠI ---------- */
  for (const [W, H, n] of [[375, 667, 'se'], [390, 844, 'ip'], [412, 915, 'an']]) {
    const { ctx, pg, errs } = await fresh(browser, { viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await login(pg, 'u_than', '1111');
    ok(await pg.evaluate(() => document.documentElement.scrollWidth) <= W, `${n} ${W}px: không tràn ngang`);
    ok(await pg.isVisible('#fab') && await pg.locator('.seg button').count() === 2, `${n}: có nút ＋ nổi và thanh Hôm nay | Ngày mai`);
    const c0 = await pg.locator('#myPane .tcard').count();
    await pg.click('#fab'); await wait(300);
    if (await pg.isVisible('.zpick')) { await pg.click('.zpick .btn >> nth=0'); await wait(400); }
    ok(await pg.locator('#myPane .tcard').count() === c0 + 1 && await pg.locator('#myPane .tcard.fresh').count() === 1, `${n}: ＋ thêm việc mới (tô viền)`);
    ok(await pg.evaluate(() => document.activeElement && document.activeElement.dataset.path === 'tasks.0.desc'), `${n}: con trỏ vào ô nội dung việc mới`);
    // bấm +5 ở việc kế thừa đầu tiên
    const card = pg.locator('#myPane .tcard:has([data-act=bump]):not(.fresh)').first();
    const id = await card.getAttribute('id'), i = id.split('-')[1];
    const before = parseFloat(await card.locator('.lk b').first().innerText());
    await card.locator('[data-act=bump][data-v="5"]').click(); await wait(200);
    ok(parseFloat(await pg.innerText(`#cum-${i} b`)) === Math.min(100, before + 5), `${n}: +5 → lũy kế ${before}+5`);
    await shot(pg, `m_${n}_today`);
    await pg.click('.seg button >> nth=1'); await wait(300);
    const p0 = await pg.locator('#myPane .tcard').count();
    await pg.click('#fab'); await wait(300);
    ok(await pg.locator('#myPane .tcard').count() === p0 + 1, `${n}: Ngày mai – ＋ thêm kế hoạch`);
    ok(/% dự kiến thực hiện/.test(await pg.innerText('#myPane')), `${n}: nhãn “% dự kiến thực hiện”`);
    await shot(pg, `m_${n}_tomorrow`);
    await pg.click('#mBottom [data-mytab=qa]'); await wait(300);
    const zb = await pg.$$eval('#myPane .zbar span:first-child', e => e.map(x => x.textContent));
    ok(/Nghiệm thu trong ngày/.test(zb[0]) && /Thí nghiệm trong ngày/.test(zb[1]) && /Kế hoạch nghiệm thu/.test(zb[2]) && /Kế hoạch thí nghiệm/.test(zb[3]), `${n}: thứ tự Nghiệm thu → Thí nghiệm → KH nghiệm thu → KH thí nghiệm`);
    ok(await pg.isVisible('#fab'), `${n}: nút ＋ ở thẻ Nghiệm thu`);
    const q0 = await pg.locator('#myPane .tcard').count();
    await pg.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await pg.click('#fab'); await wait(300); await pg.click('.zpick .btn >> nth=0'); await wait(400);
    ok(await pg.locator('#myPane .tcard').count() === q0 + 1 && await pg.evaluate(() => document.activeElement && document.activeElement.dataset.path === 'inspections.0.desc'), `${n}: ＋ thêm nghiệm thu mới ở đầu, con trỏ vào ô nội dung`);
    const box = await pg.locator('#myPane .tcard.fresh').boundingBox();
    ok(box && box.y >= 0 && box.y < H, `${n}: thẻ nghiệm thu mới nằm trong màn hình`);
    await shot(pg, `m_${n}_qa`);
    await pg.click('#mBottom [data-mytab=work]'); await wait(200);
    if (n === 'ip') {
      await login(pg, 'u_chot', '1234');
      await pg.click('[data-tab=people]'); await wait(300);
      ok(await pg.isVisible('#fab'), 'ip chốt: nút ＋ ở tab Nhân sự');
      await pg.click('#fab'); await wait(300); await pg.click('.zpick .btn >> nth=0'); await wait(400);
      ok(await pg.evaluate(() => { const n = R.manpower.length - 1; return !R.manpower[n].title && !!R.manpower[0].title && document.activeElement.dataset.path === 'manpower.' + n + '.title'; }), 'ip chốt: ＋ nhân lực mới ở cuối danh sách, con trỏ ở dòng mới');
      ok(await pg.locator('.qrow [data-act=mv]').count() > 0, 'ip chốt: có nút ▲▼ trên điện thoại');
      await shot(pg, 'm_ip_chot_people');
      await pg.click('[data-tab=tasks]'); await wait(300);
      if (await pg.locator('[data-act=gotoDate]').count()) { await pg.click('[data-act=gotoDate][data-d="2026-06-27"]'); await wait(700); await pg.click('[data-tab=tasks]'); await wait(300); }
      ok(await pg.inputValue('#dateSel') === '2026-06-27' && await pg.locator('#pane .rcard .jd').count() > 0, 'ip chốt: bấm banner “ngày chưa chốt” → mở ngày đó, có so sánh KH');
      await shot(pg, 'm_ip_chot_tasks');
      await pg.evaluate(() => go('period')); await wait(500);
      await pg.fill('#pAnchor', '2026-06-26'); await pg.dispatchEvent('#pAnchor', 'change'); await wait(700);
      await pg.click('[data-wtab=task]'); await wait(300);
      ok(await pg.locator('#periodPane .tcard.wauto').count() > 0 && await pg.locator('#periodPane table').count() === 0 && await pg.locator('#mBottom [data-act=wLock]').count() === 1 && await pg.evaluate(() => document.documentElement.scrollWidth) <= W, 'ip báo cáo tuần: dòng việc dạng thẻ như phiếu ngày, nút Chốt tuần ở thanh dưới, không tràn ngang');
      await shot(pg, 'm_ip_week_task');
      ok(await pg.isVisible('#fab'), 'ip báo cáo tuần: nút ＋ nổi ở I.A');
      const nt0 = await pg.evaluate(() => W.tasks.length);
      await pg.click('#fab'); await wait(300); if (await pg.locator('.zpick .btn').count()) { await pg.click('.zpick .btn >> nth=0'); await wait(400); }
      ok(await pg.evaluate(n => W.tasks.length === n + 1 && document.activeElement.dataset.path === 'tasks.' + n + '.desc', nt0), 'ip báo cáo tuần: ＋ thêm việc → con trỏ vào ô nội dung dòng mới');
      const tb = await pg.evaluate(() => { const r = document.activeElement.getBoundingClientRect(); return r.top; });
      ok(tb >= 0 && tb < H, 'ip báo cáo tuần: dòng mới nằm trong màn hình');
      await pg.click('[data-wtab=plan]'); await wait(300);
      const np0 = await pg.evaluate(() => W.nextPlans.length);
      await pg.click('#fab'); await wait(300); if (await pg.locator('.zpick .btn').count()) { await pg.click('.zpick .btn >> nth=0'); await wait(400); }
      ok(await pg.evaluate(n => W.nextPlans.length === n + 1 && document.activeElement.dataset.path === 'nextPlans.' + n + '.desc' && document.querySelectorAll('#periodPane .qbtns [data-act=wBump]').length > 0, np0), 'ip báo cáo tuần: ＋ thêm kế hoạch tuần sau, thẻ có nút +2/+5/+7/+10');
      const ib = await pg.evaluate(() => W.nextPlans.length - 1);
      await pg.fill(`[data-root=W][data-path="nextPlans.${ib}.add"]`, '20'); await pg.click(`[data-act=wBump][data-i="${ib}"][data-v="5"]`); await wait(150);
      ok(await pg.evaluate(i => W.nextPlans[i].add === 25 && /25%/.test($('#wpt-' + i).innerText), ib), 'ip KH tuần sau: nút +5 cộng % dự kiến, lũy kế dự kiến cập nhật ngay');
      await shot(pg, 'm_ip_week_plan');
    }
    ok(!errs.length, `${n}: không lỗi JavaScript ` + errs.join(' | '));
    await ctx.close();
  }
  await browser.close();
  console.log(fails ? `\n${fails} kiểm thử LỖI` : '\nTất cả kiểm thử giao diện đạt');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
