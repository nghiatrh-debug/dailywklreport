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
    const doc = await pg.innerText('#doc');
    ok(/LŨY KẾ HÔM QUA/i.test(doc) && /CHÊNH LỆCH/i.test(doc), 'PDF ngày có cột Lũy kế hôm qua / Chênh lệch');
    ok(/KẾ HOẠCH NGÀY MAI/i.test(doc) && /BẢN NHÁP/.test(doc), 'PDF có bảng kế hoạch riêng + dấu BẢN NHÁP khi chưa chốt');
    ok(/Việc đạt kế hoạch/.test(await pg.innerText('#pane')), 'Tình trạng phiếu: thống kê đạt KH');
    await pg.click('[data-tab=tasks]'); await wait(200);
    ok(await pg.locator('#pane .jd.short').count() > 0 && /ngày liên tiếp/.test(await pg.innerText('#pane')), 'Chốt: có việc Hụt + “ngày liên tiếp”');
    await shot(pg, 'desk_chot_tasks');
    // ngày cũ đã chốt: dòng chốt
    await pg.selectOption('#dateSel', '2026-06-26'); await wait(600);
    ok(/Chốt bởi .* 26\/06\/2026/.test(await pg.innerText('#doc')), 'PDF ngày đã chốt ghi thời điểm chốt');

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
    await shot(pg, `m_${n}_tomorrow`);
    if (n === 'ip') {
      await login(pg, 'u_chot', '1234');
      await pg.click('[data-tab=people]'); await wait(300);
      ok(await pg.isVisible('#fab'), 'ip chốt: nút ＋ ở tab Nhân sự');
      await pg.click('#fab'); await wait(300); await pg.click('.zpick .btn >> nth=0'); await wait(400);
      ok(await pg.inputValue('[data-path="manpower.0.title"]') === '', 'ip chốt: nhân lực mới ở đầu danh sách');
      await shot(pg, 'm_ip_chot_people');
      await pg.click('[data-tab=tasks]'); await wait(300);
      if (await pg.locator('[data-act=gotoDate]').count()) { await pg.click('[data-act=gotoDate] >> nth=0'); await wait(700); await pg.click('[data-tab=tasks]'); await wait(300); }
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
