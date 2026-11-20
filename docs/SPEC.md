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

## 4. Thư mục lưu PDF (Cấu hình → Cài đặt)
- Dán link thư mục Google Drive của dự án (thư mục đã chia sẻ) → app kiểm tra mở được + ghi thử 1 file rồi xóa → lưu `settings.pdfFolderId/pdfFolderName`.
- Cấu trúc: `<thư mục>/Báo cáo ngày/<yyyy-MM>` (tắt được “chia theo tháng”), `Báo cáo tuần`, `Báo cáo tháng`. Chưa chọn → thư mục mặc định `Báo cáo ngày – <mã>/PDF`.
- Tài khoản triển khai app cần quyền Người chỉnh sửa (Editor). Mất quyền → xuất PDF báo lỗi rõ, không lưu nhầm chỗ khác. PDF cũ giữ nguyên chỗ cũ.
- Quản trị có nút nhanh “📄 Thư mục PDF”.

---

# ĐẶC TẢ – Đợt 5: Kỳ tuần T6–T5, chống ghi đè, phiên đăng nhập, nhiều ảnh mặt bằng

Trạng thái: **ĐÃ CHỐT** (16/11/2026).

## 1. Báo cáo tuần
- Kỳ tuần kết thúc ở **ngày chốt tuần** (Cấu hình → Cài đặt, mặc định **Thứ 5**) → tuần = Thứ 6 → Thứ 5. Khóa kỳ `W-<ngày đầu kỳ>`.
- Báo cáo tháng giữ theo tháng dương lịch.
- Tên PDF: `yyyymmdd(ngày cuối kỳ)-<mã>-Weekly Report.pdf`, `yyyymm-<mã>-Monthly Report.pdf`. PDF ngày: `yyyymmdd-<mã>-Daily Report.pdf` (xuất lại thay file cũ cùng tên).

## 2. Chống ghi đè
- Mỗi Report/Sub mang `rev` (máy chủ tăng mỗi lần lưu). Lưu kèm `baseRev`; máy chủ có `rev` khác → **từ chối** (lỗi `CONFLICT`), không ghi đè.
- Giao diện báo: “Vừa được sửa ở thiết bị/người khác lúc … – Tải bản mới / Giữ bản của tôi (ghi đè)”.
- Phiên ghi `seen` (lần gọi gần nhất). Cùng tài khoản có phiên khác hoạt động trong 10 phút → dòng nhắc “Tài khoản này cũng đang mở trên thiết bị khác”.

## 3. Phiên đăng nhập
- Ô **“Ghi nhớ đăng nhập trên máy này”** (mặc định bỏ chọn). Không chọn → phiên chỉ sống trong tab/trình duyệt (sessionStorage), máy chủ hết hạn sau 12 giờ.
- Có chọn: Kỹ sư/TVGS/Xem 30 ngày; **Quản trị, Người chốt tối đa 7 ngày**.
- **Tự đăng xuất sau 8 giờ không thao tác** (Cài đặt chỉnh được, 0 = tắt).
- Sau khi nộp phiếu: thông báo có nút **Đăng xuất**.

## 4. Mặt bằng thi công
- Tối đa **6 ảnh** / ngày, mỗi ảnh có chú thích; ▲▼ sắp xếp, xóa từng ảnh; ngày sau kế thừa cả bộ. Chỉ nhận ảnh (không PDF).
- Ảnh giữ cạnh dài ~2400 px (không nén như ảnh hiện trường).
- PDF: **3 ảnh / trang A4**, mỗi ô cao ~1/3 trang, ảnh giữ tỷ lệ, chú thích dưới ảnh.
- Dữ liệu: `layouts:[{id,img,fileId,caption}]`; bản cũ `layout` tự chuyển.

## 5. Khác
- Hộp thoại Mở khóa: “khi xuất lại, PDF mới thay file cũ cùng tên”.

## 6. Tốc độ (bổ sung 16/11/2026)
- Lưu phiếu/báo cáo **ghi xuyên bộ đệm** (cập nhật `day:<ngày>` và `idx` thay vì xóa) → lần lưu/mở sau không đọc lại Sheet.
- Chốt ngày: gửi `acceptSubs` kèm lần lưu báo cáo → nhận mọi phiếu đã nộp trong 1 lần gọi.
- Lưu tuần tự, gộp yêu cầu trùng (tối đa 1 lượt chờ).
- PDF: ảnh đã có trên máy gửi kèm; ảnh còn lại máy chủ đọc từ Drive (mỗi ảnh 1 lần). Ảnh mặt bằng 2000 px.
- Cài đặt → **⏱ Đo tốc độ** (`apiPing`): mạng + Google, đọc Sheet, bộ đệm.

## 7. Dữ liệu lớn dần theo thời gian (bổ sung 16/11/2026)
- **Chỉ mục ngày** gửi/đệm dạng gọn `{r:[[ngày,tt,bản,tvgs]], s:[[ngày,người,tt]], t}` (mã 1 ký tự). Kỹ sư chỉ nhận phiếu của mình. Phiếu của ngày đã chốt quá 120 ngày bỏ khỏi chỉ mục (ngày vẫn còn qua danh sách báo cáo).
- **Ô JSON > 45.000 ký tự** chia sang cột ẩn `json_2..json_4` (BaoCao, PhieuKS) – tối đa ~180.000 ký tự; vượt → báo lỗi rõ. Giao diện cảnh báo khi báo cáo > 150.000.
- **Chốt ngày** tìm dòng các bảng chuẩn hóa bằng `TextFinder` (không đọc cả cột).
- **Ảnh đệm trên máy** (IndexedDB v3, mốc `t`): giữ tối đa 800 ảnh / 60 ngày, logo giữ nguyên; ảnh đệm cũ không có mốc xóa 1 lần khi nâng cấp.

---

# ĐẶC TẢ – Đợt 6A: Báo cáo tuần (soạn sửa được, TVGS xác nhận)

Trạng thái: **ĐÃ CHỐT** (17/11/2026). Báo cáo tháng giữ nguyên. Hồ sơ đệ trình + văn bản trong tuần: Đợt 6B.

## Nguyên tắc
- Kỳ tuần theo ngày chốt tuần (Cài đặt, mặc định Thứ 5). Người chốt mở tuần → **⟳ Tổng hợp từ báo cáo ngày** → app gom thành các danh sách **sửa/thêm/xóa/▲▼ được**. Tổng hợp lại: giữ dòng đã sửa tay và dòng thêm tay, thay dòng tự động chưa sửa, thêm dòng mới.
- Dữ liệu tuần `W` lưu trong `TongHopKy` (key `W-<ngày đầu kỳ>`, cột json + json_2..4). Báo cáo tuần trước = bản tuần gần nhất trước kỳ này.
- Quy trình: Nháp → **Chốt tuần** → TVGS **Xác nhận / Yêu cầu sửa** (giống báo cáo ngày, mã xác thực + QR) → **Xuất PDF**. Quản trị/Người chốt mở khóa → bản v+1, phải TVGS xác nhận lại.

## Nội dung
- **Đầu trang**: 3 logo + tên đơn vị; “BÁO CÁO TUẦN <số> / WEEKLY REPORT No.<số>”, “Tuần k – Tháng MM/YYYY” (k = thứ tự tuần có ngày cuối kỳ trong tháng), kỳ báo cáo; bảng thông tin: dự án, địa điểm, CĐT, TVGS, nhà thầu, thời tiết tuần (số ngày nắng/mưa); QR TVGS.
- **Số tuần**: tuần đầu tiên nhập tay; các tuần sau = số tuần trước + số tuần chênh lệch.
- **Thông tin chung**: An toàn & vệ sinh / Công tác thi công / Nguồn lực × Tốt – Trung bình – Kém. App gợi ý (vi phạm an toàn 0 → Tốt, 1–3 → TB, >3 → Kém; thi công theo đánh giá tiến độ tổng; nguồn lực mặc định Tốt), người chốt sửa được.
- **OVERALL SCHEDULE**: % KH tuần này (= % KH tuần sau của tuần trước), % thực tế tuần trước (tự lấy), **% thực tế tuần này** (nhập), **% KH tuần sau** (nhập), nhãn bản tiến độ (VD Rev02), nhận xét. Tuần đầu nhập cả 4. Chênh lệch = TT − KH: ≥ 0 Đạt; ≥ −5 Chậm nhẹ; < −5 Chậm.
- **A. Công tác thi công**: A.1 Xây dựng / A.2 MEP → khu vực → việc: KL tuần, % đầu tuần, % KH MSP (= mục tiêu kế hoạch tuần trước, sửa được), % thực tế cuối tuần, chênh lệch, ghi chú.
- **B. Kế hoạch tuần sau**: cùng nhóm, % mục tiêu; nút tạo nhanh từ các việc chưa 100%.
- **C. Vật tư**: theo chủng loại + quy cách: KL kỳ trước (lũy kế tuần trước; tuần đầu nhập), KL kỳ này (cộng báo cáo ngày), lũy kế. Kế hoạch vật tư tuần sau.
- **D. Nghiệm thu & thí nghiệm** trong tuần (từ báo cáo ngày) + kế hoạch nghiệm thu tuần sau.
- **E. An toàn**: nhận xét chung, hoạt động an toàn trong tuần, nhắc nhở/vi phạm từng ngày.
- **F. Nhân lực**: biểu đồ cột nhóm ngày × chức danh (có số trên cột) + bảng TB/ngày, cao nhất, tổng công. **G. Thiết bị**: TB/ngày, cao nhất.
- **H. Hình ảnh**: bộ mặt bằng của ngày cuối kỳ + 6 ảnh hiện trường chọn ngẫu nhiên rải đều các ngày (đổi bộ khác, bỏ từng ảnh).
- **Ký**: đại diện nhà thầu. **Tracking MSP**: tối đa 2 ảnh Gantt, mỗi ảnh nguyên 1 trang (xoay ngang) + QR/link file PDF MS Project (upload, lưu Drive, ai có link xem được).

