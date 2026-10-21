# Migration map

Web source: `High-Fidelity DramaFlash Prototype/`. Native destination: `src/`. Do not import the web files from the Expo app.

Status is the plan, not work already done. The Expo app still has only the placeholder home screen.

| Web source | Native destination | Strategy | Dependencies | Status | Risk |
| --- | --- | --- | --- | --- | --- |
| `src/demoState.ts` | `src/domain/wallet.ts` | Port the functions and Jest tests. No UI | None | Planned | Low. Tests already define the numbers |
| `src/authState.ts` | `src/domain/auth.ts` | Port the type, loader, and Jest tests | None | Planned | Low |
| `src/App.tsx` screen switch | `src/app/` routes in `docs/ARCHITECTURE.md` | Replace `setScreen` with Expo Router | expo-router, already installed | Planned | Login return must not loop |
| `localStorage` keys | Async Storage, same key strings | One context. Memory fallback if write fails | `@react-native-async-storage/async-storage` in the state PR | Planned | Do not use Secure Store |
| Login return ref | In-memory ticket in the context | Not a route param | None | Planned | Lost on process kill, same as a refresh of the web ref |
| `Button`, `IconButton` | `src/components/PrimaryButton.tsx`, `IconButton.tsx` | Rebuild with `Pressable` | None | Planned | — |
| Home block | `src/features/home/` | Rebuild layout from tokens and prototype copy | Images later | Planned | Title mismatch with the design frame |
| Discover block | `src/features/discover/` | `TextInput`, filter titles | None beyond catalog | Planned | Genre chips do not filter a real genre |
| Detail block | `src/features/series/` | One featured series | Catalog data | Planned | Every poster opens this series |
| Player and locked blocks | `src/features/player/` | One screen. Lock card is a state | `Image` now. `expo-video` only after a URL exists | Planned | No real video in the prototype |
| Progress CSS | `Animated` in the player | Decorative bar. Honor Reduce Motion | None | Planned | Must not be described as playback time |
| Unlock sheet | `src/features/player/UnlockSheet.tsx` | `Modal`, not a route | None | Planned | Design shows three options. Build one |
| Store block | `src/features/wallet/` and `src/app/coins.tsx` | Screen | None | Planned | Screenshot says 85 coins. Code says 10 |
| Success block | `src/features/wallet/` and `src/app/unlocked.tsx` | Screen | None | Planned | — |
| Library block | `src/features/library/` | Gate on provider. One boolean | Auth context | Planned | Not a list of series |
| Profile block | `src/features/profile/` | Sign out and reset | Auth and wallet context | Planned | `window.confirm` becomes `Alert.alert` |
| `src/Login.tsx` | `src/features/auth/` | Rebuild. Same four fake providers | Legal review of brand marks | Planned | Marks may not be shippable |
| `src/index.css` tokens | `src/theme/tokens.ts` | Copy measured values. No Tailwind | None | Planned | Android glow will differ |
| Google font import | `expo-font` plus `@expo-google-fonts/inter` and `@expo-google-fonts/playfair-display` | Load at startup | Those packages. New dev build if `expo-font` is native in this SDK | Planned | Confirm Playfair 800 exists in the package |
| `lucide-react` | `lucide-react-native` | Same icon names | `react-native-svg` | Planned | — |
| `<img>` posters | `Image`, then `expo-image` if lists stutter | `require` local JPEGs from `references/assets/` | Copy images into `assets/drama/` first | Planned | `references/` is gitignored |
| Prototype `public/art/*.png` | Do not use as the app source | Approved JPEGs replace them | — | Rejected | Generated art, not the approved crops |
| `<video>` | None today | There is no video element to port | `expo-video` later | Blocked | No URL |
| Status bar fake icons | Delete | Real status bar and safe area | `expo-status-bar`, `react-native-safe-area-context` | Planned | — |
| DOM focus trap | Delete | Modal handles assistive focus | — | Planned | — |
| `window.scrollTo` restore | ScrollView `scrollTo` on the origin screen | Only if that screen is still mounted or the offset is saved | None | Planned | A screen that unmounts must store the offset in the ticket |
| Hover CSS | Delete | Pressed opacity only | — | Planned | — |
| Tailwind and Vite | Do not port | — | — | Rejected | Web toolchain |
| `tests/*.test.mjs` | `src/domain/__tests__/` | Rewrite asserts in Jest. Same cases | Jest, already installed | Planned | Do not leave the node test runner as a second CI path |

## Route mapping

| Prototype `screen` | Native route |
| --- | --- |
| `home` | `/(tabs)` |
| `discover` | `/(tabs)/discover` |
| `detail` | `/series/featured` |
| `player` | `/player/featured?episode=N` |
| `locked` | Same player route. Lock UI when the episode is locked |
| `store` | `/coins` |
| `success` | `/unlocked` |
| `library` | `/(tabs)/library` |
| `profile` | `/(tabs)/profile` |
| `login` | `/login` |
| sheet | Modal inside the player |
| toast | Inline status, not a route |

## Packages to add later

Add these only in the PR that needs them, with `npx expo install`. Do not add them in the docs PR.

| Package | PR | Why |
| --- | --- | --- |
| None | Navigation and domain | Pure TypeScript and Expo Router are enough |
| `expo-font`, `@expo-google-fonts/inter`, `@expo-google-fonts/playfair-display` | Tokens and fonts | Native font loading |
| `lucide-react-native`, `react-native-svg` | Shared controls | Icons |
| `expo-linear-gradient` | First screen that paints the brand gradient | No CSS gradients |
| `@react-native-async-storage/async-storage` | First PR that must survive reload | Same role as `localStorage` |
| `expo-image` | Only if poster lists stutter | Caching. Needs a new dev build |
| `expo-blur` | Optional, sheet polish | Easy to skip |
| `expo-video` | Only after a real media URL | Official SDK 58 player. Needs a new dev build |

Do not add Reanimated, Gesture Handler, a state library, or a payment SDK for this demo.
