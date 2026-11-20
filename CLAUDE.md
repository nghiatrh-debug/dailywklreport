# CLAUDE.md — App Báo cáo ngày công trường

Hướng dẫn cho Claude khi làm việc trên repo này. Phần A là quy ước riêng của app. Phần B là 4 nguyên tắc chống lỗi khi AI viết code, phỏng theo [forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills) (MIT).

Trả lời bằng tiếng Việt, ngắn gọn, dùng được ngay.

---

## A. Quy ước riêng của app

### Cách làm việc
- **Bàn trước, làm sau.** Phân tích, đề xuất phương án (có thể kèm mockup), rồi CHỜ chủ repo nói "Làm đi" mới sửa code.
- Mỗi đợt sửa: ghi các mục đã chốt vào `docs/SPEC.md` trước, sau đó mới code.
- **SPEC tự lưu, tự đẩy lên repo**: ghi/cập nhật `docs/SPEC.md` xong thì commit + push luôn, KHÔNG tạo file hay gửi bản SPEC vào cuộc trò chuyện cho chủ repo xem. Chỉ tạo/gửi khi chủ repo yêu cầu xem SPEC.
- App là **khuôn mẫu dùng chung cho nhiều dự án**. CN8-2 chỉ là dữ liệu thử. Không đưa thông tin riêng của một dự án vào code.

### Bảo mật
- KHÔNG hỏi, đọc hay xử lý `.clasprc.json` (luôn nằm trong `.gitignore`).
- KHÔNG gõ PIN vào app thật (link `/exec`).
- `.clasp.json` phải có trong repo.

### Cấu trúc
- `apps-script/Code.gs`: máy chủ. Mỗi màn hình chỉ gọi `apiOpen` một lần. Dùng bộ đệm CacheService; bảng chuẩn hóa chỉ ghi khi CHỐT.
- `apps-script/Index.html`: toàn bộ giao diện (vanilla JS, một file). Chạy 2 chế độ: Apps Script (`google.script.run`) hoặc độc lập (IndexedDB + dữ liệu demo).
- Mô hình dữ liệu và chi tiết nghiệp vụ: `docs/SPEC.md`.
- Thêm cột vào SCHEMA: chỉ thêm vào **cuối**, gọi `ensureHeader_()`.
- CSS cho điện thoại (<768px) nằm trong khối `<style>` cuối `<head>`.
- Template literal trong HTML: kiểm tra kỹ dấu backtick khi nối chuỗi.

### Kiểm thử — bắt buộc trước khi push
```bash
node tests/gastest.js        # máy chủ (giả lập GAS bằng tests/gasmock.js)
node tests/ui.js             # giao diện, Playwright: 375/390/412 px + máy tính, ảnh ở tests/shots/
# kiểm tra cú pháp giao diện nhanh:
sed -n '/<script>$/,/<\/script>/p' apps-script/Index.html | sed '1d;$d' > /tmp/app.js && node --check /tmp/app.js
```
- Tính năng mới → thêm kiểm thử vào `gastest.js` / `ui.js`. Mock thiếu hàm → bổ sung `tests/gasmock.js`.
- Xem ảnh chụp giao diện trước khi báo xong.

### Vòng viết code → tự kiểm thử → TESTING.md (bắt buộc mỗi đợt sửa)
1. Sửa xong → tự chạy `bash tests/run-all.sh "ghi chú đợt sửa"` (chạy cả 3 bước, tự ghi 1 dòng vào nhật ký `TESTING.md`). Trong môi trường Claude: đặt `CHROME=/usr/bin/google-chrome PW_PATH=/tmp/pwnode/node_modules/playwright-core`.
2. Có lỗi → tự sửa và chạy lại đến khi ĐẠT. Không báo xong, không push khi còn lỗi.
3. Viết thêm mục trong "Ghi chú từng đợt sửa" của `TESTING.md` bằng lời dễ hiểu: sửa gì, kiểm thử mới, ảnh màn hình đã xem, rủi ro còn lại. Cập nhật phần "bao phủ" nếu có nhóm kiểm thử mới.
4. Commit `TESTING.md` cùng với code.

### Triển khai
- `git push origin main` → GitHub Actions kiểm thử → `clasp push` lên bản thử **/dev**. Link `/exec` không đổi.
- Chỉ khi chủ repo nói "phát hành": `git push origin main:release` → `clasp deploy` lên `/exec`. Không dùng tag (proxy chặn).

---

## B. Bốn nguyên tắc viết code (Karpathy)

Các nguyên tắc này ưu tiên cẩn thận hơn tốc độ. Việc nhỏ, hiển nhiên thì dùng phán đoán.