## PDF & dữ liệu Google
- Tên file: `yyyymmdd(ngày cuối kỳ)-<mã dự án>-<mã viết tắt NT>-WR-<số tuần>-Weekly report and Tracking MSP(checked).pdf`. Ô mới **Cấu hình → Dự án → Mã viết tắt nhà thầu (tên file)**.
- Lưu **thẳng vào thư mục PDF đã chọn** (không thư mục con). Chưa chọn thư mục → thư mục mặc định của app.
- Khi chốt tuần ghi các bảng: `Tuan_TienDo` (1 dòng/tuần), `Tuan_CongViec`, `Tuan_VatTu`, `Tuan_NhanLuc`, `Tuan_NghiemThu`, `Tuan_AnToan`.

## Bổ sung 17/11/2026 – Cấu trúc I–IV, khu vực 4 loại, Đợt 6B hồ sơ đệ trình
- **Khu vực 4 loại**: Xây dựng / MEP / Hoàn thiện / Khác (Cấu hình → Khu vực). Báo cáo ngày & tuần nhóm theo loại; Hoàn thiện/Khác trống thì ẩn.
- **PDF tuần**: đầu trang + Thông tin chung + OVERALL giữ nguyên; rồi **I – Các hoạt động thi công trong tuần**: A (A.1 XD, A.2 MEP, A.3 Hoàn thiện, A.4 Khác), B (B.1 Nghiệm thu, B.2 Thí nghiệm, B.3 Tình trạng hồ sơ, B.4 Văn bản), C (C.1 Vật tư, C.2 Thiết bị), D Nhân lực, E An toàn; **II – Kế hoạch tuần tiếp theo** (II.1 Thi công = XD+HT+Khác, II.2 Cơ điện, II.3 KH nghiệm thu, II.4 KH vật tư); **III – Mặt bằng & hình ảnh** + ký; **IV – Tiến độ MSP – Tracking**. Mục trống tự ẩn (A.3, A.4, B.4, II.3, II.4, IV).
- **Hồ sơ đệ trình**: Cấu hình → Cài đặt → dán link sổ theo dõi (Google Sheet, chỉ đọc). App tự tìm dòng tiêu đề, nhận cột (Date, MC Code, Description, Submission Count, ngày TVGS, PMH approved, Returned, Status, link) và đoán loại trang tính (hồ sơ / văn bản / bỏ qua – sửa được).
  - **B.3** = hồ sơ **trình trong tuần** (mọi tình trạng) + hồ sơ trình trước nhưng **có kết quả trong tuần**. Bỏ hồ sơ cũ không đổi và hồ sơ hủy.
  - Tình trạng: “X/Y” lấy chữ sau – A/B Đã duyệt, C Trả về chỉnh sửa, D Từ chối; trống → Chờ duyệt (đã có ngày TVGS → TVGS đang kiểm tra).
  - **B.4** = văn bản (SI, cảnh báo, NCR, phạt, thư) có ngày trong tuần.
  - Đọc khi bấm “Tổng hợp” hoặc “⟳ Đọc file theo dõi hồ sơ”; chụp lại vào báo cáo; chốt tuần ghi bảng `Tuan_HoSo`.

## Bổ sung 17/11/2026 – Thư mục lưu báo cáo tuần
- Cấu hình → Cài đặt có thêm mục "📁 Thư mục lưu báo cáo tuần" (`settings.weekFolderId`, `weekFolderName`): dán link thư mục Drive, app kiểm tra quyền ghi như thư mục PDF.
- Đã chọn → PDF báo cáo tuần lưu thẳng vào thư mục này. Chưa chọn → như cũ (thẳng trong thư mục PDF đã chọn, hoặc thư mục mặc định PDF/Tuan).

## Đợt 6C (17/11/2026) – Báo cáo tuần nhập giống báo cáo ngày, khóa dữ liệu tổng hợp
- Tên app: **LẬP BÁO CÁO THI CÔNG** (tiêu đề, tab trình duyệt, tên icon). Mục "Tuần / Tháng" → **Báo cáo tuần**; ẩn chọn "Theo tháng" (báo cáo tháng làm sau).
- Màn nhập tuần dùng chung khung phiếu ngày: thẻ có biểu tượng ở đầu, thanh nút cố định cuối (⟳ Tổng hợp lại · 💾 Lưu nháp · 🔒 Chốt tuần / 🔓 Mở khóa / TVGS xác nhận). Máy tính: bảng theo khu vực (thẻ "📍 Zone · loại"); điện thoại: mỗi dòng 1 thẻ.
- **Dòng tổng hợp từ báo cáo ngày khóa** (ô xám 🔒, không xóa): I.A công việc, B.1 nghiệm thu, B.2 thí nghiệm, II.3 KH nghiệm thu, C.1 vật tư, C.2 thiết bị, D nhân lực, E vi phạm an toàn, B.3/B.4 hồ sơ. Dòng thêm tay: sửa/xóa được. Số liệu sai → sửa ở báo cáo ngày rồi "Tổng hợp lại". Tổng hợp lại: dòng tổng hợp lấy số mới, giữ dòng thêm tay.
- I.A: % KH lấy từ "KH tuần sau" của tuần trước (khóa); việc không có KH → ô KH nhập tay. Cột ghi chú luôn sửa được (giữ khi tổng hợp lại). Tuần đầu tiên: "kỳ trước" vật tư nhập tay.
- **Đánh giá tuần tự xếp loại, không sửa:** An toàn: 0 vi phạm Tốt, 1–3 TB, >3 Kém. Thi công: chênh lệch tiến độ tổng ≥0 Tốt, ≥−5% TB, <−5% Kém (chưa nhập % → theo số việc trễ KH: 0 Tốt, ≤3 TB, >3 Kém). Nguồn lực: tổng nhân lực bình quân so tuần trước giảm <20% Tốt, 20–40% TB, >40% Kém (không có tuần trước → Tốt).
- Vẫn nhập tay: tiến độ tổng (%), nhận xét, nhận xét an toàn, hoạt động an toàn, II.1/II.2 KH tuần sau, II.4 KH vật tư, ảnh, MSP.

## Đợt 6D (17/11/2026) – chỉnh báo cáo tuần sau kiểm tra
1. IV – MSP trên PDF: chỉ in mã QR (bỏ tên file + link), cỡ bằng QR "Verified by Consultant" của báo cáo ngày.
2. Ảnh Gantt tối đa 6 (mỗi ảnh 1 trang).
3. Tiêu đề không còn "?" khi chưa có số tuần.
4. Mặt bằng thi công tuần: thêm / xóa / đổi thứ tự / chú thích như báo cáo ngày, tối đa 6 ảnh. Lần tổng hợp đầu lấy bộ mặt bằng của ngày cuối kỳ; sau đó "Tổng hợp lại" không ghi đè. Ảnh thêm mới tải lên Drive khi lưu.
5. Sửa lỗi ảnh mặt bằng / ảnh tiêu biểu đứng ở "Đang tải ảnh…" sau khi bấm "Tổng hợp lại" hoặc "Đổi bộ ảnh khác".
6. II. KH tuần sau: II.1 Thi công xây dựng (khu vực XD, Hoàn thiện, Khác) · II.2 Thi công MEP; trong mỗi mục chia theo khu vực, nút "+ Thêm kế hoạch" từng khu vực. Nguyên tắc như kế hoạch ngày mai: nhập % dự kiến thực hiện trong tuần, lũy kế dự kiến = lũy kế hiện tại (theo việc cùng tên, cùng khu vực ở I.A) + % dự kiến, tối đa 100 → thành % KH tuần sau. "Tạo từ các việc chưa xong" = Tự sinh (việc < 100%).
7. Điện thoại: nút ＋ nổi ở I.A và II như phiếu ngày (chọn khu vực → dòng mới hiện tại chỗ, con trỏ vào ô nội dung); thẻ kế hoạch có nút +2/+5/+7/+10.
8. Bảng nhập trên máy tính: cột nội dung đủ rộng (bảng cuộn ngang trong khung như phiếu ngày).

