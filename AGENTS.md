# DramaFlash

DramaFlash is an Expo SDK 58 app for iOS and Android. Use React Native, TypeScript strict mode, and Expo Router.

Prioritize iOS and Android compatibility, performance, and code that is easy to maintain.

## Rule files

Shared engineering rules live in this file. Cursor reads it from the repository root.

Cursor also supports project rules in `.cursor/rules/` as `.mdc` files. A plain `.md` file in that folder is ignored. Use `.cursor/rules/` only for Cursor behavior. Do not copy these shared rules into a new `.mdc` file.

| File                                     | Who reads it            | What it covers                                                                                                 |
| ---------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md`                              | Every coding agent      | App stack, React code quality, React Compiler, Expo docs, git, checks, how to talk to the user, GitHub writing |
| `.cursor/rules/github-communication.mdc` | Cursor only, every chat | Do not add Cursor signatures or automatic AI co-author lines                                                   |

## Local plans

Before building a screen, read the local plans. They are not in git:

`docs/PROTOTYPE_AUDIT.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md`, `docs/MIGRATION_MAP.md`, and `docs/IMPLEMENTATION_PLAN.md`.

`references/DESIGN_GUIDE.md` is local too. Do not commit these files.

## Expo has changed — do not trust your training data

Follow the official docs for the Expo SDK installed in this repo. Expo changes APIs in every SDK release. Names you remember may be wrong.

Before writing code that uses an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch `https://docs.expo.dev/llms.txt` and open the page you need. Do not answer from memory.

## Project

- Use native React Native components and Expo APIs.
- Do not copy React DOM or CSS code from Figma Make.
- Keep the architecture simple. Do not add abstractions you do not need.
- Install packages with `npx expo install <package>` so the version matches the SDK. Do not use `npm install`, `yarn add`, `pnpm add`, or `bun add` for Expo packages.
- This repo uses npm and `package-lock.json`. Use `bunx` only if `bun.lock` is present.
- Never commit secrets, credentials, or generated native folders. Examples: `.env`, `credentials.json`, keystores, provisioning profiles, `ios/`, and `android/`.
- If `ios/` and `android/` are missing, Expo generates them (Continuous Native Generation). Do not create or edit them by hand. Configure native behavior in `app.json` and config plugins.
- Expo Go only includes its own native modules. After you add a library with native code, use a development build: `npx expo run:ios` or `npx expo run:android` locally, or `eas build --profile development`.
- Prefer Expo modules over third-party libraries. Check project skills before you add a dependency. Docs: `https://docs.expo.dev/versions/latest/index.md`

## React and React Native

Follow modern React, React Native, TypeScript, and Expo practice.

- DRY: do not duplicate business logic, styles, or data transformations.
- KISS: prefer a simple, readable solution over a new abstraction.
- Single responsibility: each component, hook, and function should have one clear purpose.
- Separation of concerns: keep rendering, navigation, business rules, and persistence apart where that stays practical.
- Prefer composition over inheritance.
- Prefer pure functions for business rules and data transformations.
- Prefer explicit TypeScript types and clear component props.
- Keep Expo Router route files thin. Put screen UI in feature folders.
- Do not add a dependency or an architectural layer you do not need.

### JSX handlers

Extract an event handler into a named function when it contains navigation, business logic, a conditional branch, more than one statement, a state change combined with another action, or repeated behavior.

A simple one-line callback may stay inline when the name would not make the JSX clearer. Do not extract every callback.

### Performance

- Do not use `useCallback`, `useMemo`, or `React.memo` by default.
- Use them only for a measured performance problem or a real identity requirement, such as a library that needs a stable function.
- Do not store derived data in state when it can be calculated from props or state during render.
- Do not use `useEffect` for work that belongs in an event handler.
- Use an effect to synchronize with an external system, and keep that effect focused.
- Do not store the same state in more than one place.
- Avoid extra Context providers and global stores.
- Keep data flowing in one direction.

### Components

