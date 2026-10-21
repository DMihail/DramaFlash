# Prototype audit

Sources, read on 21 Oct 2026:

- `High-Fidelity DramaFlash Prototype/` — exported Figma Make React app. Behavior in this audit comes from this code.
- `references/DESIGN_GUIDE.md` and `references/screens/` — approved visuals. These files are local. `references/` is gitignored.
- `src/` — Expo SDK 58 app. It currently has a placeholder home screen only.

Status words used below:

| Status | Meaning |
| --- | --- |
| Working | The code does this, and the prototype tests cover the rule where noted |
| Mocked | The control runs, but the result is local and fake |
| Visual only | The pixels or labels exist, and the control does not change product data |
| Missing | Shown in a design picture, or named in copy, but not implemented in code |

Do not treat a screenshot as proof that a feature works.

## App shape

The web app has no router. `src/App.tsx` switches one `screen` string. `src/Login.tsx` is the only other screen component. Wallet rules live in `src/demoState.ts`. Auth rules live in `src/authState.ts`. Tests are `tests/demo-state.test.mjs` and `tests/auth-state.test.mjs`.

Dependencies are React 19, React DOM, and `lucide-react`. Styles are one Tailwind v4 file, `src/index.css`. There is no video library.

Screen values: `home`, `detail`, `player`, `locked`, `store`, `success`, `discover`, `library`, `profile`, `login`.

Overlays, not screens: unlock sheet (`sheet` state) and toast.

## Screen inventory

| Screen | What the code does | Status |
| --- | --- | --- |
| Home | Logo, search, bell, avatar, hero, genre chips, three poster rails, five-item tab bar | Working navigation. Catalog is hardcoded |
| Discover | Search field, chips, poster grid. Empty search copy if nothing matches | Working filter on the local title list |
| Series detail | One fixed series page. Synopsis, cast, episode rows, sort, show more, recommendations | Working for that one series only |
| Player | One still image, play/pause label, next episode, like, comment, share | Mocked playback |
| Locked player | Same layout with a lock card. Opened when the episode is not free or unlocked | Working gate |
| Unlock sheet | One option, balance, confirm or “Get coins”, Maybe Later, close | Working for the 10-coin rule |
| Coin store | Four packs, selected pack, simulated buy, disabled VIP | Mocked purchase |
| Episode unlocked | Success copy, continue, back to series, remaining balance | Working after a real unlock |
| Library | Guest is sent to Login. Signed-in empty state, or the first three posters if saved | Mocked save flag |
| Profile | Guest is sent to Login. Balance, get coins, provider label, sign out, reset | Working demo controls |
| Login | Google, Apple, Email, Create account, Continue as Guest, Terms, Privacy | Mocked sign-in |

The tab bar is Home, Discover, Romance, Library, Profile. Romance is not a screen. It sets the genre to Romance and opens Discover. The active style is skipped for that button (`i !== 2`).

## Home

- Hero title is “Forbidden Love”, 72 episodes, rating 4.8. Art file is `home.png`. The alt text says “Echoes of Eternity”.
- Watch now opens the same detail page as every poster. It does not start playback.
- The plus button calls `toggleSaved`. A guest is sent to Login with `saveSeries: true`.
- Chips: All, Romance, Drama, Action, Mystery. They change the first rail title. Action uses `posters.slice(6)`. Other genres still use the first three posters. The chip does not filter by a real genre field.
- See all sets the genre to the rail title and opens Discover.
- Bell shows the toast “You’re all caught up. Your next obsession awaits.”
- Avatar opens Profile, which sends a guest to Login.
- Search icon opens Discover.

Poster data is nine items: The CEO and I (50), My Secret Life (30), Love on Detours (65), Bloody Roses (80), Shadow Kiss (45), Dark Desire (60), Avenging Angel (90), Band of Fate (25), Second Chance (55). A PRO badge is hidden only when the index in that rail is 1. Episode length text is “1m/ep” for that same index and “2m/ep” otherwise. This is display logic, not catalog data.

## Series detail

There is one detail page. The selected poster is ignored.

- Title: “The CEO’s Secret Life”. Tags: Billionaire, Secret Identity, Romance. Year 2024. Rating 4.8 (12k). Count: 45 episodes.
- Play Ep 1 calls `openEpisode(1)` and opens the player. It does not autoplay (`autoplay` defaults to false).
- Heart on the title row toggles `liked`. Like is memory only. It is not the library save.
- Heart in the top bar is the library save (`toggleSaved`).
- Share shows “Series link copied for sharing”. Nothing is copied. `navigator.clipboard` is not used.
- Synopsis and “Why you’ll love it” are fixed strings.
- Cast: Elena as Mia (Artist), Julian Vance as Alexander (CEO), Sarah Lin as Chloe (Best Friend), Marcus as Rival CEO. Photos only. No cast screen.
- Episode list shows 6 rows, or 9 after “Show more episodes”. Named titles exist only for the first six. Later rows use `Chapter N`. Art and duration repeat with `(number - 1) % 6`.
- Sort reverses the visible rows only. It does not change playback order.
- “Continue the story” finds the first locked episode from 4 to 45, opens the locked player, and opens the sheet. If all are unlocked, it toasts “All episodes are unlocked. Enjoy the story!” The banner price is “10 Coins / Ep”. It does not sell a season.
- Recommendations are Forbidden Vows (48), Love in the Fast Lane (60), and The Heir’s Dilemma (45). Each still calls `go("detail")`.

