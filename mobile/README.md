# ERO Mobile (React Native + Expo)

The ERO cross-platform mobile app (iOS + Android), built with **Expo SDK 57**,
**Expo Router** (file-based navigation) and **TypeScript**. It shares the same
REST API contract as the web app, so business rules live on the backend and are
not duplicated here.

## What's implemented

- **Auth** — login / register with token persisted in `AsyncStorage`; an auth
  gate in `app/_layout.tsx` redirects between the `(auth)` and `(tabs)` groups.
- **Bottom tabs** (screenshots 1/2/4/13): Home · Exams · Tests · Progress · Profile.
- **Home** — welcome hero, live KPI chips (accuracy, answered, days, streak),
  unlocked programmes, pull-to-refresh.
- **Exams** — choose-exam list with flags/question counts and **activation-code
  redemption**.
- **Programme detail** — exams list + subject grid; routes mocks and daily
  practice to the right runtime.
- **Mock exam runner** (`app/attempt/[attemptId]`) — block overview with
  server-authoritative timers and release countdowns, one-question-at-a-time
  interface, answer saving, auto-submit on timeout, and a results screen.
- **Daily practice** (`app/practice/[enrollmentId]`) — plan overview with streak
  and locked/unlocked day grid, plus a day runner with **immediate feedback**
  (correct/incorrect + explanation + key points + high-yield fact).
- **Progress** — accuracy ring, KPIs and subject-wise accuracy bars from the
  analytics API.

The server remains the single source of truth: timers, randomisation, grading
and the answer key are never trusted to the client (the API hides correct
answers during an active mock, exactly as on web).

## Configuration

The API base URL is read from `app.json` → `expo.extra.apiBaseUrl`
(defaults to `https://ero.nokkoo.in/api/v1`). Change it there to point at a
different backend (e.g. a local tunnel during development).

The ERO logo is a **replaceable placeholder** (`src/components/EroLogo.tsx`),
matching the web app — swap it when the official asset is supplied.

## Running

```bash
cd mobile
npm install
npx expo start           # scan the QR with Expo Go, or press i / a for simulators
npm run typecheck        # tsc --noEmit (passes clean)
```

## Building for the stores (app-store readiness)

Uses EAS Build. Bundle identifiers are preconfigured in `app.json`
(`in.nokkoo.ero` for both platforms).

```bash
npm i -g eas-cli
eas login
eas build --platform android      # AAB for Google Play
eas build --platform ios          # IPA for the App Store (requires Apple account)
eas submit --platform android     # upload to Play Console
eas submit --platform ios         # upload to App Store Connect
```

Before submitting: add real `assets/icon.png` + splash, finalise the store
listing, and point `apiBaseUrl` at production.

## Project structure

```
app/                       Expo Router routes
  _layout.tsx              root stack + auth gate
  (auth)/                  login, register
  (tabs)/                  home, exams, tests, progress, profile
  programme/[slug].tsx     programme detail
  exam/[examId].tsx        mock instructions / practice enroll
  attempt/[attemptId].tsx  live mock runner + results
  practice/[enrollmentId]/ plan overview + day/[day] runner
src/
  lib/        api client (axios + AsyncStorage) + queries
  store/      auth context
  components/ ui primitives, EroLogo
  hooks/      useServerCountdown
  theme.ts    design tokens (mirror the web design system)
  types.ts    shared API contract types
```
