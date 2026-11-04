# My Pay – Requirements & Specification

> Trạng thái: DRAFT v0.5 – sẽ bổ sung khi scope rõ hơn.
> Quy ước: `[x]` đã chốt · `[ ]` chưa chốt / cần bổ sung · `(?)` cần xác minh nguồn.
> **Giao diện dashboard hiện tại là bản chốt.** Timesheet, thêm/sửa ca, report, settings, login giữ layout và luồng sẵn có. Việc sau này chỉ thay số mock bằng engine/DB, không thiết kế lại các màn đó.
> Công thức PAYG withholding 2026–27 (bảng hệ số, ví dụ, giá trị test): [payg-withholding-2026-27.md](./payg-withholding-2026-27.md).

## 1. Mục tiêu

App theo dõi ca làm, tính lương ước tính và ước tính thuế cho người đi làm ở **Úc** (giai đoạn 1: chỉ Úc).

Ước tính thuế ở giai đoạn này là **PAYG withholding** (số thuế employer giữ lại trên mỗi kỳ lương), theo công thức ATO. Đây là số bị trừ trên lương, không phải thuế cuối năm sau khi lodge tax return. Trên UI ghi nhãn **"estimated tax withheld"**.

## 2. Đối tượng người dùng

- [x] Du học sinh (student visa) — map sang resident hoặc foreign resident theo hồ sơ thuế user khai, không suy ra từ loại visa.
- [x] Part-time, casual, hoặc full-time có **lịch thay đổi, không cố định** (kể cả tăng ca đột xuất → phải track được)

## 3. Quyết định đã chốt

| # | Quyết định |
|---|---|
| D1 | Độ chính xác: **ước tính gần đúng**, không cần khớp từng đồng với tax return. Luôn hiển thị disclaimer "ước tính, không phải tư vấn thuế/payroll". Vớiholding theo công thức ATO phải khớp sample data ATO (làm tròn đúng quy tắc mục 4.3). |
| D2 | Dữ liệu luật (rate, bảng hệ số PAYG) **không hard-code trong code tính**: nhập vào bảng DB riêng, có `effective_from`. Chọn bộ hệ số theo **ngày trả lương**, không theo ngày làm. |
| D3 | Nguồn PAYG 2026–27 đã chốt ở mục 8. Award MVP là Fast Food MA000003. Bảng giờ ở mục 9. |
| D4 | Backend: Supabase (Auth + Postgres + RLS) – triển khai **sau** khi engine tính toán ổn định. |
| D5 | Payslip mẫu để đối chiếu: user sẽ cung cấp sau. |
| D6 | Thuế MVP = **ước tính PAYG withholding** theo ATO Schedule 1 (NAT 1004) và khoản study/training loan theo Schedule 8 (NAT 3539), năm tài chính **2026–27** (payment từ 1/7/2026). Chi tiết công thức: [payg-withholding-2026-27.md](./payg-withholding-2026-27.md). |
| D7 | Gross đưa vào withholding **gồm taxable allowances** (allowance chịu thuế, bonus, commission). Employer super trả thêm, **không** nằm trong withholding và không trừ vào net. |
| D8 | Net ước tính = gross − withholding. Khi bật study/training loan, khoản loan đã nằm trong withholding. Hiển thị withholding bằng **đô la nguyên**. |
| D9 | UI mock đã có là giao diện dùng tiếp. Không đổi `ShiftRow`, `PeriodEditor`, trang Add New Shifts, period detail, report, form rate, personal info, login/signup. |
| D10 | Preset lương lấy theo status, level (1–3), tuổi, rồi loại giờ (ordinary, thứ bảy, chủ nhật, ngày lễ, overtime). Số ở mục 9, hiệu lực 1/7/2026. |

## 4. Phạm vi chức năng (MVP)

### 4.0 Giao diện đã có (giữ nguyên)

Dữ liệu đang là mock / `localStorage`. Các màn dưới đây đã đúng ý và không được dựng lại.

