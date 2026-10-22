# Final Recruitment Evaluation

Role: Senior Mobile App Developer (React Native), TargetVideo.
Code SHA evaluated: `6a2a3e5` on `feat/public-demo` (PR #29).
Evidence: see `FINAL_SUBMISSION_AUDIT.md`. The original assignment text is not in the repository, so requirements are taken from the README scope (browse, series details, free and paid episodes, coin unlock, library, demo sign-in). No extra requirements were invented.

Scores describe the project **as a reviewer would meet it today**: the live web demo and APK are older builds than the code.

## 1. Senior React Native engineer — 7/10

Evidence for:

- Wallet writes are verified by read-back, rolled back on failure, and published only after storage accepts them. Corrupt data is never silently reset to 15 coins.
- Business rules are pure TypeScript functions (`confirmUnlock`, `grantCoinPack`) with direct unit tests. 175 test cases.
- Strict TypeScript (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`), React Compiler on, typed routes.
- MMKV 4 on Nitro with web local storage, behind one `LocalStorage` interface. Development and production variants have separate app ids and schemes.
- Live run: a double-click on Confirm charged exactly once.

Evidence against:

- A modal stayed open over the next screen (B1). It reached the first deploy because tests mocked the router push but did not assert that the sheet closed.
- A development bundle was deployed publicly (B2). The guard now exists, but only after the fact.
- `DemoAuth.savedSeriesIds` overlaps with the library store. Two large screens (`PlayerScreen`, `LoginScreen`, about 480 lines each).
- No native E2E ran in this audit. Maestro flows exist but have no recorded run.

## 2. HR / recruiter (five-minute review) — 6/10

- Minute 1: the README opens with "Try DramaFlash", a live link, and a six-step tour. Clear.
- Minutes 2–4: the web demo looks polished: dark theme, real artwork, smooth flows, honest "demo only" labels.
- What hurts: the Home hero shows "ECHOES OF ETERNITY" painted under "The CEO and I". In the current live build, Library posters are cropped to a corner ("TH"). A recruiter who hits either will notice.
- No screenshots in the README. No iOS install (explained, with a fallback).

After a redeploy of the current code, the crop issue should go away (not yet seen live). A score of 7–8 is realistic then.

## 3. Tech lead / hiring manager — 7/10

- Good scope control: season unlock, VIP, and membership stay visibly unavailable. Nothing fakes payments or credentials.
- Small, focused PR history with clear commit messages. `AGENTS.md` sets working rules.
- Persistence design shows senior judgment: markers that stop a missing file from looking like a new install, and a recover-on-error MMKV strategy with a written reason.
- Concerns: release discipline. Two separate artifacts (web and APK) were published from builds that do not match the branch. The repository also carries many audit and design documents, which can read as noise.

## 4. Automated code reviewer — 7/10

- Requirement coverage: all README-listed flows exist and were exercised on the web.
- Duplication and dead code: reduced in this audit (see audit). Remaining overlap: `DemoAuth` vs library store.
- Security: no secrets in the bundle. Session stores only the provider. Dev reset routes are gated, and now the build is gated too.
- Misleading claims to fix: the README says the APK was "Installed and launched on an emulator". This audit did not verify that, and that APK predates the image-scaling fix and this audit's fixes. The README also implies the live demo is current. It is not until redeployed.

## Top three strengths

1. Careful persistence and wallet correctness, with tests for failure paths.
2. A demo that runs in a browser in one click, with honest "simulated" labels.
3. Clean domain/UI separation and strict typing.

## Top three weaknesses

1. Deployed artifacts lag the code, and one is a development build.
2. Visible polish gaps on first contact (hero title clash, the stale build's poster crop).
3. No recorded native E2E run or CI result for the final commits.

## Potential rejection reasons

- A reviewer opens `/dev/reset-wallet` or sees the poster crop and judges release quality.
- The README claims something the reviewer cannot reproduce (APK contents, current web build).
- The volume of AI-style audit documents raises questions about authorship.

## Likely interview questions

1. Why verify the wallet by reading it back? What can MMKV or `localStorage` do that makes this necessary?
2. How do you stop a double charge? Why a module-level lock instead of only a disabled button?
3. Why does `Modal` stay above navigation, and how would you test that?
4. How do development and production variants differ, and how did a development bundle reach production?
5. Why can Expo Go not run this app? What are Nitro Modules?
6. Zustand without the persist middleware: why commit manually?
7. How would you replace the artwork preview with real video (`expo-video`), and what changes for memory and lists?
8. How would you add real purchases (StoreKit, Play Billing) without breaking the wallet guarantees?

## Recommendation

**NOT READY today; READY after four owner steps:**

1. `npm run validate` passes on the Mac.
2. Redeploy the web demo with `npm run export:web`, then confirm `/dev/reset-wallet` redirects home and Library posters fill their cards.
3. Rebuild the Android preview APK, install it with Metro off, and update the README link.
4. Push `feat/public-demo` and confirm CI is green.
