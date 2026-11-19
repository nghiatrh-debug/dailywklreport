# TESTING.md — Nhật ký kiểm thử

File này để anh Nghĩa **đọc thay vì đọc code**: mỗi đợt sửa, Claude tự chạy kiểm thử, rồi ghi lại đã kiểm gì và kết quả ra sao. Không hiểu chỗ nào thì hỏi Claude giải thích; thấy thiếu thì yêu cầu kiểm thêm.

## Cách chạy

```bash
bash tests/run-all.sh "ghi chú đợt sửa"
```

Chạy lần lượt: kiểm tra cú pháp giao diện → kiểm thử máy chủ (`tests/gastest.js`) → kiểm thử giao diện (`tests/ui.js`), rồi tự thêm 1 dòng vào bảng nhật ký cuối file. GitHub Actions cũng chạy lại máy chủ + giao diện mỗi lần push.

## Bộ kiểm thử đang bao phủ những gì

**Máy chủ (119 kiểm thử, giả lập Google Apps Script)**
- Đăng nhập & phân quyền: tạo mã PIN, sai PIN, token hết hạn; kỹ sư không sửa được cấu hình hay phiếu của người khác; chỉ Quản trị đổi logo và xem link Sheet/Drive.
- Lưu phiếu & chốt ngày: ngày đã chốt chặn sửa phiếu; chốt lại không nhân đôi dòng; bảng chuẩn hóa (CongViec, BaoCao, HinhAnh) chỉ ghi khi chốt.
- Ảnh: tải ảnh, không tải lại ảnh trùng, mặt bằng nhiều ảnh, dữ liệu gửi đi không kèm ảnh nặng.
- Kỳ tuần/tháng: lấy đúng khoảng ngày, cột KH/thực hiện/chênh lệch, việc làm thêm.
- Quy trình TVGS: chốt → chờ kiểm tra → yêu cầu sửa (bắt buộc ghi chú) → xác nhận → sinh mã xác thực, QR trỏ về /exec; chưa xác nhận thì chặn xuất PDF; mở khóa thì mã cũ báo "bản cũ".
- PDF & Drive: PDF lưu đúng thư mục dự án/Báo cáo ngày/tháng; kiểm tra thư mục sai hoặc không có quyền.
- Chế độ thử: chỉ ngày chưa có dữ liệu mới là ngày thử; xóa ngày thử giữ ngày thật.
- Tốc độ & bộ đệm: mở lại ngày lấy từ bộ đệm, lưu phiếu chỉ đọc Sheet 3 lần.
- Dữ liệu lớn dần: chỉ mục ngày gọn, ghép đủ 300 việc, ô JSON lớn chia cột (vượt 180.000 ký tự → báo lỗi, không ghi hỏng), chốt lại tìm dòng bằng TextFinder.
- Báo cáo tuần: lưu nháp + tải ảnh Gantt, chặn xuất PDF khi chưa chốt / chưa TVGS xác nhận, chốt ghi 6 bảng Tuan_*, TVGS trả lại phải ghi chú, xác nhận sinh mã tra được, tuần đã chốt không bị ghi đè, PDF lưu thẳng thư mục đã chọn và ai có link xem được, tuần sau nhận số liệu tuần trước, mở khóa làm mã cũ hết hiệu lực, tải PDF MS Project.
- Hồ sơ đệ trình: link sổ sai/không quyền, nhận loại trang tính, chỉ lấy hồ sơ phát sinh trong tuần (bỏ cũ không đổi, bỏ hủy), ô ngày kiểu Date/chữ, mô tả 2 dòng, B/A → Đã duyệt, C cũ có kết quả trong tuần, MEP đang kiểm tra, văn bản trong tuần, ghi Tuan_HoSo.
- Reset toàn bộ: lưu trữ, xóa dữ liệu, thu hồi token.

**Giao diện (Playwright, điện thoại 375/390/412 px + máy tính, ảnh ở `tests/shots/`)**
- Trên 3 cỡ điện thoại: không tràn ngang, không lỗi JavaScript, nút ＋ nổi, thêm việc / nghiệm thu / kế hoạch ngày mai, lũy kế tự cộng.
- Máy tính: phiếu kỹ sư, chốt, chống ghi đè, tình trạng phiếu, cài đặt, mặt bằng, chặn lũy kế > 100%.
- PDF: bản nháp có dấu BẢN NHÁP, cột lũy kế hôm qua/chênh lệch, PDF tuần có mục tuân thủ KH, nguồn thời tiết.
- TVGS & xác thực: tin nhắn Zalo soạn sẵn, quét QR ra trang xác thực, tra mã sai.
- Phiên đăng nhập: "Ghi nhớ" / không ghi nhớ, tự đăng xuất sau 8 giờ.
- Báo cáo tuần: tự tổng hợp khi mở, đầu trang thông tin dự án + thông tin chung + overall + A.1, biểu đồ nhân sự, đánh giá Đạt/Chậm (ngưỡng 5%), tổng hợp lại giữ dòng sửa tay, KH tuần sau từ việc chưa xong, tên file mẫu VC-WR-34, chốt → TVGS xác nhận → QR + tra mã, tuần sau tự lấy số tuần & % tuần trước, tuần đã xác nhận khóa nhập.

## Ghi chú từng đợt sửa

### Đợt 9.3 – Ý kiến TVGS theo từng dòng cho báo cáo tuần (19/11/2026)
- **Sửa gì:** báo cáo tuần có đủ chức năng như báo cáo ngày: 💬 từng dòng (kể cả dòng 🔒, B.3/B.4) + Tiến độ tổng, Đánh giá chung, Nhận xét an toàn; giỏ ý kiến lưu nháp, gửi 1 lần / gửi bổ sung; người chốt “Tới chỗ sửa” (tự chuyển thẻ), “Đã sửa”; chốt lại → TVGS thấy “đã sửa x/y”. Dòng 🔒 nhắc cách sửa. Máy tính: 💬 ở cột STT cho dễ thấy.
- Quản trị kiêm người chốt: khi báo cáo đang trả về thì không hiện “gửi bổ sung” (vai người sửa).
- **Kiểm thử mới:** gastest – tuần trả lại kèm ý kiến, gửi bổ sung, lưu không ghi đè ý kiến, chốt lại → lastItems đã sửa/chưa sửa. ui.js – 💬 Tiến độ tổng (đề nghị % thực tế tuần này), 💬 dòng 🔒 (nhắc cách sửa), đếm (2), gửi, người chốt 0/2 → Tới chỗ sửa đúng thẻ → Đã sửa → chốt lại → TVGS thấy 1/2 rồi xác nhận.
- **Ảnh đã xem:** desk_week_tvgs_cmt, desk_week_chot_cmt.


