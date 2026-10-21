# Architecture

Native app for DramaFlash on Expo SDK 58, React Native 0.88, Expo Router, and TypeScript strict. iOS and Android only for product work. The web script can stay, but screens are designed for phones.

This document plans the app. It does not add those folders yet.

Keep the current infrastructure: `app.config.ts`, `eas.json`, application ids, EAS project `33a80453-d173-4c89-a709-54dd349a68b2`, owner `dmihail`, npm 11.19.0, GitHub Actions, and the tests in `src/__tests__/`.

Behavior rules are the ones in `docs/PROTOTYPE_AUDIT.md`. Do not copy the web prototype into `src/`.

## Why this shape

The prototype is one 1,100-line component. The native app should split by feature, but it should stay small. One context is enough. Wallet and auth rules stay pure functions so Jest can test them without rendering.

Do not add Redux, Zustand, a repository layer, or a styling framework.

## Folders

| Path | Responsibility |
| --- | --- |
| `src/app/` | Expo Router layouts and screens. Read params, call feature components, and navigate. No wallet math |
| `src/domain/` | Types and pure functions for wallet, auth, and catalog ids |
| `src/data/` | Hardcoded series, posters, episodes, and coin packs |
| `src/state/` | One React context. Loads and saves the two demo records. Holds the in-memory login return ticket |
| `src/theme/` | Color, type, space, and radius tokens. Font loading |
| `src/components/` | Controls used by more than one feature |
| `src/features/home/` | Home layout |
| `src/features/discover/` | Search and genre grid |
| `src/features/series/` | Detail layout |
| `src/features/player/` | Artwork player, lock card, unlock sheet |
| `src/features/wallet/` | Coin store and unlock success |
| `src/features/auth/` | Login screen |
| `src/features/library/` | Saved and empty states |
| `src/features/profile/` | Profile, sign-out, reset |
| `assets/drama/` | Approved images, copied in a later PR |

Do not create a folder until the PR that fills it.

## Routes

`experiments.typedRoutes` is already true.

```text
src/app/_layout.tsx                 Root stack. DemoProvider. Status bar.
src/app/(tabs)/_layout.tsx          Home, Discover, Library, Profile
src/app/(tabs)/index.tsx            Home
src/app/(tabs)/discover.tsx         Discover
src/app/(tabs)/library.tsx          Library gate
src/app/(tabs)/profile.tsx          Profile gate
src/app/series/[seriesId].tsx       Detail
src/app/player/[seriesId].tsx       Player. Query: episode
src/app/coins.tsx                   Coin store
src/app/unlocked.tsx                Success screen
src/app/login.tsx                   Demo login
```

Romance is not a route. The Home or tab control sets the Discover genre to Romance and pushes Discover. Match the prototype: five buttons, four screens.

The locked player is not a route. `player/[seriesId]?episode=5` renders the lock card when `isEpisodeUnlocked` is false.

The unlock sheet is a React Native `Modal` rendered by the player feature. The artwork stays behind it. Do not make it a route.

The toast is local component state. Terms and Privacy stay toasts.

### Params

| Route | Params | Notes |
| --- | --- | --- |
| `series/[seriesId]` | `seriesId: string` | Unknown id shows a short not-found state |
| `player/[seriesId]` | `seriesId: string`, `episode: number` | Missing or invalid episode opens episode 1 |
| `coins` | none in the URL | Return target lives in memory: `unlock` or `profile` |
| `unlocked` | none in the URL | Uses the episode already in memory |
| `login` | none in the URL | Return ticket lives in memory |

Deep links use the existing schemes `dramaflash` and `dramaflash-dev`:

- `dramaflash://series/featured`
- `dramaflash://player/featured?episode=4`

Login return, scroll, and play state are not deep links. A cold start opens Home, as the prototype does after reload.

### Back behavior

| From | Back goes to |
| --- | --- |
| Detail | Home |
| Player | Detail for that `seriesId` |
| Coin store | Profile, or the player. Reopen the sheet if the episode is still locked |
| Unlocked success | Detail. Continue opens the player with autoplay |
| Login, guest or back | The screen that asked for login. Restore play state. Do not save |
| Login, after sign-in | The screen that was requested. Complete a pending save |
| Sheet | Closes the sheet. Does not leave the player |
| Android hardware back | Same as the header back. Close the sheet first |

