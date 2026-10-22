# DramaFlash

DramaFlash is a short-drama streaming prototype built for the TargetVideo take-home assignment (Option A). You browse series, watch free episodes, hit a locked episode, and unlock it with demo coins. The app runs on Android, iOS, and the web from one Expo codebase.

<p>
  <img src="deliverables/screenshots/home.jpg" alt="Home with the Spotlight series" width="200" />
  <img src="deliverables/screenshots/unlock.jpg" alt="Unlock sheet for a paid episode" width="200" />
  <img src="deliverables/screenshots/library.jpg" alt="Library with Continue watching and saved series" width="200" />
  <img src="deliverables/screenshots/profile-guest.jpg" alt="Guest profile with Sign in and Create account" width="200" />
</p>

## Try it

| What                                                           | Status                                                                                            |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [Live web demo](https://dramaflash--dramaflash-demo.expo.app/) | Permanent address on EAS Hosting. It shows this version only after the next deploy.               |
| Android APK                                                    | New preview build pending. The link is added here after the EAS build succeeds and is tested.     |
| [Demo video (70 s)](deliverables/DramaFlash_Demo.mp4)          | The real production web build in a 390 px phone window. No edits to the app UI.                   |
| [Source code](https://github.com/DMihail/DramaFlash)           | This repository.                                                                                  |
| iOS                                                            | No public install (needs device UDIDs or a paid TestFlight setup). Use the web demo on an iPhone. |

### Demo journey (about two minutes)

1. Open the app as a guest. Browse **Home**, then **Discover** (it opens in browse mode, without the keyboard).
2. Open **The CEO and I** and tap **Play Ep 1**, then **Watch**. Episodes 1–3 are free.
3. Tap **Next** until **Episode 4**. It is locked. Opening it costs nothing.
4. Tap **Unlock**, then **Confirm unlock · 10 coins**. You start with 15 coins, so 5 remain. The episode plays.
5. Go to **Episode 5**. You now need more coins: tap **Get coins**, add a demo pack, go back, and unlock.
6. Open **Profile**: a guest sees **Sign in** and **Create account**. Sign in with any email (demo only) to see the full profile.
7. Open **Library** for Continue watching, Saved, and Purchases. Refresh or restart: everything stays.

**Reset the demo:** on the web, clear the site data for the demo URL (browser settings, or a private window). On Android, clear the app's storage or reinstall. Development builds also have `/dev/reset-wallet` and `/dev/reset-library`; production builds redirect those routes home.

## What is implemented (Option A)

- Home with a spotlight series and genre rails; Discover with genre filters and search.
- Series details: synopsis, cast, episode list with free and locked states.
- Player: artwork preview with play and pause, previous and next, save, share, and a lock card for paid episodes.
- Unlock sheet with confirmation. Each paid episode costs 10 coins, charged exactly once.
- Coin store with demo coin packs. Season unlock, membership, and VIP are shown as unavailable.
- Library: Continue watching, Saved series, and Purchases.
- Demo sign-in (Google, Apple, email, or guest) and a guest or signed-in Profile.
- Persistence across restarts, with protection against lost or corrupt data.

## What is simulated

- **Payments:** coin packs show price labels, but no payment is made and no card is asked for.
- **Authentication:** sign-in buttons do not contact any provider. Only the provider name is stored; no email or password is saved.
- **Backend:** a local mock API (`src/api/`) returns catalog data from `src/data/` with a short delay, cancellation, and error states, so the screens show real loading and retry behavior. There is no server.
- **Video:** the player shows episode artwork with demo controls. It does not stream video.

## Architecture

- **Expo SDK 58, React Native 0.88, TypeScript (strict), Expo Router** with typed routes and React Compiler.
- **State:** small Zustand stores for wallet, library, and session. Business rules are pure functions in `src/domain/` (for example `confirmUnlock`), tested without rendering.
- **Persistence:** MMKV 4 (Nitro) on Android and iOS, `localStorage` on the web, behind one storage interface. Every write is read back and checked before the UI shows the new value; a failed write restores the old value. Corrupt data is reported, never silently replaced by a fresh 15-coin wallet; a saved-wallet marker turns a later missing wallet into an error too. No AsyncStorage.
- **Double charges:** the wallet store holds a lock during a write, so repeated taps cannot charge twice.
- **Builds:** `development` and `production` app variants with separate app ids. The web export fails if it is not the production variant.

**Connecting a real backend:** replace the functions in `src/api/` with HTTP calls (same types), move coin balance and unlocks to server-side entitlements, verify store purchases on the server (Google Play Billing, StoreKit), and keep the local stores as a cache.

**Suggested metrics:** episode completion rate, lock impressions (locked episode views), unlock conversion (unlocks ÷ lock impressions), coin-pack conversion, and next-episode starts after an unlock.

## Tests

- 180 Jest tests (domain rules, stores, persistence, screens) and 9 Maestro flows in `tests/e2e/maestro`.
- `npm run validate` runs ESLint on the whole repo, Prettier, TypeScript, Jest, and Expo Doctor. CI runs the same on every pull request.
- A Playwright journey (43 checks at 390, 360, and 1440 px) was run against the production web export: guest start, Discover focus and repeated search, session restore without a guest flash, unlock and double-tap charge, coin top-up, persistence after reload, sign-in and sign-out, dev routes blocked, invalid links.

## Known limitations

- No real video streaming, payments, accounts, or server-side entitlements.
- No public iOS install.
- The spotlight artwork on Home has another title painted into the image, as in the design reference.

## Media and licenses

- Posters, stills, and cast portraits come from the design reference supplied for the assignment (`FLASH.svg`). They are used only for this demo. **Owner to confirm the usage terms of these images.**
- Icons: [Lucide](https://lucide.dev) (ISC license). Fonts: Inter and Playfair Display via `@expo-google-fonts` (SIL Open Font License).

## Launch methods

| Method              | Status          | Notes                                                                                                                                  |
| ------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Web demo            | Available       | No install. Hosted on EAS Hosting.                                                                                                     |
| Android preview APK | Build pending   | Standalone release APK from the `preview` profile. No Expo Go, no Metro, MMKV included.                                                |
| iOS install         | Not available   | Ad hoc builds need each device UDID. TestFlight needs a paid Apple Developer account and App Store Connect setup. Use the web demo.    |
| Expo Go             | Not supported   | `react-native-mmkv` 4 runs on `react-native-nitro-modules`. Expo Go cannot load custom native modules, so the app needs its own build. |
| Development client  | Developers only | `development` profiles. Needs a local Metro server.                                                                                    |

## Requirements (local development)

- Node.js `22.22.0` (`.nvmrc`)
- npm `11.19.0`

Node.js 22.22.0 includes npm 10.9.4. This repo needs npm 11.19.0. `.npmrc` keeps `engine-strict` on. EAS Build and GitHub Actions run `npm run eas-build-pre-install` before `npm ci`. That script installs npm 11.19.0.

```bash
nvm use
npm install --global npm@11.19.0
```

## Install

```bash
npm ci
```

Copy `.env.example` to `.env.local` only for local public settings. Do not commit secrets. The public demo needs no secret environment variables.

## Development

```bash
npm run start
npm run ios
npm run android
npm run web
```

These scripts set `APP_VARIANT=development`.

| Variant     | Name              | iOS and Android id       | Scheme           |
| ----------- | ----------------- | ------------------------ | ---------------- |
| development | drama-flash (Dev) | `com.dramaflash.app.dev` | `dramaflash-dev` |
| production  | drama-flash       | `com.dramaflash.app`     | `dramaflash`     |

An empty `APP_VARIANT` means production. An unknown value throws an error.

## Tests and validation

```bash
npm test
npm run lint
npm run typecheck
npm run doctor
npm run validate
npm run export:web
```

`npm run validate` runs lint, format check, typecheck, unit tests, and Expo Doctor. Run it before you open a pull request.

`npm run export:web` builds the production web app into `dist/`. It sets `APP_VARIANT=production`, clears the Metro cache, and fails if any bundle still carries the development variant. Do not deploy a plain `npx expo export`: it uses whatever `APP_VARIANT` your shell has, and a development bundle ships the demo reset routes.

## iOS and Android builds

EAS project: `drama-flash`  
Owner: `dmihail`  
Project ID: `33a80453-d173-4c89-a709-54dd349a68b2`

| Profile                 | Use                                                |
| ----------------------- | -------------------------------------------------- |
| `development`           | Dev client for Android, and for an iOS device      |
| `development-simulator` | Dev client for the iOS Simulator                   |
| `preview`               | Standalone Android APK for sharing (internal link) |
| `production`            | Store build                                        |

```bash
npx eas-cli@latest build --platform android --profile preview
npx eas-cli@latest build --platform ios --profile development-simulator
```

`ios/` and `android/` are generated. Do not commit them. Do not commit keystores, certificates, or `credentials.json`.

A new native package needs a new development build. JavaScript-only changes use `npm run start`.

## Web hosting

The app exports with `expo.web.output: "server"`, so direct links such as `/series/the-ceo-and-i` work on refresh. The demo is on EAS Hosting under the `dramaflash-demo` alias. No secret environment variables are needed.

```bash
npm run export:web
npx eas-cli@latest deploy --alias dramaflash-demo
```

## Git

- Work on a feature branch.
- Do not push directly to `main`.
- Open a pull request. Do not merge it without the owner's approval.
- Do not turn off tests, lint, or TypeScript to make CI pass.

GitHub Actions runs `npm ci`, lint, typecheck, tests, and Expo Doctor on pull requests to `main`. The check name is **Lint, types, tests, and Expo Doctor**. It does not build the native apps.

Protect `main` on GitHub: require a pull request, require that check, and do not allow bypass.