## Đợt 6E (17/11/2026) – Thư mục dữ liệu, tự dọn file cũ
- Thư mục dữ liệu của app: **"Dữ liệu báo cáo <mã dự án>"** (cũ "Báo cáo ngày – <mã>": app tự đổi tên, giữ nguyên nội dung/mã file).
- **Tự dọn, không có nút:** sau mỗi lần chốt ngày, giao diện gọi ngầm `apiCleanup` (không chờ, tối đa 1 lần/ngày, ≤ 25 giây). Chuyển vào **Thùng rác Drive** (lấy lại trong 30 ngày):
  - ảnh trong bảng HinhAnh (ảnh hiện trường, mặt bằng) của ngày **quá 3 tháng**, ngày đó **đã chốt và đã xuất PDF**;
  - ảnh Gantt / mặt bằng của báo cáo tuần quá 3 tháng, tuần đã chốt và đã xuất PDF.
  - Không xóa: ảnh mặt bằng còn được ngày trong 3 tháng gần nhất dùng (kế thừa); file MSP (QR trỏ tới); logo; PDF báo cáo.
  - Ghi tiến độ dọn (`CLEAN_UPTO`, `WCLEAN_UPTO`) để không quét lại. Ngày quá hạn mà chưa chốt/chưa xuất PDF thì giữ nguyên.
- Cấu hình → Cài đặt: chỉ ghi chú cho người dùng biết quy tắc tự dọn.

## Đợt 6F (17/11/2026) – ảnh tuần, B.3/B.4 tách riêng
1. Hình ảnh tiêu biểu tuần: tự lấy ngẫu nhiên **30 ảnh** từ các báo cáo ngày (rải đều các ngày). Người chốt **thêm ảnh** (tải lên, tối đa tổng 30) và **xóa** ảnh không cần. "Đổi bộ ảnh khác" giữ ảnh tự thêm, chỉ đổi phần ảnh lấy ngẫu nhiên. Ảnh thêm tay tải lên Drive khi lưu.
2. Mặt bằng thi công tuần: tối đa **10 ảnh** (báo cáo ngày vẫn 6).
3. B.3 Tình trạng hồ sơ đệ trình và B.4 Văn bản trong tuần: **2 mục riêng**, mỗi mục 1 bảng (điện thoại: thẻ). B.3 có dòng tổng hợp số lượng theo tình trạng, sắp xếp: Trả về / Từ chối → Chờ duyệt / TVGS đang kiểm tra → Đã duyệt.

## Đợt 6G (17/11/2026) – ảnh theo khu vực, hồ sơ chờ lâu, PDF tuần nhẹ
1. Ảnh tiêu biểu trên PDF (và màn nhập) **nhóm theo khu vực** theo thứ tự khu vực trong Cấu hình; ảnh không gắn khu vực / tự thêm vào nhóm "Ảnh khác". Dưới mỗi ảnh: chú thích + ngày. Ảnh tự thêm chọn được khu vực. Ảnh cũ chưa có khu vực: đoán theo tên khu vực ở đầu chú thích.
2. B.3: hồ sơ **Chờ duyệt / TVGS đang kiểm tra quá 7 ngày** (tính đến ngày cuối kỳ báo cáo) tô đỏ, ghi "chờ X ngày"; dòng tổng hợp có "Quá hạn N". Có trên màn nhập và PDF.
3. Khi xuất PDF tuần: ảnh tiêu biểu nén còn cạnh dài ≤ 900 px (JPEG 0,72), ảnh mặt bằng ≤ 1600 px (JPEG 0,8); Gantt giữ nguyên. Ảnh lưu trên Drive không đổi.

## Đợt 6H (17/11/2026) – Đánh dấu bản quyền
- Màn đăng nhập (chân thẻ): "© 2026 Huỳnh Trọng Nghĩa – Lập báo cáo thi công v1.6".
- Cấu hình (mọi thẻ, cuối trang): mục Giới thiệu – tên app, phiên bản, phát hành lần đầu 11/2026, tác giả, câu bảo lưu quyền.
- PDF ngày và tuần: dòng chữ nhỏ dưới phần ký "Lập bằng ứng dụng Lập báo cáo thi công · © 2026 Huỳnh Trọng Nghĩa".
- Đầu file Code.gs, Index.html: dòng bản quyền + tác giả. File LICENSE (bảo lưu mọi quyền, kho công khai không phải giấy phép), README dẫn tới LICENSE.
- Thông tin tác giả/phiên bản đặt 1 chỗ: hằng `APP` trong Index.html.

## Đợt 6I (17/11/2026) – Giờ lấy thời tiết buổi chiều
- Buổi sáng 6–12h, có sau 12h (giữ nguyên).
- Buổi chiều: có sau **17h** (trước là 18h), mặc định tính 12–17h. Người chốt bấm "🌦 Lấy thời tiết" sau 17h của chính ngày đó → buổi chiều và nhiệt độ tính đến giờ hiện tại (VD bấm 19h20 → 12–19h). Ngày đã qua: 12–17h.
- Bấm nút luôn tải số liệu mới (không dùng số đã tải trước đó trong phiên).

## Đợt 6J (17/11/2026)
- Tuan_CongViec thêm cột cuối `du_kien_tuan` = % dự kiến thực hiện trong tuần của dòng KE_HOACH_TUAN_SAU (kh_pct vẫn là lũy kế dự kiến).
- PDF B.3: ngày trình ghi đủ dd/mm/yyyy (hồ sơ có thể trình từ tháng/năm trước).
- Cấu hình → Dự án: ô thông tin cố định khi chưa bấm "✎ Sửa thông tin" hiện nền xám; bấm vào ô thì nhắc bấm "✎ Sửa thông tin" (trước đây trông như ô nhập được nhưng gõ không vào).

## Đợt 7 (17/11/2026) – Danh mục vật tư, C.1.1 Xây dựng / C.1.2 MEP
- **Danh mục vật tư** `CFG.materials = [{id, name, unit, sec:'XD'|'MEP', mode:'qty'|'lot', specs:[], alias:[], hidden}]`. Thứ tự trong danh mục = thứ tự trên báo cáo.
- **Báo cáo ngày – vật tư nhập về:** chọn Chủng loại từ danh mục (ĐVT tự điền) hoặc "＋ Thêm chủng loại mới…" (người chốt/admin: tên, ĐVT, bộ môn, kiểu ghi; trùng tên – không phân biệt hoa thường, khoảng trắng – thì dùng mục có sẵn). Kiểu Khối lượng: chọn/gõ chi tiết (gợi ý từ danh mục) + số lượng; chi tiết mới tự vào danh mục khi lưu. Kiểu Theo lô: nội dung lô + ghi chú; ngày nhập = ngày báo cáo. Dữ liệu cũ gõ tự do vẫn giữ.
- **Báo cáo tuần C.1:** C.1.1 Vật tư xây dựng · C.1.2 Vật tư MEP. Nhóm theo chủng loại (thứ tự danh mục), mỗi nhóm kiểu Khối lượng có dòng Tổng (kỳ trước, kỳ này, lũy kế của các chi tiết hiện trong tuần). **Chỉ hiện chi tiết có hàng về trong tuần**; lũy kế mọi chi tiết lưu ở `matCum` của báo cáo tuần → lần về sau: kỳ trước = lũy kế còn lại. Tuần đầu: kỳ trước nhập tay. Kiểu Theo lô: chỉ các lô về trong tuần (ngày nhập, nội dung, ghi chú).
- **Cấu hình → Danh mục → Vật tư (admin):** sửa tên/ĐVT/bộ môn/kiểu ghi/chi tiết, đổi thứ tự, ẩn, gộp mục trùng (tên cũ thành bí danh – dữ liệu cũ tự quy về). **Nhập từ file:** tải file mẫu (CSV mở bằng Excel, 5 cột: Bộ môn · Chủng loại · ĐVT · Kiểu ghi · Chi tiết), nạp file .xlsx/.csv hoặc dán vùng ô copy từ Excel; trùng chủng loại thì gộp chi tiết.
- Tuan_VatTu thêm cột cuối `bo_mon`, `ngay_nhap`, `ghi_chu`; loai = NHAP_VE (khối lượng) / LO_HANG (theo lô) / KE_HOACH.
- Máy chủ: lưu báo cáo ngày kèm `matMem` (chi tiết mới) → gộp vào danh mục; `apiCatalogAdd` (admin, chốt) thêm chủng loại; `apiSaveConfig` giữ mục/chi tiết danh mục do người chốt thêm trong lúc admin đang sửa.