- Keep a component focused on one responsibility.
- Extract a component when it is reused, or when that makes a complex screen easier to read.
- Do not create a component for every small `View` or `Text`.
- Keep feature-specific components in that feature folder.
- Move a component to shared UI only when more than one feature needs it.
- Use composition and typed props.
- Avoid a large component with many boolean props.
- Do not add a custom hook unless it removes real duplication or hides a real external subscription.

### React Native UI

- Use native React Native components and Expo APIs.
- Use the existing design tokens and shared UI components.
- Keep styles next to the component with `StyleSheet.create`.
- Avoid an inline style object when a named style can express it. A dynamic value may stay inline.
- Respect safe areas, accessibility, and platform differences.
- Use `FlatList` for a long or dynamic list.
- Do not add an animation or gesture library without a clear need.

## Platform APIs

Prefer official Expo and React Native APIs over custom implementations for nontrivial platform features. Before adding a dependency, check existing packages and official SDK support. Use maintained libraries when they clearly reduce complexity, improve reliability, or provide native capabilities. Keep simple domain logic as pure TypeScript functions. Avoid reinventing platform functionality, unnecessary dependencies, and premature abstractions. Follow DRY, KISS, modern React patterns, and React Compiler requirements.

## State

Use Zustand for shared client state and MMKV for persistent local state. Keep screen-local state in React components and domain logic in pure TypeScript. Use typed selectors, validated persistence, explicit schema migrations, and feature-focused stores. Do not add Context providers for general application state without a clear reason. Preserve persisted user data during storage migrations. Do not show a successful wallet transaction before its storage write succeeds.

The demo wallet is the shared persistent state for coin balance and paid episode unlocks. Saved series and the last opened episode live in one library store. Demo sign-in lives in its own store and saves only the provider: guest, Google, Apple, or email. It does not save a password, token, or email address. Signing in or out does not change the wallet or the library. A guest can save a series on this device. That save does not sign the guest in. On the web, the same records use browser local storage instead of MMKV. Web and native installs do not share that data. Search text, genre filters, notices, the unlock sheet, the selected coin pack, and the player session stay on the screen. Episode labels are derived. Series and player requests stay in their screen hooks.

## Loading and performance

Prefer native Expo and React Native capabilities over custom platform code when they provide a clear benefit.

Use lazy loading and list virtualization when the content size or a measured performance problem justifies them.

Every asynchronous screen must handle loading, success, empty, error, retry, and cancellation when those states apply.

Prefer accessible animated skeletons for full-screen loading. Use React Native Animated for a simple animation. Use Reanimated when an advanced animation or gesture needs it.

Respect Reduced Motion. Stop animations when the component unmounts.

Evaluate React `Activity` before using it on a native screen. Do not assume DOM behavior works in React Native. Do not use it only to try the API, and do not hide a video player with it unless playback and resource cleanup are verified.

Choose `ScrollView`, `FlatList`, or `SectionList` from the data shape and the rendering need. Do not force `SectionList` onto horizontal groups.

Follow the React Compiler, strict TypeScript, DRY, and KISS rules in this file. Keep tests in the root `tests/` directory.

## React Compiler

React Compiler is enabled with `experiments.reactCompiler` in `app.json`. Expo SDK 58 configures Babel for it. Do not add a custom Babel config or a second compiler plugin.

`eslint-config-expo` already includes the React Compiler lint rules through `eslint-plugin-react-hooks`. Do not add `eslint-plugin-react-compiler`.

Write components and hooks that follow the Rules of React:

- Keep components pure during rendering.
- Never mutate props or React state directly.
- Do not run a side effect during rendering.
- Update state immutably.
- Call hooks unconditionally, at the top level.
- Avoid an effect that only copies props into state.
- Trust the compiler for automatic memoization where it supports the code.
- Do not add `useMemo`, `useCallback`, or `React.memo` unless a measurement or an integration requires it.
- Do not use a compiler directive such as `'use no memo'` to hide incorrect React code.

Use modern React 19.3 APIs and hooks when they improve clarity, performance, or user experience. Prefer the simplest correct React pattern. Do not force new hooks into code where basic hooks or plain functions are better. Follow the Rules of React and keep all components compatible with React Compiler.

