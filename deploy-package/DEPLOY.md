# ERO — cPanel deployment guide (ero.nokkoo.in)

This package is **pre-built** for PHP 8.3. You do **not** need Composer, Node, or
SSH on the server. You only need **File Manager** (or FTP) and **phpMyAdmin**.

Target layout on the server:

```
/home/uddjzwrz/ero-app/              <- the Laravel application (ABOVE the web root)
/home/uddjzwrz/ero.nokkoo.in/        <- the document root (public web files)
```

Keeping the app above the web root means your source code, `.env` and database
credentials are never directly reachable from the internet.

---

## What's in this package

| Folder | Goes to |
|---|---|
| `ero-app/`  | `/home/uddjzwrz/ero-app/` |
| `docroot/`  | **contents** go into `/home/uddjzwrz/ero.nokkoo.in/` |

---

## Step 1 — Confirm PHP 8.3

cPanel → **Select PHP Version** (or MultiPHP Manager) → set `ero.nokkoo.in` to
**PHP 8.3**. Ensure these extensions are enabled (usually on by default):
`pdo_mysql, mbstring, openssl, tokenizer, xml, ctype, json, bcmath, curl, fileinfo`.

## Step 2 — Create / confirm the database

cPanel → **MySQL Databases**:
- Database: `uddjzwrz_ero` (already created ✓)
- User: `uddjzwrz_ero` (already created ✓) — ensure it is **added to the database
  with ALL PRIVILEGES**.

## Step 3 — Upload the files

Using **File Manager**:

1. Upload the `ero-app` folder to `/home/uddjzwrz/` so you have
   `/home/uddjzwrz/ero-app/`. (Zip it locally, upload the zip, Extract.)
2. Upload the **contents** of `docroot/` into `/home/uddjzwrz/ero.nokkoo.in/`.
   - Make sure the hidden `.htaccess` file is included (File Manager →
     Settings → **Show Hidden Files**).
   - If an old `index.html`/`index.php` already exists in the doc root, replace it.

> If you place `ero-app` somewhere other than `/home/uddjzwrz/ero-app`, open
> `ero.nokkoo.in/index.php` and edit the single `$APP_BASE` line to match.

## Step 4 — Set the database password in `.env`

Edit `/home/uddjzwrz/ero-app/.env` (File Manager → right-click → Edit):

```
DB_PASSWORD="your-real-mysql-password-here"
```

Replace the `CHANGE_ME_SET_REAL_PASSWORD` placeholder with the real password.
`APP_KEY` is already set for you — leave it as is.

## Step 5 — Fix storage permissions

In File Manager, set these folders to **0755** (and writable by the web user):

```
/home/uddjzwrz/ero-app/storage
/home/uddjzwrz/ero-app/storage/framework/cache
/home/uddjzwrz/ero-app/storage/framework/sessions
/home/uddjzwrz/ero-app/storage/framework/views
/home/uddjzwrz/ero-app/bootstrap/cache
```

(Right-click → Change Permissions → tick through sub-directories if offered.)

## Step 6 — Run migrations (no SSH needed)

This package includes a **one-time, secret-protected** migration route.

1. Edit `/home/uddjzwrz/ero-app/.env` and set a secret, for example:
   ```
   DEPLOY_MIGRATE_KEY=a4377bb09683a0f10b54103fdd47bf3d822322d8edc6e1f9
   ```
   (Use your own random value — this one is just an example.)
2. Visit this URL in your browser (creates all tables **and** seeds the USMLE
   280-question mock, FMGE programme and demo accounts):
   ```
   https://ero.nokkoo.in/api/deploy/migrate?key=a4377bb09683a0f10b54103fdd47bf3d822322d8edc6e1f9&seed=1
   ```
   You should see migration output ending in “DONE”.

## Step 7 — Lock it down (important)

1. Edit `.env` again and blank the key: `DEPLOY_MIGRATE_KEY=`
2. Open `/home/uddjzwrz/ero-app/routes/api.php`, delete the block marked
   **“TEMPORARY one-time deploy helper”**, and save.
3. Clear cached config by visiting (optional) or re-upload; simplest is to delete
   `/home/uddjzwrz/ero-app/bootstrap/cache/config.php` if it exists.

## Step 8 — Test

- Visit **https://ero.nokkoo.in** → the ERO sign-in screen should load.
- Sign in with a demo account (password `password`):
  - `student@ero.test`, `admin@ero.test`, `super@ero.test`
- Open **USMLE → Full Mock → Start** and run a block.

## Step 9 — Security follow-ups

- **Change the demo passwords** or delete the demo users once you've verified.
- **Rotate your MySQL password** (it was shared in chat) via cPanel → MySQL
  Databases → Change Password, then update `.env`.
- Confirm `APP_DEBUG=false` (it is, in the shipped `.env`).

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| 500 error, blank page | Check `/home/uddjzwrz/ero-app/storage/logs/laravel.log`. Usually permissions (Step 5) or a wrong `DB_PASSWORD`. |
| “Frontend build not found” | The `docroot/` contents (incl. `app.html`, `assets/`) weren't uploaded to the web root. |
| CSS/JS 404 | The `assets/` folder is missing from the web root, or `.htaccess` wasn't uploaded. |
| “could not find driver” | Enable `pdo_mysql` in Select PHP Version. |
| API returns the HTML page | `.htaccess` missing — Apache isn't routing through `index.php`. |
| Login works but data is empty | Migrations/seed (Step 6) didn't run — re-run the migrate URL with `&seed=1`. |

## Updating later

When you have new code: rebuild the frontend (`npm run build`) and backend vendor
locally, then re-upload the changed files. The `app/`, `routes/`, `resources/` and
`docroot/assets/` folders are what change most often.