### Sửa nhỏ 9.2 – Ý kiến chung của TVGS không mất khi bấm Quay lại (18/11/2026)
- **Lỗi:** trong giỏ ý kiến, gõ “Ý kiến chung” rồi bấm “← Quay lại” để kiểm tra chỗ khác → mất chữ đã gõ.
- **Sửa:** ý kiến chung tự lưu nháp trên máy ngay khi gõ; nút đổi thành “💾 Lưu & quay lại”; mở lại giỏ (kể cả sau khi tải lại trang) vẫn còn; số ý kiến trên nút tính cả ý kiến chung; gửi xong mới xóa nháp.
- **Kiểm thử mới (ui.js):** Lưu & quay lại → đếm (2); tải lại trang, mở lại giỏ → còn đủ ý kiến chung + ý kiến từng việc.


### Sửa nhỏ 9.1 – Người chốt sửa phiếu kỹ sư: bỏ 2 nút “Lưu” trùng (18/11/2026)
- **Lỗi:** người chốt mở phiếu kỹ sư (kể cả phiếu MEP) thấy “💾 Lưu” và “✔ Lưu” – hai nút làm cùng một việc.
- **Sửa:** phiếu đã nộp → “💾 Lưu nháp” + “✔ Lưu & về màn hình tổng hợp” (lưu xong quay về, báo cáo gộp cập nhật). Phiếu chưa nộp / bị trả → “📨 Lưu & nộp thay kỹ sư” (ghi “nhập thay bởi” người chốt).
- **Kiểm thử mới (ui.js):** đúng 2 nút khác nhau theo trạng thái phiếu, không còn “Lưu” trùng.


### Đợt 9 – TVGS ghi ý kiến theo từng việc (18/11/2026)
- **Sửa gì:** TVGS bấm 💬 ngay tại từng dòng (phiếu kỹ sư + các tab báo cáo ngày) → 4 nút chọn nhanh (% chưa đúng · Khối lượng chưa đúng · Ghi rõ vị trí · Thiếu ảnh) + “Đề nghị %” + ghi chú → vào giỏ “📝 Ý kiến (n)” → “Yêu cầu nhà thầu sửa (n)” gửi 1 lần. Đã trả lại vẫn “Gửi bổ sung”. Người chốt thấy danh sách ý kiến, “Tới chỗ sửa →” mở đúng phiếu/dòng (tô cam), sửa trực tiếp, “✔ Đã sửa”; chốt lại → TVGS thấy “Ý kiến lần trước – đã sửa x/y”. PDF không đổi.
- **Kiểm thử mới:** gastest – trả lại kèm ý kiến, gửi bổ sung (cộng dồn, chặn khi chưa trả lại, kỹ sư không gửi được), đánh dấu đã sửa không ghi đè ý kiến, chốt lại → lastItems có cờ đã sửa. ui.js – nút 💬, hộp ý kiến (4 nút + đề nghị %), giỏ, gửi, gửi bổ sung, người chốt thấy danh sách, Tới chỗ sửa, Đã sửa 1/2; điện thoại TVGS xem phiếu có 💬 và “📝 Ý kiến (1)”.
- **Ảnh đã xem:** desk_tvgs_cmt, desk_chot_cmt, desk_chot_cmt_go, m_tvgs_cmt, m_tvgs_cmt_box.
- **Rủi ro:** ý kiến gắn theo mã dòng; dòng không có mã (dữ liệu cũ) gắn theo thứ tự + tên – nếu nhà thầu xóa/đổi dòng thì “Tới chỗ sửa” báo không tìm thấy. Nháp ý kiến TVGS nằm trên máy đang dùng (đổi máy giữa chừng thì mất nháp chưa gửi).


### Sửa lỗi 8.8 – Nút “In báo cáo” ra trang trắng (18/11/2026)
- **Lỗi:** bấm In → trang 1 trắng. Nguyên nhân: CSS in cũ chỉ “làm hiện” khung #doc nằm trong khung xem trước (có cuộn, giới hạn chiều cao, vị trí tương đối) nên báo cáo bị đẩy/xén ra ngoài trang; báo cáo tuần (#pdoc) còn không được in.
- **Sửa:** trước khi in, chép báo cáo đang xem vào khung #printRoot đặt thẳng dưới <body>, CSS in ẩn mọi thứ khác; hoạt động cả với Ctrl+P (sự kiện beforeprint).
- **Kiểm thử mới (ui.js):** in báo cáo ngày và tuần → chỉ còn bản báo cáo, nằm ngay đầu trang. Đã in thử PDF bằng Chrome ở màn hình hẹp, cuộn giữa trang: 3 trang đủ nội dung, không trang trắng.


### Sửa nhỏ 8.7 – Overall Schedule + tiêu đề báo cáo tuần (18/11/2026)
- **Lỗi:** ô Đánh giá co hẹp, “Chậm nhẹ” tràn ô. Nguyên nhân: lớp `warn` của giao diện app (display:block) đè lên ô bảng ở bản xem trước. Sửa: đổi lớp ô thành `e-ok/e-warn/e-bad`, cố định 4 cột 25%, chữ đánh giá 18px Arial 1 dòng.
- Tiêu đề tuần: “Tuần – Tháng” và “Kỳ báo cáo” thành 2 dòng canh giữa.
- **Kiểm thử mới (ui.js):** “Chậm nhẹ”, “Chậm” nằm gọn 1 dòng, 4 ô rộng đều; tiêu đề 2 dòng canh giữa. Ảnh đã xem: desk_week_ovr, desk_week_qr.


