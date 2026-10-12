# ERO — Project Steering

Context and conventions for the ERO ("Medical Learning Without Borders") medical
exam-prep platform. Apply these across all work in this repo.

## Architecture

Monorepo with three apps:

- `backend/` — Laravel 13, PHP 8.3, Sanctum (bearer-token API), MySQL (prod) /
  SQLite (local + CI). All endpoints are versioned under `/api/v1`
  (`routes/api.php` → `routes/api_v1.php`; admin routes under
  `App\Http\Controllers\Api\V1\Admin\...`).
- `frontend/` — React 19 + TypeScript + Vite + Tailwind v4, React Router,
  Zustand auth store, Recharts. Built SPA is served by Laravel.
- `mobile/` — React Native + Expo SDK 57 + Expo Router, shares the same REST
  API contract (types mirrored in `mobile/src/types.ts`).
- `deploy-package/` — regeneratable cPanel bundle (not the source of truth).

## Core engineering rules

- **Token auth, not cookies.** The web SPA and mobile app authenticate with
  Sanctum personal access tokens (`Authorization: Bearer`). Do **NOT** enable
  `statefulApi()` / CSRF in `bootstrap/app.php` — it breaks login with "CSRF
  token mismatch". The `auth:sanctum` guard protects authenticated routes.
- **Server is the source of truth** for the exam engine: block/question/option
  randomisation (secure `random_int` Fisher–Yates, stored per attempt), timers,
  release schedules, grading. Never trust the client. The answer key
  (`is_correct`, explanations) is never sent to the student API during an active
  mock — only when `result_visibility` permits.
- **Exam structure is data-driven** (DB config + `ProgrammeConfig`), never
  hard-coded in controllers or React components.
- **Authorisation is server-side.** Admin routes use the `role:admin`
  middleware (`EnsureUserHasRole`); super_admin satisfies admin checks. Hiding a
  button in the UI is not a gate.
- **MySQL index names must be ≤ 64 chars.** SQLite (dev/CI) has no such limit,
  so give composite indexes explicit short names in migrations (this bit us on
  `exam_attempt_questions`). Verify new migrations against this before shipping.

## Design system

- Dark-cinematic medical palette defined in `frontend/src/index.css` `@theme`:
  deep navy backgrounds (`#031226`→`#0B2341`), electric blue primary
  (`#086BFF`/`#1678FF`), success `#12E6A5`, cyan/purple/pink/amber/orange
  accents. Brand gradient utilities: `.ero-grad-primary/success/purple/pink/
  amber`, `.ero-grad-hero/mock`, `.ero-glow-primary`.
- Reuse the shared primitives in `frontend/src/components/ui/index.tsx`
  (`Button, Card, Input, Tabs, Badge, StatCard, HeroBanner, ExamCard,
  SubjectTile, ProgressRing, EmptyState, Skeleton`). Don't re-roll one-off
  styles when a primitive exists.
- The ERO logo is the blue graduation-cap + gradient "ERO" wordmark
  (`components/EroLogo.tsx`). Do NOT substitute the metallic "Elior Research
  Orbit" image — keep the two brand treatments distinct.
- Image slots (`HeroBanner`, `ExamCard`) are swappable: real landmark/medical
  photos are uploaded by admins (see below) and fall back to themed gradients.
  Never fabricate/scrape copyrighted photos into the repo.

## Admin-managed media

- Programme **cover images** and the student **welcome-banner** are uploaded via
  `POST /api/v1/admin/uploads` (public disk, image mimes ≤5 MB) and stored as
  URLs (`exam_programmes.cover_image_url`, `settings.welcome_banner_url`).
  Requires `php artisan storage:link` on deploy.
- Public read: `GET /api/v1/settings` exposes `welcome_banner_url` to the SPA.

## Testing & CI

- Backend: `php artisan test` (SQLite in-memory). Keep it green — currently 42
  feature/unit tests covering the exam engine, admin, practice/analytics, auth
  hardening, level mocks, and media. Add tests for new backend behaviour.
- Frontend/mobile: `npm run build` / `tsc --noEmit` must pass clean.
- `.github/workflows/ci.yml` runs all three on push/PR to `main`.
- After frontend changes, rebuild and sync the SPA into `backend/public/` (and
  `deploy-package/docroot/`) before committing.

## Git / workflow

- Push to `main` on `importerbrocom/ero`.
- Never commit secrets. `.env` is gitignored; `backend/.env.cpanel` is a
  committed production template with a `PUT_YOUR_DB_PASSWORD_HERE` placeholder.
  `vendor/`, `node_modules/`, build zips are gitignored.

## Production deployment (cPanel, account uddjzwrz, LiteSpeed)

Live at **https://ero.nokkoo.in**. Key facts (these caused long debugging — keep
them in mind):

- Server: shared cPanel on **LiteSpeed**, PHP 8.3, no root (`/scripts/*` not
  available). Domain is on **Cloudflare**; server IP `190.92.174.35`.
- Layout: Laravel app at `~/ero-app` (above web root); document root is
  `~/ero.nokkoo.in` (confirmed in `/var/cpanel/userdata/uddjzwrz/`).
- **Deploy = Laravel `public/` contents copied into the docroot**, with a custom
  `~/ero.nokkoo.in/index.php` whose `$APP_BASE = '/home/uddjzwrz/ero-app'`
  (absolute — do NOT use `$_SERVER['HOME']`, it's unset under LiteSpeed PHP).
- **Order trap:** `cp -a ~/ero-app/public/. ~/ero.nokkoo.in/` overwrites
  `index.php` with Laravel's default. ALWAYS rewrite the custom `index.php`
  immediately after, then `php artisan config:cache && route:cache`.
- The docroot `.htaccess` must route all non-file requests to `index.php`
  (`DirectoryIndex index.php`, rewrite with `-f`/`-d` passthrough).
- `curl -H "Host: ..." http://127.0.0.1/` gives misleading results on this
  LiteSpeed box — verify against the real `https://ero.nokkoo.in/...` URL.
- Deploy update sequence: `git pull` in `~/ero-src` → copy `backend/` to
  `~/ero-app` → `composer install --no-dev -o` → `migrate --force` →
  `storage:link` → copy `public/` to docroot → rewrite `index.php` →
  `config:cache` + `route:cache`.

## Security follow-ups (outstanding until done)

- Demo accounts (`student@/admin@/super@ero.test`, password `password`) are
  public — replace with a real admin and remove/re-password the demos.
- Rotate the MySQL password (it was exposed in chat) and update `.env`.
- Keep `APP_DEBUG=false` in production.
- Configure a real mailer (`MAIL_*`) so password-reset/verification emails send
  (defaults to the `log` driver).
