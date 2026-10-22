# Final Submission Audit

Updated: 2026-10-22, release stage.
`main`: `50a258e` (PR #29, squash-merged).
Release branch: `fix/release-guard` on top of `main`. It carries the audit commits that were not part of the PR #29 merge, plus README screenshots and this report.

## Repository state

- PR #29 merged only its first five commits. The six audit commits (export guard, dead code, player text, not-found page, Saved empty line, reports) were still local. They were cherry-picked onto `fix/release-guard` without conflicts.
- Untracked user files (`FLASH.svg`, the prototype folder, design audits) were not touched.

## Validation

| Check                     | Result      | How                                                                                                                               |
| ------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript                | Pass        | `tsc --noEmit` on a clean clone.                                                                                                  |
| Prettier                  | Pass        | `prettier --check .` on a clean clone.                                                                                            |
| Production web export     | Pass        | `APP_VARIANT=production expo export --platform web --clear` in a Linux sandbox. See note.                                         |
| Export guard              | Pass        | `node scripts/check-web-export.mjs`: production variant in 16 bundles. It fails on the old development `dist/` (checked earlier). |
| ESLint, Jest, Expo Doctor | **Not run** | ESLint and Jest need the macOS-only `unrs-resolver` binary in `node_modules`. Doctor needs network. The npm registry was blocked. |
| CI                        | **Not run** | This session has no GitHub access. The branch is not pushed.                                                                      |

Note on the export: `app.config.ts` loads `tsx`, whose `esbuild` binary is macOS-only, so the sandbox used a plain-JS copy of the same variant logic. Global CSS went through a pass-through stub because no Linux `lightningcss` binary is installed. Both changes lived only in the sandbox clone. JavaScript bundles, routes, and assets are the real Metro output. Run `npm run export:web` on macOS for the deployable build.

## Production bundle security (from the export)

- `appVariant` is `production` in every bundle. The development check `'development'===e.appVariant` is present but false.
- The image fix is in the bundle (`height:254` posters; the old `height:255` is gone).
- No `EXPO_PUBLIC_` variables, tokens, or keys. Search hits for "secret" and "password" are series titles and React Native Web input handling.
- `/dev/reset-wallet` and `/dev/reset-library` still exist as route chunks, but in a browser they redirect home and leave stored data unchanged (see journeys).

## Browser journeys on the production export

Playwright with Chromium, against the exported files served as `expo serve` rendered them. 31 checks, all pass, on three consecutive runs. Zero console errors apart from the expected 404 for the unknown-route test.

| Area                     | Checks                                                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Layout at 390, 360, 1440 | Home renders. Every image fits its card on Home, Discover, Series, Player, and Library.                         |
| Browse and play          | Discover, series direct link, free episode 1, player text "Paused artwork preview. No video is playing."        |
| Unlock                   | Episode 4 locked and free to open. Double-click on Confirm: 15 → 5, one unlock. Reopen: no second charge.       |
| Insufficient balance     | Get coins opens the store with no dialog left. Demo pack: 5 → 305. Unlock: 305 → 295.                           |
| Library                  | Save persists. Continue watching and saved poster shown. Reload keeps wallet, unlocks, and library.             |
| Auth                     | Email demo sign-in stores only `{"schema":1,"provider":"email"}`. Session survives reload. Sign-out keeps data. |
| Security                 | `/dev/reset-wallet` and `/dev/reset-library` redirect home, data unchanged. Profile reset row disabled.         |
| Invalid routes           | Unknown series, out-of-range episode, and unknown URL (branded "Page not found", HTTP 404).                     |

The image check compares each `<img>` with its card. Run against the current live site, the same check flags posters painted at 832×1248 inside 130×195 cards.

## Live deployments

| Target  | State                                                                                                                                                                                                                                             |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web     | **Stale.** Still a development bundle from before the image fix. `/dev/reset-wallet` returns 200 and resets data. Needs `npm run export:web && npx eas-cli@latest deploy --alias dramaflash-demo` from `fix/release-guard` or `main` after merge. |
| Android | **Stale.** EAS build `699aace0` (Succeeded) predates the image fix. Needs `npx eas-cli@latest build --platform android --profile preview`. Install and launch were not verified in this session.                                                  |
| iOS     | No public route. Ad hoc needs device UDIDs. TestFlight needs a paid Apple Developer account. The web demo is the fallback.                                                                                                                        |

## Bugs fixed across the audit

| ID  | Severity | Bug                                                                 | Status                                                                         |
| --- | -------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| B1  | P1       | Unlock sheet stayed over the Coin Store after Get coins.            | Fixed in PR #29. Verified on the export and on the live site.                  |
| B2  | P0       | Public web demo was a development bundle with working reset routes. | Guard on `fix/release-guard`. Verified on the export. **Live needs redeploy.** |
| B3  | P2       | Player text repeated "artwork preview".                             | Fixed. Verified on the export.                                                 |
| B4  | P2       | Unknown URLs showed Expo's default page with a Sitemap link.        | Fixed. Verified on the export.                                                 |
| B5  | P2       | Saved tab blank when only Continue watching had items.              | Fixed. Unit test added (not run).                                              |
| B6  | P1       | Posters and stills painted at asset size on web.                    | Fixed in PR #29. Verified on the export. **Live needs redeploy.**              |

Dead code removed: `purchaseCoins`, `readStoredWallet`, `writeStoredWallet`, `guestSession`, `loadAuth`, `resetSavedSeries`, `isSeriesSaved`, the old auth storage key, `storyCastRoleNote`, and the `/unlocked` placeholder route. Test cases: 175 on the release branch, 176 on `main`. The branch removes 4 legacy `loadAuth` cases and adds 3 (2 toolchain, 1 not-found).

## Remaining findings

| Severity     | Finding                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------- |
| P0           | Live web demo is the old development build. Redeploy.                                       |
| P1           | `npm run validate` (ESLint, Jest, Doctor) and CI have not run on the release branch.        |
| P1           | Android APK predates the image fix. Rebuild, or keep the README note.                       |
| P2           | Home hero artwork carries another title painted in ("ECHOES OF ETERNITY"), as on the board. |
| P2           | `DemoAuth.savedSeriesIds` overlaps with the library store.                                  |
| Out of scope | Real payments, real auth, streaming video, season unlock, VIP.                              |

## Verdict

**NOT READY TO SUBMIT yet.** The release branch is verified in a production export. Submission needs the owner to:

1. Push `fix/release-guard`, open its PR, and get `npm run validate` and CI green.
2. Merge, then `npm run export:web && npx eas-cli@latest deploy --alias dramaflash-demo`.
3. Open the live URL: `/dev/reset-wallet` must redirect home, and Library posters must fit their cards.
4. Rebuild the Android APK and update the README links, or leave the README note as is.