### 1. Nghĩ trước khi code
**Không đoán. Không giấu chỗ chưa rõ. Nêu rõ đánh đổi.**
- Nói rõ các giả định. Không chắc thì hỏi.
- Yêu cầu hiểu được nhiều cách → trình bày các cách, không tự chọn ngầm.
- Có cách đơn giản hơn → nói ra. Phản biện khi cần.
- Chỗ nào chưa rõ → dừng lại, chỉ đúng chỗ đó, rồi hỏi.

### 2. Đơn giản trước tiên
**Ít code nhất mà giải quyết được việc. Không làm phòng xa.**
- Không thêm tính năng ngoài yêu cầu.
- Không tạo lớp trừu tượng cho đoạn code chỉ dùng một lần.
- Không thêm "tùy biến", "cấu hình" khi chưa ai yêu cầu.
- Không bắt lỗi cho tình huống không thể xảy ra.
- Viết 200 dòng mà 50 dòng đủ → viết lại.

Tự hỏi: "Kỹ sư giỏi có thấy chỗ này rườm rà không?" Có → đơn giản hóa.

### 3. Sửa đúng chỗ
**Chỉ chạm vào chỗ cần sửa. Chỉ dọn rác do mình tạo ra.**
- Không "tiện tay" sửa code, chú thích, định dạng bên cạnh.
- Không refactor phần đang chạy tốt.
- Giữ đúng phong cách code hiện có.
- Thấy code thừa không liên quan → báo lại, không xóa.
- Thay đổi của mình làm biến/hàm thành thừa → xóa phần thừa đó.

Phép thử: mỗi dòng thay đổi phải truy được về yêu cầu.

### 4. Làm theo mục tiêu kiểm chứng được
**Đặt tiêu chí thành công. Lặp đến khi kiểm chứng xong.**
- "Thêm kiểm tra dữ liệu" → viết test cho dữ liệu sai, rồi làm cho test qua.
- "Sửa lỗi" → viết test tái hiện lỗi, rồi làm cho test qua.
- "Refactor" → test phải qua cả trước và sau.

Việc nhiều bước → nêu kế hoạch ngắn:
```
1. [Bước] → kiểm chứng: [cách kiểm]
2. [Bước] → kiểm chứng: [cách kiểm]
```

**Dấu hiệu nguyên tắc đang hiệu quả:** diff ít thay đổi thừa, ít phải viết lại vì phức tạp hóa, câu hỏi làm rõ đến trước khi code chứ không phải sau khi sai.

---

## C. Phân công đội CMD Office (repo `nghiatrh-debug/CMD-OFFICE`)

Khi làm việc với đội agent, Tổng quản giao việc theo bảng dưới. Mọi agent vẫn tuân thủ phần A và B.

| Bước | Agent | Ghi chú riêng cho app này |
|---|---|---|
| Bàn trước, phương án, ghi `docs/SPEC.md` | `spec-writer` | Chờ chủ repo nói "Làm đi" |
| Sửa `apps-script/Code.gs` | `backend-dev` | Cột mới thêm ở cuối + `ensureHeader_()`; test vào `gastest.js` |
| Sửa `apps-script/Index.html` | `frontend-dev` | **Một file duy nhất → chỉ 1 agent sửa tại một thời điểm**, không chạy song song |
| Kiểm thử | `tester` | Chạy `bash tests/run-all.sh "ghi chú"` (được phép ghi nhật ký `TESTING.md`); XEM ảnh trong `tests/shots/` |
| Soát diff | `reviewer` | Đối chiếu phần A + B (nhất là "Sửa đúng chỗ") |
| Dùng thử | `field-engineer` | Chỉ chế độ độc lập + nút "Điền mẫu demo"; không mở link `/exec` |
| Push, theo dõi CI | `release` | Lệnh theo dõi bên dưới; "phát hành" chỉ khi chủ repo nói |

Người sửa code (`backend-dev`/`frontend-dev`) viết mục "Ghi chú từng đợt sửa" trong `TESTING.md` và commit cùng code.

### Theo dõi CI
```bash
gh api repos/nghiatrh-debug/dailywklreport/commits/<sha>/check-runs --jq '.check_runs[]|"\(.name): \(.status) \(.conclusion)"'
```
Lặp bằng vòng `until` (15 giây/lần), không dùng `sleep` dài. API Actions bị proxy chặn → dùng check-runs.

### Môi trường
- Trong môi trường Claude cloud: cài Playwright `mkdir -p /tmp/pwnode && cd /tmp/pwnode && npm init -y >/dev/null && npm i playwright-core@1`.
- Trên máy Windows: Chrome ở `C:\Program Files\Google\Chrome\Application\chrome.exe`; `Set-Clipboard` lỗi → dùng `| clip`.
