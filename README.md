# My Pay

Ước tính lương và thuế PAYG cho ca làm ở Úc.

## Chạy local

```bash
npm ci
```

`frontend/.env.local` và `backend/.env` (xem file `.env.example` cạnh mỗi thư mục):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

```
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
PORT=3001
```

```bash
npm run dev
```

Web ở http://localhost:5173, API ở http://localhost:3001. Vite chuyển `/api` sang API.

```bash
npm test
npm run lint
npm run build
```

## Database

Migration nằm ở `supabase/migrations`, áp theo thứ tự `0001` đến `0006` lên project Supabase. API dùng JWT của user nên RLS luôn có hiệu lực. Ghi kỳ và ghi ca đi qua hàm `create_period` và `save_day`.

## Deploy

Một project Vercel phục vụ cả web và API trên cùng domain.

1. Import repo GitHub. Framework để trống. Build command là `node scripts/vercel-build.mjs`.
2. Thêm biến môi trường:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Trong Supabase, mục Authentication → URL Configuration, đặt Site URL và Redirect URL là domain Vercel.

Không đặt `CORS_ORIGIN` khi web và API cùng một domain.
