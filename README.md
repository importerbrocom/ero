# ERO — Medical Learning Without Borders

A medical examination preparation platform supporting multiple global programmes
(FMGE, USMLE, and additional configurable programmes). This repository contains a
**Laravel REST API backend** and a **React + TypeScript + Vite web frontend**,
built around a reusable, server-authoritative examination engine.

> **Status — Phase 1 + exam engine delivered.** This is a working, tested
> foundation: authentication, the data model, the full examination engine
> (randomisation, timers, scheduling, grading), the core student web app and the
> ERO design system. Admin dashboard, analytics dashboards, question import UI
> and the React Native mobile app are scoped as the next phases (see
> [Roadmap](#roadmap)).

---

## Design audit

The UI was built from the supplied ERO screenshots. Components identified and the
page-to-screenshot mapping:

| Screenshot | Page built | Key elements reproduced |
|---|---|---|
| ERO splash / logo | `EroLogo`, `Login` | Graduation-cap wordmark, tagline, dark globe hero |
| Choose Your Exam | `ChooseExam` | Exam cards with flags, question counts, locked/unlocked badges, search, activation-code redemption |
| FMGE Home dashboard | `Dashboard` | Welcome hero + progress, quick-action tiles, progress ring, programme cards, streak strip |
| Programme detail | `ProgrammeDetail` | Programme hero, exam list, subject grid |
| Active exam question | `ExamRunner` (BlockInterface) | Timer header, progress bar, subject tag, A–D options, Previous/Next, flag, question palette |
| Question review | `AttemptResults` | Accuracy ring, correct/incorrect KPIs, subject-wise bar chart |
| Desktop sidebar composite | `AppShell` | Left sidebar (desktop) + bottom tab bar (mobile) |

**Design system** (`src/index.css` + `src/components/ui`): dark navy base, electric
blue primary with blue→purple gradient heroes, green/red/amber semantics, rounded
cards, pill tabs, KPI chips, progress rings, skeletons and empty states.

The ERO logo is a **replaceable placeholder** — set `VITE_ERO_LOGO_URL` or drop an
asset in `frontend/public` and point `EroLogo` at it when the official logo arrives.

---

## Architecture

```
backend/    Laravel 13 REST API (/api/v1), Sanctum auth, SQLite (dev) / MySQL (prod)
frontend/   React 19 + TypeScript + Vite + Tailwind v4 + React Router + Zustand + Recharts
```

### Key architectural decisions

1. **Data-driven exam configuration.** Durations, block counts, question counts,
   release schedules and retry/visibility rules live in the database
   (`exams` table + `exam_programmes.config`). Nothing about exam structure is
   hard-coded into controllers or React components, so new programmes and rule
   changes are configuration, not code.
2. **One reusable `ExamEngine`.** The same engine serves USMLE, FMGE and future
   programmes. See [Examination engine](#examination-engine-the-correctness-critical-core).
3. **Server is the source of truth.** All randomisation, timers, release
   scheduling and grading happen server-side. The client renders state; it cannot
   grant extra time, read a locked block, or infer the answer key.
4. **Answer key never leaves the server during a mock.** `ExamQuestionResource`
   omits `is_correct`/explanations unless the exam's result-visibility policy
   permits it. Correctness is always derived from the canonical
   `question_options.is_correct`, never from a displayed option letter.
5. **Centralised auth & errors.** A single Axios client (bearer token, uniform
   error shape) on the frontend; a single JSON exception renderer on the backend.
6. **Role authorisation is enforced server-side** via the `role` middleware and
   `programme_access` checks — hiding a button is never the gate.

---

## Examination engine (the correctness-critical core)

`backend/app/Services/ExamEngine.php` implements the USMLE requirements (and the
reusable rules for all programmes):

- **§5.1 structure** — e.g. USMLE full mock = **14 blocks × 20 questions = 280**,
  validated when an attempt is built.
- **§5.2 randomised block order** — a cryptographically-secure shuffle of logical
  block ids is generated per attempt and **stored** (`exam_attempts.block_sequence`).
  Logical identity is preserved; display order varies per student; it is **stable
  across refresh/resume** and only regenerated for a new permitted attempt.
- **§5.3 question shuffle within a block** — stored per attempt, no duplicates.
- **§5.4 option shuffle** — stored per question; grading reads canonical
  `is_correct`, so a correct answer shown as “A” is still graded correctly.
- **§5.5 30-minute block timer** — server-authoritative deadline persisted on
  block start; survives refresh/reconnect; auto-submits on expiry; device-clock
  changes have no effect.
- **§5.6 55-minute release schedule** — `from_start` (default) or `from_completion`
  modes, enforced on the backend with configurable interval.
- **§5.7 navigation & locking** — locked future blocks cannot be read via API;
  submitted/expired blocks are locked.
- **§5.8 grading & analytics** — per-attempt totals, accuracy, subject/topic
  breakdowns computed in a transaction; idempotent submission.

All of the above are covered by automated tests (`backend/tests/Feature`).

---

## Running locally

### Backend

```bash
cd backend
composer install
cp .env.example .env            # already present; uses SQLite by default
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve               # http://127.0.0.1:8000
```

Seeded demo accounts (password: `password`):

| Role | Email |
|---|---|
| Student | `student@ero.test` |
| Admin | `admin@ero.test` |
| Super admin | `super@ero.test` |

The seeder also creates the full **USMLE 14×20=280 mock** and the FMGE programme,
and grants the demo student access to both.

### Frontend

```bash
cd frontend
npm install
npm run dev                     # http://127.0.0.1:5173 (proxies /api -> :8000)
```

Open http://127.0.0.1:5173, sign in as `student@ero.test`, open **USMLE → Full
Mock → Start**, and run a block.

### Tests

```bash
cd backend && php artisan test  # 14 passing feature/unit tests
cd frontend && npm run build    # type-check + production build
```

---

## Production notes

- **Database:** switch `DB_CONNECTION=mysql` and configure credentials. All
  migrations are MySQL-compatible.
- **Cache / queue / rate-limit:** set `CACHE_STORE=redis`, `QUEUE_CONNECTION=redis`
  and run `php artisan queue:work` for background jobs (imports, reports,
  notifications). Redis is the intended production driver.
- **API:** versioned under `/api/v1`; add `/api/v2` beside it without breaking
  clients.

---

## Admin console (Phase 2 — delivered)

A full admin area at `/admin` (role-gated, server-enforced via `role:admin`):

- **Overview** — students (total/active/new), attempts (completed/in-progress/avg
  accuracy), content counts, per-programme performance, recent audit activity.
- **Students** — search/filter, suspend/reactivate, grant/revoke programme access.
- **Question Bank** — list/search/filter by status, create/edit (with canonical
  correct-option mapping) and archive questions; every change is versioned + audited.
- **Import Questions** — upload CSV/XLSX, **two-phase**: a validated preview with
  row-level errors first, then commit (only valid rows persist, in a transaction).
  A downloadable CSV template documents the exact column format.
- **Programmes** — view programmes and configure exams (block counts, durations,
  55-min schedule, retry & result-visibility rules) via the API — all data-driven.
- **Activation Codes** — generate batches, set redemption limits/expiry, revoke.
- **Audit Logs** — significant admin/system events with actor, subject and time.

Covered by `backend/tests/Feature/AdminApiTest.php` (role enforcement, question
creation mapping, code batches, and the CSV import validate→commit cycle).

Sign in as `admin@ero.test` / `super@ero.test` (password `password`) and the
"Admin Console" link appears in the sidebar.

## Student analytics & daily practice (Phase 3 — delivered)

- **Analytics API** (`/api/v1/analytics/overview`, `/analytics/attempts`) — derives
  overall accuracy, questions attempted/correct/incorrect, accuracy trend,
  subject & topic breakdowns, mock-test scores and streaks **from the student's
  own completed attempts and practice days** (never fabricated; honest empty
  state for new students).
- **Progress dashboard** (screenshot 12) — accuracy ring, KPI chips, accuracy
  trend area chart, subject-wise accuracy bars, mock-test performance bars.
- **My Tests** — real attempt history with scores and resume/review links.
- **Daily-practice runtime** (`PracticeEngine` + `/api/v1/practice/*`) — enroll in
  a plan (e.g. FMGE 14×10), per-day quizzes with server-stored shuffled questions
  & options, day-locking/unlocking, streak tracking, and immediate feedback
  (correct/incorrect + explanation + key points + high-yield fact, screenshot 6).
  Kept separate from mock history (§5.9) so neither overwrites the other.

Covered by `backend/tests/Feature/PracticeAndAnalyticsTest.php` (day building,
answer-key hiding, day locking, grading+streak+unlock, no in-plan repeats,
analytics aggregation + empty state). **26 passing tests total.**

## Roadmap

Delivered: auth, data model, exam engine, student web app, design system, cPanel
deployment, admin console + question import, and **student analytics + daily
practice** (Phase 3). 26 passing tests.

Next phases (scoped, not yet built):
1. FMGE level-mock (Day-31 300-question) runtime UI on top of the exam engine.
2. React Native (Expo) mobile app sharing the API contract in `frontend/src/types.ts`.
3. Email verification + password reset flows, notifications.
4. CI, deployment config, app-store readiness.
```