| Màn | Đã có |
|---|---|
| Timesheet | Danh sách kỳ theo tháng. Nút **Add New Shifts**. Mỗi kỳ hiện income, tax, actual. |
| Add New Shifts | Chọn khoảng ngày (tối đa 14 ngày), chặn khoảng chồng kỳ đã có, lưu kỳ. |
| Ca trong kỳ | Check-in, check-out, break không lương, rate. Checkbox **More than 1 shift?** thêm hoặc bỏ ca thứ 2. **Save Shift** ghi ca của ngày. Sửa lại được trên kỳ đã lưu (`/timesheet/:periodId`). Ca qua nửa đêm: giờ ra sớm hơn giờ vào. |
| Ước tính kỳ | Cột before tax / est. tax / after tax và 3 card period earnings. Disclaimer ước tính đã có. |
| Actual | Ô **Actual received** + **Save actual** trên period detail. |
| Report | Tab 1 tháng / 3 tháng / năm tài chính (1/7) / năm dương lịch. Biểu đồ Estimated vs Net. Card earnings, net, difference, tax, giờ, tuần năng suất, fortnight cao/thấp. |
| Settings | Personal info (avatar, tên, email, password chỉ đọc). Rates: Fast Food (status, level, tuổi) hoặc Custom, ordinary (đêm, thứ bảy, chủ nhật, ngày lễ), overtime, thêm và chỉnh rate. |
| Auth UI | Sign in email + password (mock). Form sign up (họ tên, email, password). Anh / Việt (`en.json`, `vn.json`). |
| Khác | Landing, Features, Pricing (Coming soon), About, Dashboard (một card tổng; số trên card còn placeholder). |

### 4.1 Nhập ca làm
- [x] Nhập ca theo ngày: check-in, check-out, break (không lương), tối đa 2 ca/ngày, ca qua nửa đêm. UI mục 4.0.
- [x] Thêm kỳ mới; mở kỳ đã tạo để sửa ca; bật/tắt ca thứ 2 để thêm hoặc bỏ ca đó. Giữ nguyên `ShiftRow` và `PeriodEditor`.
- [ ] Ghi chú cho ca (tùy chọn), đánh dấu ngày lễ thủ công nếu cần. Chưa có trên UI.
- [ ] Nhiều job / nhiều employer. UI hiện là một rate cho mỗi ca (`timesheet.rate.hint`: one job · one rate). Form rate trong Settings giữ nguyên khi nối dữ liệu thật.

### 4.2 Engine tính lương (module thuần, có unit test, tách khỏi UI)

Giờ làm = check-out − check-in (qua nửa đêm thì cộng 24 giờ), trừ break không lương. Nhân với đơn giá mục 9 theo status, level, tuổi và loại giờ. Hai khung đêm trên form dùng **ordinary**. Custom rate dùng số user nhập trên từng ô. Không dùng `getPresetPay`.

- [x] Bảng ordinary, tuổi, thứ bảy, chủ nhật, ngày lễ, overtime: mục 9.
- [x] Custom rate (UI đã có).
- [ ] Tiền tính bằng **cent (số nguyên)**. UI vẫn hiện đô la có 2 số lẻ như `formatMoney`.

### 4.3 Engine ước tính thuế (PAYG withholding)

Module thuần `taxEngine`, không phụ thuộc UI. Hệ số và ví dụ số nằm ở [payg-withholding-2026-27.md](./payg-withholding-2026-27.md). Tóm tắt quy tắc đã chốt:

#### Hồ sơ thuế (nhập một lần)

- [x] Resident hoặc **foreign resident**.
- [x] Có claim **tax-free threshold** hay không (chỉ một job được claim).
- [x] Có **study / training support loan** hay không (HELP, VSL, Financial Supplement, SSL, AASL).
- [x] **Tax offset** năm (số tiền annual, tùy chọn). Chỉ scale 2, 5, 6.
- [x] **Medicare levy variation** (tùy chọn): full exemption → scale 5; half exemption → scale 6; điều chỉnh theo spouse/con (family income thấp). Nếu app không thu thập family variation thì bỏ bước trừ Medicare levy adjustment.
- [x] Chu kỳ trả lương: weekly, fortnightly, monthly. Quarterly, bi-monthly và daily/casual có trong công thức ATO; xác nhận có đưa vào UI MVP không (mục 11).