## Sửa nhỏ 7.1 – Mục mặt bằng không ép sang trang mới (17/11/2026)
- Bỏ quy tắc "mục Mặt bằng thi công luôn sang trang mới" (báo cáo ngày mục 8, báo cáo tuần mục III).
- Tiêu đề mục dính với ảnh mặt bằng đầu tiên: còn đủ chỗ thì in tiếp ngay sau mục trước; không đủ chỗ cho một ô ảnh (~1/3 trang) thì cả tiêu đề và ảnh cùng sang trang.
- Ảnh tiếp theo vẫn mỗi ảnh một ô, không bị cắt ngang trang.

## Sửa nhỏ 7.2 – Đầu mục chính có màu nền (17/11/2026)
- Tiêu đề mục chính báo cáo ngày (1, 2, 3…): nền xanh navy #1e3a8a, chữ trắng, viền trái vàng hổ phách #f59e0b; số tổng bên phải màu vàng nhạt.
- Báo cáo tuần (mục I, II, III…): thêm viền vàng cho đồng bộ.
- In giữ màu nền (print-color-adjust: exact).

## Sửa nhỏ 7.3 – Đổi thứ tự mục báo cáo ngày (17/11/2026)
- Nhân lực, Thiết bị chuyển xuống sau Vật tư, trước An toàn. Đánh số lại:
  1 Công việc · 2 Kế hoạch ngày mai · 3 Nghiệm thu & thí nghiệm · 4 Vật tư · 5 Nhân lực · 6 Thiết bị · 7 An toàn · 8 Mặt bằng · 9 Hình ảnh.
- Phiếu của kỹ sư (không có nhân lực/thiết bị) giữ nguyên.

## Đợt 8 – Khóa nút khi bận, màu đầu mục, H.T.N, dấu TVGS (chốt làm 18/11/2026)

### 8.1 Khóa tạm nút khi app đang bận (đã thống nhất 18/11/2026)
- App đếm các việc đang chạy; còn việc chưa xong → nút quan trọng mờ, không bấm được, ghi lý do trên nút ("⏳ Đang lưu…", "⏳ Đang đọc file hồ sơ…"). Xong hết → sáng lại.
- Bấm 1 nút → nút đó khóa đến khi việc của nó xong (chống bấm 2 lần).
- Việc tính là "bận": đang lưu (tự lưu / bấm Lưu: phiếu, ngày, tuần); đang tải từ máy chủ (mở ngày, đổi tuần, Tổng hợp lại); đang đọc file theo dõi hồ sơ B.3/B.4; đang ghi danh mục vật tư (thêm chủng loại, nạp Excel); đang tải ảnh/file lên Drive (ảnh, mặt bằng, Gantt, MSP); đang tạo PDF.
- Nút bị khóa tạm: Nộp phiếu, Chốt ngày, Chốt tuần, Mở khóa, Tổng hợp lại, Xác nhận / Yêu cầu sửa (TVGS), Xuất PDF, Lưu cấu hình. Ô nhập liệu KHÔNG khóa.
- Quá 60 giây → mở lại nút + báo "⚠ Kết nối chậm – kiểm tra rồi bấm lại".
- Không khóa theo ảnh xem trước đang tải (PDF lấy ảnh thẳng từ Drive).
- Kiểm thử: giả lập máy chủ chậm 3 giây → nút mờ, bấm lúc mờ không chạy, xong thì sáng; quá giờ thì mở lại.

### 8.2 Màu nền đầu mục báo cáo tuần (đề xuất 18/11/2026)
- Cấp 1 (I, II, III…): giữ nền navy #1e3a8a, chữ trắng, viền vàng.
- Cấp 2 (A –, B –, C –…): nền xanh nhạt #dbeafe, chữ navy, viền trái 4px #2563eb.
- Cấp 3 (B.1, B.2, B.3, C.1.1…): nền xám xanh rất nhạt #f1f5f9, chữ #1e293b, viền trái 3px #6366f1; số tổng bên phải giữ màu xám.
- Áp dụng cả bản xem trước và PDF (print-color-adjust: exact).

### 8.3 Màu bảng "Thông tin chung" (đánh giá Tốt / Trung bình / Kém) – đề xuất 18/11/2026
- Bỏ dấu X + nền vàng. Ô được chọn: Tốt = nền xanh lá nhạt #dcfce7, chữ #166534, viền #22c55e, dấu ✔; Trung bình = nền vàng nhạt #fef3c7, chữ #92400e, viền #f59e0b, dấu ●; Kém = nền đỏ nhạt #fee2e2, chữ #991b1b, viền #ef4444, dấu ✖.
- Ô không được chọn: chữ xám nhạt #94a3b8. Tiêu đề cột Tốt / Trung bình / Kém tô chữ xanh / cam / đỏ.
- Cố định độ rộng cột để bảng không xô lệch giữa các tuần.

### 8.4 Giới thiệu: ký hiệu tác giả + nút Liên hệ (yêu cầu 18/11/2026)
- Mục Giới thiệu (Cấu hình → Cài đặt): dòng "© 2026 Huỳnh Trọng Nghĩa" đổi thành "© 2026 H.T.N". Dòng "Tác giả: Huỳnh Trọng Nghĩa" giữ nguyên.
- Thêm nút "✉ Liên hệ": bấm hiện hộp thông tin HUỲNH TRỌNG NGHĨA · ĐT 0976820909 (bấm gọi được) · Email nghia.tr.h@gmail.com (bấm mở thư được).
- Đã chốt: chân PDF báo cáo ngày + tuần chỉ còn "© 2026 H.T.N" (bỏ chữ "Lập bằng ứng dụng …") và dòng bản quyền màn hình đăng nhập cũng đổi sang H.T.N. Cập nhật kiểm thử đang dò "© 2026 Huỳnh Trọng Nghĩa".

### 8.5 Dấu TVGS trên đầu báo cáo: chữ trên, QR giữa, mã dưới (yêu cầu 18/11/2026)
- Thứ tự trong khối: "Verified by Consultant" (trên) → mã QR → mã xác thực (dưới, ví dụ 516D-EF58). Cả 3 canh giữa theo trục mã QR.
- Dòng "Verified by Consultant" nằm ngang hàng với dòng tiêu đề BÁO CÁO NGÀY / BÁO CÁO TUẦN; khối vẫn ở góc phải.
- Bỏ dấu "-" giữa chữ và mã. Áp dụng báo cáo ngày + tuần (cùng hàm qrHead).
- CSS dự kiến: .qrst{float:right;text-align:center;…;margin-top:19px} .qrst img{margin:2px auto 1px}. Đã thử trên bản xem trước báo cáo ngày, cần kiểm lại với tiêu đề báo cáo tuần.

### 8.6 Logo tác giả H.T.N (chốt 18/11/2026 – phương án B, logo nét bút)
- Đặt ở mục Giới thiệu (bên trái thông tin tác giả, ~160px; điện thoại xếp dọc ~140px) và đầu hộp Liên hệ (~170px).
- KHÔNG đặt ở chân trang PDF: chân trang giữ "© 2026 H.T.N" như 8.4.
- Ảnh JPEG nền trắng ~11 KB nhúng trong Index.html (dấu "/" trong base64 ghi "\/" để Apps Script không cắt nhầm).

### 8.7 Sửa nhỏ báo cáo tuần (18/11/2026)
- Overall Schedule: 4 ô luôn rộng đều (colgroup 25%, table-layout fixed); chữ đánh giá (Đạt / Chậm nhẹ / Chậm) 18px, 1 dòng, font Arial như phần còn lại. Lỗi tràn ô do lớp "warn" của giao diện app đè lên ô bảng → đổi tên lớp ô đánh giá thành e-ok / e-warn / e-bad.
- Tiêu đề: dòng "Tuần NN – Tháng MM/YYYY" và dòng "KỲ BÁO CÁO / PERIOD: … → …" tách 2 dòng, canh giữa; kỳ báo cáo không xuống dòng.

### 8.8 Sửa lỗi nút In báo cáo ra trang trắng (18/11/2026)
- Khi in, app chép bản báo cáo đang xem (ngày / tuần / phiếu kỹ sư) vào khung riêng #printRoot ngay dưới <body>; CSS in ẩn mọi thứ khác. Không còn phụ thuộc khung xem trước (cuộn, giới hạn chiều cao, ẩn trên điện thoại). Áp dụng cả khi bấm Ctrl+P.

