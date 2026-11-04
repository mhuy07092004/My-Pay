# My Pay – Requirements & Specification

> Trạng thái: DRAFT v0.1 – sẽ bổ sung khi scope rõ hơn.
> Quy ước: `[x]` đã chốt · `[ ]` chưa chốt / cần bổ sung · `(?)` cần xác minh nguồn.

## 1. Mục tiêu

App theo dõi ca làm, tính lương ước tính và ước tính thuế cho người đi làm ở **Úc** (giai đoạn 1: chỉ Úc).

## 2. Đối tượng người dùng

- [x] Du học sinh (student visa)
- [x] Working Holiday Maker (WHM)
- [x] Part-time, casual, hoặc full-time có **lịch thay đổi, không cố định** (kể cả tăng ca đột xuất → phải track được)
- [ ] Resident / PR / citizen (chưa ưu tiên; xác nhận có hỗ trợ ở giai đoạn 1 không)

## 3. Quyết định đã chốt

| # | Quyết định |
|---|---|
| D1 | Độ chính xác: **ước tính gần đúng**, không cần khớp từng đồng. Luôn hiển thị disclaimer "ước tính, không phải tư vấn thuế/payroll". |
| D2 | Dữ liệu luật (rate, bảng thuế) **không hard-code**: nhập vào bảng DB riêng, có `effective_from` (hiệu lực theo ngày/năm tài chính). |
| D3 | Nguồn dữ liệu: nhập từ nguồn chính phủ vào DB riêng (xem mục 8 – cần xác nhận nguồn). |
| D4 | Backend: Supabase (Auth + Postgres + RLS) – triển khai **sau** khi engine tính toán ổn định. |
| D5 | Payslip mẫu để đối chiếu: user sẽ cung cấp sau. |

## 4. Phạm vi chức năng (MVP)

### 4.1 Nhập ca làm
- [x] Nhập ca theo ngày: check-in, check-out, break (không lương), tối đa 2 ca/ngày, ca qua nửa đêm.
- [ ] Thêm ca đột xuất / tăng ca sau khi kỳ lương đã tạo; sửa và xóa ca.
- [ ] Ghi chú cho ca (tùy chọn), đánh dấu ngày lễ thủ công nếu cần.
- [ ] Nhiều job / nhiều employer (mỗi job có rate và cài đặt thuế riêng, tax-free threshold chỉ claim ở 1 job).

### 4.2 Engine tính lương (module thuần, có unit test, tách khỏi UI)
- [ ] Tách ca theo **đoạn thời gian thực** (qua nửa đêm, đổi ngày, đổi loại ngày).
- [ ] Áp dụng theo loại thời điểm: ordinary, night, Saturday, Sunday, public holiday.
- [ ] Casual loading, junior rate theo tuổi, level, status (full-time/part-time/casual).
- [ ] Overtime (ngưỡng theo ngày/tuần: cần định nghĩa từ award).
- [ ] Minimum engagement / quy tắc nghỉ (cần xác định có làm ở MVP không).
- [ ] Ngày lễ theo **bang/lãnh thổ**.
- [ ] Rate lấy từ DB theo `effective_from` của ngày làm; user có thể tự nhập custom rate.
- [ ] Tiền tính bằng **cent (số nguyên)**.

### 4.3 Engine ước tính thuế
- [ ] Hồ sơ thuế người dùng: residency (resident / non-resident / WHM), claim tax-free threshold, có TFN, HELP debt, Medicare levy, chu kỳ trả lương (tuần/2 tuần/tháng), bang.
- [ ] **PAYG withholding theo kỳ lương** (annualise theo chu kỳ, áp bảng ATO).
- [ ] **Dự báo thuế cả năm tài chính** (1/7–30/6): tổng thu nhập, thuế ước tính, refund / nợ thuế.
- [ ] Hiển thị riêng **superannuation** (employer đóng thêm, không trừ vào lương).
- [ ] Bảng thuế theo năm tài chính, lưu trong DB, có phiên bản.

### 4.4 Báo cáo & so sánh
- [x] Báo cáo theo tháng / 3 tháng / năm tài chính / năm dương lịch (đã có UI).
- [ ] Sửa so sánh: **net thực nhận vs net ước tính** (hiện đang so net với gross).
- [ ] Phân tách: gross, tax, net, super; ordinary vs penalty vs overtime.
- [ ] Xuất CSV / PDF (có thể để giai đoạn sau).

### 4.5 Tài khoản
- [ ] Đăng ký / đăng nhập / quên mật khẩu (Supabase Auth). Phương thức: email+password (xác nhận có Google không).
- [ ] Settings lưu thật: profile, hồ sơ thuế, rates.
- [ ] Xóa tài khoản và dữ liệu.