#### Chọn scale

| Scale | Khi nào |
|---|---|
| 1 | Resident, **không** claim tax-free threshold (thường là job thứ hai) |
| 2 | Resident, **có** claim tax-free threshold. Mặc định cho resident một job. Đã gồm Medicare levy |
| 3 | Foreign resident. Không tax-free threshold, không Medicare levy |
| 5 | Miễn Medicare levy **toàn phần** (Medicare levy variation) |
| 6 | Miễn Medicare levy **một nửa** (Medicare levy variation) |

MVP giả định user đã có TFN. Không có scale 4 (không ước tính 47% / 45% khi thiếu TFN). Tax offset chỉ scale 2, 5, 6. Medicare levy adjustment chỉ scale 2 và 6.

#### Công thức

ATO dùng đường thẳng theo khoảng thu nhập, không phải một bảng tra cứu duy nhất:

```
y = a × x − b
```

- **x** = thu nhập quy đổi theo tuần, tính bằng đô la nguyên **cộng 0.99**. Ví dụ $477.00–$477.99 → x = 477.99.
- **a**, **b** = hệ số theo scale và khoảng của x. Lấy **dòng đầu tiên** có giới hạn "x less than N" lớn hơn x.
- **y** = thuế weekly trước khi làm tròn.

Quy đổi chu kỳ (earnings = gross kỳ lương, gồm allowance chịu thuế):

| Chu kỳ | Đô la nguyên tương đương tuần | Đưa thuế weekly đã làm tròn `w` về chu kỳ |
|---|---|---|
| Weekly | earnings, bỏ cent | w |
| Fortnightly | earnings ÷ 2, bỏ cent | w × 2 |
| Monthly | (earnings × 3) ÷ 13, bỏ cent. Nếu earnings kết thúc đúng 33 cent thì cộng 1 cent trước | w × 13 ÷ 3, làm tròn đô la gần nhất |
| Quarterly | earnings ÷ 13, bỏ cent | w × 13 |
| Bi-monthly | Cộng các khoản trong tháng, xử lý như monthly | kết quả monthly ÷ 2 |

Sau đó x = đô la nguyên tương đương tuần + 0.99.

**Daily / casual** (NAT 1024; payee đã claim tax-free threshold → scale 2): bỏ cent thu nhập ngày × 5 + 0.99 = x; áp scale 2; làm tròn đô la; chia 5; làm tròn đô la. Đó là withholding của ngày.

#### Thứ tự tính (mọi chu kỳ trừ daily)

1. Tính **x**.
2. `y = a × x − b`. Nếu có study/training loan và đủ điều kiện, **cộng** hạng loan vào `y` **trước** khi làm tròn (cùng x; Table A cho scale 2, 3, 5, 6; Table B cho scale 1).
3. Làm tròn thành đô la nguyên → `w`.
4. Quy `w` về chu kỳ lương.
5. Trừ tax offset nếu scale cho phép (weekly 1.9%, fortnightly 3.8%, monthly 8.3%, quarterly 25% của annual offset; làm tròn đô la gần nhất).
6. Trừ Medicare levy adjustment nếu scale cho phép và user đã khai family variation.
7. Kết quả &lt; 0 thì dùng 0.

Study loan chỉ áp dụng khi user khai có nợ study/training, và **không** claim Medicare levy reduction cho spouse/dependants. Không áp dụng cho lump-sum termination.

#### Làm tròn