### Đợt 8.6 – Logo tác giả H.T.N (18/11/2026)
- Logo nét bút (phương án B) ở mục Giới thiệu (Cấu hình) và đầu hộp Liên hệ; chân trang PDF giữ chữ © 2026 H.T.N, không in logo.
- Ảnh JPEG nền trắng ~11 KB nhúng trong Index.html; dấu "/" trong chuỗi base64 ghi "\/" để Apps Script không cắt nhầm.
- Kiểm thử mới (ui.js): logo tải được ở Giới thiệu + Liên hệ; PDF tuần không có logo. Ảnh đã xem: desk_contact.


### Đợt 8 – Khóa nút khi bận, màu đầu mục, bảng đánh giá, H.T.N, dấu TVGS (18/11/2026)
- **8.1 Khóa tạm nút:** mọi lệnh gửi máy chủ quan trọng (lưu, tải dữ liệu, đọc file hồ sơ, ghi danh mục, tải file, tạo PDF, TVGS xác nhận…) được theo dõi. Còn việc chạy → các nút Nộp, Chốt, Mở khóa, Tổng hợp lại, Xác nhận/Yêu cầu sửa, Xuất PDF, Lưu cấu hình… mờ và ghi lý do; xong thì sáng lại. Bấm 1 nút → khóa ngắn chống bấm 2 lần. Quá 60 giây → mở lại nút, báo “Kết nối chậm”.
- **8.2** Đầu mục báo cáo tuần 3 cấp màu (navy / xanh nhạt / xám xanh nhạt). **8.3** Bảng đánh giá: bỏ X nền vàng; Tốt xanh ✔, Trung bình vàng ●, Kém đỏ ✖; ô không chọn chữ xám, cột cố định. **8.4** © 2026 H.T.N (Giới thiệu, chân PDF ngày + tuần, màn đăng nhập), bỏ “Lập bằng ứng dụng…”, nút ✉ Liên hệ. **8.5** Dấu TVGS: chữ trên – QR giữa – mã dưới, canh giữa trục QR, ngang dòng tiêu đề.
- **Kiểm thử mới (ui.js):** nút mờ + lý do khi bận, vẽ lại vẫn mờ, bấm lúc bận không chạy, xong thì sáng lại đúng chữ cũ, bấm nhanh 2 lần chỉ chạy 1 lần, quá thời gian chờ thì mở lại + cảnh báo, các lệnh máy chủ đều được theo dõi; màu 3 cấp đầu mục; bảng đánh giá đủ 3 mức đúng màu/dấu; thứ tự và canh giữa dấu TVGS; nút Liên hệ (tel:, mailto:); bản quyền H.T.N.
- **Ảnh đã xem:** desk_week_rate, desk_week_qr, desk_contact, desk_week_doc.
- **Rủi ro:** dấu ✔ ● ✖ và viền ô trên PDF do Google tạo cần xem 1 file thật trên /dev (bộ chuyển PDF của Google có thể thiếu ký hiệu). Khi tự lưu chạy, nút Chốt mờ trong lúc lưu (vài giây) – đúng thiết kế.


### Sửa nhỏ 7.3 – Đổi thứ tự mục báo cáo ngày (17/11/2026)
- Nhân lực (5) và Thiết bị (6) chuyển xuống sau Vật tư (4), trước An toàn (7); đánh số lại các mục.
- Kiểm thử mới (ui.js): kiểm tra đúng thứ tự 1→9 trên bản xem trước.
- Đã in thử PDF bằng Chrome, xem 3 trang: hai bảng nhân lực/thiết bị vẫn nằm cạnh nhau.


### Sửa nhỏ 7.2 – Đầu mục chính nổi bật (17/11/2026)
- Tiêu đề mục chính báo cáo ngày đổi sang nền navy, chữ trắng, viền vàng; báo cáo tuần thêm viền vàng.
- Đã in thử PDF bằng Chrome, xem trang 1–2: chữ trắng rõ, số tổng bên phải đọc được.
- Rủi ro: chỉ đổi CSS, không đổi dữ liệu.


### Sửa nhỏ 7.1 – Mục mặt bằng không để trống nửa trang (17/11/2026)
- **Lỗi:** PDF báo cáo ngày mục 7 ngắn, mục 8 Mặt bằng bị ép sang trang mới nên để trống hơn nửa trang.
- **Sửa:** bỏ ép sang trang; tiêu đề mục 8 (và mục III báo cáo tuần) gói chung với ảnh đầu, không đủ chỗ thì cả hai cùng sang trang.
- **Kiểm thử mới (ui.js):** tiêu đề dính ảnh đầu; không phần tử tiêu đề nào có ngắt trang ép buộc.
- **Rủi ro:** bộ chuyển PDF của Google xử lý "không ngắt giữa khối" có thể khác Chrome một chút; cần anh xem 1 file PDF thật trên /dev.


### 17/11 – Đợt 7: danh mục vật tư, C.1.1 Xây dựng / C.1.2 MEP
- **Sửa:**
  - **Danh mục vật tư** (Cấu hình → Danh mục): chủng loại có ĐVT, bộ môn (XD/MEP), kiểu ghi (Khối lượng / Theo lô), danh sách chi tiết. Quản trị sửa, đổi thứ tự, ẩn, gộp mục trùng (tên cũ thành bí danh).
  - Nhập danh mục từ file: tải file mẫu CSV, nạp .xlsx (bộ đọc Excel tải từ jsdelivr khi cần) hoặc .csv, hoặc dán vùng ô copy từ Excel.
  - **Báo cáo ngày:** chọn chủng loại (ĐVT tự điền), gợi ý chi tiết; chi tiết mới tự vào danh mục khi lưu (`matMem` → `mergeMat_`). Người chốt thêm chủng loại mới qua "＋ Thêm chủng loại mới…" (`apiCatalogAdd`, trùng tên thì dùng mục có sẵn). Kiểu theo lô: nội dung lô + ghi chú.
  - **Báo cáo tuần:**
    - C.1.1 / C.1.2 nhóm theo chủng loại (thứ tự danh mục), có dòng Tổng.
    - Chỉ hiện chi tiết có hàng về trong tuần. Lũy kế mọi chi tiết lưu ở `matCum`; tuần cũ chưa có thì lấy từ bảng vật tư.
    - Lô hàng MEP ghi ngày nhập và ghi chú.
    - Tuan_VatTu thêm cột bo_mon, ngay_nhap, ghi_chu; loại LO_HANG.
  - `apiSaveConfig` giữ chủng loại / chi tiết người chốt vừa thêm khi admin lưu cấu hình cũ.
  - **Sửa lỗi phát hiện khi kiểm thử:** đăng nhập lại ngay sau khi bị tự đăng xuất (trong vòng 30 giây) không ghi mốc thao tác mới, nên khoảng 1 phút sau lại bị đăng xuất. Nay đăng nhập luôn ghi mốc mới.
