---
inclusion: manual
---

# ERO — Deployment Runbook (cPanel / LiteSpeed)

Copy-paste commands for deploying `importerbrocom/ero` to **https://ero.nokkoo.in**.
Server: cPanel account `uddjzwrz`, LiteSpeed, PHP 8.3, no root. Pull this file in
when doing a deploy. For *why* behind these steps, see `ero-project.md`.

Paths:
- App (above web root): `~/ero-app`  → absolute `/home/uddjzwrz/ero-app`
- Document root (web): `~/ero.nokkoo.in`
- Working clone: `~/ero-src`

---

## A. Deploy an update (the normal flow)

```bash
# 1. Pull latest source
cd ~/ero-src && git pull origin main

# 2. Sync app code into the live app dir
cp -a ~/ero-src/backend/. ~/ero-app/

# 3. Install prod dependencies + apply DB + storage
cd ~/ero-app
composer install --no-dev --optimize-autoloader --no-interaction
php artisan migrate --force
php artisan storage:link        # harmless if already linked

# 4. Publish the built SPA + Laravel public assets into the docroot
cp -a ~/ero-app/public/. ~/ero.nokkoo.in/

# 5. *** CRITICAL *** rewrite the custom front controller
#    (step 4 overwrote index.php with Laravel's default, which points nowhere)
cat > ~/ero.nokkoo.in/index.php <<'PHP'
<?php
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
define('LARAVEL_START', microtime(true));
$APP_BASE = '/home/uddjzwrz/ero-app';
if (file_exists($m = $APP_BASE.'/storage/framework/maintenance.php')) { require $m; }
require $APP_BASE.'/vendor/autoload.php';
$app = require_once $APP_BASE.'/bootstrap/app.php';
$app->usePublicPath(__DIR__);
$app->handleRequest(Request::capture());
PHP

# 6. Re-cache config + routes
cd ~/ero-app
php artisan config:cache && php artisan route:cache

# 7. Verify (always test the REAL https URL, not 127.0.0.1 host-header)
curl -sk https://ero.nokkoo.in/api/v1/health; echo
curl -sk -o /dev/null -w "root: %{http_code}\n" https://ero.nokkoo.in/
```

Expect: `{"status":"ok",...}` and `root: 200`.

> The `.htaccess` in the docroot must route non-file requests to `index.php`
> (`DirectoryIndex index.php` + rewrite with `-f`/`-d` passthrough). Only re-add
> it if a `cp` clobbers it or deep links start 404ing.

---

## B. Frontend-only change (fastest)

If only `frontend/` changed, you can skip composer/migrate:

```bash
cd ~/ero-src && git pull origin main
cp -a ~/ero-src/backend/public/assets/. ~/ero.nokkoo.in/assets/
cp ~/ero-src/backend/public/app.html ~/ero.nokkoo.in/app.html
```
(The build output is committed under `backend/public/` by the agent after each
`npm run build` + sync.)

---

## C. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `root: 200` but `/api/...` 404 (cPanel page) | `.htaccess` not routing → re-add the rewrite block; LiteSpeed may cache `.htaccess`. |
| `Undefined array key "HOME"` / `/ero-app/vendor` not found | `index.php` used `$_SERVER['HOME']`; rewrite it with the absolute `$APP_BASE`. |
| "CSRF token mismatch" on login | `statefulApi()` got re-enabled in `bootstrap/app.php` — remove it. |
| 500 / blank | `tail -n 30 ~/ero-app/storage/logs/laravel.log`; usually a wrong `DB_PASSWORD` or stale `config:cache`. Run `php artisan config:clear` then re-cache. |
| Identifier too long on migrate | MySQL 64-char index limit — give the composite index an explicit short name. |
| Uploaded images 404 | `php artisan storage:link` not run, or docroot missing the `storage` symlink target. |

---

## D. First-time / fresh deploy (if ~/ero-app doesn't exist)

```bash
cd ~
rm -rf ~/ero-src && git clone https://github.com/importerbrocom/ero.git ero-src
cp -a ~/ero-src/backend ~/ero-app
cd ~/ero-app
composer install --no-dev --optimize-autoloader --no-interaction
cp .env.cpanel .env            # then: nano .env  → set real DB_PASSWORD
php artisan key:generate --force
php artisan migrate --force --seed
php artisan storage:link
chmod -R 775 storage bootstrap/cache
```
Then do steps A.4–A.7 to publish into the docroot.

---

## E. Post-deploy security checklist (do once)

- [ ] `APP_DEBUG=false` in `~/ero-app/.env` → `php artisan config:cache`
- [ ] Remove diagnostic probes: `rm -f ~/ero.nokkoo.in/_eroprobe.php ~/ero.nokkoo.in/probe.php`
- [ ] Create a real super_admin; delete/re-password demo accounts
      (`student@/admin@/super@ero.test`)
- [ ] Rotate MySQL password (was exposed in chat); update `.env` + `config:cache`
- [ ] cPanel → Domains → **Force HTTPS Redirect = On** for ero.nokkoo.in
- [ ] (optional) Configure `MAIL_*` for real reset/verification emails
