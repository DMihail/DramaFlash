# Final Recruitment Evaluation

Role: Senior Mobile App Developer (React Native), TargetVideo.
Updated: 2026-10-22, strict audit on PR #30. Evaluated: `fix/release-guard` on `main` `50a258e`.
Evidence: `FINAL_SUBMISSION_AUDIT.md`. The original assignment text is not in the repository, so scope comes from the README.

Two scores per perspective. **Today** is what a reviewer meets now: the live demo and APK are stale. **After release** assumes the owner redeploys, rebuilds, and CI passes. That second score rests on the production export verified here.

| Perspective                  | First audit | Release stage | Now (code) | After release |
| ---------------------------- | ----------- | ------------- | ---------- | ------------- |
| Senior React Native engineer | 7           | 7             | 8          | 8             |
| HR / recruiter               | 6           | 5             | 5          | 8             |
| Tech lead / hiring manager   | 7           | 7             | 7.5        | 8             |
| Automated code reviewer      | 7           | 7             | 8          | 8             |

"Now (code)" scores the branch. HR stays at 5 because a recruiter sees the live site, which is still the old build.

Changes since the release stage: lint now covers tests and scripts (the CI and editor gap), four visual fixes against `FLASH.svg` (Home header, player artwork, login headline, Continue watching rail), one added failure test, and 7 MB of stale audit images untracked.

## Senior React Native engineer

- For: verified-write wallet with rollback, never resets corrupt data. Pure domain rules with tests (175 cases). Strict TypeScript. MMKV on Nitro behind one storage interface. In a production export, 31 browser checks pass, including the double-tap charge, persistence after reload, and safe dev routes.
- Against: ESLint, Jest, and Doctor have not run on the release branch. No native E2E run recorded. `DemoAuth` overlaps with the library store. Two large screens.
- Why not higher after release: no recorded native device run, and a pure-JS storage seam the interviewer may probe.

## HR / recruiter

- README top now shows the pitch, three screenshots, the stack, the live link, a tour, and an honest "what is simulated" list.
- Today the live link opens an older build. Posters are blown up in Library and rails, and `/dev/reset-wallet` works. That is why "today" drops to 5: the README screenshots no longer match the live site.
- After a redeploy, the live site matches the screenshots. The home hero's painted "ECHOES OF ETERNITY" title remains the one visible oddity.

## Tech lead / hiring manager

- Good: scope control, honest demo labels, careful persistence, a build guard that turns a real release mistake into a failing check.
- Concern: two releases shipped from builds that did not match the branch, and a squash merge left six reviewed commits behind. These are process gaps, and both come up in an interview.

## Automated code reviewer

- Requirement coverage: all README flows exercised in a browser on the production export.
- Dead code: reduced (see audit). No secrets in the bundle.
- Claims: the README now says the APK predates the image fix. The web link is accurate only after redeploy.

## Strengths

1. Wallet and persistence correctness, including failure paths.
2. One-click browser demo with honest simulated labels.
3. A release guard tested on a real export.

## Weaknesses

1. Live demo and APK lag the code until the owner redeploys and rebuilds.
2. Lint, unit tests, and CI not yet run on the release branch.
3. Painted title in the home hero artwork.

## Likely interview questions

1. Why read the wallet back after writing it? What can MMKV or `localStorage` do that makes this necessary?
2. How do you prevent a double charge beyond disabling the button?
3. Why does `Modal` stay above navigation, and how would you test it?
4. How did a development bundle reach production, and what stops it now?
5. Why can Expo Go not run this app?
6. How would you add `expo-video` playback and real store purchases without breaking the wallet guarantees?

## Recommendation

**NOT READY today. READY after the four owner steps in the audit's Verdict.** No code blockers are known on `fix/release-guard`.
