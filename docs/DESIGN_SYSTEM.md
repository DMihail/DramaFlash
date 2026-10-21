# Design system

Visual values come from `references/DESIGN_GUIDE.md`, measured from the Figma export on 21 Oct 2026. Do not invent a second palette. Behavior that conflicts with a screenshot is decided in `docs/PROTOTYPE_AUDIT.md`.

Use `StyleSheet.create` next to each component. Tokens live in one module, `src/theme/tokens.ts`. Do not make a global stylesheet and do not add a styling library.

The frame is 390 × 844 pt. Use flex, not a scaled web page. Side margins are 16 (Home, store, library, player), 20 (detail), or 24 (hero copy).

## Color

| Token | Hex | Use |
| --- | --- | --- |
| `background` | `#000000` | Screen background |
| `playerScrim` | `#061532` | Player shade and lock card |
| `surface` | `#18172B` | Chips, cards, balance, packs |
| `surfaceRaised` | `#1A192F` | Sheet card, login card, locked card |
| `surfaceMedia` | `#1E1D35` | Behind thumbnails |
| `border` | `#322F56` | 1 pt strokes. Packs and VIP use 2 pt |
| `primary` | `#64EDF7` | Main buttons, active chip, active tab |
| `onPrimary` | `#044449` | Text on cyan |
| `playerPrimary` | `#00C8E0` | Watch button on the player only |
| `accent` | `#CB64F7` | Spotlight, bonus text, season pill |
| `onAccent` | `#340449` | Text on the purple pill |
| `coin` | `#FACC15` | Coin badge on the lock icon |
| `text` | `#FFFFFF` | Titles and labels |
| `textOnMedia` | `#E5E7EB` | Copy over photos. Meta also uses `#D1D5DB` |
| `textSecondary` | `#C0BEDA` | Body, inactive tabs |
| `textMuted` | `#9CA3AF` | Not used on the main tabs. Player design only |

The alternate detail frame (`#34E8F4`, `#B934F4`) is not the Option A palette. Do not use it.

Brand gradient, 90 degrees: `#64EDF7` → `#CB64F7`. React Native has no CSS gradient. Use `expo-linear-gradient` for the wordmark accent, the PRO badge, and the Buy button border when those screens are built. Do not add it before that PR.

Scrims on heroes are black fades. Approximate them with `expo-linear-gradient`. A flat black overlay is acceptable on the first pass if the gradient package is not in yet.

Android will not match iOS glows. The design shadow `0 8 24 #64EDF7` at 20% can be an iOS shadow. On Android, use a small elevation or skip the glow. Do not block the layout on a perfect glow.

Backdrop blur in the design is 12, 4, or 24. Use it only where the system blur is easy (`expo-blur`) and skip it where it hurts scrolling. The sheet scrim can be black at 80% without blur.

## Type

Two families:

- Playfair Display for titles, names, and headings.
- Inter for every other label.

Load them with `expo-font` and the packages named in the design guide: `@expo-google-fonts/playfair-display` and `@expo-google-fonts/inter`. Weights: Inter 400, 500, 600, 700. Playfair 500, 600, 700. The CSS also asks for Playfair 800. Load 700 if 800 is not in the package, and do not fake a heavier font.

Both families are SIL Open Font License Google fonts. The app may embed them. Do not commit loose font files downloaded from an unknown page.

| Role | Family | Size | Examples |
| --- | --- | --- | --- |
| Display XL | Playfair | 36 | Home hero title |
| Display L | Playfair | 30 | Detail title |
| Display M | Playfair | 24 | Sheet title, group titles, pack amounts |
| Title L | Playfair | 20 | Player title, wordmark |
| Title M | Playfair | 18 | Section titles, screen titles |
| Title S | Playfair | 16 | Season banner title |
| Title XS | Playfair | 14 | Poster captions, episode titles |
| Body | Inter | 16 | Button labels, balance value |
| Body small | Inter | 14 | Synopsis, chips, meta |
| Caption | Inter | 12 | Cast names, subtitles |
| Micro | Inter | 10 | Tab labels, badges |

