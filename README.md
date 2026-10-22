# DramaFlash

DramaFlash is a demo app for short drama series. It uses Expo SDK 58, React Native, TypeScript in strict mode, and Expo Router. The app runs on iOS, Android, and the web.

## Try DramaFlash

You do not need to clone the repo or install anything to try the demo.

| Link                                                                                                                    | Use                                                               |
| ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| [Live Web Demo](https://dramaflash--dramaflash-demo.expo.app/)                                                          | Open in any modern browser, on a phone or a desktop.              |
| [Android APK](https://expo.dev/artifacts/eas/r2K672R3TN4dA_U9qEZNoq1vbW0f4j9FPmVS23iAz_s.apk)                           | Install on an Android phone or emulator. No Expo Go and no Metro. |
| [EAS Android build](https://expo.dev/accounts/dmihail/projects/drama-flash/builds/699aace0-4879-4640-bb8f-96723bc7753a) | Build details for the preview APK.                                |
| iOS                                                                                                                     | No public install. Use the web demo on iPhone or desktop.         |
| [Source repository](https://github.com/DMihail/DramaFlash)                                                              | Read the code on GitHub.                                          |

### A two-minute tour

1. **Browse series.** Open the web demo. Scroll Home, or open **Discover**.
2. **Open The CEO and I.** It is the Spotlight series on Home.
3. **Watch a free episode.** Tap **Play Ep 1**, then **Watch**. Episodes 1–3 are free.
4. **Open a locked episode.** Tap **Next** until Episode 4, or pick it from the episode list. Opening it costs nothing.
5. **Unlock it with demo coins.** Tap **Unlock**, then **Confirm unlock · 10 coins**. You start with 15 coins, so the balance drops to 5. For the next episode, tap **Get coins** and add a demo pack.
6. **Explore Library and Continue Watching.** Tap the heart in the player to save the series. Open **Library** to see Saved and Purchases. Open **Profile** to see Continue watching and your coin balance.

Refresh the page at any point. Your coins, unlocks, and saved series stay.

### What is simulated

- **Purchases are simulated.** Coin packs show a price label, but no real payment is processed and no card is asked for.
- **Sign-in is demo-only.** Google, Apple, and email buttons do not contact any provider. **Continue as Guest** also works.
- **Data stays on your device.** Wallet, unlocks, library, and progress are stored locally: MMKV on Android and iOS, browser local storage on the web. Clearing site data resets the demo.
- **Video is a preview.** The player shows episode artwork and demo controls. It does not stream video.
- Season unlock, membership, and VIP are shown as unavailable and never spend coins.

### Launch methods

| Method              | Status          | Notes                                                                                                                                  |
| ------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Web demo            | Available       | No install. Hosted on EAS Hosting.                                                                                                     |
| Android preview APK | Available       | Standalone release APK from the `preview` profile. No Expo Go, no Metro, MMKV included. Installed and launched on an emulator.         |
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