## Đợt 9 – TVGS ghi ý kiến theo từng việc (chốt làm 18/11/2026)
- Áp dụng báo cáo ngày trước; báo cáo tuần dùng lại ở đợt sau. PDF không đổi.
- TVGS: mỗi dòng (công việc, kế hoạch, nghiệm thu, vật tư, nhân lực, ảnh) có nút 💬 → ô ý kiến mở tại chỗ: 4 nút chọn nhanh (% chưa đúng · Khối lượng chưa đúng · Ghi rõ vị trí · Thiếu ảnh) + "Đề nghị % hôm nay" + ghi chú. Dòng có ý kiến viền cam, ô bị góp ý tô đỏ.
- Giỏ ý kiến "📝 Ý kiến (n)": xem lại, sửa/xóa, thêm ý kiến chung → "Gửi yêu cầu sửa (n)" gửi 1 lần. Đã gửi vẫn gửi bổ sung được đến khi nhà thầu chốt lại.
- Ý kiến CHỈ gửi người chốt (không gửi kỹ sư). Người chốt sửa thẳng số liệu trên phiếu kỹ sư (máy chủ đã cho phép người chốt lưu phiếu; cần mở giao diện sửa phiếu cho người chốt), "Tới chỗ sửa →" nhảy đúng dòng, "Đánh dấu đã sửa", rồi chốt lại → TVGS xác nhận → xuất PDF.
- Lưu ý: phiếu do người chốt sửa ghi vết "sửa bởi <người chốt>" để kỹ sư biết.
- Đã làm: nút 💬 ở phiếu kỹ sư (thẻ điện thoại + bảng máy tính) và các tab báo cáo ngày (công việc, nghiệm thu/thí nghiệm, ảnh, nhân lực, thiết bị, vật tư, an toàn). Dòng gộp từ phiếu kỹ sư gắn ý kiến về đúng phiếu (theo `by`). Nhãn ý kiến có tên khu vực.
- Dữ liệu: `review.items[]` {id, scope 'S:<uid>'|'R', path, ref (id hoặc i<n>), label, owner, tags, pct, note, text}; gửi bổ sung = `apiReview(...,'append',...)` khi review đang 'returned'; người chốt đánh dấu `reviewFix{id:true}`; chốt lại → `review.lastItems` kèm `fixed`, xóa reviewFix. Nháp ý kiến TVGS lưu localStorage theo dự án + ngày.

### 9.1 Người chốt sửa phiếu kỹ sư – nút lưu (18/11/2026)
- Phiếu đã nộp/đã nhận: "💾 Lưu nháp" + "✔ Lưu & về màn hình tổng hợp" (điện thoại: "✔ Lưu & quay lại").
- Phiếu nháp/bị trả: "📨 Lưu & nộp thay kỹ sư" (điện thoại: "📨 Nộp thay"); ghi enteredBy = người chốt.

### 9.2 Lưu nháp ý kiến chung (18/11/2026)
- Ô "Ý kiến chung" trong giỏ tự lưu nháp (localStorage, theo dự án + ngày); nút "💾 Lưu & quay lại"; gửi xong mới xóa. Số trên nút = số ý kiến từng việc + 1 nếu có ý kiến chung.

### 9.3 Ý kiến TVGS theo từng dòng – báo cáo tuần (19/11/2026)
- Dùng chung cơ chế Đợt 9 (ngữ cảnh tuần khi đang ở màn hình Báo cáo tuần): 💬 ở mọi dòng các thẻ I.A–III (kể cả dòng 🔒 tổng hợp, B.3 hồ sơ, B.4 văn bản), và cho Tiến độ tổng, Đánh giá chung, Nhận xét an toàn. Máy tính: 💬 nằm ở cột STT.
- Dòng 🔒: hộp ý kiến nhắc nhà thầu sửa ở báo cáo ngày rồi “Tổng hợp lại”, hoặc giải trình ở cột Ghi chú.
- Máy chủ: apiReviewPeriod nhận items + 'append'; saveWeek_ khi chốt lại sau khi bị trả → review.lastNote + lastItems (cờ fixed từ W.reviewFix), xóa reviewFix.
- Quản trị kiêm người chốt: khi báo cáo đang bị trả về thì ở vai người sửa (không gửi bổ sung ý kiến) – áp dụng cả báo cáo ngày.

### 9.6 Ý kiến trên dòng đã xóa + nhắc tổng hợp lại tuần (20/11/2026)
- Ý kiến TVGS mà dòng gốc đã bị xóa → hiện “🗑 Đã xóa dòng”, tính là đã sửa (ghi vào reviewFix), ẩn “Tới chỗ sửa”.
- Báo cáo tuần chưa chốt: khi mở, app tự tổng hợp thử (không ghi) và so các dòng tự động (🔒) với bản đang lưu. Khác nhau → dải vàng “⚠ Số liệu báo cáo ngày đã thay đổi sau lần tổng hợp … – bấm ⟳ Tổng hợp lại” (chỉ người chốt thấy). Bấm tổng hợp lại → dải mất. Không tự ghi đè.
- Không so ảnh (bộ ảnh có chọn ngẫu nhiên).

### 9.7 Quản trị xóa bản tuần, làm lại từ đầu (20/11/2026)
- Chỉ **Quản trị** thấy nút “🗑 Xóa bản tuần này, làm lại từ đầu” (thẻ Chung, cạnh Lưu nháp / Chốt tuần), chỉ khi tuần **chưa chốt** và đã có bản lưu. Hỏi xác nhận.
- Xóa dòng tuần trong TongHopKy (số nhập tay, ý kiến TVGS, trạng thái trả về). Báo cáo ngày, phiếu kỹ sư giữ nguyên. Mở lại → tự tổng hợp mới. Ghi nhật ký XOA_BAN_TUAN.
- Máy chủ chặn: không phải quản trị, hoặc tuần đã chốt.
- “🗑 Xóa toàn bộ ngày thử” xóa thêm các bản tuần chưa chốt có chứa ngày thử.

## Đợt 10: Phân vai Nhà thầu – TVGS – CĐT, tự phát hành PDF, Ý kiến TVGS, Lỗi tồn đọng, mất sóng

Trạng thái: **ĐÃ CHỐT 20/11/2026**. Bản thử giao diện: artifact "Draft Đợt 5 — LẬP BÁO CÁO THI CÔNG theo vai trò". Đang làm: **10A**.
Áp dụng mọi dự án dùng khuôn mẫu. Làm theo 4 gói tách rời, mỗi gói triển khai và chạy thử riêng: **10A → 10B → 10C → 10D**.

---

### 10A. Vai trò và phạm vi nhìn thấy

#### 10A.1 Năm vai trò
| Mã | Tên hiển thị | Đơn vị | Ghi chú |
|---|---|---|---|
| `admin` | Quản trị (PMH) | CĐT – PMH | Người được trao quyền triển khai dự án. Giữ toàn bộ cài đặt, người dùng, PIN, logo, thư mục. Phân vai cho người các đơn vị. **Thấy tất cả**, kể cả bản nháp. Làm thay được mọi vai (dự phòng). |
| `cdt` | CĐT – Ban QLDA | CĐT – PMH | **Chỉ thấy báo cáo ngày/tuần đã được TVGS xác nhận.** Không xem sớm. Không góp ý báo cáo trong app. Được tạo **yêu cầu khắc phục** hiện trường (10C). Thay cho vai `xem` cũ. |
| `tvgs` | TVGS – kiểm tra nội dung | TVGS | Thấy báo cáo **từ lúc nhà thầu chốt**. Kiểm tra, ghi Ý kiến TVGS, Xác nhận / Yêu cầu sửa. Tạo và đóng yêu cầu khắc phục của mình, nhắc nhà thầu với yêu cầu do CĐT tạo. |
| `chot` | Người tổng hợp / chốt | Nhà thầu chính | Tổng hợp, chốt ngày/tuần, sửa khi bị trả. **Không còn quyền Cấu hình.** Phản hồi yêu cầu khắc phục. |
| `ks` | Kỹ sư hiện trường | Nhà thầu | Như hiện tại (chỉ phiếu của mình). Phản hồi yêu cầu khắc phục thuộc khu vực được giao. |

#### 10A.2 Bảng quyền
| Việc | ks | chot | tvgs | cdt | admin |
|---|:-:|:-:|:-:|:-:|:-:|
| Lập / nộp phiếu kỹ sư | ✔ | ✔ (nộp thay) | | | ✔ |
| Tổng hợp, chốt ngày / tuần, mở khóa | | ✔ | | | ✔ |
| Xem bản nháp, bản chưa chốt | phiếu của mình | ✔ | | | ✔ |
| Xem bản đã chốt, chờ kiểm tra, bị trả | | ✔ | ✔ | | ✔ |
| Ý kiến từng dòng (Đợt 9), Xác nhận / Yêu cầu sửa | | | ✔ | | ✔ |
| Ý kiến TVGS in PDF (10B) | | | ✔ | | ✔ |
| Phát hành PDF + QR | | xuất lại (dự phòng) | **tự động khi xác nhận** | | ✔ |
| Xem bản đã phát hành | ✔ | ✔ | ✔ | ✔ | ✔ |
| Tạo yêu cầu khắc phục (10C) | | | ✔ | ✔ | ✔ |
| Phản hồi bằng ảnh | ✔ (khu vực mình) | ✔ | | | ✔ |
| Đóng / trả lại yêu cầu | | | của TVGS | của CĐT | ✔ mọi yêu cầu |
| Nhắc nhà thầu | | | ✔ (yêu cầu của CĐT) | | ✔ |
| Cấu hình, người dùng, PIN, logo, thư mục, Cài đặt | | | | | ✔ |

