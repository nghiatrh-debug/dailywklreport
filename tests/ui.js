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
    const pdfRows = await pg.$$eval('#doc table.grid', t => t[0].innerText);
    ok(pdfRows.indexOf('Tổ cốp pha') > pdfRows.indexOf('Chỉ huy trưởng'), 'PDF: tổ đội mới nằm dưới Quản lý dự án / Chỉ huy trưởng');
    await pg.click('[data-tab=status]'); await wait(200);
    const doc = await pg.innerText('#doc');
    ok(/LŨY KẾ HÔM QUA/i.test(doc) && /CHÊNH LỆCH/i.test(doc), 'PDF ngày có cột Lũy kế hôm qua / Chênh lệch');
    ok(/KẾ HOẠCH NGÀY MAI/i.test(doc) && /BẢN NHÁP/.test(doc), 'PDF có bảng kế hoạch riêng + dấu BẢN NHÁP khi chưa chốt');
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
    ok(d26.includes('Verified by Consultant - ' + code) && await pg.locator('#doc .ttl .qrst img').count() === 1, 'PDF: mã QR + “Verified by Consultant - ' + code + '”');
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

    /* ---- Cấu hình: thứ tự thẻ, logo, chế độ thử nghiệm ---- */
    await pg.click('[data-view=config]'); await wait(300);
    const tabsTxt = await pg.innerText('#cfgTabs');
    ok(tabsTxt.indexOf('Người dùng') < tabsTxt.indexOf('Khu vực') && /Cài đặt/.test(tabsTxt), 'Cấu hình: Người dùng & PIN đứng trước Khu vực; có thẻ Cài đặt');
    const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAICAIAAAB/FOjAAAAAH0lEQVR42mNk+M+ABzAxEAEYGRgYGBkZGBj/MxDUMAMAqwgCCTL0vDMAAAAASUVORK5CYII=', 'base64');
    await pg.setInputFiles('input[data-logo=consultant]', { name: 'tvgs.png', mimeType: 'image/png', buffer: PNG }); await wait(700);
    ok(await pg.locator('.lbox img').count() === 1, 'Tải logo TVGS: hiện xem trước');
    await pg.click('[data-view=day]'); await wait(600);
    ok(await pg.evaluate(() => { const td = document.querySelectorAll('#doc .logos2 td'); return td.length === 3 && !!td[0].querySelector('img') && /TƯ VẤN GIÁM SÁT/.test(td[0].innerText) && /CHỦ ĐẦU TƯ/.test(td[1].innerText) && /NHÀ THẦU/.test(td[2].innerText); }), 'PDF: logo TVGS (trái) – CĐT (giữa) – Nhà thầu (phải)');
    await pg.click('[data-view=config]'); await wait(300); await pg.click('[data-cfgtab=settings]'); await wait(300);
    ok(/Thư mục lưu PDF/.test(await pg.innerText('#configPane')) && await pg.isVisible('#pdfLink') && await pg.isVisible('[data-cfgchk="settings.pdfMonthly"]'), 'Cài đặt: chọn thư mục lưu PDF (dán link Drive) + chia thư mục theo tháng');
    await shot(pg, 'desk_settings');
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
    const pn = await pg.innerText('#periodPane');
    ok(/ngày chưa chốt/.test(pn) && /Tuân thủ KH ngày/.test(pn), 'Tuần: gom ngày chưa chốt + tỷ lệ tuân thủ KH');
    ok(/TUÂN THỦ KẾ HOẠCH NGÀY/.test(await pg.innerText('#pdoc')), 'PDF tuần có mục tuân thủ KH');
    await shot(pg, 'desk_period');
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
    }
    ok(!errs.length, `${n}: không lỗi JavaScript ` + errs.join(' | '));
    await ctx.close();
  }
  await browser.close();
  console.log(fails ? `\n${fails} kiểm thử LỖI` : '\nTất cả kiểm thử giao diện đạt');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
