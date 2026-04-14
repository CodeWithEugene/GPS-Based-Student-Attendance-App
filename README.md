# AttendEase — JKUAT GPS-Based Student Attendance App

A mobile app that lets students sign attendance **only while physically inside the classroom** using GPS geofencing, prevents proxy sign-ins, and generates attendance reports instantly.

Built for Jomo Kenyatta University of Agriculture and Technology (JKUAT).

---

## Features

### Students
- JKUAT ID login + **real email OTP via Supabase** + optional biometric (fingerprint / Face ID)
- Dashboard showing today's classes with live session indicator
- GPS geofenced attendance with live map and distance status
- One sign-in per session (DB-enforced; proxy sign-ins blocked)
- Attendance history with percentage, risk level, filters
- Profile, FAQ, help screens

### Lecturers
- Dashboard of today's units with "Start Session" / "View Report"
- Live session setup: pick classroom GPS pin, adjust geofence radius (10–100 m), set duration
- Real-time monitor: students appear live as they sign in
- Reports: bar chart per session, present/absent donut, student risk table, per-session drill-down
- Export-ready data model

### Security / Anti-proxy
- GPS verified at sign-in (Haversine distance)
- Session must be explicitly opened by the lecturer
- `unique(session_id, student_id)` DB constraint + Supabase RLS policy rejects duplicate / out-of-class sign-ins
- Account lockout after 3 failed OTP attempts
- Biometric second factor

---

## Setup (one-time)

### 1. Create a Supabase project
1. Go to https://supabase.com → **New project** (free tier is fine).
2. In the dashboard, open **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and click **Run**. This creates tables, RLS policies, and seeds demo users + units.
3. Open **Authentication → Providers → Email** and make sure it is enabled. Under **Email auth** uncheck **"Confirm email"** (so OTPs work on first login without clicking a link).
4. Open **Authentication → URL Configuration → Redirect URLs** and add `gpsattendance://auth-callback` (matches the app `scheme` and Google OAuth callback path).
5. Open **Settings → API** — copy the **Project URL** and the **anon public key**.

#### Email: 6-digit OTP (not only a magic link)

Supabase uses the same `signInWithOtp` call for both flows. **What the user receives depends on the email template**, not the app code.

1. In the dashboard go to **Authentication → Email Templates**.
2. Open the **Magic Link** template (this is the one used for passwordless email sign-in).
3. Include the OTP token in the body, for example: `Your login code is: {{ .Token }}`  
   If the template only contains `{{ .ConfirmationURL }}`, users get a **clickable link** instead of a code.
4. A full HTML example (JKUAT logo + OTP only, no magic link) lives in [`supabase/email-template-magic-link.html`](supabase/email-template-magic-link.html) — copy its **inner body/table content** into the dashboard editor if it expects HTML fragments only.
5. Optional: under **Authentication → Providers → Email**, adjust **Email OTP expiration** if needed.

#### Custom SMTP and “From” address (e.g. `eugene@technetium.co.ke`)

The app **cannot** set the sender address. Configure it in Supabase:

1. **Project Settings → Auth → SMTP Settings** — enable custom SMTP and enter host, port, username, and password from your mail provider.
2. Set **Sender email** (and **Sender name**) to the address your provider allows you to send as (e.g. `eugene@technetium.co.ke`). It must match SPF/DKIM or the provider’s “verified sender” rules, or mail will fail or go to spam.

### 2. Paste keys into `.env`
```bash
cp .env.example .env
# edit .env and paste the two values from Settings → API
```
If you build a standalone APK, these values are embedded at build-time.  
After changing `.env`, rebuild and reinstall the APK.

### 3. Install & run
```bash
npm install --legacy-peer-deps
npx expo start
```
Scan the QR with **Expo Go** on Android, or press `a` for an emulator.

### 4. (Important) Use real email addresses for demo accounts
The seed in `schema.sql` inserts placeholder emails like `s001@demo.local`. Before you can actually log in, update those rows to emails you can receive OTPs on:

```sql
update profiles set email = 'your.name+s001@gmail.com' where id = 'S001';
update profiles set email = 'your.name+l001@gmail.com' where id = 'L001';
-- repeat for any accounts you want to use
```

Then in the app, log in by typing the student/staff ID (e.g. `S001`) → Supabase emails you a 6-digit code → enter it on the OTP screen.

---

## Demo flow

1. Log in as **L001** (`Dr. Mwangi`) — tap **Start Session** on any unit.
2. On session setup, your current GPS is the geofence centre. Adjust radius, tap **Start Session**.
3. On another device (or after logging out), log in as **S001**. The live session appears on the dashboard with a red **Go Sign Attendance** button.
4. Tap through to the GPS screen — if you are inside the geofence, **Sign Attendance** activates.
5. Sign in → success screen → record appears instantly in the lecturer's live monitor (tab shows a gold pulsing dot).
6. Lecturer taps **End Session** → report is generated on the Reports tab.

Demo IDs seeded:

| Role     | ID   | Name |
|----------|------|------|
| Student  | S001 | Brian Otieno |
| Student  | S002 | Aisha Mohamed |
| Student  | S003 | Kevin Kamau |
| Student  | S004 | Faith Wanjiru |
| Lecturer | L001 | Dr. Mwangi |
| Lecturer | L002 | Prof. Njoroge |

---

## Project layout

```
GPS-Based-Student-Attendance-App/       # repo root — everything lives here now
├── logo.png                            # JKUAT logo (used as app icon/splash)
├── .env / .env.example                 # Supabase keys
├── app.json                            # Expo config, Android permissions
├── package.json
├── app/                                # expo-router routes
│   ├── index.tsx                       # Splash
│   ├── (auth)/                         # 10 auth screens
│   ├── (student)/                      # 11 student screens (tabs + detail)
│   └── (lecturer)/                     # 9 lecturer screens (tabs + detail)
├── src/
│   ├── theme.ts                        # JKUAT colour palette
│   ├── store.tsx                       # Auth context
│   ├── lib/
│   │   ├── geo.ts                      # Haversine geofence
│   │   └── supabase.ts                 # Supabase client
│   ├── data/                           # Types + Supabase repo
│   └── components/                     # Button, Card, Input, Pill, TopBar
├── supabase/
│   └── schema.sql                      # Run in Supabase SQL editor
└── assets/                             # Icons / splash
```

## Building an APK

### Quick (Expo Go — recommended for demo)
No build needed — `npx expo start` + Expo Go app.

### Standalone APK (local)
```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
# APK lives in android/app/build/outputs/apk/release/
```
Requires Android SDK (Android Studio) + JDK 17.

### Cloud build (EAS)
```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```
EAS emails you a signed APK in ~10 min.

## Tech stack

- **Expo SDK 54** + **React Native 0.81** + **TypeScript**
- **expo-router** — file-based navigation (stacks + tabs)
- **react-native-maps** — live map + geofence circle
- **expo-location** — foreground GPS
- **expo-local-authentication** — biometric
- **expo-notifications** — push
- **Supabase** — Postgres, Row-Level-Security, email-OTP auth, realtime-ready

## Colour palette (strict JKUAT brand)

| Token | Hex |
|-------|-----|
| Forest green | `#1B5E20` |
| Crimson red  | `#B71C1C` |
| Gold / amber | `#F9A825` |
| White        | `#FFFFFF` |
| Dark text    | `#1A1A1A` |
