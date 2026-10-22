# DramaFlash — Submission

Internal checklist and email draft. Items marked **NOT READY** must be resolved before sending.

## Status of links

| Item                  | Link                                                     | Status                                                                                                                |
| --------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| GitHub repository     | https://github.com/DMihail/DramaFlash                    | Verified public. Final branch `fix/final-qa` still needs push, PR, CI, and merge.                                     |
| Live web demo         | https://dramaflash--dramaflash-demo.expo.app/            | **NOT READY.** The URL works, but it still serves an older development build. Redeploy needed.                        |
| Android APK           | —                                                        | **NOT READY.** New EAS preview build not started yet. Do not send the old APK link.                                   |
| Demo video            | `deliverables/DramaFlash_Demo.mp4` (70 s, H.264, 3.6 MB) | Ready as a file. After push it is also at `github.com/DMihail/DramaFlash/blob/main/deliverables/DramaFlash_Demo.mp4`. |
| Waddington's Auctions | https://apps.apple.com/app/id6502690253                  | Store page verified. **Your contribution text: to fill.**                                                             |
| Rejsespejder          | https://apps.apple.com/app/id1107399591                  | Store page verified. **Your contribution text: to fill.**                                                             |

## Project description

DramaFlash is a short-drama streaming prototype (Option A). Users browse series, watch free episodes, reach a locked episode, and unlock it with demo coins. One Expo codebase runs on Android, iOS, and the web.

## Option A user journey

1. Start as a guest and browse Home and Discover.
2. Open a series and play a free episode (episodes 1–3).
3. Reach the locked episode 4 and open the unlock sheet.
4. Confirm the 10-coin unlock (15 → 5 coins) and keep watching.
5. With too few coins, buy a demo coin pack and unlock the next episode.
6. Sign in with the demo login, then see Profile and Library (Continue watching, Saved, Purchases).
7. Restart: coins, unlocks, saves, and progress persist.

## Architecture and decisions

- Expo SDK 58, React Native 0.88, TypeScript (strict), Expo Router, React Compiler.
- Business rules are pure functions (`src/domain/`); Zustand stores call them.
- MMKV (Nitro) on native and `localStorage` on the web, behind one storage interface. Each write is verified by reading it back, failed writes roll back, and corrupt data is never silently reset.
- A store-level lock prevents double coin charges from repeated taps.
- A typed local mock API (`src/api/`) gives real loading, cancel, and error states without a server.
- Separate development and production app variants. The web export fails if it is not production.
- Tests: 179 Jest tests, 9 Maestro flows, and a 39-check Playwright journey on the production web export.

## Known limitations

- No real video streaming, payments, accounts, or server-side entitlements (all simulated and labeled).
- No public iOS install; the web demo works on iPhone.
- Usage terms of the artwork from the design reference (`FLASH.svg`) to be confirmed.

## Email draft (to Aleksandra)

> Do not send until every NOT READY item above is resolved and the two contribution lines are filled in.

**Subject:** TargetVideo assignment — Mihail Dzhezhelo (Senior Mobile App Developer, React Native)

Hi Aleksandra,

Thank you for the opportunity. Here are both parts of the assignment.

**Part 1 — Published apps**

- **Waddington's Auctions** — https://apps.apple.com/app/id6502690253
  _[Your role and contributions — to fill]_
- **Rejsespejder** — https://apps.apple.com/app/id1107399591
  _[Your role and contributions — to fill]_

**Part 2 — DramaFlash (Option A prototype)**

DramaFlash is a short-drama app built with Expo and React Native. You can browse series, watch free episodes, reach a locked episode, and unlock it with demo coins. Payments, sign-in, and the backend are simulated and clearly labeled in the app.

- Source code: https://github.com/DMihail/DramaFlash
- Live web demo: https://dramaflash--dramaflash-demo.expo.app/ _(NOT READY until redeployed)_
- Android APK: _(NOT READY — new build link)_
- Demo video (70 s): _(attach `DramaFlash_Demo.mp4` or use the GitHub link after push)_

The README explains the architecture, what is simulated, the tests, and the known limitations.

Best regards,
Mihail Dzhezhelo
