# TESTING.md — Nhật ký kiểm thử

File này để anh Nghĩa **đọc thay vì đọc code**: mỗi đợt sửa, Claude tự chạy kiểm thử, rồi ghi lại đã kiểm gì và kết quả ra sao. Không hiểu chỗ nào thì hỏi Claude giải thích; thấy thiếu thì yêu cầu kiểm thêm.

## Cách chạy

```bash
bash tests/run-all.sh "ghi chú đợt sửa"
```

Chạy lần lượt: kiểm tra cú pháp giao diện → kiểm thử máy chủ (`tests/gastest.js`) → kiểm thử giao diện (`tests/ui.js`), rồi tự thêm 1 dòng vào bảng nhật ký cuối file. GitHub Actions cũng chạy lại máy chủ + giao diện mỗi lần push.

## Bộ kiểm thử đang bao phủ những gì

**Máy chủ (111 kiểm thử, giả lập Google Apps Script)**
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
- Reset toàn bộ: lưu trữ, xóa dữ liệu, thu hồi token.

**Giao diện (Playwright, điện thoại 375/390/412 px + máy tính, ảnh ở `tests/shots/`)**
- Trên 3 cỡ điện thoại: không tràn ngang, không lỗi JavaScript, nút ＋ nổi, thêm việc / nghiệm thu / kế hoạch ngày mai, lũy kế tự cộng.
- Máy tính: phiếu kỹ sư, chốt, chống ghi đè, tình trạng phiếu, cài đặt, mặt bằng, chặn lũy kế > 100%.
- PDF: bản nháp có dấu BẢN NHÁP, cột lũy kế hôm qua/chênh lệch, PDF tuần có mục tuân thủ KH, nguồn thời tiết.
- TVGS & xác thực: tin nhắn Zalo soạn sẵn, quét QR ra trang xác thực, tra mã sai.
- Phiên đăng nhập: "Ghi nhớ" / không ghi nhớ, tự đăng xuất sau 8 giờ.
- Báo cáo tuần: tự tổng hợp khi mở, đầu trang thông tin dự án + thông tin chung + overall + A.1, biểu đồ nhân sự, đánh giá Đạt/Chậm (ngưỡng 5%), tổng hợp lại giữ dòng sửa tay, KH tuần sau từ việc chưa xong, tên file mẫu VC-WR-34, chốt → TVGS xác nhận → QR + tra mã, tuần sau tự lấy số tuần & % tuần trước, tuần đã xác nhận khóa nhập.

## Ghi chú từng đợt sửa

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
