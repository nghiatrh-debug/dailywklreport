# ĐẶC TẢ – Đợt 2: Tính % theo kế hoạch, giao diện kỹ sư, so sánh KH

Trạng thái: **ĐÃ CHỐT** (16/11/2026) · Áp dụng cho mọi dự án dùng khuôn mẫu (CN8-2 chỉ là dữ liệu thử).

## A. Thêm mới trên điện thoại
| # | Yêu cầu | Cách làm |
|---|---|---|
| A1 | Việc / kế hoạch / nhân lực / thiết bị / vật tư mới **hiện lên đầu** danh sách | Nút “Thêm” chèn dòng mới vào đầu, tự đưa con trỏ vào ô nội dung |
| A2 | Nút **＋ nổi** góc phải dưới | Màn hình kỹ sư: thêm việc (Hôm nay) hoặc kế hoạch (Ngày mai); nhiều khu vực → hỏi khu vực. Người chốt: tab Nhân sự (hỏi Nhân lực / Thiết bị), tab Vật tư |
| A3 | Thanh chọn **[ Hôm nay | Ngày mai ]** ở tab Công việc | Tách việc hôm nay và kế hoạch ngày mai, khỏi phải cuộn dài |

## B. Mô hình % (không dùng “KL thiết kế”)
| Trường | Ai nhập | Ghi chú |
|---|---|---|
| % lũy kế hôm qua | Tự động (khóa) | Lấy từ lũy kế cuối ngày trước của cùng việc (khu vực + nội dung + vị trí) |
| KH hôm nay | Tự động (khóa) | = “% dự kiến làm thêm” kỹ sư đặt hôm qua |
| **% làm được hôm nay** | **Kỹ sư** | Nút nhanh +2 / +5 / +7 / +10 / Xong |
| % lũy kế hôm nay | Tự động (khóa) | = lũy kế hôm qua + % hôm nay; **chặn > 100%** |
| So với KH | Tự động | Đạt (= KH) · Vượt (> KH) · Hụt (< KH); xong 100% luôn tính Đạt |
| % đã làm trước đó | Kỹ sư nhập **1 lần** cho việc mới thêm giữa chừng | Sau khi nộp chỉ người chốt sửa được |
| KL ngày, ĐVT | Tùy chọn | Chuyển vào mục “Chi tiết” |

- **Kế hoạch ngày mai** nhập “% dự kiến làm thêm”; lũy kế dự kiến tự tính.
- **Việc theo dõi / lặp lại** (quan trắc, vệ sinh…): nhập **kết quả dạng chữ** (VD “CK11”), không tính %.
- Sửa số ngày trước → ngày sau **tự tính lại** lũy kế khi mở phiếu.
- Dữ liệu cũ (chỉ có % lũy kế) tự đổi: % hôm nay = lũy kế − lũy kế hôm trước; KH hôm nay = KL dự kiến cũ − lũy kế hôm trước.

## C. So sánh kế hoạch – thực hiện
- Màn hình chốt: **X/Y việc đạt KH**, danh sách việc hụt, cảnh báo **“hụt N ngày liên tiếp”** (từ 2 ngày).
- PDF ngày: bảng công việc gồm **Lũy kế hôm qua | KH hôm nay | Thực hiện | Lũy kế hôm nay | Chênh lệch**; bảng kế hoạch ngày mai riêng (Dự kiến làm thêm | Lũy kế dự kiến).
- Tuần / tháng: tỷ lệ tuân thủ KH ngày + bảng việc hụt nhiều ngày nhất.

## Người chốt quên chốt
1. Banner **“Còn N ngày chưa chốt”** trên màn hình chốt, bấm để mở ngày đó.
2. Báo cáo tuần/tháng **vẫn gom ngày chưa chốt** (từ phiếu đã nộp) và **đánh dấu “chưa chốt – số liệu tạm”**.
4. PDF ngày ghi **“Chốt ngày … – trễ N ngày”** khi chốt muộn; bản chưa chốt ghi “BẢN NHÁP”.
5. Người chốt dự phòng: Quản trị gán thêm vai trò “Người tổng hợp / chốt” trong Cấu hình (không cần code).

## Kỹ thuật
- Dữ liệu công việc: `prevProgress`, `planToday`, `dayPct`, `startPct`, `progress` (= lũy kế, giữ tương thích), `shortStreak`, `recurring` (= việc theo dõi). Kế hoạch: `add`, `target` (= lũy kế dự kiến), `mon`.
- Tab `CongViec` thêm cột: `kh_hom_nay`, `thuc_hien`, `chenh_lech`, `du_kien_them`.
- `apiPeriod` trả thêm `subs` của các ngày chưa chốt trong kỳ.
- Kiểm thử: `tests/gastest.js` (máy chủ) + `tests/ui.mjs` (giao diện, Playwright: 375/390/412 px + máy tính) chạy trong GitHub Actions; ảnh chụp lưu ở artifact “ui-screenshots”.