#### 10A.3 Menu theo vai (chỉ thấy thẻ của mình)
- **ks**: Phiếu của tôi · Yêu cầu khắc phục · Báo cáo đã phát hành.
- **chot**: Tổng hợp & chốt ngày · Báo cáo tuần · Bị TVGS trả về (số) · Yêu cầu khắc phục (số).
- **tvgs**: Hộp chờ kiểm tra (số, ngày + tuần, cũ nhất lên đầu) · Đã xác nhận · Lỗi tồn đọng.
- **cdt**: Báo cáo đã phát hành (ngày / tuần, mới nhất lên đầu) · Lỗi tồn đọng · Tra mã xác thực.
- **admin**: toàn bộ thẻ + Cấu hình.
- Dải màu dưới đầu trang cho biết đang ở khu nào: 🟡 Nhà thầu – đang làm · 🔵 TVGS – chờ kiểm tra · 🟢 CĐT – đã phát hành · 🟣 Quản trị.

#### 10A.4 Lọc ở máy chủ (không chỉ ẩn trên giao diện)
- `index_` / `idxEnc_`: vai `cdt` chỉ nhận ngày **đã phát hành** = `review.status = 'approved'` (từ 10B: thêm điều kiện `pub = ok`; dự án không bật TVGS kiểm tra: đã chốt) và tuần tương tự. Vai `tvgs` chỉ nhận ngày/tuần đã chốt (`locked`, `returned`, `approved`). Không gửi phiếu kỹ sư (`subs`) cho `tvgs` / `cdt`.
- `apiOpen` / `bundle_`: `cdt` mở ngày chưa xác nhận → lỗi "Báo cáo chưa phát hành". `tvgs` mở ngày chưa chốt → lỗi tương tự. Không trả `prev` của ngày chưa phát hành cho `cdt`.
- `apiPeriod`: cùng quy tắc với tuần / tháng. Tháng của `cdt` chỉ gom ngày đã phát hành.
- `apiSaveConfig`, `apiSetPin` (người khác), `apiSaveLogo`, `apiCheckFolder`, `apiResetAll`, `apiClearTestDays`: chỉ `admin`.
- Trang xác thực công khai `?v=<mã>` giữ nguyên.

#### 10A.5 Chế độ thử (1 người nhiều vai)
- Chỉ `admin` thấy ô **"Xem như: <vai>"** trên dải vàng Chế độ thử (đã có Đợt 3).
- Máy chủ nhận tham số `asRole` **chỉ khi tài khoản thật là `admin`**. `asRole` chỉ **thu hẹp** quyền, không bao giờ mở rộng. Ghi nhật ký kèm "(xem như <vai>)".
- Khi triển khai thật: mỗi tài khoản 1 vai, tắt Chế độ thử.

#### 10A.6 Chuyển đổi khi cập nhật
- Vai `xem` cũ tự đổi thành `cdt`.
- Sau cập nhật, `admin` thấy dải nhắc **"Rà lại vai trò"** ở Cấu hình → Người dùng & PIN cho đến khi bấm "Đã rà". **Việc tay bắt buộc:** tài khoản nhà thầu đang giữ `admin` (người chốt hiện tại) đổi sang `chot`; người PMH được giao giữ `admin`. **Làm bước này trước khi báo nhà thầu dùng bản mới**, để người chốt không mất quyền giữa chừng.
- Không cho xóa / hạ vai `admin` cuối cùng.
- **Checklist chuyển vai** (in ở dải nhắc): (1) tạo / chỉ định tài khoản PMH giữ `admin`; (2) đổi tài khoản người chốt nhà thầu sang `chot`; (3) kiểm tra người chốt đăng nhập lại được và chốt thử; (4) mới báo nhà thầu dùng bản mới. Ghi rõ người làm, ngày làm.

---

### 10B. Tự phát hành PDF khi TVGS xác nhận + Ý kiến TVGS

#### 10B.1 Tự phát hành
- Luồng mới (ngày và tuần giống nhau): Nhà thầu **chốt** → TVGS **Xác nhận** → **PDF + QR tự xuất, lưu Drive** → báo cáo sang khu CĐT. **Bỏ bước người chốt bấm Xuất PDF.**
- Kỹ thuật: PDF đang dựng HTML trên trình duyệt. Sau khi `apiReview(...,'approve')` trả về thành công, trình duyệt của TVGS dựng HTML bản đã xác nhận và gọi `apiExportPdf`. `apiExportPdf` mở cho `tvgs` **chỉ khi** báo cáo đúng `approved` và đúng bản (`rev`) vừa xác nhận.
- Trạng thái phát hành `pub`: `pending` (đang xuất) · `ok` (fileId, giờ) · `fail` (lỗi). Màn hình TVGS: "⏳ Đang phát hành PDF…" → "✅ Đã phát hành" + nút **Sao chép tin nhắn Zalo** (link PDF, mã xác thực).
- Xuất lỗi (mạng, Drive, quá giờ): giữ `approved`, đặt `pub=fail`, dải đỏ cho `admin` + `chot` + `tvgs` "Chưa phát hành được PDF ngày …" + nút **Xuất lại** (cả 3 vai). CĐT chỉ thấy báo cáo khi `pub=ok`.
- Tên file, thư mục: giữ như Đợt 4–6A (xuất lại thay file cũ cùng tên).
- Lưu ý: TVGS hay dùng điện thoại. PDF tuần nặng (ảnh, Gantt). **Đo thời gian xuất trên điện thoại thật** ở 10B. Nếu quá 60 giây → chuyển dựng HTML ở máy chủ (gói sau).

#### 10B.2 Ý kiến TVGS (in vào PDF)
- **Khác Đợt 9**: Đợt 9 là ý kiến từng dòng để **yêu cầu nhà thầu sửa**, không in. 10B là **nhắc nhở / lưu ý của TVGS kèm bản xác nhận**, in vào PDF.
- Nhập trong hộp **Xác nhận**: mỗi ý kiến = loại (Chất lượng / An toàn / Tiến độ / Vệ sinh – môi trường / Khác) + nội dung. Có thể không có ý kiến nào.
- Dữ liệu: `review.remarks:[{cat,text}]`. **Tính vào mã xác thực** (SHA-256 nội dung) → in xong không sửa được. Mở khóa → xóa remarks cùng dấu TVGS, **nhưng trước khi xóa ghi nhật ký `MO_KHOA` kèm remarks cũ + mã xác thực cũ** (PDF cũ đã gửi Zalo vẫn tra lại được).
- **Mã xác thực do máy chủ tính** từ dữ liệu đã lưu (không lấy từ HTML trình duyệt gửi lên) → PDF dựng trên máy TVGS mà sai lệch thì quét QR là lộ.
- PDF ngày và tuần: khung **"Ý KIẾN TVGS / CONSULTANT'S REMARKS"** viền xanh, đặt **trước phần ký**. Không có ý kiến → ẩn khung.
- Tuần: TVGS ghi ý kiến riêng cho tuần + **mục 🔒 tự gom ý kiến TVGS của các ngày trong tuần, chỉ đọc** (mỗi dòng: ngày · loại · nội dung). *(Đã chốt.)*
- Nhật ký: `TVGS_XAC_NHAN` ghi thêm số ý kiến.

---

### 10C. Lỗi tồn đọng / Yêu cầu khắc phục (thẻ riêng)

#### 10C.1 Luồng
1. **TVGS hoặc CĐT** phát hiện lỗi → thẻ *Lỗi tồn đọng* → **📷 Chụp & tạo yêu cầu**. **Bắt buộc ≥ 1 ảnh** (tối đa 4), vị trí, khu vực (theo danh mục Cấu hình), loại, nội dung, hạn khắc phục, giao cho (mặc định Nhà thầu chính).
2. Nhà thầu nhận ở thẻ *Yêu cầu khắc phục* (số đang chờ) → **📷 Phản hồi bằng ảnh**: **bắt buộc ≥ 1 ảnh sau khắc phục** (tối đa 4) + ghi chú.
3. **Bên tạo kiểm tra**: ✔ Đạt – đóng, hoặc ↩ Chưa đạt – trả lại (bắt buộc lý do) → quay về bước 2. Quyền đóng **theo vai, không theo người**: yêu cầu do CĐT tạo thì bất kỳ tài khoản `cdt` nào cũng đóng được, do TVGS tạo thì bất kỳ `tvgs` nào cũng đóng được (người tạo nghỉ phép không làm treo yêu cầu). `admin` đóng được mọi yêu cầu.
4. TVGS thấy cả yêu cầu do CĐT tạo, có nút **🔔 Nhắc nhà thầu** (ghi số lần nhắc, lần cuối; hiện trên yêu cầu cho mọi vai).