- Làm tròn kết quả weekly về **đô la nguyên**; đúng 50 cent thì **làm tròn lên**.
- Chỉ làm tròn **một lần** từ giá trị đúng của `a × x − b` (đã cộng loan nếu có). Không làm tròn về cent trước.
- Dùng số thập phân đúng hoặc số nguyên (tính bằng cent). Floating point nhị phân có thể biến .50 thành .4999 và ra kết quả thấp hơn $1.
- Kết quả âm → 0.

#### Đã chốt trong engine

- [x] PAYG withholding theo kỳ lương bằng công thức weekly ở trên (không annualise rồi áp tax bracket cả năm).
- [x] Study/training loan là công thức biên thứ hai, cộng vào y trước khi làm tròn.
- [x] Superannuation hiển thị riêng (employer đóng thêm, không trừ vào lương, không đưa vào withholding).
- [x] Bảng hệ số theo năm tài chính, lưu data có `effective_from`, chọn theo **ngày trả lương**. Kỳ trả từ 1/7/2026 dùng số 2026–27 kể cả khi kỳ đó gồm ngày làm trong tháng 6.
- [x] Mỗi tháng 6: cập nhật hệ số từ ATO và chạy lại sample data làm test. Không tái sử dụng hệ số năm cũ cho payment sau 1/7/2026.
- [ ] **Dự báo thuế cả năm tài chính** (1/7–30/6): tổng thu nhập, thuế ước tính, refund / nợ thuế. Tách khỏi withholding; công thức PAYG này không tính tax return.
- [ ] WHM (Schedule 15) — chưa có bảng trong tài liệu 2026–27.
- [ ] Các schedule đặc biệt nằm ngoài MVP: seniors/pensioners (9), horticulture/shearing (2), actors (3), back pay/bonus đặc biệt (5), unused leave và termination (7, 11), super payments (12, 13), voluntary agreements (10). Năm có 53 kỳ weekly hoặc 27 kỳ fortnightly: schedule giả định 52/26; extra withholding là tùy chọn, bảng nằm trong tài liệu PAYG.

#### Test bắt buộc

- Khớp sample data ATO (720/720 giá trị weekly, fortnightly, monthly đã được đối chiếu khi viết tài liệu).
- Các ví dụ A–F trong tài liệu PAYG (scale 2 + loan, scale 5 + offset, monthly + offset, Medicare levy adjustment, loan scale 1). Bỏ ví dụ G (không TFN).
- Lệch $1 so với bảng in khi weekly earnings trên khoảng $3,400 hoặc fortnightly trên khoảng $6,800 là ATO chấp nhận (formula hoặc bảng in đều được). Engine dùng formula.

### 4.4 Báo cáo & so sánh
- [x] Báo cáo theo tháng / 3 tháng / năm tài chính / năm dương lịch. Giữ tab, biểu đồ và các card hiện tại.
- [ ] Sửa **số** difference: hiện `variance = actual − gross` (trước thuế). Khi có withholding, cùng card Difference so **actual với net ước tính**. Không đổi layout report.
- [ ] Các card sẵn có (estimated, net, tax, giờ) nhận số từ engine. Super và tách ordinary / penalty / overtime chỉ hiện thêm nếu còn chỗ trên report hiện tại; không dựng màn report mới. Loan nằm trong withholding khi bật.
- [ ] Xuất CSV / PDF (có thể để giai đoạn sau). Chưa có nút export.

### 4.5 Tài khoản
- [x] Màn sign in và sign up email + password. Sign in chạy mock (`/api/auth/login` + MSW) và lưu session `localStorage`. Form sign up chưa gửi request.
- [ ] Nối đăng ký / đăng nhập / quên mật khẩu vào Supabase Auth, giữ form hiện tại. Google login: chưa có nút.
- [ ] Settings lưu thật: profile và rates (UI đã có, state chỉ trong component). Hồ sơ thuế PAYG (mục 4.3) chưa có màn; khi thêm thì để trong Settings, không sửa card personal và card rates.
- [ ] Xóa tài khoản và dữ liệu. Chưa có.

## 5. Ngoài phạm vi (giai đoạn 1)

