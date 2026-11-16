# WebApp Báo cáo ngày công trường – Hướng dẫn triển khai (bản 2A + tối ưu tốc độ)

Đây là **khuôn mẫu dùng chung**. Mỗi dự án dùng một bản copy riêng. CN8-2 chỉ là dữ liệu demo.

## 1. Tạo file mẫu (làm 1 lần cho cả phòng)
1. Tạo Google Sheet mới, đặt tên `MAU_BaoCaoNgay`.
2. Vào **Tiện ích mở rộng → Apps Script**:
   - Dán `Code.gs` vào file Code.gs.
   - Bấm **+ → HTML**, đặt tên đúng là `Index`, dán `Index.html`.
3. Chạy hàm `setup` một lần, cấp quyền Sheets và Drive. Hàm này tạo 13 tab dữ liệu.
4. Không triển khai file mẫu. File mẫu chỉ dùng để copy.

## 2. Triển khai cho một dự án
1. **Tệp → Tạo bản sao** từ `MAU_BaoCaoNgay`, đổi tên thành `<MÃ DỰ ÁN>_BaoCaoNgay`. Nên đặt trong tài khoản/Shared Drive của PMH, không dùng tài khoản cá nhân.
2. Mở Apps Script của bản sao → **Triển khai → Triển khai mới → Ứng dụng web**:
   - Thực thi dưới dạng: **Tôi**.
   - Ai có quyền truy cập: **Bất kỳ ai** (hoặc **Bất kỳ ai có tài khoản Google**). Kỹ sư nhà thầu dùng Gmail cá nhân, nên việc phân quyền do **PIN** trong app đảm nhận.
3. Mở link `/exec`. Màn hình **Khai báo dự án lần đầu** hiện ra; nhập thông tin dự án và **tài khoản quản trị** (tên + PIN).
4. Vào **Cấu hình**:
   - **Người dùng & PIN**: thêm kỹ sư và người chốt, đặt PIN cho từng người.
   - **Khu vực & phân công**: tạo khu vực (Zone/Block + bộ môn) và giao cho kỹ sư phụ trách.
   - **Danh mục**: WBS, danh mục nhân lực và thiết bị mặc định.
5. Gửi link cho mọi người. Trên điện thoại, chọn **Thêm vào màn hình chính** để dùng như một app.

## 2b. Cập nhật lên phiên bản mới (khi tôi gửi code mới)
1. Mở Apps Script của dự án, dán đè **Code.gs** và **Index** bằng nội dung mới, rồi bấm 💾 Lưu.
2. Vào **Triển khai → Quản lý triển khai → ✎ Chỉnh sửa → Phiên bản: "Phiên bản mới"** → **Triển khai**.
   Nếu không chọn "Phiên bản mới", link `/exec` vẫn chạy code cũ.
3. Dữ liệu cũ giữ nguyên, không cần chạy lại `setup`.
4. Mở link, bấm Ctrl+F5 (hoặc đóng mở lại app trên điện thoại).

## 2c. Tự động triển khai từ GitHub (đã thiết lập)
Đã cài: clasp trên máy anh Nghĩa, secret `CLASPRC_JSON` trên GitHub, file `.clasp.json` (Script ID) và `.github/workflows/deploy.yml`.

| Thao tác | Kết quả |
|---|---|
| Đẩy code lên nhánh `main` | GitHub chạy kiểm thử. Đạt thì code tự vào Apps Script, bản **Thử nghiệm** (Triển khai → Kiểm tra triển khai → link `/dev`, chỉ chủ sở hữu mở được). **Link `/exec` của kỹ sư không đổi.** |
| Đẩy tag `v…` (VD `v2.1`), hoặc vào tab **Actions → Kiểm thử & triển khai → Run workflow** và tick *release* | Như trên, sau đó **phát hành lên link chính thức `/exec`**: link giữ nguyên, kỹ sư tải lại app là thấy bản mới |
| Kiểm thử lỗi | Dừng, **không** đưa code lên. GitHub gửi email báo lỗi cho chủ repo |