Line height 23 for 14 pt body copy. Line height 24 for 16 pt buttons. Other single-line styles can use a tight line height near the size.

## Space, radius, layout

Spacing scale: 4, 8, 12, 16, 20, 24, 32, 48.

| Token | Value |
| --- | --- |
| `radius.xs` | 4 |
| `radius.sm` | 6 |
| `radius.md` | 10 |
| `radius.lg` | 12 |
| `radius.card` | 14 |
| `radius.sheetInner` | 18 |
| `radius.sheet` | 24 |
| `control.button` | 48 pt tall pill |
| `control.icon` | 48 pt circle, 32 pt in the header |
| `poster.rail` | about 130 × 195, radius 12 |
| `episode.thumb` | 112 × 63, radius 10 |
| `tabBar` | about 64 pt plus bottom safe area. Icons 24. Labels 10 |
| `header` | Respect the safe area. Do not add a fake 44 pt status row |

Rails in the design start at the screen edge while titles are inset. Keep that: title row has horizontal padding, the horizontal list does not clip the first poster with the same inset, and the list content inset matches the title.

## Icons

Use `lucide-react-native` so the names match the prototype (`Heart`, `Play`, `LockKeyhole`, `Zap`, and the rest). It needs `react-native-svg`. Install both with `npx expo install` in the shared-controls PR.

Default size 24 for tabs, 20–22 for buttons. Stroke width about 1.75. Do not ship the signal, wifi, or battery icons.

Logo: heart on a 32 pt `#64EDF7` tile, radius 6.

## Shared components

Build these only when a second screen needs them. Styles that belong to one screen stay in that feature.

| Component | Job | Variants | Used by |
| --- | --- | --- | --- |
| `AppText` | Applies a type role and color | The roles in the type table | All screens |
| `Screen` | Black background, safe area, optional tab-bar padding | Default, edges none for full-bleed heroes | All screens except the full-bleed player, which handles its own edges |
| `PrimaryButton` | 48 pt cyan pill, on-primary label, press opacity | `player` uses `#00C8E0` | Home, detail, sheet, success, library |
| `IconButton` | Circular hit target, `accessibilityLabel` required | 48 and 32 | Home, detail, player, login |
| `PosterCard` | Image, title, optional meta | Rail and grid | Home, Discover, detail recommendations, library |
| `GenreChip` | Pill, selected state | Selected uses primary fill and on-primary text | Home, Discover |
| `SectionHeader` | Playfair title and optional “See all” | — | Home, detail |
| `CoinBalance` | “Your Balance” and the coin count | — | Store, sheet, profile, success |
| `EmptyState` | Icon, title, body, one button | — | Library, Discover no results |

`accessibilityLabel` is required on icon-only buttons. Chips and pack buttons expose selected state. The sheet needs a title for the accessibility tree. Do not trap focus with DOM APIs. On iOS and Android the modal itself moves assistive focus.

Do not build `EpisodeItem`, `SeriesPoster`, and `PosterCard` as three wrappers for the same picture. One `PosterCard` is enough. Episode rows are feature-local until another screen lists episodes.

## Motion

| Effect | Native approach | When |
| --- | --- | --- |
| Button press | `Pressable` opacity | With the first buttons |
| Screen change | Expo Router stack default | With the routes |
| Sheet | `Modal` `animationType="slide"` | Unlock PR |
| Preview bar | `Animated` timing, 18s, only while `playing`. Stop when Reduce Motion is on | Player PR |
| Toast | Opacity, about 2.6s | When the first toast is needed |
| Vertical episode swipe | Not planned | Only if the product rejects the Next button |

Do not copy CSS keyframes. Do not add Reanimated until a gesture needs it.

## Fidelity

Match the Option A frames for layout: Home, series detail, player still, lock card, unlock sheet (one option, not three), and coin store (VIP disabled). Library and Login follow the prototype structure and the design tokens, even though the design guide marked those frames as outside Option A.

Text comes from the prototype strings, not from German labels in the SVG.
