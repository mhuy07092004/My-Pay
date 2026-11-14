<div align="center">

# 💸 My Pay

**Track your shifts. Estimate your pay. Know your PAYG tax before payday.**

A pay and tax estimator for shift workers in Australia, built around the official ATO PAYG withholding formulas and the Fast Food Industry Award.
[![CI](https://github.com/mhuy07092004/My-Pay/actions/workflows/ci.yml/badge.svg)](https://github.com/mhuy07092004/My-Pay/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
![Node](https://img.shields.io/badge/node-%3E%3D22-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Postgres-3ECF8E?logo=supabase&logoColor=white)

[**Live Demo**](https://wheresmypay.vercel.app/) · [Specification](./docs/SPEC.md) · [Report a Bug](https://github.com/mhuy07092004/My-Pay/issues)

**🌐 Language:** [English](#english) · [Tiếng Việt](#tiếng-việt)

</div>

---

<a id="english"></a>

# 🇬🇧 English

## Table of Contents

- [About](#about)
- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Database](#database)
- [API Overview](#api-overview)
- [Deployment](#deployment)
- [Data Sources](#data-sources)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Disclaimer](#disclaimer)
- [License](#license)
- [Credits](#credits)

## About

**My Pay** helps part-time, casual and full-time workers with irregular schedules (including international students) log their shifts and see an estimate of their gross pay, withheld tax and net pay for each pay period.

Tax is computed with the **ATO PAYG withholding formulas** (Schedule 1, NAT 1004, and Schedule 8 for study/training loans) for the **2026–27** financial year. It is the amount your employer withholds from each payment, **not** your end-of-year tax return result.

## Features

- 🕒 **Shift tracking**: check-in, check-out, unpaid break, up to 2 shifts per day, shifts that cross midnight.
- 💼 **Multiple jobs**: each job has its own rate, and tax is calculated per job. Only one job can claim the tax-free threshold.
- 🍔 **Award presets**: Fast Food Industry Award (MA000003) by status, level (1–3) and age, covering ordinary, Saturday, Sunday, public holiday and overtime rates.
- ✍️ **Custom rates**: use your own hourly rates instead of presets.
- 🎉 **Public holidays and overtime**: per-shift public holiday flag and overtime hours.
- 🧮 **PAYG withholding engine**: scales 1, 2, 3, 5, 6, weekly, fortnightly and monthly cycles, study/training loans, tax offsets, half-up rounding on integer cents.
- 📊 **Reports**: 1 month, 3 months, financial year (1 July) and calendar year, with estimated vs net charts.
- ✅ **Actual vs estimate**: record what you actually received and compare it with the estimate.
- 🔒 **Secure by design**: Supabase Auth, Postgres Row Level Security, and per-user JWT on every API request.
- 🌏 **Bilingual UI**: English and Vietnamese.
- 📱 **Responsive**: bottom tab bar on mobile, expanded sidebar on desktop.

## Screenshots

<!-- Add screenshots here, for example:
<p align="center">
  <img src="./docs/images/dashboard.png" alt="Dashboard" width="48%" />
  <img src="./docs/images/timesheet.png" alt="Timesheet" width="48%" />
</p>
-->

_Coming soon._ In the meantime, try the [live demo](https://wheresmypay.vercel.app/).

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS 4, React Router 7, Framer Motion, i18next |
| Backend | Node.js 22, Express 5, TypeScript, Zod |
| Shared engine | `@my-pay/engine`: pure TypeScript functions used by both frontend and backend |
| Database and auth | Supabase (Postgres, Auth, Row Level Security) |
| Testing | Vitest, Supertest |
| CI/CD | GitHub Actions, Vercel |

## Architecture

npm workspaces monorepo:

```text
My Pay
├── frontend/            React app (Vite)
├── backend/             Express API (also runs as a Vercel function)
├── packages/engine/     @my-pay/engine: pay and tax calculation, pure and unit tested
├── supabase/migrations/ SQL schema, seed data and RLS policies
├── docs/                Spec, award table, PAYG formula notes
└── scripts/             Build helpers (Vercel)
```

Key design decisions:

- **Pure engine**: `calcShift`, `withholdCents`, `computePeriod` and `report` have no UI or I/O dependencies and are shared by the web app and API.
- **Money in integer cents** with half-up rounding. No floating point for tax.
- **Tax law is data, not code**: PAYG coefficients live in database tables with `effective_from`, selected by the **payment date** of the period.
- **RLS always on**: the API forwards the user's JWT to Supabase so row-level policies always apply.
- **Rate snapshot**: a saved shift keeps the rate it was saved with, so changing a rate never rewrites history.
- **Data integrity in the database**: non-overlapping pay periods, non-overlapping shifts, and a single tax-free-threshold claim are enforced by constraints and RPC functions.

## Getting Started

### Prerequisites

- Node.js **22** or later
- npm
- A [Supabase](https://supabase.com/) project

### Installation

```bash
git clone https://github.com/mhuy07092004/My-Pay.git
cd My-Pay
npm ci
```

### Configure

Copy the example files and fill in your Supabase values:

```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

Then apply the SQL files in `supabase/migrations` to your Supabase project in order (`0001` to `0006`).

### Run

```bash
npm run dev
```

| Service | URL |
|---|---|
| Web | http://localhost:5173 |
| API | http://localhost:3001 |

Vite proxies `/api` to the API.

### Local mock data

`npm run dev` uses Supabase and the API. To work on the UI without either:

```bash
npm run dev:mock -w frontend
```

Sign in as `demo@mypay.test` / `demopass`, or create an account. Accounts and pay data stay in this browser's `localStorage`. `npm run dev:live -w frontend` forces the real backend.

`VITE_MOCK` is read only by the Vite dev server. `vite build`, GitHub Actions, and Vercel ignore it and always call Supabase, even if the variable is set to `on` during the build. Do not put `VITE_MOCK` in `.env.local` or on Vercel. Restart the dev server after changing it.

## Environment Variables

**`frontend/.env.local`**

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key |

`VITE_MOCK` is not a project variable. See [Local mock data](#local-mock-data).

**`backend/.env`**

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key |
| `PORT` | API port (default `3001`) |
| `CORS_ORIGIN` | Optional. Set only when the web app calls the API from a different origin |

> Never commit real secrets. Only publishable keys are used, and access control is enforced by RLS.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run API and web together (real Supabase data) |
| `npm run dev:mock -w frontend` | Web only, with local mock data |
| `npm run dev:live -w frontend` | Web only, against the real API and Supabase |
| `npm run build` | Typecheck the backend and build the frontend |
| `npm test` | Run engine and backend tests |
| `npm run lint` | Lint the frontend |
| `npm run preview` | Preview the production frontend build |

## Database

Migrations live in [`supabase/migrations`](./supabase/migrations) and must be applied in order:

| File | Purpose |
|---|---|
| `0001_schema.sql` | Core schema, RLS policies and RPCs (`create_period`, `save_day`) |
| `0002_seed_2026_27.sql` | 2026–27 PAYG coefficients and award rates |
| `0003_tax_free_threshold_any_job.sql` | Tax-free threshold on any job |
| `0004_jobs_archive_and_one_claim.sql` | Job archiving and single claim rule |
| `0005_shift_integrity.sql` | Shift overlap protection |
| `0006_public_holidays.sql` | Public holidays by state (2026–2027) |

The API uses the user's JWT, so RLS applies to every query. Pay periods and shifts are written through the `create_period` and `save_day` functions.

## API Overview

All routes are under `/api` and require a Supabase user JWT (`Authorization: Bearer <token>`), except `/api/health`.

| Method | Route | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET / PATCH | `/me` | Current user profile |
| GET / PUT | `/tax-profile` | Tax profile |
| GET | `/rules` | Tax and award rules |
| GET | `/holidays` | Public holidays |
| GET / POST | `/jobs` | List or create jobs |
| PATCH / DELETE | `/jobs/:id` | Update or delete a job |
| POST | `/jobs/:id/claim-tax-free-threshold` | Claim the tax-free threshold |
| GET | `/award-rates` | Award rate presets |
| GET / POST | `/periods` | List or create pay periods |
| GET / PATCH / DELETE | `/periods/:id` | Read, update or delete a period |
| PUT | `/periods/:id/days/:date` | Save the shifts of a day |
| GET | `/report` | Aggregated report |

## Deployment

One Vercel project serves both the web app and the API on the same domain.

1. Import the GitHub repository into Vercel. Leave the framework empty. Set the build command to `node scripts/vercel-build.mjs`.
2. Add the environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   Do not set `VITE_MOCK`. Production always uses Supabase.
3. In Supabase, go to **Authentication → URL Configuration** and set the Site URL and Redirect URL to your Vercel domain.

Do not set `CORS_ORIGIN` when the web app and API share one domain.

## Data Sources

- **PAYG withholding 2026–27** (ATO): [Schedule 1, NAT 1004](https://www.ato.gov.au/tax-rates-and-codes/payg-withholding-schedule-1-statement-of-formulas-for-calculating-amounts-to-be-withheld) and [Schedule 8, NAT 3539](https://www.ato.gov.au/tax-rates-and-codes/schedule-8-statement-of-formulas-for-calculating-study-and-training-support-loans-components). Implementation notes: [`docs/payg-withholding-2026-27.md`](./docs/payg-withholding-2026-27.md).
- **Award rates**: [Fast Food Industry Award MA000003](https://www.fairwork.gov.au/find-help-for/fast-food-restaurants-cafes/fast-food-industry) (Fair Work). Table: [`docs/fastfood_award.md`](./docs/fastfood_award.md).

Every 1 July, add a new coefficient set from the ATO and re-run the sample data tests. No formula code needs to change.

## Roadmap

- [ ] Working Holiday Maker (Schedule 15)
- [ ] Other pay cycles in the UI (quarterly, bi-monthly, daily/casual)
- [ ] Shift notes and manual public holiday marking
- [ ] Financial year tax forecast (refund or amount owing)
- [ ] CSV / PDF export
- [ ] Google sign-in and account deletion
- [ ] More awards beyond Fast Food

See [`docs/SPEC.md`](./docs/SPEC.md) for the full specification and open questions.

## Contributing

Contributions are welcome.

1. Fork the repository and create a branch: `git checkout -b feat/my-change`.
2. Make your changes and add tests where relevant.
3. Make sure everything passes:
   ```bash
   npm test && npm run lint && npm run build
   ```
4. Open a pull request describing the change.

CI runs typecheck, build, lint and tests on every push and pull request.

## Disclaimer

My Pay provides **estimates only**. It is not tax, payroll or legal advice, and results may differ from your payslip or tax return. Always confirm with your employer, the [ATO](https://www.ato.gov.au/) or a registered tax agent.

## License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for details.

## Credits

Created and maintained by **Hayden Loi**.

Built with data from the Australian Taxation Office and the Fair Work Commission / Fair Work Ombudsman.

---

<a id="tiếng-việt"></a>

# 🇻🇳 Tiếng Việt

## Mục lục

- [Giới thiệu](#giới-thiệu)
- [Tính năng](#tính-năng)
- [Ảnh minh họa](#ảnh-minh-họa)
- [Công nghệ](#công-nghệ)
- [Kiến trúc](#kiến-trúc)
- [Bắt đầu](#bắt-đầu)
- [Biến môi trường](#biến-môi-trường)
- [Lệnh thường dùng](#lệnh-thường-dùng)
- [Cơ sở dữ liệu](#cơ-sở-dữ-liệu)
- [Triển khai](#triển-khai)
- [Nguồn dữ liệu](#nguồn-dữ-liệu)
- [Lộ trình](#lộ-trình)
- [Đóng góp](#đóng-góp)
- [Tuyên bố miễn trừ](#tuyên-bố-miễn-trừ)
- [Giấy phép](#giấy-phép)
- [Tác giả](#tác-giả)

## Giới thiệu

**My Pay** giúp người đi làm part-time, casual hoặc full-time có lịch thay đổi (kể cả du học sinh) ghi lại ca làm và xem ước tính lương gross, thuế bị giữ lại và lương net cho từng kỳ lương ở Úc.

Thuế được tính theo **công thức PAYG withholding của ATO** (Schedule 1, NAT 1004, và Schedule 8 cho khoản vay học tập/đào tạo) cho năm tài chính **2026–27**. Đây là số tiền employer giữ lại trên mỗi kỳ lương, **không phải** thuế cuối năm sau khi lodge tax return.

## Tính năng

- 🕒 **Theo dõi ca làm**: check-in, check-out, break không lương, tối đa 2 ca mỗi ngày, hỗ trợ ca qua nửa đêm.
- 💼 **Nhiều job**: mỗi job có rate riêng, thuế tính riêng từng job. Chỉ một job được claim tax-free threshold.
- 🍔 **Preset theo Award**: Fast Food Industry Award (MA000003) theo status, level (1–3) và tuổi, gồm ordinary, thứ bảy, chủ nhật, ngày lễ và overtime.
- ✍️ **Rate tùy chỉnh**: tự nhập đơn giá thay vì dùng preset.
- 🎉 **Ngày lễ và overtime**: đánh dấu public holiday và số giờ overtime cho từng ca.
- 🧮 **Engine PAYG withholding**: scale 1, 2, 3, 5, 6, kỳ lương weekly, fortnightly, monthly, study/training loan, tax offset, tiền tính bằng cent và làm tròn half-up.
- 📊 **Báo cáo**: 1 tháng, 3 tháng, năm tài chính (1/7), năm dương lịch, biểu đồ Estimated vs Net.
- ✅ **So sánh thực nhận**: nhập số tiền thực nhận và so với số ước tính.
- 🔒 **Bảo mật**: Supabase Auth, Row Level Security, JWT của user trên mọi request API.
- 🌏 **Giao diện song ngữ**: tiếng Anh và tiếng Việt.
- 📱 **Responsive**: tab bar đáy trên mobile, sidebar mở rộng trên laptop.

## Ảnh minh họa

_Sắp có._ Trong lúc chờ, bạn có thể dùng thử [bản demo](https://wheresmypay.vercel.app/).

## Công nghệ

| Lớp | Công nghệ |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS 4, React Router 7, Framer Motion, i18next |
| Backend | Node.js 22, Express 5, TypeScript, Zod |
| Engine dùng chung | `@my-pay/engine`: hàm thuần TypeScript dùng cho cả frontend và backend |
| Database và auth | Supabase (Postgres, Auth, Row Level Security) |
| Kiểm thử | Vitest, Supertest |
| CI/CD | GitHub Actions, Vercel |

## Kiến trúc

Monorepo dùng npm workspaces:

```text
My Pay
├── frontend/            Ứng dụng React (Vite)
├── backend/             API Express (cũng chạy như Vercel function)
├── packages/engine/     @my-pay/engine: tính lương và thuế, hàm thuần, có unit test
├── supabase/migrations/ Schema SQL, dữ liệu seed và RLS
├── docs/                Spec, bảng award, ghi chú công thức PAYG
└── scripts/             Script build (Vercel)
```

Các quyết định chính:

- **Engine thuần**: `calcShift`, `withholdCents`, `computePeriod`, `report` không phụ thuộc UI hay I/O, dùng chung cho web và API.
- **Tiền là số nguyên cent**, làm tròn half-up, không dùng float cho thuế.
- **Luật thuế là dữ liệu, không hard-code**: hệ số PAYG nằm trong bảng DB có `effective_from`, chọn theo **ngày trả lương** của kỳ.
- **RLS luôn bật**: API chuyển JWT của user sang Supabase nên policy theo hàng luôn có hiệu lực.
- **Rate snapshot**: ca đã lưu giữ rate tại thời điểm lưu, đổi rate không làm đổi ca cũ.
- **Toàn vẹn dữ liệu ở database**: kỳ lương không chồng nhau, ca không chồng giờ, chỉ một job claim tax-free threshold, được ép bằng constraint và RPC.

## Bắt đầu

### Yêu cầu

- Node.js **22** trở lên
- npm
- Một project [Supabase](https://supabase.com/)

### Cài đặt

```bash
git clone https://github.com/mhuy07092004/My-Pay.git
cd My-Pay
npm ci
```

### Cấu hình

Sao chép file mẫu và điền thông tin Supabase:

```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

Sau đó áp các file SQL trong `supabase/migrations` lên project Supabase theo thứ tự (`0001` đến `0006`).

### Chạy

```bash
npm run dev
```

| Dịch vụ | URL |
|---|---|
| Web | http://localhost:5173 |
| API | http://localhost:3001 |

Vite chuyển `/api` sang API.

### Dữ liệu mock trên máy local

`npm run dev` dùng Supabase và API. Muốn sửa giao diện mà không cần cả hai:

```bash
npm run dev:mock -w frontend
```

Đăng nhập `demo@mypay.test` / `demopass`, hoặc tạo tài khoản mới. Tài khoản và dữ liệu lương chỉ nằm trong `localStorage` của trình duyệt này. `npm run dev:live -w frontend` buộc dùng backend thật.

`VITE_MOCK` chỉ có tác dụng với Vite dev server. `vite build`, GitHub Actions và Vercel bỏ qua biến này và luôn gọi Supabase, kể cả khi build có `VITE_MOCK=on`. Không ghi `VITE_MOCK` vào `.env.local` hay project Vercel. Đổi biến thì phải khởi động lại dev server.

## Biến môi trường

**`frontend/.env.local`**

| Biến | Mô tả |
|---|---|
| `VITE_SUPABASE_URL` | URL project Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable (anon) key của Supabase |

`VITE_MOCK` không phải biến của project. Xem [Dữ liệu mock trên máy local](#dữ-liệu-mock-trên-máy-local).

**`backend/.env`**

| Biến | Mô tả |
|---|---|
| `SUPABASE_URL` | URL project Supabase |
| `SUPABASE_PUBLISHABLE_KEY` | Publishable (anon) key của Supabase |
| `PORT` | Cổng API (mặc định `3001`) |
| `CORS_ORIGIN` | Tùy chọn. Chỉ đặt khi web gọi API khác origin |

> Không commit secret thật. App chỉ dùng publishable key, quyền truy cập do RLS kiểm soát.

## Lệnh thường dùng

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Chạy API và web cùng lúc (dữ liệu Supabase thật) |
| `npm run dev:mock -w frontend` | Chỉ web, dùng dữ liệu mock trên máy |
| `npm run dev:live -w frontend` | Chỉ web, gọi API và Supabase thật |
| `npm run build` | Typecheck backend và build frontend |
| `npm test` | Chạy test của engine và backend |
| `npm run lint` | Lint frontend |
| `npm run preview` | Xem thử bản build frontend |

## Cơ sở dữ liệu

Migration nằm ở [`supabase/migrations`](./supabase/migrations), áp theo thứ tự `0001` đến `0006` lên project Supabase. API dùng JWT của user nên RLS luôn có hiệu lực. Ghi kỳ và ghi ca đi qua hàm `create_period` và `save_day`.

## Triển khai

Một project Vercel phục vụ cả web và API trên cùng domain.

1. Import repo GitHub vào Vercel. Framework để trống. Build command là `node scripts/vercel-build.mjs`.
2. Thêm biến môi trường:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   Không đặt `VITE_MOCK`. Bản production luôn dùng Supabase.
3. Trong Supabase, mục **Authentication → URL Configuration**, đặt Site URL và Redirect URL là domain Vercel.

Không đặt `CORS_ORIGIN` khi web và API cùng một domain.

## Nguồn dữ liệu

- **PAYG withholding 2026–27** (ATO): [Schedule 1, NAT 1004](https://www.ato.gov.au/tax-rates-and-codes/payg-withholding-schedule-1-statement-of-formulas-for-calculating-amounts-to-be-withheld) và [Schedule 8, NAT 3539](https://www.ato.gov.au/tax-rates-and-codes/schedule-8-statement-of-formulas-for-calculating-study-and-training-support-loans-components). Bản rút gọn: [`docs/payg-withholding-2026-27.md`](./docs/payg-withholding-2026-27.md).
- **Award**: [Fast Food Industry Award MA000003](https://www.fairwork.gov.au/find-help-for/fast-food-restaurants-cafes/fast-food-industry) (Fair Work). Bảng số: [`docs/fastfood_award.md`](./docs/fastfood_award.md).

Mỗi 1/7, thêm một bộ hệ số mới từ ATO và chạy lại test sample data. Không cần sửa code công thức.

## Lộ trình

- [ ] Working Holiday Maker (Schedule 15)
- [ ] Thêm chu kỳ lương trên UI (quarterly, bi-monthly, daily/casual)
- [ ] Ghi chú ca và đánh dấu ngày lễ thủ công
- [ ] Dự báo thuế năm tài chính (hoàn thuế hoặc nợ thuế)
- [ ] Xuất CSV / PDF
- [ ] Đăng nhập Google và xóa tài khoản
- [ ] Thêm award ngoài Fast Food

Xem [`docs/SPEC.md`](./docs/SPEC.md) để biết spec đầy đủ và các câu hỏi còn mở.

## Đóng góp

Rất hoan nghênh đóng góp.

1. Fork repo và tạo nhánh: `git checkout -b feat/my-change`.
2. Thay đổi code và thêm test nếu cần.
3. Đảm bảo mọi thứ đều qua:
   ```bash
   npm test && npm run lint && npm run build
   ```
4. Mở pull request mô tả thay đổi.

CI chạy typecheck, build, lint và test trên mọi push và pull request.

## Tuyên bố miễn trừ

My Pay chỉ cung cấp **số ước tính**. Đây không phải tư vấn thuế, payroll hay pháp lý, kết quả có thể khác payslip hoặc tax return của bạn. Hãy xác nhận với employer, [ATO](https://www.ato.gov.au/) hoặc tax agent có đăng ký.

## Giấy phép

Phát hành theo **MIT License**. Xem [`LICENSE`](./LICENSE).

## Tác giả

Được tạo và duy trì bởi **Hayden Loi**.

Dữ liệu từ Australian Taxation Office và Fair Work Commission / Fair Work Ombudsman.

<div align="center">

---

</div>