## Player

`openEpisode` sets the episode, plays only when `autoplay` is true and the episode is unlocked, clears the cliffhanger flag, and chooses `player` or `locked`.

- Image is `player.png` for episodes 1–3 and `locked.png` for episode 4 and above, even after unlock.
- Title on the player is “The Billionaire’s Secret”, not the detail title.
- Back and the episode-list icon both go to detail.
- Watch toggles `playing` when unlocked, or opens the sheet when locked.
- The status line says “Playing preview” or “Paused preview”, plus “Artwork demo · no video playback”.
- A CSS bar animates from 5% to 100% width over 18 seconds while playing. It does not read media time. It does not mark the episode complete. Reduced motion disables it.
- Next episode calls `openEpisode(next, true)` and sets `cliffhanger` when the next episode is locked. The locked screen then says “Cliffhanger reached”. There is no swipe between episodes.
- Like changes the count label from 12K to 12.1K. It is the same `liked` flag as detail. Not stored.
- Comments toast: “Comments will be available in the full app.”
- Share toast: “Episode link copied for sharing”. Nothing is copied.
- The tab bar stays on the player. The design’s second tab bar (Home / Search / Rewards / Profile / VIP) is not in the code.
- There is no `<video>`, no media URL, and no player library.

## Unlock and coins

Constants and tests:

- Initial balance: 15. Storage key: `dramaflash.option-a.v1`.
- Episodes 1–3 are free. Episodes 4–45 cost 10 (`EPISODE_COST`). Episode 46, fractions, and non-integers do nothing.
- Unlock subtracts 10 and appends the episode id. A second unlock of the same episode returns the same state.
- If the balance is below 10, unlock does not change state. The UI then opens the store.
- Buying a pack adds coins and bonus only. It does not unlock an episode. The UI says this, and the tests check 15 → unlock episode 4 → 5, then pack 0 → 305, then unlock episode 5 → 295.
- Invalid storage (missing, broken JSON, negative balance, episode outside 4–45) loads a fresh demo.
- A thrown storage read also loads a fresh demo.

Sheet contents that work: one selected option, live balance, confirm text, “Get coins” when the balance is too low, Maybe Later, and the close button. Backdrop click closes the sheet. Escape closes it. Focus is trapped while it is open. That focus trap is DOM-only.

Sheet contents that are visual only in the design, and absent in code: full-season option, membership option, radio buttons, and “BEST VALUE” on a second option.

Store:

- Packs: 300 for €2.99, 800 + 50 for €6.99 (default, ribbon POPULAR), 2500 + 200 for €19.99, 6000 + 1000 for €49.99 (ribbon BEST VALUE).
- `purchaseHandled` blocks a second click until the store is opened again.
- After buy, the app returns to Profile if the store was opened from Profile. Otherwise it returns to the player or locked screen, and reopens the sheet when the episode is still locked.
- Toast: “Simulated purchase: N coins added. No money charged.”
- VIP card is `disabled`. Copy: “Unavailable in this prototype” and divider “NOT AVAILABLE IN DEMO”.
- The design price of 85 coins, the €9.99 season, and the membership prices are not used.

Success screen: “Episode N is unlocked”, continue watching (`openEpisode` with autoplay), back to detail, and the new balance. The header back also goes to detail.

## Login and account

Storage key: `dramaflash.auth-demo.v1`. Shape: `{ provider, savedSeries }`. Provider is `google`, `apple`, `email`, or `null`.

- The app always opens on Home, including after reload.
- Guests can use Home, Discover, detail, player, locked player, sheet, and store.
- Library, Profile, and save send the guest to Login.
- Google, Apple, Email, and Create account all call `signIn` with a provider. Email has no form. Create account uses `email`.
- If a provider is already set, `signIn` returns immediately.
- Sign-in writes only the auth key. Tests check that it does not read or change the coin key.
- A pending save is completed on sign-in, then the app opens the requested screen.
- Continue as Guest and the Login back button call `returnFromLogin(false)`. They restore the origin screen, scroll position, and `wasPlaying`. They do not save.
- Terms and Privacy are toasts, not pages. The text says sign-in is simulated and no credentials are collected.
- Profile shows Google, Apple, or Email. Sign out sets `provider` to `null`, stops playback, goes Home, and does not change coins, unlocks, or `savedSeries`. The heart looks empty while signed out because `saved` is `provider !== null && savedSeries`. The flag comes back on the next sign-in.
- Reset Demo asks `window.confirm`, then restores 15 coins, clears paid unlocks and `savedSeries`, resets episode, play, cliffhanger, pack, list length, sort, like, genre, and search, and goes Home. It keeps the current provider.
- If storage throws, a toast says progress or sign-in lasts for this visit only. State still updates in memory.

