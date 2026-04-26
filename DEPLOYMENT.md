## Deploy (Free) — Recommended: Vercel + Neon Postgres

This repo is set up to deploy **frontend + backend** on Vercel:
- Frontend: built from `artifacts/portfolio`
- Backend (Express): served via Vercel Serverless Function `api/[...path].ts`
- Database: **use Postgres** (Neon/Supabase) via `DATABASE_URL`

### 1) Create a free Postgres database (Neon)
1. Create a Neon project + database.
2. Copy the connection string (`postgres://...`) and keep it for Vercel env vars.

### 2) Push the schema to your DB (Drizzle)
Run this locally (PowerShell):
```powershell
$env:DATABASE_URL="postgres://USER:PASSWORD@HOST:5432/DB?sslmode=require"
pnpm.cmd -C lib/db run push
```

### 3) Push to GitHub
If you used the GitHub CLI:
```powershell
git remote -v
```

### 4) Deploy on Vercel
1. Import the GitHub repo into Vercel.
2. Set env vars (Project → Settings → Environment Variables):
   - `DATABASE_URL` = your Neon connection string
   - `ADMIN_USERNAME` = your admin username (for `/admin`)
   - `ADMIN_PASSWORD` = a strong password
3. Deploy.

### Notes / Limitations (important)
- **Uploads are not persistent on Vercel**: uploads are written to `/tmp` in serverless and can disappear after redeploy/cold start.
  - For production, use externally hosted URLs for logos/resume, or integrate object storage (S3/R2/Cloudinary).

