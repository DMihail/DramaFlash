# DramaFlash

DramaFlash is a mobile app for short drama series. It uses Expo SDK 58, React Native 0.88, TypeScript in strict mode, and Expo Router. The app targets iOS and Android.

The home screen is only a placeholder. Product screens are not built yet.

## Requirements

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

Copy `.env.example` to `.env.local` only for local public settings. Do not commit secrets.

## Development

```bash
npm run start
npm run ios
npm run android
```

These scripts set `APP_VARIANT=development`.

| Variant | Name | iOS and Android id | Scheme |
| --- | --- | --- | --- |
| development | drama-flash (Dev) | `com.dramaflash.app.dev` | `dramaflash-dev` |
| production | drama-flash | `com.dramaflash.app` | `dramaflash` |

An empty `APP_VARIANT` means production. An unknown value throws an error.

## Tests and validation

```bash
npm test
npm run lint
npm run typecheck
npm run doctor
npm run validate
```

`npm run validate` runs lint, typecheck, unit tests, and Expo Doctor. Run it before you open a pull request.

## iOS and Android builds

EAS project: `drama-flash`  
Owner: `dmihail`  
Project ID: `33a80453-d173-4c89-a709-54dd349a68b2`

| Profile | Use |
| --- | --- |
| `development` | Dev client for Android, and for an iOS device |
| `development-simulator` | Dev client for the iOS Simulator |
| `production` | Store build |

```bash
npx eas-cli@latest build --platform ios --profile development-simulator
npx eas-cli@latest build --platform android --profile development
```

`ios/` and `android/` are generated. Do not commit them. Do not commit keystores, certificates, or `credentials.json`.

A new native package needs a new development build. JavaScript-only changes use `npm run start`.

## Git

- Work on a feature branch.
- Do not push directly to `main`.
- Open a pull request. Do not merge it without the owner's approval.
- Do not turn off tests, lint, or TypeScript to make CI pass.

GitHub Actions runs `npm ci`, lint, typecheck, tests, and Expo Doctor on pull requests to `main`. The check name is **Lint, types, tests, and Expo Doctor**. It does not build the native apps.

Protect `main` on GitHub: require a pull request, require that check, and do not allow bypass.
