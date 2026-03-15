# MarketSense AI Frontend

Modern AI SaaS frontend for e-commerce competitive intelligence, built with Next.js App Router, TypeScript, Tailwind CSS, ShadCN-style reusable UI components, Recharts, and React Context authentication.

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Recharts
- React Context API
- `localStorage` mock authentication
- `next-themes` dark mode

## App Flow

Landing Page → Signup/Login → Dashboard → Feature Pages

Protected routes:

- `/dashboard`
- `/products`
- `/reviews`
- `/alerts`
- `/strategy`
- `/reports`
- `/admin`

If a user is not authenticated, protected pages redirect to `/login`.

## Authentication (Mock)

- Signup stores user data in `localStorage` and logs user in.
- Login validates credentials from `localStorage`.
- Logout clears active session and redirects to landing page.

Storage keys used:

- `marketsense_user`
- `marketsense_session`

## Run Locally

```powershell
Set-Location "c:\Users\ADMIN\OneDrive\Desktop\cit"
npm install
npm run dev
```

Open: `http://localhost:3000`

## Build Check

```powershell
Set-Location "c:\Users\ADMIN\OneDrive\Desktop\cit"
npm run lint
npm run build
```

## Main Structure

- `src/app` - all pages (`/`, `/login`, `/signup`, `/dashboard`, etc.)
- `src/components` - reusable UI and feature components
- `src/context/AuthContext.tsx` - auth provider and state
- `src/lib/auth.ts` - localStorage auth helpers
- `src/lib/mock-data.ts` - mock API-style frontend data

## Database Strength (Jury)

Backend now exposes live MongoDB health and data-quality evidence:

- `GET /database/health`
- `GET /dashboard`
- `GET /sentiment?keyword=<product>`

`/database/health` includes:

- connectivity status (`ok`, `degraded`, `down`)
- response latency in milliseconds
- document volume in `pricing`
- unique keyword and job coverage
- live-signal rows vs fallback rows
- platform coverage distribution
- per-collection document counts and latest scrape timestamp

MongoDB performance indexes are automatically created at backend startup for:

- `(job_id, platform, url)` unique upsert safety
- `(keyword, scraped_at)` query speed
- `(platform, scraped_at)` query speed
- `(scraped_at)` recency reads