- **Kiểm thử mới:**
  - gastest: thêm chủng loại, trùng tên, chi tiết tự vào danh mục khi lưu báo cáo ngày, admin lưu cấu hình cũ không mất mục, kỹ sư không thêm được, Tuan_VatTu có lô hàng MEP và bộ môn.
  - ui: dán từ Excel; nạp CSV; nạp .xlsx (bộ đọc giả lập từ bản cài sẵn); gộp mục; lưu; ô nhập ngày theo danh mục; thêm chủng loại mới (trùng và mới); tổng hợp tuần (kỳ trước = lũy kế còn lại, giữ lũy kế chi tiết không về, lô hàng); PDF C.1.1/C.1.2; chọn chủng loại ở báo cáo ngày → ĐVT tự điền; đăng nhập lại sau khi tự đăng xuất.
- **Ảnh đã xem:** desk_cfg_materials.png, desk_week_mat.png, desk_day_mat.png.
- **Rủi ro còn lại:**
  - Đọc file .xlsx cần mạng để tải bộ đọc (jsdelivr). Nếu bị chặn, app báo lưu dạng CSV.
  - Dữ liệu vật tư cũ gõ tự do, chưa có trong danh mục, vẫn được gom theo tên.

### 17/11 – Đợt 6J: cột % dự kiến tuần, ngày trình đủ năm, ô cấu hình bị khóa
- **Sửa:**
  - Tuan_CongViec thêm cột cuối `du_kien_tuan` (% dự kiến thực hiện trong tuần của kế hoạch tuần sau).
  - PDF B.3: ngày trình ghi đủ dd/mm/yyyy, cột rộng hơn (trước chỉ hiện "13/10/20").
  - Cấu hình → Dự án: ô thông tin cố định chưa bấm "✎ Sửa thông tin" thì ở chế độ chỉ đọc nhưng trông như ô nhập được, nên gõ mã viết tắt nhà thầu không vào. Nay ô khóa có nền xám, con trỏ cấm, bấm vào thì nhắc bấm "✎ Sửa thông tin".
- **Kiểm thử mới:** gastest – cột du_kien_tuan = 30, kh_pct = 50. ui – ngày trình 20/06/2026 trên PDF; ô khóa xám và có nhắc; sửa rồi lưu được mã "VC".
- **Ảnh đã xem:** desk_settings.png.
- **Rủi ro còn lại:** không.

### 17/11 – Đợt 6I: giờ lấy thời tiết buổi chiều
- **Sửa:** buổi chiều có sau 17h (trước là 18h), mặc định tính 12–17h. Người chốt bấm "🌦 Lấy thời tiết" sau 17h của chính ngày đó → buổi chiều và nhiệt độ tính đến giờ hiện tại; ngày đã qua tính 12–17h. Bấm nút luôn tải số liệu mới, không dùng lại số đã tải trong phiên.
- **Kiểm thử mới (ui):** dữ liệu giả có mưa lúc 18h – 16h20 chưa có buổi chiều; 17h20 chiều nắng (12–17h); 19h20 chiều mưa và nhiệt độ có giá trị lúc 18h; ngày đã qua tính 12–17h.
- **Lỗi tự gây ra rồi sửa trong đợt:** dòng chú thích chèn giữa dòng code làm mất khai báo biến → nút lấy thời tiết báo lỗi. Kiểm thử cũ bắt được, đã sửa.
- **Rủi ro còn lại:** không.

### 17/11 – Đợt 6H: đánh dấu bản quyền
- **Sửa:** dòng "© 2026 Huỳnh Trọng Nghĩa – Lập báo cáo thi công v1.6" ở màn đăng nhập. Cấu hình có mục Giới thiệu (tác giả, phiên bản, phát hành lần đầu, bảo lưu quyền). PDF ngày/tuần có dòng chữ nhỏ dưới phần ký. Đầu Code.gs và Index.html có dòng bản quyền. Thêm file LICENSE (bảo lưu mọi quyền, kho công khai không phải giấy phép); README dẫn tới LICENSE. Thông tin tác giả/phiên bản nằm ở hằng `APP`.
- **Kiểm thử mới (ui):** màn đăng nhập có dòng ©; Cấu hình có Giới thiệu; PDF tuần có dòng bản quyền.
- **Ảnh đã xem:** desk_settings.png (mục Giới thiệu ở cuối thẻ).
- **Rủi ro còn lại:** dòng trên PDF in chữ 6,5 pt màu xám – đủ đọc khi phóng to, không ảnh hưởng nội dung báo cáo.

### 17/11 – Đợt 6G: ảnh theo khu vực, hồ sơ chờ quá 7 ngày, nén ảnh PDF tuần
- **Sửa:**
  - Ảnh tiêu biểu nhóm theo khu vực (thứ tự trong Cấu hình) trên màn nhập và PDF. Mỗi ảnh có chú thích và ngày. Ảnh không gắn khu vực vào nhóm "Ảnh khác"; ảnh tự thêm chọn được khu vực. Ảnh cũ chưa có khu vực thì đoán theo tên khu vực ở đầu chú thích.
  - B.3: hồ sơ chờ duyệt hoặc TVGS đang kiểm tra quá 7 ngày (tính đến ngày cuối kỳ) hiện đỏ "chờ X ngày"; dòng tổng hợp có "Chờ quá 7 ngày N". PDF cũng sắp xếp hồ sơ cần xử lý lên trước.
  - Xuất PDF tuần: nén ảnh tiêu biểu (cạnh dài ≤ 900 px) và mặt bằng (≤ 1600 px); ảnh trên Drive giữ nguyên.