Library and Profile, when the user is a guest, replace themselves with Login. They must not call Login again when the guest cancels, or the app will loop. Cancel returns to the origin screen stored before Login opened.

## Domain models

Keep these small. Do not make one interface with many optional fields.

### Catalog

```ts
type SeriesId = 'featured';

type Poster = {
  id: string;
  title: string;
  episodeCount: number;
  image: number; // require() of a local image
};

type CastMember = {
  id: string;
  name: string;
  role: string;
  image: number;
};

type Episode = {
  number: number; // 1..45
  title: string;
  durationLabel: string;
};

type FeaturedSeries = {
  id: SeriesId;
  detailTitle: string;
  playerTitle: string;
  homeHeroTitle: string;
  synopsis: string;
  year: number;
  ratingLabel: string;
  episodeCount: 45;
  cast: CastMember[];
  episodes: Episode[];
};
```

`homeHeroTitle`, `detailTitle`, and `playerTitle` stay separate until the title question in the audit is answered. All posters navigate to `featured`. That matches `go("detail")` with no id.

Episodes 7–45 with no name in the prototype use `Chapter N`. Only the first six have the names from the code. Art and duration repeat every six episodes.

### Wallet

```ts
type Wallet = {
  balance: number;
  unlockedEpisodes: number[];
};

type CoinPack = {
  coins: number;
  bonus: number;
  priceLabel: string;
};
```

Functions, same rules as `demoState.ts`: `freshWallet`, `isEpisodeUnlocked`, `unlockEpisode`, `purchaseCoins`, `loadWallet`. Episodes 1–3 are free. Cost is 10. Last episode is 45. Packs are the four rows in the audit. `unlockEpisode` and `purchaseCoins` return the same object when they change nothing.

### Auth

```ts
type DemoProvider = 'google' | 'apple' | 'email';

type DemoAuth = {
  provider: DemoProvider | null;
  savedSeries: boolean;
};
```

Functions: `guestAuth`, `loadAuth`. Sign-in, sign-out, toggle save, and reset are tiny functions in the same file so the screen does not reimplement the rules. Sign-out clears `provider` only. Reset clears `savedSeries` only and does not clear `provider`. Wallet reset is a separate call.

`saved` on screen is `provider !== null && savedSeries`.

### Session-only state

Not stored, matching the prototype:

- `liked`
- genre and search text
- `playing` and `cliffhanger`
- episode list sort and show-more
- selected pack index (default 1, the 800 pack)
- login return ticket: origin route, destination route, play state, pending save

There is no playback-progress model. The prototype does not store one. Do not add continue-watching until the product asks for it.

## State ownership

`DemoProvider` in `src/state/demo-store.tsx`:

- Holds `Wallet` and `DemoAuth`.
- On launch, reads two JSON values. Bad JSON or a thrown read uses the fresh values and continues. The screen can show the “this visit only” toast when the write fails.
- Writes wallet and auth to different keys: `dramaflash.option-a.v1` and `dramaflash.auth-demo.v1`.
- Does not write one record from the other record’s functions.
- Holds the login ticket in a ref, not in storage.

Persistence package, when that PR starts: `@react-native-async-storage/async-storage`. Do not use Secure Store. Coins are not a secret, and Secure Store is the wrong size and purpose.

The provider does not know about routes. Screens call `router` themselves.

## Shared components

See `docs/DESIGN_SYSTEM.md`. Feature components stay in `src/features/` until a second screen needs them.

## Playback

There is no video file. The player feature renders a still with React Native `Image`, a play/pause flag, and a progress bar that does not represent media time.

When a real URL exists, use Expo SDK 58 `expo-video` (`useVideoPlayer`, `VideoView`). Leave background playback and picture-in-picture off. That package is a native module and needs a new development build. Do not install it in the artwork-preview PR.

Pause when the app goes to the background only after a real player exists. The artwork preview has nothing to release. Still unmount the screen’s timers on blur.

## What stays out

- Real OAuth, passwords, and a backend.
- Real payments and VIP.
- A vertical paging feed, unless a later decision rejects the prototype’s Next button.
- Reanimated and Gesture Handler, unless that feed is approved.
- The fake 9:41 status bar.
