# Final Submission Audit

Updated: 2026-10-22, strict audit on PR #30.
Branch: `fix/release-guard` (PR #30) on `main` `50a258e`.

## ESLint: CI green, editor red

- **Root cause of the coverage gap:** `npm run lint` was `expo lint`, which lints only `src/`, `app/`, and `components/` when given no paths. `tests/`, `scripts/`, and the root config files never reached CI. The editor lints every open file. Fix: `npm run lint` is now `eslint .`, pinned by a toolchain test.
- **Counts (full repo, project config, type-aware rules):** before 2 errors (`simple-import-sort/imports` in `tests/domain/wallet-test.ts` and `tests/storage/web-storage-test.ts`). After 0 errors, 0 warnings, 150 files.
- **`no-unsafe-member-access … type that cannot be resolved`:** not reproducible from the CLI, on a clean clone or on the owner's working folder, with TypeScript 6.0.3 and typescript-eslint 8.72 (supported range). That message means an import resolved to TypeScript's `error` type in the editor's ESLint process. No `any`, `@ts-ignore`, `eslint-disable`, or weakened `no-unsafe-*` rule was added. If the editor still shows it: run `npx eslint <file>` in Terminal. If that is clean, restart the editor's ESLint service and make sure it uses the project `node_modules/typescript`.
- **Limit:** `eslint-plugin-import` rules load the macOS-only `unrs-resolver` binary, so they were switched off in the sandbox runs. CI (`npm ci` on Linux) runs them, now including `tests/`.

## Design check against FLASH.svg

Board frames rendered from `FLASH.svg` (`docs/audit/frames/`, local) compared with 390 px screenshots of a production web export.

| Screen                     | Finding                                                                                                   | Fix                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Home                       | Header overlaid the hero and covered the title painted into the artwork. The board has a header row.      | Header above the hero (`HomeScreen.tsx`).                   |
| Player                     | Portrait artwork cover-filled the full-height stage, cutting the painted title at both sides.             | Artwork in a top 3:4 frame with a fade (`PlayerStage.tsx`). |
| Login                      | Headline lines had different alignment: SVG text drew from the left of an estimated box.                  | `GradientTitle align="center"`, with a test.                |
| Library                    | Continue watching stacked one rail card per row.                                                          | One horizontal rail (`LibraryScreen.tsx`).                  |
| Unlock, Coin Store, Series | Match the board, minus intentionally unavailable products and data the app does not have (ratings, tags). | None.                                                       |

## Test coverage review

PR #30 removed the `loadAuth` tests together with that dead API. The session domain and store tests already cover guest defaults, provider-only persistence, corrupt records, overlap with sign-in, and sign-out keeping wallet and library. Added: a failed session write keeps the user a guest. Wallet, library, and verified-write tests (exactly-once charge, busy lock, rollback, reload) are unchanged. Test cases: 178 in 41 files (`main`: 176).

## Repository cleanup

- Untracked (kept on disk): `docs/audit/compare/after-*.png` (9 files, 6.9 MB, stale, unreferenced) and `docs/FIGMA_IMPLEMENTATION_PLAN.md` (finished branch plan).
- `.gitignore`: the blanket `/docs/` rule is replaced by exact patterns for the local notes, `docs/audit/`, `FLASH.svg`, and the prototype folder.
- No dependencies changed. All tracked assets are referenced.

## Earlier release-stage results

- PR #29 merged only its first five commits. The six audit commits (export guard, dead code, player text, not-found page, Saved empty line, reports) were still local. They were cherry-picked onto `fix/release-guard` without conflicts.
- Untracked user files (`FLASH.svg`, the prototype folder, design audits) were not touched.

## Validation

| Check                 | Result                                                                               | How                                                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript            | Pass                                                                                 | `tsc --noEmit` on a clean clone.                                                                                                  |
| Prettier              | Pass                                                                                 | `prettier --check .` on a clean clone.                                                                                            |
| Production web export | Pass                                                                                 | `APP_VARIANT=production expo export --platform web --clear` in a Linux sandbox. See note.                                         |
| Export guard          | Pass                                                                                 | `node scripts/check-web-export.mjs`: production variant in 16 bundles. It fails on the old development `dist/` (checked earlier). |
| ESLint                | Pass (partial)                                                                       | `eslint .` with the project config, type-aware rules on, `import/*` rules off (macOS-only resolver). 150 files, 0 errors.         |
| Jest, Expo Doctor     | **Not run**                                                                          | Jest needs the macOS-only `unrs-resolver` binary. Doctor needs network. The npm registry was blocked.                             |
| CI                    | Owner reports green on PR #30 before this audit's commits. Not seen by this session. | No GitHub access here.                                                                                                            |

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

| Severity     | Finding                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| P0           | Live web demo is the old development build. Redeploy.                                                 |
| P1           | Jest, Expo Doctor, and the `import/*` lint rules have not run on the final commits. CI will run them. |
| P1           | Android APK predates the image fix. Rebuild, or keep the README note.                                 |
| P2           | Home hero artwork carries another title painted in ("ECHOES OF ETERNITY"), as on the board.           |
| P2           | `DemoAuth.savedSeriesIds` overlaps with the library store.                                            |
| Out of scope | Real payments, real auth, streaming video, season unlock, VIP.                                        |

## Verdict

**NOT READY TO SUBMIT yet.** The branch passes typecheck, ESLint (type-aware), Prettier, a production export, and 31 browser checks after the design fixes. Submission needs the owner to:

1. Push `fix/release-guard` to PR #30 and get `npm run validate` and CI green.
2. Merge, then `npm run export:web && npx eas-cli@latest deploy --alias dramaflash-demo`.
3. Open the live URL: `/dev/reset-wallet` must redirect home, and Library posters must fit their cards.
4. Rebuild the Android APK and update the README links, or leave the README note as is.