- **Kiểm thử mới:** nhóm ảnh theo khu vực, đổi khu vực của ảnh tự thêm; hồ sơ chờ 12 ngày tô đỏ và ghi trên PDF; shrinkImg 2000 px → 900 px JPEG.
- **Ảnh đã xem:** desk_week_qa.png, desk_week_photo.png.
- **Rủi ro còn lại:** dung lượng PDF thực tế chưa đo trên Google. Ảnh chưa tải xong lúc xuất thì máy chủ lấy bản gốc từ Drive (không nén).

### 17/11 – Đợt 6F: 30 ảnh tiêu biểu, mặt bằng tuần 10 ảnh, B.3/B.4 tách riêng
- **Sửa:**
  - Ảnh tiêu biểu tuần: lấy ngẫu nhiên tối đa 30 ảnh, rải đều các ngày. Người chốt thêm ảnh (nhãn "Tự thêm", tải lên Drive khi lưu) và xóa ảnh. "Đổi bộ ảnh khác" giữ ảnh tự thêm.
  - Mặt bằng tuần tối đa 10 ảnh.
  - B.3 Tình trạng hồ sơ và B.4 Văn bản tách thành 2 mục, mỗi mục 1 bảng (điện thoại: thẻ). B.3 có dòng tổng hợp theo tình trạng và xếp hồ sơ cần xử lý lên trước.
  - Tự dọn: thêm ảnh tự thêm của báo cáo tuần.
- **Kiểm thử mới:** gastest – ảnh tự thêm tải lên Drive. ui – giới hạn 30/10; thêm ảnh; đổi bộ giữ ảnh tự thêm; B.3/B.4 là 2 mục, 2 bảng; thứ tự hồ sơ.
- **Ảnh đã xem:** desk_week_qa.png.
- **Rủi ro còn lại:** 30 ảnh + 10 mặt bằng + 6 Gantt làm file PDF tuần nặng và xuất lâu hơn (chưa đo trên Google thật).

### 17/11 – Đợt 6E: thư mục "Dữ liệu báo cáo", tự dọn ảnh quá 3 tháng
- **Sửa:**
  - Thư mục dữ liệu đổi tên thành "Dữ liệu báo cáo <mã dự án>". Thư mục cũ "Báo cáo ngày – <mã>" được tự đổi tên, giữ nguyên ảnh và file.
  - Tên tab trình duyệt sau khi đăng nhập đổi thành "Báo cáo thi công – <mã>" (trước đó vẫn còn chữ "Báo cáo ngày").
  - Tự dọn: sau khi chốt ngày, app gọi ngầm (người dùng không phải chờ), tối đa 1 lần/ngày.
    - Chuyển vào thùng rác Drive: ảnh của các ngày quá 3 tháng đã chốt và đã xuất PDF; ảnh Gantt và mặt bằng của các tuần quá 3 tháng đã chốt và đã xuất PDF.
    - Giữ lại: ảnh mặt bằng còn được kế thừa; file MSP, logo, PDF báo cáo.
    - Cài đặt chỉ có dòng ghi chú về quy tắc này.
- **Kiểm thử mới:**
  - gastest: đổi tên thư mục cũ; dọn đúng ảnh ngày quá hạn đã chốt và xuất PDF; giữ ảnh mặt bằng kế thừa, ngày chưa chốt, ảnh trong 3 tháng; không quét lại ngày đã dọn; apiCleanup chỉ chạy 1 lần/ngày.
  - ui: Cài đặt có ghi chú tự dọn.
- **Ảnh đã xem:** desk_settings.png.
- **Rủi ro còn lại:** ngày quá 3 tháng mà chưa xuất PDF thì ảnh được giữ luôn (an toàn). Cột link trong bảng HinhAnh của ngày đã dọn sẽ trỏ tới file trong thùng rác. Xuất lại PDF của ngày đã dọn sẽ không có ảnh.

### 17/11 – Đợt 6D: chỉnh báo cáo tuần sau kiểm tra (8 mục)
- **Sửa:**
  - IV MSP trên PDF chỉ còn mã QR, cỡ bằng QR TVGS (40 px). Ảnh Gantt tối đa 6.
  - Tiêu đề không còn "?" khi chưa có số tuần.
  - Mặt bằng tuần thêm / xóa / đổi thứ tự / chú thích như báo cáo ngày, tối đa 6. "Tổng hợp lại" không ghi đè. Ảnh thêm tay tải lên Drive khi lưu (máy chủ trả về mã file).
  - Sửa lỗi ảnh đứng ở "Đang tải ảnh…" sau "Tổng hợp lại" / "Đổi bộ ảnh khác": tải lại ảnh sau 2 thao tác này.
  - KH tuần sau tách II.1 Thi công xây dựng / II.2 Thi công MEP, chia theo khu vực, mỗi khu vực có nút thêm. Nhập % dự kiến → lũy kế dự kiến tự tính như kế hoạch ngày mai; điện thoại có nút +2/+5/+7/+10.
  - Nút ＋ nổi trên điện thoại ở I.A và II (chọn khu vực → dòng mới hiện tại chỗ, con trỏ vào ô nội dung).
  - Bảng nhập trên máy tính có độ rộng tối thiểu, cột nội dung rộng hơn, ô nội dung 2 dòng.
- **Kiểm thử mới:** gastest – lưu tuần có ảnh mặt bằng thêm tay → tải lên Drive, bảng không chứa ảnh. ui – lũy kế dự kiến tự tính, tách II.1/II.2 theo khu vực; mặt bằng tuần thêm / đổi thứ tự / xóa, tổng hợp lại không ghi đè; báo đủ 6 ảnh; tiêu đề không "?"; QR MSP không chữ, cỡ ≤ 44 px; GANTT_MAX = 6; điện thoại – ＋ nổi thêm việc/kế hoạch, dòng mới trong màn hình, nút +5.
- **Ảnh đã xem:** desk_week_plan.png, desk_week_photo.png, m_ip_week_plan.png.
- **Rủi ro còn lại:** kế hoạch tuần sau đã lưu trước đây chỉ có "% mục tiêu" → app tự quy ra % dự kiến = mục tiêu − lũy kế hiện tại. Ô nhập trong bảng máy tính không viền khi chưa bấm vào (giống phiếu ngày).