- Quốc gia khác ngoài Úc.
- Lodge tax return, kết nối trực tiếp ATO/myGov của user.
- Tư vấn thuế, tính offset/deduction phức tạp ngoài số annual tax offset user tự khai (work-related expenses, v.v.).
- Thanh toán / gói Premium (chỉ giữ UI "Coming soon").
- Schedule ATO ngoài Schedule 1 và Schedule 8 đã liệt kê ở mục 4.3 (kể cả WHM Schedule 15 cho đến khi có spec riêng).
- Không ước tính withholding khi user không có TFN (scale 4).
- In lại toàn bộ tax table PDF; engine dùng công thức `y = a × x − b`.
- Phụ cấp, phép, ca tối thiểu, nghỉ giải lao có lương, báo trước khi nghỉ việc.

## 6. Dữ liệu (nháp, sẽ chốt khi vào bước backend)

| Bảng | Mục đích |
|---|---|
| `profiles` | Thông tin user, bang, timezone |
| `tax_profiles` | Residency (resident / foreign resident), claim tax-free threshold, study/training loan, annual tax offset, Medicare levy variation (none / full / half), family variation (spouse, số con) nếu có, chu kỳ trả lương. Không lưu số TFN |
| `jobs` | Job/employer, award, status, level, tuổi, rate đang dùng. Tax-free threshold chỉ claim ở một job |
| `award_rates` | $/giờ theo status, level, tuổi, loại giờ (ordinary, thứ bảy, chủ nhật, ngày lễ, overtime) + `effective_from`. Số mục 9 |
| `tax_withholding_coefficients` | Hệ số PAYG: năm tài chính, scale (1–3, 5–6), ngưỡng `x less than`, `a`, `b`, `effective_from` |
| `tax_study_loan_coefficients` | Hệ số Schedule 8: Table A và Table B, ngưỡng, `a`, `b`, `effective_from` |
| `tax_offset_rates` | Tỷ lệ trừ annual offset theo chu kỳ (1.9% / 3.8% / 8.3% / 25%) + `effective_from` |
| `medicare_levy_adjustment_params` | Ngưỡng và hệ số WLA cho scale 2 và 6 + `effective_from` (bỏ qua nếu không thu thập family variation) |
| `public_holidays` | Ngày lễ theo bang và năm |
| `pay_periods` | Kỳ lương của user theo job; **payment date** dùng để chọn bộ hệ số |
| `shifts` | Ca làm (ngày, giờ, break, job, ghi chú) |
| `actual_payments` | Số tiền thực nhận (net) theo kỳ, dùng để so sánh |

Mọi bảng dữ liệu user bật **RLS** (user chỉ truy cập dữ liệu của mình); bảng luật (rates, hệ số thuế, ngày lễ) chỉ đọc với user.

Không dùng bảng `tax_brackets` thu nhập cả năm cho withholding. Dự báo thuế năm (nếu làm sau) mới cần bracket / rule riêng.

## 7. Kiến trúc & nguyên tắc kỹ thuật

- `payEngine` và `taxEngine`: hàm thuần, không phụ thuộc UI, có unit test với ca ví dụ, payslip mẫu, và sample data ATO trong tài liệu PAYG.
- `taxEngine` nhận gross (cent), payment date, chu kỳ, và hồ sơ thuế; trả withholding (đô la nguyên, lưu nội bộ bằng cent). Không đọc hệ số từ hằng số trong code.
- Component hiện tại (`period_editor`, `shift_row`, `report`, `timesheet`, `rate_form`) giữ nguyên cấu trúc màn hình. Chỉ đổi nguồn số: gọi engine thay cho `TAX_RATE` và nhân giờ × rate phẳng.
- `MOCK_RATES`, `TAX_RATE`, `getPresetPay` là dữ liệu giả phía sau form và card đã có. Thay bằng DB/engine, không bỏ các ô rate trên Settings.
- MSW chỉ chạy ở dev (`import.meta.env.DEV`). Kỳ lương đang nằm ở `localStorage` (`my-pay-periods`).
- Múi giờ cố định theo bang của user khi xác định đêm / cuối tuần / ngày lễ.
- Lint: sửa 3 lỗi `react-refresh/only-export-components`.