- Xem lịch sử chạy: tab **Actions** của repo.
- Quay về bản cũ: Apps Script → Triển khai → Quản lý triển khai → ✎ → chọn **phiên bản** trước → Triển khai.
- Nếu báo lỗi đăng nhập (`invalid_grant`, `unauthorized`): trên máy tính chạy lại `clasp login`, sau đó cập nhật secret `CLASPRC_JSON` bằng nội dung file `%USERPROFILE%\.clasprc.json` mới.

## 3. Vai trò
| Vai trò | Làm được gì |
|---|---|
| **Quản trị** | Mọi quyền của người chốt, cộng thêm cấu hình, người dùng, PIN, reset dự án |
| **Người tổng hợp / chốt** | Theo dõi phiếu, trả lại, nhập thay, nhập nhân lực/thiết bị/vật tư/an toàn, chốt, mở khóa, xuất PDF |
| **Kỹ sư hiện trường** | Chỉ nhập **phiếu của mình** cho các khu vực được giao; nộp hoặc rút lại phiếu |
| **Chỉ xem** | Xem báo cáo ngày, tuần, tháng (dành cho CĐT, TVGS) |

## 4. Quy trình hằng ngày
1. **Kỹ sư** mở "Phiếu của tôi". App tự **cuốn chiếu** từ ngày trước các loại việc sau trong khu vực được giao:
   - kế hoạch ngày mai của hôm trước;
   - việc chưa đạt 100%;
   - việc lặp lại hằng ngày;
   - kế hoạch nghiệm thu của hôm trước (chuyển thành danh sách cần nhập kết quả).
2. Kỹ sư nhập KL % lũy kế, KL ngày, nghiệm thu, thí nghiệm, ảnh, và **ghi chú nhân lực/thiết bị** cho người chốt, rồi bấm **Nộp**.
   - **Kiểm tra số liệu**: app chặn nộp khi % vượt 100. App cảnh báo khi thiếu %, % thấp hơn hôm trước, hoặc % tăng mà không có KL ngày.
   - **Ảnh** được cắt khung 4:3 và **đóng dấu ngày giờ chụp, người chụp, mã dự án, khu vực**. Ngày giờ lấy từ EXIF của ảnh; ảnh chụp khác ngày báo cáo bị gắn nhãn đỏ.
3. **Người chốt** mở "Tổng hợp & chốt ngày":
   - Xem tab **Tình trạng phiếu**: Đã nộp / Đang nhập / Bị trả lại / Chưa có.
   - **Xem/sửa** phiếu, **Trả lại** kèm ghi chú, hoặc **Nhập thay** cho kỹ sư vắng.
   - Nhập thời tiết, nhân lực, thiết bị, vật tư, an toàn, mặt bằng.
   - Bấm **Chốt** để khóa ngày.
   - Bấm **Lưu PDF vào Google Drive**, rồi gửi link qua Zalo.
4. **Sửa sau khi đã chốt**: bấm **Mở khóa**, sửa, rồi chốt lại. Báo cáo thành bản **v2** (file `BCN_<mã>_<ngày>_v2.pdf`); PDF bản cũ trên Drive được giữ nguyên.

## 5. Dữ liệu (các tab trong Google Sheet)
| Tab | Nội dung |
|---|---|
| BaoCao | 1 dòng/ngày: trạng thái, phiên bản, người chốt, tổng hợp, link PDF |
| PhieuKS | 1 dòng/kỹ sư/ngày: trạng thái, giờ nộp, nhập thay, ghi chú, lý do trả lại |
| CongViec | Việc thực hiện và kế hoạch: bộ môn, **khu vực**, WBS, KL, %, **người báo cáo**, mã tiến độ (để dành cho liên kết MS Project sau này) |
| NhanLuc / ThietBi / VatTu / AnToan | Số liệu theo ngày |
| NghiemThu / ThiNghiem | Theo ngày, có khu vực và người báo cáo |
| HinhAnh | Link ảnh trên Drive, thời điểm chụp, cảnh báo ảnh chụp khác ngày |
| TongHopKy | Phần nhập tay của báo cáo tuần/tháng |
| **NhatKy** | Nhật ký thao tác: ai nộp, trả lại, chốt, mở khóa, xuất PDF, lúc nào |
| CauHinh | Cấu hình dự án, mã băm PIN (không lưu PIN gốc) |