### 17/11 – Đợt 6C: báo cáo tuần nhập như phiếu ngày, khóa dữ liệu tổng hợp
- **Sửa:**
  - Tên app thành "LẬP BÁO CÁO THI CÔNG" (tiêu đề, tab trình duyệt, tên icon).
  - Mục "Tuần / Tháng" thành "Báo cáo tuần"; bỏ chọn "Theo tháng".
  - Màn nhập tuần dùng khung phiếu ngày: thẻ có biểu tượng ở đầu; bảng theo khu vực trên máy tính, mỗi dòng một thẻ trên điện thoại; thanh nút Lưu nháp / Chốt tuần ở cuối (điện thoại: thanh dưới).
  - Dòng tổng hợp từ báo cáo ngày khóa (ô xám 🔒, không xóa). Dòng thêm mới (nhãn "Mới") sửa và xóa được. Ghi chú luôn sửa được. % KH chỉ nhập tay khi tuần trước không có kế hoạch.
  - 3 mục đánh giá (an toàn, thi công, nguồn lực) tự xếp loại, hiện căn cứ, không sửa tay.
- **Kiểm thử mới (ui):** tên app và mục; không còn chọn tháng; đánh giá không có ô sửa; dòng tổng hợp không sửa/xóa được nhưng ghi chú sửa được; thêm việc mới trong khu vực sửa được, giữ lại khi tổng hợp lại; điện thoại (390 px) hiện dạng thẻ, nút Chốt tuần ở thanh dưới, không tràn ngang.
- **Ảnh đã xem:** desk_week_gen.png, desk_week_task.png, m_ip_week_task.png.
- **Rủi ro còn lại:** báo cáo tuần đã lưu trước đợt này có dòng tổng hợp từng sửa tay; bấm "Tổng hợp lại" sẽ lấy lại số từ báo cáo ngày (đúng theo nguyên tắc mới). Bảng công việc trên máy tính rộng 860 px, cuộn ngang trong khung như phiếu ngày.

### 17/11 – Thư mục riêng lưu báo cáo tuần
- **Sửa:** Cấu hình → Cài đặt có thêm mục "📁 Thư mục lưu báo cáo tuần". Dán link thư mục Drive, bấm "Kiểm tra & dùng thư mục này" (app ghi thử để kiểm tra quyền). Đã chọn → PDF báo cáo tuần lưu thẳng vào đó; chưa chọn → lưu chung với thư mục PDF như cũ. Có nút bỏ chọn.
- **Kiểm thử mới:** gastest – chọn thư mục riêng thì PDF tuần nằm trong thư mục đó, không nằm ở thư mục PDF chung; ui – màn Cài đặt có ô dán link và nút kiểm tra.
- **Ảnh đã xem:** desk_settings.png – mục mới nằm dưới "Thư mục lưu PDF".
- **Rủi ro còn lại:** thư mục bị đổi quyền sau khi chọn → xuất PDF báo lỗi rõ, quản trị chọn lại.

### 17/11 – Sửa lỗi /dev mở ra trang trắng
- **Nguyên nhân:** khi phục vụ trang, Apps Script tự xóa các chú thích `/* … */` và hiểu nhầm `accept="image/*"` (ô chọn ảnh) là chỗ bắt đầu chú thích. Nó cắt mất một đoạn code đến dấu `*/` kế tiếp, nên JavaScript lỗi cú pháp và app không chạy. Kiểm thử trên máy không thấy lỗi này vì không đi qua bước xóa chú thích của Google.
- **Sửa:** ghi thành `image/\*`. Trình duyệt vẫn hiểu là `image/*`, còn Apps Script không còn coi đó là chú thích. Lỗi tương tự với `//` trong đường link (`https://…`), nên các link trong code cũng ghi thành `https:\/\/` (kết quả hiển thị không đổi).
- **Thêm:** dải đỏ cuối màn hình hiện lỗi JavaScript (nếu có), để lần sau chụp màn hình là biết lỗi gì.
- **Kiểm thử mới** (gastest): khối JS không có `/*` hay `://` nằm trong chuỗi. Đã chạy thử trên bản cũ: kiểm thử báo lỗi đúng chỗ.
- **Rủi ro còn lại:** khi viết code mới, tránh viết `/*` hoặc `*/` trong chuỗi; kiểm thử trên sẽ chặn trường hợp này.

Mỗi đợt sửa, Claude ghi thêm mục ở đây: sửa gì, kiểm thử mới thêm, đã xem ảnh màn hình nào, rủi ro còn lại.

### 2026-11-16 — Cài quy trình TESTING.md
- Thêm `tests/run-all.sh` và file này. Không đổi code app.
- Gộp với đợt "Chống nặng dần" (e141b90) rồi kiểm lại: máy chủ 97/97, giao diện 100/100.
- Chạy đủ 3 bước: cú pháp đạt, máy chủ 89/89, giao diện 98/98. Đã xem ảnh `m_an_qa.png` (412 px): bố cục gọn, nút ＋ và thanh Lưu/Nộp/Xem hiển thị đúng.

## Nhật ký chạy tự động

| Thời gian | Commit | Cú pháp | Máy chủ | Giao diện | Kết quả | Ghi chú |
|---|---|---|---|---|---|---|
| 2026-11-16 21:54 | 73b5339 | đạt | 89 đạt / 0 lỗi | 98 đạt / 0 lỗi | ✅ ĐẠT | Cài quy trình TESTING.md (không đổi code app) |
| 2026-11-16 21:56 | ac8d8e3 | đạt | 97 đạt / 0 lỗi | 100 đạt / 0 lỗi | ✅ ĐẠT | Kiểm lại sau khi gộp đợt 'Chống nặng dần' (e141b90) |
| 2026-11-17 03:03 | 1e79d86 | đạt | 111 đạt / 0 lỗi | 113 đạt / 0 lỗi | ✅ ĐẠT | Đợt 6A báo cáo tuần |