## 5. Ngoài phạm vi (giai đoạn 1)

- Quốc gia khác ngoài Úc.
- Lodge tax return, kết nối trực tiếp ATO/myGov của user.
- Tư vấn thuế, tính offset/deduction phức tạp (work-related expenses, v.v.).
- Thanh toán / gói Premium (chỉ giữ UI "Coming soon").

## 6. Dữ liệu (nháp, sẽ chốt khi vào bước backend)

| Bảng | Mục đích |
|---|---|
| `profiles` | Thông tin user, bang, timezone |
| `tax_profiles` | Residency, tax-free threshold, TFN, HELP, chu kỳ trả lương |
| `jobs` | Job/employer, award, status, level, tuổi, rate đang dùng |
| `award_rates` | Rate theo award/level/status/tuổi/loại giờ + `effective_from` (nạp từ nguồn chính phủ) |
| `tax_brackets` | Bảng thuế theo năm tài chính + loại residency |
| `tax_withholding_coefficients` | Hệ số PAYG theo chu kỳ (nếu dùng công thức ATO) |
| `public_holidays` | Ngày lễ theo bang và năm |
| `pay_periods` | Kỳ lương của user theo job |
| `shifts` | Ca làm (ngày, giờ, break, job, ghi chú) |
| `actual_payments` | Số tiền thực nhận (net) theo kỳ, dùng để so sánh |

Mọi bảng dữ liệu user bật **RLS** (user chỉ truy cập dữ liệu của mình); bảng luật (rates, thuế, ngày lễ) chỉ đọc với user.

## 7. Kiến trúc & nguyên tắc kỹ thuật

- `payEngine` và `taxEngine`: hàm thuần, không phụ thuộc UI, có unit test với ca ví dụ và payslip mẫu.
- UI chỉ gọi engine; bỏ logic tính tiền/thuế trong component (`period_editor`, `report`, `timesheet`).
- Bỏ `MOCK_RATES`, `TAX_RATE`, `getPresetPay`; thay bằng dữ liệu từ DB/engine.
- MSW chỉ chạy ở dev (`import.meta.env.DEV`).
- Múi giờ cố định theo bang của user khi xác định đêm / cuối tuần / ngày lễ.
- Lint: sửa 3 lỗi `react-refresh/only-export-components`.

## 8. Cần xác nhận nguồn dữ liệu (D3)

> Ghi chú: ATO cung cấp bảng thuế/PAYG withholding; **mức lương theo award (penalty, junior, casual) do Fair Work Commission/Fair Work Ombudsman công bố**, không phải ATO.

- [ ] Bảng thuế & PAYG withholding: nguồn ATO – xác nhận có API/dataset cụ thể nào (link, định dạng).
- [ ] Award rates: nguồn Fair Work (Pay Guide / API) – xác nhận nguồn sẽ dùng.
- [ ] Ngày lễ theo bang: nguồn (data.gov.au hoặc nhập tay).
- [ ] Quy trình cập nhật: ai nạp, tần suất (mỗi 1/7 và khi có thay đổi), cách kiểm tra.

## 9. Award / ngành áp dụng

- [ ] MVP: Fast Food Industry Award (MA000003) hay nhiều award?
- [x] Luôn hỗ trợ **Custom rate** cho user tự nhập khi award chưa có trong DB.

## 10. Lộ trình đề xuất

1. Chốt spec (file này) và mục 8–9.
2. `payEngine` + test.
3. `taxEngine` + test (WHM, non-resident, resident; kỳ tuần/2 tuần/tháng).
4. Settings: hồ sơ thuế + rates; nối Timesheet/Report vào engine; sửa lỗi variance; bỏ số giả ở Dashboard.
5. Schema DB, nạp dữ liệu luật, Supabase Auth + RLS, chuyển `localStorage` sang DB.
6. Đăng ký/quên mật khẩu, export, polish, deploy.

## 11. Câu hỏi mở

1. Hỗ trợ resident/PR ngay MVP hay chỉ student + WHM?
2. Nhiều job ở MVP hay 1 job?
3. Chu kỳ trả lương hỗ trợ: tuần, 2 tuần, tháng?
4. Có Google login không?
5. Nguồn dữ liệu cụ thể cho mục 8.
6. Ngôn ngữ giữ Anh–Việt?
7. Payslip mẫu: khi nào cung cấp (dùng để viết test).

## 12. Lịch sử thay đổi

- v0.1 (2026-11-04): tạo từ yêu cầu ban đầu.