- Trạng thái: `open` (chờ nhà thầu) · `fixed` (nhà thầu đã phản hồi) · `closed`. Quá hạn = chưa `closed` và hạn < hôm nay → viền đỏ.
- Bộ lọc: Đang xử lý · Chờ kiểm tra · Quá hạn · Đã đóng · Tất cả. Ô đếm đầu thẻ cùng 4 nhóm.
- Kỹ sư thấy yêu cầu thuộc khu vực mình được giao (theo bảng gán kỹ sư – khu vực ở Cấu hình). **Kỹ sư chưa được gán khu vực nào → thấy tất cả** (không bỏ sót). Người chốt thấy tất cả. *(Đã chốt.)*
- Mã: `LTD-001` tăng dần theo dự án.

#### 10C.2 Dữ liệu
- Sheet `LoiTonDong`: `ma, ngay_tao, nguoi_tao, vai_tao, khu_vuc, vi_tri, loai, noi_dung, han, giao_cho, trang_thai, anh_loi (fileId…), anh_sau (fileId…), ghi_chu_nt, ngay_phan_hoi, ly_do_tra, so_lan_tra, so_lan_nhac, nhac_cuoi, ngay_dong, nguoi_dong, test`.
- Ảnh lưu Drive thư mục `Lỗi tồn đọng` (cùng thư mục dữ liệu dự án). Dùng chung `processImage` có đóng dấu giờ + người + dự án.
- API: `apiIssues(token, filter)`, `apiIssueCreate`, `apiIssueRespond`, `apiIssueReview(token, ma, 'close'|'return', lyDo)`, `apiIssueRemind`. Mỗi bản ghi có `rev`, chống ghi đè như Đợt 5.
- Máy chủ chặn: tạo khi không phải `tvgs/cdt/admin`; phản hồi khi không phải `ks/chot/admin`, hoặc ks ngoài khu vực; đóng / trả khi không phải vai người tạo hoặc `admin`; thiếu ảnh.
- Nhật ký: `LOI_TAO`, `LOI_PHAN_HOI`, `LOI_DONG`, `LOI_TRA_LAI`, `LOI_NHAC`.
- Chế độ thử: yêu cầu tạo khi đang bật cờ `test`; "Xóa toàn bộ ngày thử" xóa luôn.

#### 10C.3 Báo cáo tuần (chỉ tuần, không in vào PDF ngày)
- Mục mới **I.F – Lỗi tồn đọng** (sau E An toàn), số liệu 🔒 tính tại ngày cuối kỳ:
  - Dòng tóm tắt: tạo mới trong tuần · đã đóng trong tuần · còn mở · trong đó quá hạn.
  - Bảng các yêu cầu **còn mở**: Mã · Vị trí · Nội dung · Người yêu cầu · Hạn · Trạng thái · Số lần nhắc. Quá hạn tô đỏ. **Không in ảnh** (giữ PDF tuần nhẹ).
- Tổng hợp lại tuần đọc lại sheet `LoiTonDong`.

---

### 10D. Làm việc khi mất sóng

- Phạm vi: **phiếu kỹ sư** (`apiSaveSub`) và **phản hồi yêu cầu khắc phục** (kèm ảnh). Không áp dụng cho chốt, xác nhận TVGS, cấu hình (cần trạng thái mới nhất từ máy chủ).
- Hàng đợi `outbox` trong IndexedDB (app đã có `IDB`, thêm kho mới), khóa theo tài khoản + dự án. Ảnh giữ dạng đã nén.
- Gửi khi nào: sự kiện `online`, mỗi 30 giây khi còn hàng chờ, khi mở app. Gửi lần lượt, cũ trước.
- Giao diện: dải "📵 Mất sóng – N mục chờ gửi, sẽ tự gửi khi có mạng". Gửi xong: "✅ Đã gửi bù N mục". Mỗi mục ghi giờ lưu và giờ gửi thật.
- Xung đột (máy chủ báo `CONFLICT` vì phiếu đã đổi, ví dụ người chốt đã nhận phiếu): **không ghi đè**. Giữ mục ở trạng thái "⚠ Cần xem lại" + nút Mở so sánh (như Đợt 5).
- Đăng xuất khi còn hàng chờ → hỏi lại "Còn N mục chưa gửi – vẫn đăng xuất?" (hàng chờ giữ cho lần đăng nhập sau của đúng tài khoản).
- **Rủi ro cần thử thật:** app chạy trong khung GitHub Pages trên iPhone. Safari có thể giới hạn hoặc xóa IndexedDB của khung nhúng (có trường hợp xóa sau 7 ngày không mở). Thử trên iPhone + Android trước khi bật cho mọi người, **có ca: lưu hàng chờ → đóng app 1–2 ngày → mở lại xem còn không**. Không được thì có công tắc tắt ở Cài đặt.

---

### Nén ảnh – đã có, không làm mới
- App đã nén trước khi tải: `processImage` cắt 1280×960 (ảnh hiện trường) hoặc tối đa 1800 px, JPEG 80%, đóng dấu giờ. Mặt bằng giữ ~2400 px (Đợt 5).
- Đợt 10 chỉ: dùng lại `processImage` cho ảnh lỗi tồn đọng; đổi `loadImg` từ FileReader (đọc cả file gốc vào bộ nhớ) sang `URL.createObjectURL` để máy yếu không treo khi chọn nhiều ảnh 10–12 MB.

---

### Kiểm thử (thêm vào gastest.js / ui.js)
- `cdt` gọi `apiOpen` ngày chưa xác nhận → lỗi. `cdt` gọi `index_` không thấy ngày nháp. `tvgs` mở ngày chưa chốt → lỗi.
- `chot` gọi `apiSaveConfig` → lỗi. Đổi `xem` → `cdt` khi nạp cấu hình cũ. Không hạ được `admin` cuối.
- `asRole` từ tài khoản không phải `admin` → bị bỏ qua. `asRole` không mở rộng quyền.
- `tvgs` gọi `apiExportPdf` khi chưa `approved` hoặc sai `rev` → lỗi; đúng → ok. Mã xác thực đổi khi đổi remarks.
- Yêu cầu khắc phục: tạo thiếu ảnh → lỗi; `ks` tạo → lỗi; `cdt` đóng yêu cầu của TVGS → lỗi; trả lại thiếu lý do → lỗi; nhắc tăng đếm.
- Mất sóng: giả lập lỗi mạng → vào hàng chờ; có mạng → gửi, xóa khỏi hàng; CONFLICT → giữ, không ghi đè.
- Giao diện 375 / 390 / 412 px + máy tính: menu đúng từng vai; dải màu khu; số trên thẻ.

### Các điểm đã chốt (20/11/2026)
1. Kỹ sư thấy yêu cầu khắc phục **theo khu vực mình**; chưa được gán khu vực → thấy tất cả.
2. Báo cáo tuần **tự gom Ý kiến TVGS của các ngày** thành mục 🔒 chỉ đọc.
3. **Giữ "Lịch phát hành" cho CĐT** (10B): chỉ hiện ngày / tuần nào chưa phát hành, trễ bao lâu, không hiện nội dung. Ngưỡng cảnh báo: nhà thầu chốt quá **24 giờ** mà TVGS chưa xác nhận → tô đỏ.
4. Thứ tự **10A → 10B → 10C → 10D**; **10A và 10B đi sát nhau** (điều kiện `pub = ok` của CĐT có từ 10B). Đổi `loadImg` sang `URL.createObjectURL` gộp vào 10A.

### 10A – phạm vi đã làm / để lại
- Làm: vai `cdt` (đổi từ `xem`), lọc máy chủ cho `cdt` / `tvgs` (danh mục ngày, mở ngày, kỳ tuần/tháng), "Xem như" của Quản trị (máy chủ nhận vai qua phiên `<mã phiên>~<vai>`, chỉ khi tài khoản thật là `admin`), không xóa được Quản trị cuối, dải nhắc "Rà lại vai trò" + checklist, dải màu khu, menu theo vai, `loadImg` dùng `URL.createObjectURL`.
- Để lại 10B: thẻ "Báo cáo đã phát hành" cho kỹ sư (hiện kỹ sư vẫn nhận dữ liệu ngày như trước – đổi cần làm lại màn hình Phiếu của tôi), "Tra mã xác thực" trên menu CĐT, số đếm trên thẻ.