Series details loads with `useEffect` and `AbortSignal`. That request is read-only, so it does not use `use`, Suspense, `useOptimistic`, or `useActionState`.

## Navigation

- Use Expo Router for all navigation.
- Routes live in `src/app/`. Every file there is a screen. `_layout.tsx` files define navigators.
- Keep components, hooks, and utils outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: `https://docs.expo.dev/router/introduction.md`

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`). Run the CLI as `npx eas-cli@latest <command>`. If `bun.lock` is present, use `bunx eas-cli` instead. Do not rely on a global `eas` binary.

Docs: `https://docs.expo.dev/eas/index.md`

## Tests

All application tests must be located in the root tests/ directory. Do not place test files inside src/. Organize tests by feature or domain, and keep them included in TypeScript, ESLint, Jest, and CI validation.

Use stable testID props for important interactive elements and UI states. Keep test IDs consistent, unique, and independent of visible text. Preserve accessibility labels. Put all unit, component, and E2E tests under the root tests/ directory. Prefer user-facing interaction tests and maintain a small set of reliable Maestro flows for critical navigation paths. Do not claim E2E verification without executing the flows on a real simulator or emulator.

All React Native testID values must be defined in src/testing/testIds.ts. Components and TypeScript tests must import identifiers from this registry. Dynamic test IDs must use typed factory functions. Never hardcode testID strings inside screen or component JSX. Maestro YAML selectors must stay synchronized with the registry.

Maestro flows live in `tests/e2e/maestro` and use the development app id `com.dramaflash.app.dev`. Jest only collects TypeScript tests, so the YAML flows stay out of `npm test`. Run `npm run e2e` on a booted iOS simulator or Android emulator with the development build open and Metro running. Do not point these flows at the production app id. GitHub CI does not run Maestro, because that job has no emulator. EAS Workflows can run Maestro later. Leave that optional.

The demo wallet is stored in MMKV. The first launch copies a valid AsyncStorage wallet into MMKV and does not replace a wallet that is already there. If that saved wallet is later missing, the app shows an error instead of a new 15-coin balance. A development build can open `dramaflash-dev:///dev/reset-wallet` to restore 15 coins and lock paid episodes again. That route does nothing in production, and it is not a normal user action. Maestro flows that need a known balance open it first. The flow that checks an unlock after restart must not open it between the unlock and the restart.

Saved series and continue watching are separate MMKV records. A missing record means the list is empty. A broken record shows an error and is not replaced with an empty list. A development build can open `dramaflash-dev:///dev/reset-library` to clear saved series and continue watching. That route does not change the wallet, it does nothing in production, and it is not a normal user action.

## Commands

```bash
npx expo install <package>  # SDK-compatible install
npx expo start              # dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # dependency and config checks
npx expo install --fix      # fix incompatible package versions
npm run validate            # lint, typecheck, unit tests, and Expo Doctor
npm run e2e                 # Maestro flows on a booted simulator or emulator
```

Run `npm run validate` before you open a pull request.

Do not say that lint, types, tests, or Expo Doctor passed unless that command actually ran in this task. If a check did not run, say that.

Do not turn off tests, lint rules, or TypeScript checks to make CI pass.

## Git

- Always create a feature branch.
- Never push directly to `main`.
- Never bypass branch protection.
- Open a pull request for review.
- Never merge a pull request without the repository owner's approval.

## Communication

- Write to the repository owner in simple English (CEFR A2–B1).
- Keep explanations short and clear.
- Explain important technical decisions and blockers.

## GitHub writing

Use this for commit messages, pull request descriptions, and review comments.

- Be professional and concise.
- Describe the real changes, why they were made, which tests ran, and any known limits.
- Do not add promotional text, product slogans, or automatic AI-tool signatures.
- Do not add "Made with Cursor" or "Generated by Cursor".
- Do not add an AI-tool co-author trailer unless the owner explicitly asks for it.
- Do not rewrite or remove attribution that a license, policy, or project rule already requires.
- If the owner asks whether AI helped, or if a policy requires disclosure, answer truthfully.

Cursor-only enforcement of the signature rules is in `.cursor/rules/github-communication.mdc`.