### 2026-11-17 — Đợt 6A: Báo cáo tuần soạn sửa được, TVGS xác nhận
- **Sửa gì:** báo cáo tuần thành bản soạn được như báo cáo ngày (8 thẻ: Chung, Tiến độ, Công việc, KH tuần sau, Nhân lực & TB, Nghiệm thu & vật tư, An toàn, Hình ảnh); nút “Tổng hợp từ báo cáo ngày” giữ dòng đã sửa tay; Chốt tuần → TVGS xác nhận/yêu cầu sửa → QR mã xác thực → xuất PDF tên `yyyymmdd-<mã>-<NT>-WR-<số tuần>-Weekly report and Tracking MSP(checked).pdf`, lưu thẳng thư mục đã chọn; khi chốt ghi 6 bảng Google Sheet `Tuan_TienDo/CongViec/VatTu/NhanLuc/NghiemThu/AnToan`; ô mới “Mã viết tắt nhà thầu”. Báo cáo tháng giữ nguyên.
- **Kiểm thử mới:** máy chủ +14 (khối “Báo cáo tuần”), giao diện +15 (tuần ở máy tính). Kết quả: máy chủ 111/111, giao diện 113/113.
- **Đã xem ảnh:** màn hình tuần đã chốt (thẻ Tiến độ), thẻ Hình ảnh, PDF tuần 4 trang in thử (đầu trang, thông tin chung, overall, A/B/C/D/E/F/G/H, trang Gantt + QR), giao diện điện thoại 390 px thẻ Công việc (không tràn ngang).
- **Rủi ro còn lại:** PDF thật do Google dựng – cần xem lần xuất đầu tiên (biểu đồ chuyển thành ảnh PNG cho chắc; ảnh Gantt xoay 90° để in nguyên trang). Chưa có số liệu thật cho ảnh tiêu biểu/mặt bằng trong demo. Hồ sơ đệ trình + văn bản (Đợt 6B) chưa làm.
| 2026-11-17 04:11 | ae869b9 | đạt | 119 đạt / 0 lỗi | 118 đạt / 0 lỗi | ✅ ĐẠT | Đợt 6A+: cấu trúc I–IV, khu vực 4 loại, Đợt 6B hồ sơ đệ trình |

### 2026-11-17 — Cấu trúc I–IV, khu vực 4 loại, Đợt 6B hồ sơ đệ trình
- **Sửa gì:** PDF tuần xếp lại theo I (A–E) · II · III · IV, mục trống tự ẩn; thẻ nhập liệu đổi tên theo I.A…IV; khu vực thêm loại Hoàn thiện, Khác (báo cáo ngày cũng nhóm theo); đọc sổ theo dõi hồ sơ (Google Sheet) cho B.3/B.4, Cấu hình → Cài đặt có mục “Hồ sơ đệ trình”; bảng mới `Tuan_HoSo`.
- **Kiểm thử mới:** máy chủ +8 (khối “Hồ sơ đệ trình” với sổ giả lập giống file CN8-2_Follow-up: DS, SDW-MEP, SI), giao diện +5 (cấu trúc I–III, mục trống ẩn, bảng B.3/B.4, thẻ I.B, khu vực Hoàn thiện ở báo cáo ngày). Kết quả: máy chủ 119/119, giao diện 118/118.
- **Đã xem ảnh:** PDF tuần in thử 5 trang (I.A–E, B.3 có 3 hồ sơ Chờ/Đã duyệt/Trả về, B.4 văn bản SI, II nhóm theo khu vực, II.4).
- **Rủi ro còn lại:** sổ thật có ô ngày ghi lẫn kiểu (m/d/yyyy ở trang Letter DSPcons) – ngày ≤ 12 sẽ hiểu là ngày/tháng; cần đối chiếu lần đọc đầu tiên. Đọc 23 trang tính mất khoảng 5–15 giây.
| 2026-11-17 04:27 | 4927e8b | đạt | 119 đạt / 0 lỗi | 118 đạt / 0 lỗi | ✅ ĐẠT | Nhân lực tuần: chỉ bình quân |

