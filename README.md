# VeloLog

**An Android-first bike computer and maintenance tracker built with React Native, Expo, and SQLite.**

> Strava tracks you. VeloLog tracks your bike.

---

## Overview

VeloLog is a local-first cycling companion that connects every recorded ride to the bike that
made it. It records routes and ride statistics, updates the bike's odometer, calculates component
wear, and reminds you when maintenance is due.

The project began as a way to build something I would genuinely use while exploring the parts of
mobile development that go beyond standard CRUD: background GPS, noisy location data, crash
recovery, offline persistence, derived domain state, and local notifications.

### Core philosophy

- **Bike first** — rides are connected to the condition and history of the bike
- **Local first** — core flows work without an account, backend, or internet connection
- **Useful in the real world** — recording continues with the screen off and survives interruptions
- **Derived, not duplicated** — odometers, wear, and maintenance status are calculated from source data
- **Focused scope** — no social feed, subscriptions, leaderboards, or turn-by-turn navigation

---

## Features

### Bike garage

- ✅ Create and manage multiple bikes
- ✅ Add bike photos, purchase details, notes, and a starting odometer
- ✅ Track components such as chains, cassettes, brake pads, and tires
- ✅ See component lifetime and wear progress based on the bike's odometer
- ✅ Archive bikes without losing their history

### Ride recording

- ✅ Record rides with background GPS on Android
- ✅ Pause, resume, save, or discard a recording
- ✅ View live distance, duration, and speed statistics
- ✅ Filter inaccurate points and implausible GPS jumps
- ✅ Recover an interrupted recording from incrementally persisted track data
- ✅ Automatically update the selected bike's odometer when a ride is completed

### Ride history and statistics

- ✅ Browse completed rides and inspect route maps
- ✅ View distance, moving time, average speed, and maximum speed
- ✅ Add ride notes and reassign a ride to another bike
- ✅ View per-bike distance, ride count, time, and longest-ride statistics
- ✅ Soft-delete rides while keeping odometers and derived totals consistent

### Maintenance

- ✅ Create mileage-based maintenance rules for bike components
- ✅ See whether maintenance is upcoming, due soon, or overdue
- ✅ Receive local maintenance notifications
- ✅ Mark work as completed and keep a maintenance history with cost and notes
- ✅ Replace a component while retaining the old component's record

### Personalization

- ✅ English and Swedish translations
- ✅ Kilometres or miles
- ✅ Light, dark, and system themes
- ✅ Journey statistics including distance equivalents, estimated CO₂ savings, calories, and cost per distance
- ✅ First-bike onboarding

---

## Architecture

VeloLog uses a deliberately lightweight layered architecture. Business calculations remain pure,
screens consume feature hooks, and repositories form the boundary around local persistence.

```text
src/
├── app/          # Logic-free Expo Router routes
├── components/   # Shared UI primitives
├── data/         # Drizzle schema, SQLite setup, and repositories
├── domain/       # Pure TypeScript business rules and unit tests
├── features/     # Feature-owned screens and TanStack Query hooks
├── i18n/         # English and Swedish resources
├── services/     # Ride recording, background location, and notifications
└── theme/        # Theme palette and helpers
```

The dependency direction is:

```text
features → services/data → domain
```

The domain layer has no React, Expo, database, or platform dependencies. This keeps GPS filtering,
ride calculations, odometer rules, component wear, and maintenance status straightforward to test.

### Key technologies

- **React Native + Expo SDK 57** — mobile application framework
- **TypeScript** — application and domain code
- **Expo Router** — file-based navigation
- **SQLite + Drizzle ORM** — typed, local-first persistence and migrations
- **expo-location + expo-task-manager** — foreground and background ride tracking
- **MapLibre + OpenFreeMap** — ride-route maps without a Google Maps API key
- **TanStack Query** — repository-backed application state
- **expo-notifications** — local maintenance reminders
- **i18next** — English and Swedish localization
- **Jest** — unit tests for pure domain logic

---

## Data and privacy

VeloLog does not currently require an account or backend. Bikes, rides, GPS tracks, maintenance
records, and settings are stored locally in SQLite on the device.

Map tiles are loaded from OpenFreeMap when displaying maps, but recording and saving a ride does
not depend on network connectivity. Cloud sync may be added later as an optional sync target; it
will not replace the local-first model.

Location permission is used to record ride routes and distance. Background location allows an
active ride to continue while the app is in the background or the screen is off.

---

## Getting started for developers

### Prerequisites

- Node.js and npm
- Android Studio with an emulator, or a physical Android device
- An Expo/EAS development build of VeloLog installed on the target

VeloLog does **not** run in Expo Go because background location, MapLibre, SQLite, notifications,
and other native modules require a development client.

### Quick start

```powershell
git clone https://github.com/mohald-3/velolog-app.git
cd velolog-app
npm install
npm start -- --dev-client --host lan
```

Open the installed VeloLog development client after Metro starts. To create a development APK:

```powershell
npx eas-cli build --platform android --profile development
```

For emulator connection instructions, local native builds, and troubleshooting, see
[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

### Quality checks

```powershell
npm run typecheck
npm run lint
npm test -- --watchAll=false
```

---

## Project status and roadmap

VeloLog v0.2 is feature-complete as an MVP and has been validated through emulator testing and
real outdoor rides on Android.

| Milestone | Status | Highlights |
|---|---|---|
| GPS de-risk | ✅ Complete | Background recording, battery measurement, screen-off and force-kill testing |
| Bike Garage | ✅ Complete | Bikes, components, photos, and local persistence |
| Ride Recording | ✅ Complete | Filtered GPS pipeline, recovery, live stats, and odometer updates |
| History & Stats | ✅ Complete | Ride maps, notes, bike statistics, and safe deletion |
| Maintenance | ✅ Complete | Mileage rules, reminders, service history, and component replacement |
| Polish & Journey | ✅ Complete | Units, localization, themes, onboarding, and journey insights |
| v0.3 | 🧭 Planning | Selecting from GPX tools, charts, elevation, weather, and ride photos |

The immediate focus is choosing two or three v0.3 features rather than expanding the scope all at
once. Longer term, an optional backend may provide multi-device sync while the app remains fully
usable offline.

---

## Notes from the developer

This is a portfolio project, but it is designed around a real personal need: I wanted one place to
understand both my rides and what those kilometres mean for my bike. The most interesting work has
been making unreliable real-world GPS input produce trustworthy statistics without compromising
the local-first experience.

The project intentionally avoids becoming another social fitness platform. Its job is simpler:
record the ride, preserve the history, and help keep the bike ready for the next one.

---

## License

This repository does not currently include an open-source license. All rights are reserved unless
permission is granted by the author.

## Contact

Created by [Mohanned](https://github.com/mohald-3).

---

Built with React Native, Expo, TypeScript, and a lot of kilometres.