### 10A.7 Giao một phần Cấu hình cho Người tổng hợp / chốt (ĐÃ CHỐT, làm 20/11/2026)
Ý kiến anh Nghĩa: chuyển cho người chốt của nhà thầu Khu vực & phân công, Danh mục, file theo dõi hồ sơ đệ trình. **Thư mục lưu PDF giữ ở Quản trị PMH** (kho bản chính thức mà QR trỏ tới).
- Người chốt thấy thẻ **Cấu hình** rút gọn: **Khu vực & phân công** · **Danh mục** · **Kỹ sư** · **File theo dõi hồ sơ** (dán link file, nhận trang tính, phân loại Hồ sơ đệ trình / Văn bản / Bỏ qua). Không thấy: Dự án, Người dùng & PIN (đầy đủ), logo, thư mục lưu PDF ngày / tuần, công tắc TVGS kiểm tra, Chế độ thử, Sao lưu / Reset.
- **Kỹ sư:** người chốt thêm tài khoản, đổi tên, khóa / mở lại, đặt PIN — **chỉ tài khoản vai `ks`**. Không tạo / sửa / đặt PIN tài khoản vai khác, không đổi vai của ai.
- Máy chủ: API mới `apiSaveCfgPart(token, part, json)` cho `chot` + `admin`. `part` = `zones` | `lists` | `register` | `engineers`; chỉ ghi đúng khóa của phần đó (`zones`; `wbs, manpower, equipment, safetyDefault, materials`; `settings.register`; người dùng vai `ks`), mọi khóa khác giữ nguyên bản đang lưu. Ghi theo phần → Quản trị và người chốt sửa cùng lúc không ghi đè nhau. Phần `engineers`: người dùng vai khác trong bản gửi lên bị bỏ qua; người mới luôn vai `ks`.
- `apiSetPin` (người khác): `admin` mọi người; `chot` chỉ tài khoản vai `ks`. `apiCheckRegister` mở thêm cho `chot`. `apiCheckFolder`, thư mục PDF, `apiSaveConfig` (toàn bộ) vẫn chỉ `admin`.
- Nhật ký: `SUA_KHU_VUC`, `SUA_DANH_MUC`, `DOI_FILE_HO_SO`, `THEM_KY_SU`, `KHOA_KY_SU`, `DAT_PIN` (đã có).
- Đổi WBS / danh mục khi đã có báo cáo: giữ như hiện tại – chỉ ảnh hưởng ngày chưa chốt, báo cáo đã chốt giữ nguyên.
- Kiểm thử: chốt lưu từng phần được; gửi kèm vai / PIN / thư mục PDF / cài đặt khác → máy chủ bỏ qua; chốt đặt PIN kỹ sư được, PIN TVGS / CĐT / Quản trị → lỗi; chốt không tạo được vai khác `ks`; chốt gọi `apiCheckFolder` → lỗi; menu Cấu hình rút gọn đúng 4 thẻ.

### 10A.8 Đánh giá "So với KH": bỏ "0/0 = Đạt", bắt buộc KH ngày mai, Tạm dừng (chốt làm 20/11/2026)
- Phản ánh của TVGS: việc KH hôm nay 0% + thực hiện 0% đang hiện **Đạt** → "Đạt kế hoạch 8/13" bị đẩy cao (đúng ra 4/13).
- **Quy tắc mới** cho việc **kế thừa từ hôm trước, lũy kế < 100%, không phải việc theo dõi, không Tạm dừng**:
  - Không có KH / KH 0% → coi KH = 0. Thực hiện trống / 0% → **Hụt** (kể cả KH 0). KH > 0 mà thực hiện 0 → **Hụt** (như cũ).
  - Còn lại như cũ: = KH → Đạt, > KH → Vượt, < KH → Hụt; lũy kế đạt 100% → Đạt.
  - Đếm "Hụt N ngày liên tiếp" không bị cắt khi bỏ trống KH. Hụt mà chênh lệch 0 (KH 0, làm 0) ghi "Hụt – không thực hiện".
  - Việc **mới** thêm trong ngày, không có KH: giữ như cũ (không đánh giá).
- **Bắt buộc KH ngày mai > 0%**: kỹ sư bấm Nộp phiếu → việc lũy kế < 100% (không theo dõi, không Tạm dừng) mà chưa có dòng "Kế hoạch ngày mai" với % dự kiến **> 0** → **chặn nộp**, báo "Còn N việc chưa lên kế hoạch ngày mai", nút **"Tạo dòng KH còn thiếu"** (thêm dòng, để trống %, chuyển sang Kế hoạch ngày mai). Phiếu chưa có KH nào → vẫn tự sinh như cũ.
- **Người chốt** chốt ngày: chỉ **cảnh báo** danh sách việc thiếu KH ngày mai, chốt vẫn được.
- **⏸ Tạm dừng** (việc dừng chính đáng: chờ bảo dưỡng, chờ nghiệm thu, chờ vật tư…): nút trên từng việc (thẻ điện thoại + bảng máy tính), **bắt buộc ghi lý do**. Đang Tạm dừng: ô % hôm nay khóa (để trống), không tính Đạt/Hụt, không vào tổng X/Y, không bắt KH ngày mai. Tạm dừng tự chuyển sang ngày sau kèm lý do, đếm số ngày; bấm "▶ Tiếp tục" để thi công lại. PDF ngày ghi ở cột Chênh lệch: "⏸ Tạm dừng · N ngày" + lý do.
- Báo cáo tuần: mục tuân thủ KH ngày dùng cùng quy tắc (Tạm dừng không tính).
- Lưu ý: quy tắc tính lúc hiển thị → mở lại ngày cũ trong app cũng thấy theo quy tắc mới; PDF đã phát hành không đổi.
- Kiểm thử: 0/0 → Hụt; KH trống + làm 0 (kế thừa) → Hụt; việc mới không KH → không đánh giá; thống kê 4/13 theo ví dụ; Tạm dừng → không tính, có lý do trên PDF, chuyển sang ngày sau +1 ngày; nộp thiếu KH ngày mai / KH 0 → bị chặn; chốt thiếu KH → cảnh báo.

### 10B – chốt phạm vi (20/11/2026), làm 2 bước – đang làm 10B1
**Bước 10B1** (thay luồng phát hành – chạy thử vài ngày rồi mới làm 10B2):
- Tự phát hành PDF + QR khi TVGS Xác nhận (ngày + tuần) như 10B.1; bỏ nút "☁ PDF" của người chốt; lỗi → `pub=fail`, dải đỏ + "Xuất lại" (Quản trị, người chốt, TVGS). CĐT chỉ thấy khi `pub=ok`.
- Chuyển đổi: ngày / tuần đã xác nhận + đã có `pdf_url` trước bản này → coi `pub=ok`.
- Ý kiến TVGS in PDF (10B.2): loại + nội dung, tính vào mã xác thực, mở khóa ghi nhật ký remarks + mã cũ. Báo cáo tuần: mục 🔒 tự gom ý kiến TVGS các ngày.
- **Sửa ảnh Gantt báo cáo tuần (mục IV):** bỏ tự xoay dọc. Ảnh Gantt **giữ nằm ngang, mỗi ảnh nửa trang A4** (2 ảnh / trang), rộng hết khổ, chú thích dưới ảnh.
- Đo thời gian xuất trên điện thoại thật của TVGS (1 ngày + 1 tuần) trên /dev; > 60 giây → gói sau chuyển dựng PDF sang máy chủ.
**Bước 10B2** (hiển thị):
- **Lịch phát hành** cho CĐT: 14 ngày gần nhất + các tuần; trạng thái ✅ Đã phát hành · ⏳ Chờ TVGS (x giờ, > 24 giờ tô đỏ) · ✎ Nhà thầu chưa chốt · ⚠ Lỗi phát hành · ✖ Chưa có báo cáo · 🏖 Ngày nghỉ (lý do). Không hiện nội dung.
- **Ngày nghỉ**: người chốt / Quản trị đánh dấu ngày không làm báo cáo là ngày nghỉ (Chủ nhật / Lễ / Tết / Khác + ghi chú), chọn được **từ ngày → đến ngày** (VD nghỉ Tết). Không tự trừ Chủ nhật – nhà thầu tự đánh dấu. Ghi nhật ký `DANH_DAU_NGAY_NGHI`.
- ~~Thẻ "Báo cáo đã phát hành" cho kỹ sư~~ – **bỏ** (anh Nghĩa 20/11).
- Số đếm trên thẻ menu (TVGS chờ kiểm tra, người chốt bị trả về).
- Tra mã xác thực: giữ nút "🔎 Tra mã xác thực" có sẵn ở khung xem báo cáo, không thêm thẻ riêng.
- Kế hoạch nghiệm thu ngày mai trong phiếu kỹ sư: **đã có** (thẻ "Nghiệm thu & TN" → "📅 Kế hoạch nghiệm thu ngày mai"). Lối tắt – **bỏ** (anh Nghĩa 20/11).
