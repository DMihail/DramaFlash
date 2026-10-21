# Implementation plan

Build one slice at a time. Each pull request runs `npm run validate` and does not turn off lint, tests, or TypeScript. Do not add a test that only asserts `true`.

Check iOS and Android on a phone-sized layout for every screen PR. A new native module needs a new development build. Say so in that PR. Do not claim a simulator launch passed unless it was launched.

The docs PR does not install packages or change `src/`.

## Order

Login’s data rules land in PR 1. The Login screen is PR 9, before Library and Profile, because those tabs send guests to Login.

| PR | Goal | Depends on |
| --- | --- | --- |
| 1 | Routes and tested domain rules | This docs PR |
| 2 | Tokens and fonts | PR 1 |
| 3 | Shared controls Home needs | PR 2 |
| 4 | Home | PR 3 and copied images |
| 5 | Discover | PR 4 catalog |
| 6 | Series detail | PR 4 catalog |
| 7 | Artwork player | PR 6 |
| 8 | Sheet, coin store, success | PR 7 and wallet functions from PR 1 |
| 9 | Login and return flow | PR 1 auth functions. UI can sit on empty tabs |
| 10 | Library, Profile, sign-out, reset | PR 9 |
| 11 | Motion, safe area, Android back, screenshot pass | PR 4–10 |

PRs 5 and 6 can follow PR 4 in either order. PR 9 can be written in parallel with PR 6–8 if the branch stays reviewable, but it should merge before PR 10.

## PR 1 — Navigation and domain

**Scope**

- `src/domain/wallet.ts` and `src/domain/auth.ts` with the rules in `docs/PROTOTYPE_AUDIT.md`.
- Jest tests that cover the cases in `High-Fidelity DramaFlash Prototype/tests/demo-state.test.mjs` and `tests/auth-state.test.mjs`.
- A catalog type and a `featured` id. No images yet.
- Root stack, four empty tabs, and empty routes: series, player, coins, unlocked, login.
- Typed params: `seriesId`, `episode`. Unknown series id shows a not-found message.
- Romance is not a route.

**Out of scope:** fonts, images, unlock UI, Async Storage, new packages.

**Done when:** `npm run validate` passes, and each route opens. iOS and Android both show the empty screens.

## PR 2 — Tokens and fonts

**Scope:** `src/theme/tokens.ts` with the values in `docs/DESIGN_SYSTEM.md`. Load Inter and Playfair. `AppText` can wait for PR 3 if this PR only proves the fonts render.

**Packages:** `npx expo install expo-font` and the two `@expo-google-fonts` packages. If the font loader needs a native rebuild, say that and do not claim the old binary already contains the fonts.

**Done when:** a temporary text sample uses both families, typecheck is clean, and the sample is removed or kept only if `AppText` is in this PR. Do not leave a debug screen.

## PR 3 — Shared controls

**Scope:** `PrimaryButton`, `IconButton`, `Screen`, `GenreChip`, `PosterCard`, `SectionHeader` if Home’s layout is clear enough to need them. `lucide-react-native` and `react-native-svg`.

**Out of scope:** full Home data, gradients, blur.

**Done when:** the controls render on a hidden story or on the still-empty Home without fake tests. Prefer rendering them on Home in PR 4 if a story would be throwaway. This PR can be merged into PR 4 if the diff stays small.

## PR 4 — Home

**Scope:** hero, chips, three rails, header, tab bar including the Romance shortcut. Copy and navigation from the prototype. Images copied from `references/assets/` into `assets/drama/`.

**Done when:** Watch now opens `/series/featured`. A poster opens the same route. Romance opens Discover with that genre. Save is visible but may still no-op until PR 9, or it may navigate to the empty Login route. Do not pretend a series was saved.

## PR 5 — Discover

**Scope:** search, chips, grid, empty copy. Same catalog as Home.

**Done when:** “Love” and “Secret” return hits. A nonsense query shows the empty line. Clear search works with the keyboard open.

## PR 6 — Series detail

**Scope:** hero, synopsis, cast, episode rows, sort, show more (6 vs 9), recommendations, continue-the-story banner.

**Done when:** episodes 1–3 open the player. Episodes 4+ open the player in the locked state. The banner opens the first locked episode. Sort and show more do not change the wallet.

## PR 7 — Player

**Scope:** still image, play/pause, decorative progress bar, next episode, cliffhanger copy, lock card, like and comment and share toasts. No `expo-video`.

**Done when:** Next from episode 3 opens episode 4 locked and can show the cliffhanger line. Back returns to detail. Reduce Motion leaves the bar still. The screen does not say that a video file is playing.

## PR 8 — Unlock and coins

**Scope:** sheet modal, `/coins`, `/unlocked`, Async Storage for the wallet key.

**Done when:** 15 coins unlock episode 4 and leave 5. A second unlock does not charge. With too few coins, the sheet goes to the store, the pack adds coins only, and the sheet is open again for a separate confirm. Reload keeps the balance and the unlocks. VIP stays disabled. Tests from PR 1 still pass. A storage failure keeps the session in memory.

## PR 9 — Login

**Scope:** Login UI, guest cancel, sign-in, pending save, toasts for Terms and Privacy. Auth key in Async Storage. Brand marks only if their use is approved. Otherwise use text buttons without the logos.

**Done when:** guest save from detail returns to detail after cancel, and saves after Email sign-in. Profile and Library open Login for a guest and open themselves after sign-in. Sign-in does not change coins.

## PR 10 — Library and Profile

**Scope:** empty and saved library, profile balance, get coins, sign out, reset with `Alert.alert`.

**Done when:** the saved flag shows the first three posters and survives reload. Sign-out keeps coins and unlocks and returns Home. Reset restores 15 coins, locks paid episodes, clears the saved flag, keeps the provider, and opens Home.

## PR 11 — Polish

**Scope:** safe areas on notched phones, Android back on the sheet and the stack, press feedback, screenshot comparison for Home, detail, player, sheet, and store. Fix spacing. Do not add a vertical feed or an 85-coin price in this PR.

**Done when:** the open questions in the audit are either still listed or decided in the PR text. No new product rule is slipped in.

## Integration checks

After PR 8 and PR 10, run through this path on iOS and Android:

1. Fresh install shows 15 coins and a guest.
2. Home → detail → episode 4 → sheet → confirm → 5 coins → success → play.
3. Kill and reopen. Balance is 5, episode 4 is unlocked, screen is Home.
4. Episode 5 with 5 coins opens the store. Buy 300. Balance is 305. Episode 5 is still locked until confirm. Then 295.
5. Guest opens Library and lands on Login. Guest cancel returns to the previous screen.
6. Sign in with Apple. Save the series. Library shows the saved rail.
7. Sign out. Coins stay. Reset. Coins are 15 and episode 4 is locked again.

## Explicit exclusions for every PR

- No real OAuth, payments, backend, or VIP purchase.
- No copying of Tailwind, DOM nodes, or the web `App.tsx` into `src/`.
- No change to EAS profiles, application ids, or CI unless a native module forces a config plugin, and then only that plugin.
- No merge without the owner’s approval.