### 2026-11-17 — Nhân lực tuần chỉ lấy bình quân
- **Sửa gì:** mục D (PDF) và thẻ I.D chỉ còn cột “Số lượng bình quân (người/ngày)”, dòng tổng = cộng các số bình quân; bỏ cột “Cao nhất” và “Tổng công” cho khỏi hiểu nhầm. Biểu đồ cột theo ngày giữ nguyên.
- **Kiểm thử mới:** giao diện +1 (bảng nhân lực không còn “Tổng công/Cao nhất”).
| 2026-11-17 04:39 | 07511c4 | đạt | 119 đạt / 0 lỗi | 119 đạt / 0 lỗi | ✅ ĐẠT | Hiện lỗi JS trên màn hình (chẩn đoán /dev trắng) |
| 2026-11-17 04:44 | 9766a73 | đạt | 120 đạt / 0 lỗi | 119 đạt / 0 lỗi | ✅ ĐẠT | Sửa /dev trắng: GAS cắt nhầm accept=image/* như chú thích |
| 2026-11-17 04:50 | 9e03095 | đạt | 120 đạt / 0 lỗi | 119 đạt / 0 lỗi | ✅ ĐẠT | Sửa /dev trắng (2): ghi https:\/\/ trong chuỗi JS để GAS không cắt nhầm |
| 2026-11-17 05:01 | 0111cd3 | đạt | 121 đạt / 0 lỗi | 119 đạt / 1 lỗi | ❌ LỖI | Thêm thư mục riêng lưu báo cáo tuần trong Cài đặt |
| 2026-11-17 05:04 | 0111cd3 | đạt | 121 đạt / 0 lỗi | 120 đạt / 0 lỗi | ✅ ĐẠT | Thêm thư mục riêng lưu báo cáo tuần trong Cài đặt |
| 2026-11-17 05:54 | 1bd5ba0 | đạt | 121 đạt / 0 lỗi | 124 đạt / 0 lỗi | ✅ ĐẠT | Đợt 6C: báo cáo tuần nhập như phiếu ngày, khóa dòng tổng hợp, tự xếp loại, đổi tên app |
| 2026-11-17 06:42 | a2c1848 | đạt | 122 đạt / 0 lỗi | 136 đạt / 0 lỗi | ✅ ĐẠT | Đợt 6D: QR MSP, 6 Gantt, mặt bằng tuần, KH tuần sau theo khu vực, nút + nổi |
| 2026-11-17 07:10 | 66c37b1 | đạt | 127 đạt / 0 lỗi | 137 đạt / 0 lỗi | ✅ ĐẠT | Đợt 6E: thư mục Dữ liệu báo cáo, tự dọn ảnh quá 3 tháng |
| 2026-11-17 07:28 | f882adb | đạt | 128 đạt / 0 lỗi | 141 đạt / 0 lỗi | ✅ ĐẠT | Đợt 6F: 30 ảnh tiêu biểu + thêm/xóa, mặt bằng tuần 10 ảnh, B.3/B.4 tách riêng |
| 2026-11-17 07:41 | 9c0b2e3 | đạt | 128 đạt / 0 lỗi | 145 đạt / 0 lỗi | ✅ ĐẠT | Đợt 6G: ảnh theo khu vực, hồ sơ chờ quá 7 ngày, nén ảnh PDF tuần |
| 2026-11-17 07:50 | 3dc975a | đạt | 128 đạt / 0 lỗi | 148 đạt / 0 lỗi | ✅ ĐẠT | Đợt 6H: ghi bản quyền (đăng nhập, Cấu hình, PDF, đầu file code) + LICENSE |
| 2026-11-17 08:03 | cb98b50 | đạt | 128 đạt / 0 lỗi | 147 đạt / 2 lỗi | ❌ LỖI | Đợt 6I: thời tiết buổi chiều có sau 17h, bấm sau 17h tính đến giờ hiện tại |
| 2026-11-17 08:08 | cb98b50 | đạt | 128 đạt / 0 lỗi | 149 đạt / 0 lỗi | ✅ ĐẠT | Đợt 6I: thời tiết buổi chiều có sau 17h, bấm sau 17h tính đến giờ hiện tại |
| 2026-11-17 09:05 | fa9cceb | đạt | 129 đạt / 0 lỗi | 150 đạt / 0 lỗi | ✅ ĐẠT | Đợt 6J: Tuan_CongViec thêm cột du_kien_tuan; B.3 PDF ngày trình đủ năm |
| 2026-11-17 09:07 | fa9cceb | đạt | 129 đạt / 0 lỗi | 152 đạt / 0 lỗi | ✅ ĐẠT | Đợt 6J: cột du_kien_tuan, B.3 ngày đủ năm, ô cấu hình khóa hiện xám + nhắc Sửa thông tin |
| 2026-11-17 09:56 | a395304 | đạt | 134 đạt / 0 lỗi | 164 đạt / 0 lỗi | ✅ ĐẠT | Đợt 7: danh mục vật tư, C.1.1 XD / C.1.2 MEP, nhập danh mục từ Excel; sửa tự đăng xuất lại sau khi đăng nhập |
| 2026-11-17 10:01 | a395304 | đạt | 134 đạt / 0 lỗi | 165 đạt / 0 lỗi | ✅ ĐẠT | Đợt 7: danh mục vật tư, C.1.1/C.1.2, nhập từ Excel; sửa tự đăng xuất lại |
| 2026-11-17 10:05 | 64d345b | đạt | 134 đạt / 0 lỗi | 165 đạt / 0 lỗi | ✅ ĐẠT | Đợt 7: kiểm thử .xlsx chạy được trên GitHub (cài xlsx) |
| 2026-11-17 13:00 | c3d58c1 | đạt | 134 đạt / 0 lỗi | 166 đạt / 0 lỗi | ✅ ĐẠT | Sửa nhỏ 7.1: mục mặt bằng không ép sang trang mới |
| 2026-11-17 13:25 | 87e16e7 | đạt | 134 đạt / 0 lỗi | 166 đạt / 0 lỗi | ✅ ĐẠT | Sửa nhỏ 7.2: đầu mục chính nền navy |
| 2026-11-17 13:36 | ea14e8e | đạt | 134 đạt / 0 lỗi | 166 đạt / 1 lỗi | ❌ LỖI | Sửa nhỏ 7.3: nhân lực/thiết bị sau vật tư |
| 2026-11-17 13:38 | ea14e8e | đạt | 134 đạt / 0 lỗi | 167 đạt / 0 lỗi | ✅ ĐẠT | Sửa nhỏ 7.3: nhân lực/thiết bị sau vật tư (sửa kiểm thử tìm bảng) |
| 2026-11-18 04:24 | a936648 | đạt | 134 đạt / 0 lỗi | 179 đạt / 0 lỗi | ✅ ĐẠT | Đợt 8: khóa nút khi bận, màu đầu mục, bảng đánh giá, H.T.N, dấu TVGS |
| 2026-11-18 07:04 | 2fe7e84 | đạt | 134 đạt / 0 lỗi | 181 đạt / 0 lỗi | ✅ ĐẠT | Đợt 8.6: logo H.T.N ở Giới thiệu + Liên hệ |
| 2026-11-18 08:01 | 81bb6bd | đạt | 134 đạt / 0 lỗi | 184 đạt / 0 lỗi | ✅ ĐẠT | Sửa nhỏ 8.7: ô đánh giá Overall Schedule không tràn, tiêu đề tuần 2 dòng |
| 2026-11-18 09:09 | 8654a65 | đạt | 134 đạt / 0 lỗi | 186 đạt / 0 lỗi | ✅ ĐẠT | Sửa lỗi 8.8: nút In báo cáo ra trang trắng |
| 2026-11-18 13:46 | 79c380d | đạt | 140 đạt / 0 lỗi | 199 đạt / 0 lỗi | ✅ ĐẠT | Đợt 9: TVGS ghi ý kiến theo từng việc |
| 2026-11-18 14:14 | 80366d4 | đạt | 140 đạt / 0 lỗi | 200 đạt / 0 lỗi | ✅ ĐẠT | Sửa nhỏ 9.1: bỏ 2 nút Lưu trùng khi người chốt sửa phiếu kỹ sư |
| 2026-11-18 14:42 | 229f737 | đạt | 140 đạt / 0 lỗi | 202 đạt / 0 lỗi | ✅ ĐẠT | Sửa nhỏ 9.2: lưu nháp ý kiến chung TVGS |
| 2026-11-19 13:55 | 3033811 | đạt | 145 đạt / 0 lỗi | 212 đạt / 0 lỗi | ✅ ĐẠT | Đợt 9.3: ý kiến TVGS theo từng dòng cho báo cáo tuần |