## Library and profile

- Saved state is one boolean, not a list of series ids.
- When saved, Library shows `posters.slice(0, 3)` under “Saved for you”. Those posters still open the same detail page.
- Empty copy: “A little room for obsession.” Button: “Explore dramas” → Home.
- There is no continue-watching row and no playback progress record.
- Profile name is the fixed line “Welcome to DramaFlash”. The avatar is a user icon, not the header photo. The header avatar image is `elena.png` and is not tied to the account.

## Persistence

| Data | Stored | Survives reload | Cleared by Reset Demo | Cleared by sign-out |
| --- | --- | --- | --- | --- |
| Balance and unlocked episodes | Yes, own key | Yes | Yes, back to 15 and none | No |
| Provider and saved flag | Yes, own key | Yes | Saved flag only | Provider only |
| Current screen | No | Opens Home | Goes Home | Goes Home |
| Like, genre, search, play, cliffhanger, sort, show-more, selected pack | No | No | Yes, except pack is also reset | Play stops on sign-out |

## Motion

| Motion | Status |
| --- | --- |
| Preview progress bar, 18s CSS keyframes | Visual only. Stops under `prefers-reduced-motion` |
| Sheet focus trap and body scroll lock | Working on the web. DOM-only |
| Toast hides after 2600 ms | Working |
| Scroll restore after guest cancel | Working, `window.scrollY` |
| Hover, the phone status bar (9:41), and `max-width: 430px` frame | Web only |

There are no gesture-driven episode changes.

## Assets and fonts

Prototype images are in `High-Fidelity DramaFlash Prototype/public/art/`. They are PNG posters, heroes, cast, and player stills, plus `google-mark.svg` and `apple-mark.svg`. `public/art/README.md` describes them as generated artwork.

Approved JPEG crops live in `references/assets/`. The manifest lists 45 images. Use those for the native app, not the prototype PNGs, once a later PR copies the files into the repo. `references/` is not in git today.

Fonts in the prototype CSS:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700;800&display=swap');
```

Inter is the UI font. Playfair Display is used for headings. Both are Google fonts under the SIL Open Font License. The design guide names `@expo-google-fonts/inter` and `@expo-google-fonts/playfair-display`. No font files are in the Expo repo yet.

Icons are Lucide components. The fake status-bar icons (signal, wifi, battery) must not be rebuilt.

## Web-only pieces

- `react-dom`, Vite, Tailwind, `window.localStorage`, `window.scrollTo`, `window.confirm`, `document` focus trap, `<img>`, `<button>`, `<input>`, CSS variables, and keyframes.
- No React Router. Navigation is `setScreen`.

## Code versus screenshots

| Topic | Design picture | Code |
| --- | --- | --- |
| Home hero title | “Verbotene Liebe” in the design guide | “Forbidden Love” |
| Detail title | “The CEO’s Secret Life” | Same |
| Player title | “The Billionaire’s Secret” | Same |
| Episode price | 85 coins on the coin-store frame; 10 on the unlock sheet | 10 everywhere |
| Unlock choices | Episode, full season, membership | Episode only |
| Player layout | Three stacked episodes and a different tab bar | One image, same five tabs, Next button |
| Login wordmark | Design guide says the frame says LoveFlix | Code says DramaFlash |
| Language | German and English in the frames | English in the code (“Watch now”, not “Jetzt ansehen”) |
| Library and Login | Design guide says they are outside Option A | Both are implemented |

The native app should follow the code for behavior and the design guide for color, type, and spacing. Do not silently switch the price to 85 or build the three-option sheet.

## Problems in the prototype

- One detail page stands in for every series.
- Three titles and two episode counts describe the same flow (72 on the hero, 45 in the model).
- Unlocked episodes above 3 still use the locked still.
- Show more stops at 9 rows even though `LAST_EPISODE` is 45.
- Genre chips do not filter a genre field.
- Library cannot save more than one flag, and the saved rail is not the series the user saved.
- Share and comments are toasts.
- `liked` is shared by detail and player and is lost on reload.

## Open questions

- Which title and episode count should the product use?
- Should the native app keep the 10-coin rule from code, or the 85-coin label from the coin-store frame?
- Should the player stay one still plus Next, or later match the vertical feed in the screenshot?
- Should Romance stay a shortcut into Discover?
- May the Google and Apple SVG marks ship in the app?
- Where should the approved JPEGs live in git? `references/` is ignored today.
- Is a real video URL coming, or does the demo stay an artwork preview?
