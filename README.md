# Báo cáo ngày công trường (Daily / Weekly / Monthly Report)

Web app trên **Google Apps Script** để lập báo cáo ngày công trường, rồi tự tổng hợp thành báo cáo tuần và tháng. Dữ liệu lưu ở **Google Sheets**, ảnh và PDF lưu ở **Google Drive**.
Đây là khuôn mẫu dùng chung: mỗi dự án dùng một bản copy riêng của file Google Sheet.

## Tính năng
- **Khai báo dự án lần đầu** (công trình, địa điểm, chủ đầu tư, tư vấn, nhà thầu, người ký). Muốn chuyển sang dự án khác thì dùng Reset; app tạo bản lưu trữ trước khi xóa.
- **Đăng nhập bằng tên + PIN**, có 4 vai trò: Quản trị, Người chốt, Kỹ sư hiện trường, Chỉ xem.
- **Khu vực và phân công**: mỗi khu vực (Zone/Block + bộ môn) giao cho 1 kỹ sư. Việc gắn theo khu vực, nên đổi người phụ trách thì việc dở dang chuyển theo.
- **Phiếu riêng cho từng kỹ sư**:
  - Tự cuốn chiếu từ ngày trước: việc dưới 100%, kế hoạch ngày mai, việc lặp lại.
  - Nhập nghiệm thu, thí nghiệm, ảnh và ghi chú cho người chốt.
  - Lưu nháp, nộp hoặc rút lại phiếu.
- **Kiểm tra số liệu khi nhập**: chặn khi % vượt 100; cảnh báo khi thiếu %, % thấp hơn hôm trước, hoặc % tăng mà thiếu KL ngày.
- **Ảnh**: tự cắt khung 4:3 và đóng dấu ngày giờ chụp (lấy từ EXIF), người chụp, dự án, khu vực. Ảnh chụp khác ngày báo cáo bị gắn nhãn đỏ.
- **Người chốt**:
  - Theo dõi phiếu đã nộp, chưa nộp, bị trả lại.
  - Trả lại phiếu kèm ghi chú, hoặc nhập thay cho người vắng.
  - Nhập nhân lực, thiết bị, vật tư, an toàn.
  - Chốt báo cáo; mở khóa rồi chốt lại thì tạo bản v2, v3… mà vẫn giữ PDF cũ.
- **Báo cáo tuần và tháng tự động**:
  - Tiến độ gom theo đầu mục WBS.
  - Vật tư cộng dồn.
  - Nhân lực và thiết bị lấy trung bình theo số ngày có báo cáo.
  - Nghiệm thu, thí nghiệm, an toàn liệt kê đầy đủ.
- **Nhật ký thao tác** (tab NhatKy) và các bảng chuẩn hóa để phân tích bằng Pivot hoặc Looker Studio.

## Tối ưu tốc độ
- Cấu hình được nhúng sẵn vào trang khi mở (template scriptlet).
- Đăng nhập trả về luôn dữ liệu màn hình đầu; mỗi màn hình chỉ gọi máy chủ 1 lần.
- Dùng CacheService và chỉ ghi đúng dòng cần sửa.
- Ảnh tải sau và lưu bộ đệm trên máy (IndexedDB). Khi xuất PDF, máy chủ tự chèn ảnh.
- Tự lưu chỉ gửi phần chữ và số (khoảng 4 KB thay vì khoảng 1 MB).

## Cấu trúc thư mục
```
apps-script/
  Code.gs        # máy chủ Apps Script
  Index.html     # giao diện (file HTML trong Apps Script phải đặt tên "Index")
docs/
  HUONG_DAN_TRIEN_KHAI.md   # hướng dẫn triển khai và cập nhật
tests/
  gasmock.js     # giả lập SpreadsheetApp, DriveApp, CacheService… để chạy Code.gs bằng Node
  gastest.js     # kiểm thử máy chủ: phân quyền, phiếu, chốt, ảnh, bộ đệm, reset
```

## Triển khai nhanh
1. Tạo Google Sheet, vào **Tiện ích mở rộng → Apps Script**. Dán `apps-script/Code.gs` vào Code.gs, và `apps-script/Index.html` vào file HTML tên **Index**.
2. Chạy hàm `setup()` một lần.
3. **Triển khai → Ứng dụng web**: chọn "Thực thi dưới dạng: Tôi" và "Ai có quyền truy cập: Bất kỳ ai".
4. Mở link `/exec`, làm bước khai báo dự án lần đầu.

Khi cập nhật code: dán đè cả 2 file, rồi vào **Quản lý triển khai → Chỉnh sửa → Phiên bản mới**.
Chi tiết xem `docs/HUONG_DAN_TRIEN_KHAI.md`.

## Chạy kiểm thử
```bash
node tests/gastest.js
```

## Chế độ xem trước
Mở `apps-script/Index.html` trực tiếp trên trình duyệt sẽ chạy bản độc lập: dữ liệu lưu trong IndexedDB và có sẵn dữ liệu demo. Bản này dùng để thử giao diện, không đồng bộ với Google Sheets.