## 8. Nguồn dữ liệu (D3)

> Award (penalty, junior, casual) do Fair Work Commission / Fair Work Ombudsman công bố. PAYG withholding do ATO công bố.

- [x] PAYG withholding 2026–27 (payment từ 1/7/2026), ato.gov.au, xuất bản 17/6/2026:
  - Schedule 1, Statement of formulas (NAT 1004): https://www.ato.gov.au/tax-rates-and-codes/payg-withholding-schedule-1-statement-of-formulas-for-calculating-amounts-to-be-withheld
  - Schedule 8, study and training support loans (NAT 3539): https://www.ato.gov.au/tax-rates-and-codes/schedule-8-statement-of-formulas-for-calculating-study-and-training-support-loans-components
  - Sample data: https://www.ato.gov.au/tax-rates-and-codes/payg-withholding-schedule-1-statement-of-formulas-for-calculating-amounts-to-be-withheld/sample-data
  - Bản rút gọn dùng để implement: [payg-withholding-2026-27.md](./payg-withholding-2026-27.md)
  - Năm cũ hơn: trang tax tables previous years của ATO. Mỗi 1/7 thêm một bộ data, không sửa code công thức.
- [ ] WHM: ATO Schedule 15 — chưa nạp.
- [x] Award MVP: [fastfood_award.md](./fastfood_award.md), Fast Food Industry Award (MA000003). Bảng dùng trong app là mục 9. Trang Fair Work: https://www.fairwork.gov.au/find-help-for/fast-food-restaurants-cafes/fast-food-industry
- [ ] Ngày lễ theo bang: nguồn (data.gov.au hoặc nhập tay). Rate $/giờ ngày lễ đã có ở mục 9.
- [ ] Quy trình cập nhật award và ngày lễ: ai nạp, tần suất, cách kiểm tra. PAYG: mỗi tháng 6, đọc "Important information" trên tax tables overview, cập nhật hệ số, chạy lại sample data.

## 9. Award / ngành áp dụng

Fast Food Industry Award (MA000003), từ 1/7/2026. Full-time và part-time cùng ordinary. Casual ordinary = ordinary full-time × 1.25. Nguồn số: [fastfood_award.md](./fastfood_award.md).

### Ordinary, người lớn (21+)

| Level | Full-time / Part-time | Casual |
|---|---|---|
| 1 | 27.81 | 34.76 |
| 2 | 29.45 | 36.81 |
| 3 | 29.91 – 30.27 | 37.39 – 37.84 |

### Ordinary Level 1 theo tuổi

Phần trăm của ordinary Level 1 người lớn. Tuổi 20 không có sẵn trong file nguồn; lấy 90% cùng bậc với các tuổi dưới.

| Tuổi | % | Full-time / Part-time | Casual |
|---|---|---|---|
| Dưới 16 | 40 | 11.12 | 13.90 |
| 16 | 50 | 13.91 | 17.39 |
| 17 | 60 | 16.69 | 20.86 |
| 18 | 70 | 19.47 | 24.34 |
| 19 | 80 | 22.25 | 27.81 |
| 20 | 90 | 25.03 | 31.29 |
| 21+ | 100 | 27.81 | 34.76 |

### Thứ bảy, chủ nhật, ngày lễ, overtime

Ví dụ đô la là Level 1, 21+. Casual penalty = (phần trăm + 25 điểm phần trăm) × ordinary full-time. Chủ nhật Level 2 và 3 là 150% ordinary của level đó, casual = 175% ordinary full-time của level đó.

