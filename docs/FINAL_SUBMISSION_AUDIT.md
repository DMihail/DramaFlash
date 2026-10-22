# Final Submission Audit

Branch: `feat/public-demo` (PR #29, not merged).
Code SHA audited: `6a2a3e5`. The commit that adds this file and `FINAL_RECRUITMENT_EVALUATION.md` follows it.
Date: 2026-10-22.

## How this audit ran

| Environment                | What ran                                                                | What could not run, and why                                                                                                                         |
| -------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Linux sandbox, clean clone | `tsc --noEmit` (pass), `prettier --check .` (pass), export-guard script | ESLint, Jest, `expo export`: the repo's `node_modules` holds macOS-only native bindings (`unrs-resolver`, `esbuild`). The npm registry was blocked. |
| Browser on the owner's Mac | Live web demo journeys, bundle inspection, console, local storage       | The live demo is an older build (see Distribution).                                                                                                 |
| Owner's Mac terminal       | Nothing. Remote control could click but not type in Terminal.           | `npm run validate`, `npm run export:web`, Maestro, simulators, `git push`                                                                           |
| GitHub                     | PR page read over the public web                                        | Push and CI: this session has no GitHub access. The PR page showed no check results.                                                                |

Nothing below is marked as passing unless it ran in this session.

## Bugs found and fixed

| ID  | Severity | Bug                                                                                                                                                                                                 | Fix                                                                                                                                                                                     | Commit    |
| --- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| B1  | P1       | "Get coins" pushed the Coin Store while the unlock `Modal` stayed open on top of it. Seen on the first live deploy. The 15:04 redeploy includes the fix (verified live: no dialog after Get coins). | Close the sheet before `router.push`. Test asserts the sheet is gone.                                                                                                                   | `4b199a1` |
| B2  | P0       | The live web demo is a development-variant bundle (`appVariant:"development"` in `entry-*.js`). `/dev/reset-wallet` returned 200 and erased the wallet.                                             | `export:web` pins `APP_VARIANT=production`, clears the Metro cache, and runs `scripts/check-web-export.mjs`, which fails on any non-production bundle. Toolchain test locks the script. | `98bd51b` |
| B3  | P2       | Player status read "Paused artwork preview. Artwork preview. No video is playing."                                                                                                                  | Message is now "Paused artwork preview. No video is playing." Test pins the full sentence.                                                                                              | `5828673` |
| B4  | P2       | Unknown URLs showed Expo Router's default "Unmatched Route" page with a Sitemap link.                                                                                                               | Branded `+not-found` route with a Go to Home button. New test.                                                                                                                          | `b5b4fa5` |
| B5  | P2       | With Continue watching items but no saves, the Saved tab rendered nothing.                                                                                                                          | Empty line, matching the Purchases tab. Library test asserts it.                                                                                                                        | `6a2a3e5` |

B2 is fixed in the repo only. The live site keeps the bug until it is redeployed with `npm run export:web`.

## Refactoring and removed code

Removed (no screen or store called them; checked with a whole-repo search):

- `purchaseCoins` (duplicate of `grantCoinPack` by index). Its tests now use `grantCoinPack`, with the same assertions.
- `readStoredWallet`, `writeStoredWallet`, `guestSession`: zero callers, including tests.
- `loadAuth`, `resetSavedSeries`, `isSeriesSaved`, `AUTH_STORAGE_KEY`, and two private helpers: the pre-store auth persistence. The session and library stores replaced it. Their tests were removed with them. Sign-in, sign-out, ticket, and toggle tests stay.
- `storyCastRoleNote`: a design note exported as a constant. Now a comment on the cast entry.
- `src/app/unlocked.tsx`: a placeholder route from the first app shell. Nothing links to it.

Kept on purpose:

- `api/series` `fetch*` helpers. Only tests call them, but those tests cover mock delay and abort behavior the screens rely on.
- `domain/auth` `DemoAuth.savedSeriesIds` and `toggleSavedSeries`. Home still uses them for the login ticket. They overlap with the library store (see Remaining findings, P2).

No dependencies were added or removed. No stable module was rewritten.

Test count: 175 test cases in 40 files (counted with `git grep`). `main` has 174. This PR adds 2 image-scaling cases (owner's commits), 2 toolchain cases, and 1 not-found case, and removes 4 legacy `loadAuth` cases. Assertions also changed in the wallet, auth, player, and library tests.

## Code review summary

- **Wallet.** Charges happen in pure `confirmUnlock`. The store holds a lock and publishes a new balance only after `commitWallet` writes, reads back, and verifies the JSON. A failed write restores the old bytes. Corrupt data reports `error` and is not replaced by a fresh 15-coin wallet. Live check: a double-click on Confirm charged exactly 10 coins once.
- **Reset routes.** Gated by `isDevelopmentRuntime()` in the route, the Profile row, and both stores. The gate is correct. Only the build variant was wrong (B2).
- **Auth.** Stores only the provider (`{"schema":1,"provider":"email"}` seen in local storage). No email, password, or token is written. Sign-out leaves the wallet and library alone (verified live).
- **Library and progress.** Versioned records, verified writes, a locked episode is skipped in Continue watching.
- **Image scaling (PR commits `9425348`–`c292ca0`).** Code review: every `Image` without explicit width and height now uses `fillFrame` (100% width and height), and the web `CoverImage` forces 100% on the `<img>`. That matches the root cause: React Native Web keeps the asset's pixel size. Not verified visually: the live build predates these commits (its bundle still has the old `height:255` poster).

## Design comparison

Compared the board frames in `docs/audit/frames/` with the live web demo (390 px wide).

- Home hero: the board itself paints "ECHOES OF ETERNITY / A LOVE FORBIDDEN" into the hero image. The app matches the board. Under the "The CEO and I" title it reads as a mismatch. P2, needs a design decision, not a code fix.
- Series details, player, unlock sheet, coin store, login: layout, gradients, and copy match the earlier fidelity work. The login gradient headline (#28) is live.
- Library grid: the live build shows a poster painted at full asset size (only "TH" of the title visible). This is the bug the PR's fill-frame commits fix. Visual confirmation is pending a redeploy.

## E2E results

Executed on the live web demo in a real browser. These are genuine end-to-end runs on the deployed (older) build, not on HEAD. Some taps used DOM `click()` because the browser tool's synthetic pointer events did not reach some React Native Web `Pressable`s. The app handled the events the same way.

| #   | Journey                           | Result                                                                                             |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1   | Fresh launch and browsing         | Pass. Home rails render. No console errors.                                                        |
| 2   | Series details by direct link     | Pass. `/series/the-ceo-and-i` loads on refresh.                                                    |
| 3   | Free episode                      | Pass. Episode 1 shows the preview. Progress is saved.                                              |
| 4   | Locked episode                    | Pass. Episode 4 shows the lock card. Opening it does not charge.                                   |
| 5   | Exactly-once 10-coin charge       | Pass. 15 → 5. One unlock record.                                                                   |
| 6   | Rapid repeated taps               | Pass. Double-click on Confirm: one charge.                                                         |
| 7   | Insufficient balance → Coin Store | Pass. "You need 5 more coins", then the store opens with the episode context.                      |
| 8   | Modal dismissal on Get coins      | Failed on the first deploy (B1). Pass on the current live build after the fix.                     |
| 9   | Save and remove a series          | Pass. Removal persisted.                                                                           |
| 10  | Continue watching                 | Pass. Library and Profile show episode 2 after playing it.                                         |
| 11  | Sign-in, sign-out, guest          | Pass. Email demo sign-in, session survives refresh, sign-out keeps wallet and library.             |
| 12  | Persistence after refresh         | Pass for wallet, unlocks, library, progress, and session.                                          |
| 13  | Invalid navigation                | Pass for bad series and bad episode. Unknown URL showed the default Expo page (B4, fixed in repo). |
| 13  | Storage failures                  | Not run live. Covered by unit and integration tests in the repo (not executed this session).       |

Maestro: 9 flows exist in `tests/e2e/maestro`. Not run in this session (no simulator or emulator access).

## Distribution

| Target  | Status                                                                                                                                                                                                                                                                                                                 |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web     | Live at the README URL. **Stale and a development build.** It was exported at about 15:03 on 22 Oct: it has the modal fix (B1) but not the image commits. Redeploy: `npm run export:web && npx eas-cli@latest deploy --alias dramaflash-demo`. Then check that `/dev/reset-wallet` redirects home.                     |
| Android | EAS build `699aace0` page shows "Succeeded" with an Install button (checked in a browser). Its commit is not shown. The README link was added before the image fix and this audit's fixes, so the APK does not contain them. Rebuild with the `preview` profile. Install and launch were not verified in this session. |
| iOS     | No public route. Ad hoc needs device UDIDs. TestFlight needs a paid Apple Developer account. Nothing was changed. The web demo is the fallback.                                                                                                                                                                        |

## CI

Not verified. The PR page showed no check results, and this session cannot read the Actions API. The owner's PR description lists `npm run validate` as done locally. That run predates this audit's commits.

## Remaining findings

| Severity     | Finding                                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------- |
| P0           | Live web demo is a development build. Fixed in the repo. **Redeploy required.**                                     |
| P1           | Android APK predates the image-scaling fix and this audit's fixes. **Rebuild required.**                            |
| P1           | `npm run validate` and CI have not run on the audited commits.                                                      |
| P2           | `DemoAuth.savedSeriesIds` duplicates the library store's saved ids.                                                 |
| P2           | Home hero artwork carries another title painted into the image.                                                     |
| P2           | `PlayerScreen.tsx` (476 lines) and `LoginScreen.tsx` (490 lines) are the largest screens and the hardest to review. |
| P2           | No screenshots in the README.                                                                                       |
| Out of scope | Real payments, real auth, video streaming, season unlock, VIP.                                                      |

## Verdict

**NOT READY as of this commit.** The code is in good shape. The deployed artifacts are not. It becomes ready when the owner:

1. runs `npm run validate` on the Mac and it passes,
2. redeploys the web demo with `npm run export:web` and checks `/dev/reset-wallet` redirects,
3. rebuilds the Android preview APK and updates the README link,
4. pushes `feat/public-demo` and CI is green.