## 6. Chuyển dự án / reset
Vào **Cấu hình → Sao lưu / Chuyển dự án → Reset toàn bộ** và gõ mã dự án để xác nhận. App:
- tạo bản copy `LƯU TRỮ_<mã>_<ngày giờ>`;
- xóa dữ liệu và thu hồi mọi phiên đăng nhập;
- quay về màn hình khai báo lần đầu.

Cách được khuyên dùng vẫn là **mỗi dự án một bản copy riêng** (mục 2).

## 6b. Tốc độ – cách app được tối ưu
- **Cấu hình và danh mục ngày được nhúng sẵn vào trang**, nên màn hình đăng nhập hiện ngay khi trang tải xong, không phải chờ gọi máy chủ.
- **Đăng nhập trả về luôn dữ liệu màn hình đầu**. Mỗi màn hình hoặc mỗi lần đổi ngày chỉ gọi máy chủ **1 lần**.
- **Mở lại app hiện ngay dữ liệu lần trước** (khóa ô nhập trong lúc đồng bộ), sau khoảng 1 giây cập nhật bản mới nhất.
- **Ảnh tải sau**, theo lô, và được lưu sẵn trên máy nên mở lại không tải lại. Khi xuất PDF, máy chủ tự chèn ảnh gốc.
- **Tự lưu chỉ gửi phần chữ/số** (vài KB, trước đây khoảng 1 MB kèm ảnh). Có biểu tượng "⏳ Đang lưu / ✔ Đã lưu". App cũng tự lưu khi chuyển sang ứng dụng khác.
- Máy chủ dùng **CacheService**, **chỉ sửa đúng dòng cần sửa**. Các bảng chuẩn hóa (CongViec, NhanLuc…) chỉ được ghi khi **chốt**, nên chứa đúng số liệu chính thức.
- Giới hạn không vượt qua được của Google: mỗi lần gọi máy chủ mất khoảng 1–1,5 giây. App đã được thiết kế để gọi ít nhất có thể.

## 6c. Dùng trên điện thoại
Giao diện tự đổi khi màn hình hẹp hơn 768px. Máy tính giữ nguyên giao diện cũ.
- **Phần đầu trang** gọn một dòng. Bấm nút 👤 để xem tên, đăng xuất, trạng thái lưu. Tài khoản Quản trị có thêm nút mở Google Sheet và thư mục ảnh/PDF.
- **Kỹ sư**:
  - Mỗi việc là một thẻ, có ô **KL % lũy kế** và **KL ngày** cỡ lớn.
  - Các nút cộng nhanh **+2 / +5 / +7 / +10 / 100%** cộng tiếp từ % hôm nay, hoặc từ % hôm trước nếu hôm nay chưa nhập.
  - Ô vị trí, WBS, ĐVT, việc lặp lại được gấp vào mục "Chi tiết".
  - Thanh đáy có nút **Lưu / Nộp / Xem** và 4 tab **Công việc · Nghiệm thu · Ảnh · Ghi chú**.
  - Nút **📸 Chụp ảnh** mở thẳng camera sau.
- **Người chốt**:
  - Phiếu của từng kỹ sư hiện dạng thẻ, có nút Xem/sửa, Trả lại, Nhập thay.
  - Nhân lực và thiết bị chỉnh bằng nút **− / +**.
  - Thanh đáy có nút **Lưu · ✔ Chốt ngày · PDF · Xem**.
- **Xem trước** báo cáo hoặc phiếu mở toàn màn hình, tự thu nhỏ vừa khổ A4.
- Thêm vào màn hình chính:
  - iPhone: mở bằng Safari → Chia sẻ → Thêm vào MH chính.
  - Android: mở bằng Chrome → ⋮ → Thêm vào MH chính.

## 7. Giới hạn hiện tại
- PIN là lớp bảo vệ nội bộ. Giữ file Google Sheet ở chế độ **không chia sẻ** cho kỹ sư, vì họ chỉ dùng qua link Web App.
- PDF được tạo bằng bộ chuyển HTML→PDF của Google, nên bố cục có thể hơi khác bản xem trước. Bản Google Sheet theo tháng và PDF xuất từ Sheet làm ở đợt 2B.
- Chưa hỗ trợ nhập khi mất sóng. Chưa liên kết với MS Project; đã chừa sẵn trường "mã tiến độ".
