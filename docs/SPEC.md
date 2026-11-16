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


---

# ĐẶC TẢ – Đợt 3: TVGS kiểm tra nội dung, logo, chế độ thử nghiệm

Trạng thái: **ĐÃ CHỐT** (16/11/2026).

## 1. TVGS kiểm tra nội dung trước khi phát hành
| Bước | Ai | Việc |
|---|---|---|
| 1 | Kỹ sư (nhà thầu) | Lập phiếu, nộp |
| 2 | Người chốt (nhà thầu chính) | Tổng hợp, **Chốt** → *Chờ TVGS kiểm tra* |
| 3a | TVGS | **Yêu cầu sửa** (bắt buộc ghi chú) → ngày mở lại cho nhà thầu sửa, chốt lại → quay lại bước 3 |
| 3b | TVGS | **Xác nhận nội dung** (không sửa số) → sinh **mã xác thực** |
| 4 | Người chốt | Lưu PDF chính thức lên Drive, gửi link cho các bên |
| 5 | CĐT | Xem dấu TVGS trên PDF; tra mã trong app |

- Vai trò mới `tvgs` (“TVGS – kiểm tra nội dung”). Quản trị cũng xác nhận được (dự phòng).
- Dấu trên PDF: khung “ĐÃ KIỂM TRA NỘI DUNG – TVGS” (đơn vị, người kiểm tra, giờ, bản vN, **mã xác thực**). Chưa xác nhận: dải đỏ “CHƯA KIỂM TRA – TVGS”; bị trả: “TVGS YÊU CẦU SỬA”.
- Mã xác thực = 8 ký tự đầu SHA-256 của nội dung báo cáo lúc xác nhận. **Tra mã**: hiện hành / bản cũ (đã sửa sau đó) / không tồn tại.
- Máy chủ chặn xuất PDF ngày khi chưa xác nhận; giao diện không tự đặt được trạng thái TVGS; mở khóa bản đã xác nhận → hủy dấu, phải kiểm tra lại.
- Banner: TVGS “N ngày chờ kiểm tra”; nhà thầu “N ngày TVGS yêu cầu sửa” + nội dung. Nút **Sao chép tin nhắn Zalo** soạn sẵn sau khi chốt / xác nhận / yêu cầu sửa.
- Nhật ký (tab NhatKy): `CHOT_BAO_CAO_Vn`, `TVGS_XAC_NHAN` (mã · bản), `TVGS_YEU_CAU_SUA` (ghi chú).
- Tuần/tháng: ghi số ngày chưa được TVGS xác nhận.
- Công tắc **Bắt buộc TVGS xác nhận** (Cấu hình → Cài đặt, mặc định bật). Không có tài khoản TVGS → bước này tự tắt.

## 2. Logo
- 3 đơn vị, tải ở khai báo lần đầu và Cấu hình → Dự án. Lưu Drive (thư mục Logo), app thu nhỏ còn cao ≤160 px.
- Thứ tự trên mọi PDF: **TVGS (trái) – CĐT (giữa) – Nhà thầu (phải)**. Chưa có logo → hiện tên ngắn như cũ.

## 3. Chế độ thử nghiệm (Cấu hình → Cài đặt, chỉ Quản trị)
- Chọn **ngày bất kỳ** (kể cả tương lai): ô ngày có “📅 Chọn ngày bất kỳ…” và luôn có ngày kế tiếp.
- Ngày thử = ngày **chưa có dữ liệu thật** được lưu khi đang bật chế độ thử. Dải vàng đầu màn hình; PDF ghi “BẢN THỬ”.
- Nút **Xóa toàn bộ ngày thử** (chỉ xóa ngày thử, giữ ngày thật).

## 4. Cấu hình & phiếu kỹ sư
- Thứ tự thẻ: Dự án → **Người dùng & PIN** → Khu vực & phân công → Danh mục → **Cài đặt** → Sao lưu.
- Việc mới: ô **Lũy kế hôm qua** (nhập 1 lần; bỏ trống = 0%).
- “% dự kiến làm thêm” → **“% dự kiến thực hiện”**.
- Thẻ Nghiệm thu: Nghiệm thu → **Thí nghiệm** → KH nghiệm thu ngày mai → **KH thí nghiệm ngày mai** (mới, `testPlans`; hôm sau tự thành “Thí nghiệm trong ngày”). Sheet `ThiNghiem` thêm cột `loai` (TRONG_NGAY / KE_HOACH).

## Kỹ thuật
- API mới: `apiReview(token,date,'approve'|'return',note)`, `apiVerify(token,code)`, `apiSaveLogo(token,kind,dataUrl,oldId)`, `apiClearTestDays(token)`.
- `BaoCao` thêm cột `tvgs_kiem_tra`, `ma_xac_thuc`; index trả `review` từng ngày và `testDays`.


---

# ĐẶC TẢ – Đợt 4: Thời tiết tự điền, thứ tự nhân lực, dấu QR TVGS

Trạng thái: **ĐÃ CHỐT** (16/11/2026).

## 1. Thời tiết tự điền (Open-Meteo)
- Tọa độ dự án: Cấu hình → Dự án (vĩ độ / kinh độ; nút “Dùng vị trí hiện tại”). Demo CN8-2 Quận 7: 10.729 / 106.718.
- Gộp số liệu theo giờ: **sáng 6–12h, chiều 12–18h**. Mưa ≥10 mm → Mưa lớn; ≥2,5 → Mưa; ≥0,2 → Mưa rào; không mưa: mây <30% Nắng, <70% Nắng nhẹ, còn lại Nhiều mây.
- Nhiệt độ: **thấp nhất – cao nhất** 6–18h, dạng “27oC- 33oC”.
- **Tự điền khi người chốt mở ngày**, chỉ điền ô trống; nút “🌦 Lấy thời tiết tự động” lấy lại (ghi đè). Hôm nay: buổi sáng có sau 12h, cả ngày sau 18h. Ngày tương lai (chế độ thử): số liệu dự báo.
- PDF ghi nguồn “Thời tiết: Open-Meteo · open-meteo.com (CC BY 4.0)”.
- Gọi từ trình duyệt; đổi nhà cung cấp chỉ sửa `wxFetch()`. ⚠ Gói miễn phí Open-Meteo dành cho phi thương mại – trước khi dùng chính thức cần mua gói thương mại hoặc đổi nhà cung cấp.

## 2. Nhân lực / thiết bị
- Thêm mới nằm **cuối danh sách** (trên dòng tổng), tự cuộn tới, con trỏ ở dòng mới.
- Nút **▲ ▼** mỗi dòng (máy tính + điện thoại); thứ tự PDF đúng như màn hình và tự mang sang ngày sau.

## 3. Dấu TVGS = mã QR
- PDF: **QR ~1 cm góc phải, ngang tiêu đề báo cáo** + dòng `Verified by Consultant - XXXX-XXXX` (bỏ dòng “Chốt bởi…”). QR vẽ trong trình duyệt (qrcode-generator 1.5.2, MIT, nhúng sẵn).
- QR trỏ **trang xác thực công khai** `…/exec?v=<mã>` (không cần đăng nhập): hợp lệ / bản cũ / không tồn tại; dự án, ngày, bản, giờ nhà thầu chốt, TVGS kiểm tra, nút **Mở báo cáo PDF**.
- File PDF ngày: **ai có link đều xem được (chỉ xem)**; ảnh, Google Sheet vẫn riêng tư.
