# BEAN.der / Roast & Bean — React Web

TypeScript + React + Tailwind CSS + Supabase. Mirrors the Flutter app in `../lib/`.

## Setup

From repo root:

```bash
npm start
```

Or from this folder:

```bash
cd react-web
npm install
npm start
```

(`npm start` and `npm run dev` both run Vite on port **5173**.)

Env is committed in `react-web/.env` and `../assets/env/app.env`.

**Supabase project:** CoffeeShopOrderingSystem (`zbavgkhbdfcfhxtlxabp`) — Mumbai (`ap-south-1`)

Open http://localhost:5173

## Folder map (Flutter → Web)

| Flutter (`lib/`) | Web (`react-web/src/`) |
|------------------|------------------|
| `main.dart` | `main.tsx`, `App.tsx` |
| `core/` | `core/` (env, formatters, assets) |
| `models/` | `types/index.ts` |
| `services/supabase/sb_maps.dart` | `lib/supabase/maps.ts` |
| `services/auth_service.dart` | `services/authService.ts` |
| `services/*_service.dart` | `services/supabaseService.ts` |
| `customer/customer_shell_screen.dart` | `customer/CustomerShell.tsx` |
| `customer/customer_*_tab.dart` | `customer/tabs/*Tab.tsx` |
| `admin/admin_shell_screen.dart` | `admin/AdminShell.tsx` |
| `admin/admin_*_tab.dart` | `admin/AdminShell.tsx` (panels) |
| `screens/sign_in_screen.dart` | `screens/AuthPages.tsx` |
| `screens/forgot_account_screen.dart` | `screens/RecoveryPages.tsx` |
| `screens/guest_home_screen.dart` | `screens/GuestHomePage.tsx` |
| `widgets/customer_pill_nav_bar.dart` | `components/CustomerPillNav.tsx` |

## SQL

Run Supabase migrations under `../supabase/sql/`. See `19_web_react_stack.sql` for web table index.

## Static assets

`npm run sync-assets` (runs automatically before `build`) copies from the Flutter repo into `public/`:

- `logo123.jpeg` ← `../image/logo123.jpeg`
- `images1/1.jpeg`, `images1/2.jpeg` ← promo carousel
- `images/4.webp` ← sign-in hero

Commit the copied files under `react-web/public/` so Vercel deploys them (symlinks to parent folders do not work on Vercel).

## Build & test

```bash
npm run build
npm run preview
npm run test:supabase   # verifies all 8 tables + recovery RPC
```

All customer/admin data (catalog, orders, preferences, favorites, recovery, GCash) is stored in Supabase — same schema as Flutter `lib/services/`.

## Deploy on Vercel

1. Import the repo in [Vercel](https://vercel.com/new).
2. Set **Root Directory** to `react-web`.
3. Framework preset: **Vite** (or leave auto-detect; `vercel.json` is included).
4. Add **Environment Variables** (Production + Preview) — copy from `react-web/.env`:
   - `VITE_SUPABASE_URL` = `https://zbavgkhbdfcfhxtlxabp.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `sb_publishable_V9KibPpia2nVxXet5yDShA_TTOQGFb0`
5. Deploy.

`vercel.json` configures SPA routing (`/app`, `/admin`, `/sign-in`, etc.) and cache headers for hashed assets.

**Monorepo tip:** If Root Directory is the repo root instead of `react-web`, set Build Command to `cd react-web && npm install && npm run build` and Output Directory to `react-web/dist`.