| Loại giờ | % full-time / part-time | Full-time / Part-time | Casual |
|---|---|---|---|
| Ordinary, kể cả đêm | 100 | 27.81 | 34.76 |
| Thứ bảy | 125 | 34.76 | 41.72 |
| Chủ nhật Level 1 | 125 | 34.76 | 41.72 |
| Chủ nhật Level 2–3 | 150 | ordinary × 1.50 | ordinary full-time × 1.75 |
| Ngày lễ | 250 | 69.53 | 76.48 |
| Overtime, 2 giờ đầu | 150 | 41.72 | 48.67 |
| Overtime, sau 2 giờ | 200 | 55.62 | 62.57 |
| Overtime, chủ nhật | 200 | 55.62 | 62.57 |
| Overtime, ngày lễ | 250 | 69.53 | 76.48 |

- [x] Custom rate khi user không dùng preset.

## 10. Lộ trình đề xuất

1. Chốt spec (file này). Còn mở: ngày lễ, WHM, chu kỳ lương trên UI (mục 11).
2. `payEngine` + test.
3. `taxEngine` + test theo [payg-withholding-2026-27.md](./payg-withholding-2026-27.md): scale 1, 2, 3, 5, 6 (không scale 4), weekly / fortnightly / monthly, study loan, tax offset; Medicare levy adjustment nếu UI thu thập family variation. Đối chiếu sample data ATO.
4. Nối Timesheet, Report, Settings, Dashboard vào engine **trên đúng UI mục 4.0**. Sửa số variance. Card Dashboard đổi số placeholder `12,345`, giữ một card.
5. Schema DB, nạp hệ số 2026–27 và dữ liệu luật khác, Supabase Auth + RLS, chuyển `localStorage` sang DB.
6. Đăng ký/quên mật khẩu, export, polish, deploy.

## 11. Câu hỏi mở

1. Hỗ trợ resident/PR ngay MVP hay chỉ student + WHM? (Công thức resident và foreign resident đã có; WHM thì chưa.)
2. Nhiều job ở MVP hay 1 job?
3. UI MVP hỗ trợ những chu kỳ nào trong tập công thức đã có: weekly, fortnightly, monthly, quarterly, bi-monthly, daily/casual?
4. Có thu thập Medicare levy variation (scale 5/6 và family adjustment) ở MVP không? Nếu không, resident dùng scale 1 hoặc 2, bỏ bước trừ WLA.
5. Có Google login không?
6. Nguồn ngày lễ theo bang (mục 8). Rate giờ ngày lễ đã có ở mục 9.
7. Ngôn ngữ: UI đã có Anh và Việt. Giữ cả hai.
8. Payslip mẫu: khi nào cung cấp (dùng để viết test đối chiếu net).
9. Khi nào bổ sung WHM Schedule 15?

## 12. Lịch sử thay đổi

- v0.5 (2026-11-04): bảng lương Fast Food chỉ còn ordinary (full-time, part-time, casual, level 1–3, theo tuổi) và rate thứ bảy, chủ nhật, ngày lễ, overtime. Bỏ phụ cấp, phép, ca tối thiểu.
- v0.4 (2026-11-04): preset lương = Fast Food Level 1 người lớn, $27.81 (full/part-time) và $34.76 (casual). Không dùng penalty, overtime, junior, Level 2/3. Bỏ ước tính khi không có TFN (scale 4) và không lưu TFN.
- v0.3 (2026-11-04): đối chiếu frontend mock. Chốt giữ UI timesheet (thêm kỳ, sửa ca, ca thứ 2), report, settings rates, login/signup. Phần còn lại là nối engine/DB, không dựng lại màn.
- v0.2 (2026-11-04): chốt ước tính thuế = PAYG withholding 2026–27 (Schedule 1 + Schedule 8). Ghi scale, chu kỳ, thứ tự tính, làm tròn, hồ sơ thuế, bảng hệ số, nguồn ATO, và phần WHM / schedule đặc biệt còn ngoài phạm vi. Chi tiết số liệu ở `payg-withholding-2026-27.md`.
- v0.1 (2026-11-04): tạo từ yêu cầu ban đầu.
