# DramaFlash visual fidelity plan

This plan turns the confirmed gaps in `docs/FIGMA_FIDELITY_AUDIT.md` into screen work. The SVG board is the source. German copy, LoveFlix, the leftover shopping frame, and the alternate series layout stay out.

PR #20 is merged on `main` as `8f7d5c4`. These branches stack on that commit. Nothing here rewrites the wallet, auth, or library stores.

## Asset map

Embedded images were taken out of `FLASH.svg` and matched by their place on the board, then by the title painted on the picture.

| Asset                              | Board place            | Used as                                     | Notes                                                                              |
| ---------------------------------- | ---------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------- |
| `hero-home.jpg`                    | Home hero              | Home spotlight still                        | Painted title is “Echoes of Eternity”. The spotlight series stays `the-ceo-and-i`. |
| `poster-the-ceo-and-i.jpg`         | Home rail 1, card 1    | Poster                                      | Cleaned center crosshair. See below.                                               |
| `poster-my-secret-life.jpg`        | Home rail 1, card 2    | Poster                                      | Same picture as the old file, recompressed.                                        |
| `poster-love-on-detours.jpg`       | Home rail 1, card 3    | Poster                                      | Same picture, recompressed.                                                        |
| `poster-bloody-roses.jpg`          | Home rail 2, card 1    | Poster                                      | Landscape master. Cards cover-crop it to 2:3.                                      |
| `poster-shadow-kiss.jpg`           | Home rail 2, card 2    | Poster                                      | Same picture, recompressed.                                                        |
| `poster-dark-desire.jpg`           | Home rail 2, card 3    | Poster                                      | Same picture, recompressed.                                                        |
| `poster-avenging-angel.jpg`        | Home rail 3, card 1    | Poster                                      | Same picture, recompressed.                                                        |
| `poster-band-of-fate.jpg`          | Home rail 3, card 2    | Poster                                      | Same picture, recompressed.                                                        |
| `poster-second-chance.jpg`         | Home rail 3, card 3    | Poster                                      | Same picture, recompressed.                                                        |
| `hero-the-ceo-and-i.jpg`           | Series detail hero     | Series and player still for `the-ceo-and-i` | Painted title is “The CEO’s Secret Life”. Catalog title stays “The CEO and I”.     |
| `poster-forbidden-vows.jpg`        | Detail recommendations | Poster                                      | Title is on the picture.                                                           |
| `poster-love-in-the-fast-lane.jpg` | Detail recommendations | Poster                                      | Title is on the picture.                                                           |
| `poster-the-heirs-dilemma.jpg`     | Detail recommendations | Poster                                      | Title is on the picture.                                                           |
| Cast portraits                     | Detail cast row        | `the-ceo-and-i` cast only                   | Elena, Julian Vance, Sarah Lin, Marcus. Added with the series screen.              |
| Episode stills 1–6                 | Detail episode rows    | `the-ceo-and-i` rows only                   | The board pairs these pictures with that episode list.                             |

Not shipped, because they are not a catalog series:

- Player panels titled “The Billionaire’s Secret”.
- Unlock-sheet swirl and graphic cover.
- Coin-store couple that has no series title.
- Library covers and member portrait that are not catalog posters.
- Alternate-detail art and the fruit wireframe.

The CEO poster’s red cross is in the embedded master, not only in the old JPEG. The guide pixels were replaced from neighboring pixels. The picture was not cropped, and no overlay hides the line. Other posters did not have a straight center guide.

## Copy that is real

Only `the-ceo-and-i` has board copy. It is not copied onto other series.

- Synopsis about the artist and the anonymous CEO.
- Why you’ll love it: two sentences from the card.
- Cast names above. Sarah Lin’s role is cut off on the board after “Chloe (Best”, so the app shows “Chloe”.
- Episode titles 1–6 from that frame. Later episodes stay “Episode N”.
- No ratings, no “12k”, no “2m/ep”, no PRO flag, and no fake durations. The catalog episode count stays 50. The episode price stays 10 coins.

## Tasks

| Priority | Screen  | Change                                                                                 | Files                                          | Dependencies                 | Acceptance criteria                                                 |
| -------- | ------- | -------------------------------------------------------------------------------------- | ---------------------------------------------- | ---------------------------- | ------------------------------------------------------------------- |
| P1       | Artwork | Replace guided poster and point heroes at the board stills                             | `assets/drama/`, `src/features/home/assets.ts` | `main` includes #20          | No red cross on the CEO poster. Heroes load. Catalog ids unchanged. |
| P1       | Home    | Tagline, on-image episode line, Romance gradient, header over the hero, 16 pt rail gap | Home hero, header, catalog, `PosterCard`       | Artwork                      | English “Watch now”. No invented rating or PRO badge.               |
| P1       | Series  | Synopsis, highlights, cast, thumbnails, titled rows, unavailable season note           | Series header, episode row, story data         | Artwork, Home poster overlay | Only `the-ceo-and-i` gets that copy. Unlock path unchanged.         |
| P1       | Player  | Vertical still, small Watch control, right rail, centered lock card                    | `PlayerStage`                                  | Series hero                  | Previous, next, save, and 10-coin lock stay. No second tab bar.     |
| P1       | Unlock  | Card layout, episode choice, disabled season and membership, text “Maybe later”        | `PlayerUnlockSheet`                            | Player                       | Only the episode row can spend coins.                               |
| P1       | Coins   | Locked cover, 2 pt borders, ribbons, stronger selection, unavailable VIP               | `CoinStoreScreen`                              | Unlock                       | Same four packs and `grantPack`.                                    |
| P1       | Library | Poster grid, real progress, purchases from wallet unlocks                              | `LibraryScreen`                                | Coins                        | Empty library stays. No fake completion.                            |
| P2       | Login   | Gradient title, card opacity, glows                                                    | `LoginScreen`                                  | Library                      | DramaFlash name and demo disclaimer stay.                           |

## Order

1. Artwork
2. Home
3. Series details
4. Player
5. Unlock sheet
6. Coin store
7. Library
8. Login

## Tests

Keep the current test ids. Add checks for story lookup, disabled unlock choices, and purchase lines from the wallet. Run the feature tests after each milestone and `npm run validate` on the last branch.

## Verification

After the screens change, open the web app at 360, 390, 768, 1024, 1280, 1440, and 1920. Capture Home, series, both player states, the unlock sheet, coins, a filled library, and login. Compare them with the board crops. Open the development app on Android and iOS when a simulator is already running. Do not rebuild native projects for this pass.

## Risks

- The home still and the series hero have different painted titles than the catalog. The UI title stays the catalog title.
- Season, membership, and VIP are visible only as unavailable. They do not write the wallet.
- A bad guide repair would show a smear. The CEO poster was checked after the repair.
- Stacked pull requests must be merged from A to H, and each base moved to `main` after the parent lands.

## Rollback

Each milestone is its own branch. Revert that pull request to drop one screen without touching the wallet schema.

## Status
                                                                      |
| --------- | ------------------------------------------------------------------------------------------ |
| A Artwork | Done. Posters replaced. Home and series heroes wired.                                      |
| B Home    | Done. Tagline, poster scrim, Romance gradient, header over the hero.                       |
| C Series  | Done. Synopsis, cast, titled rows, and an unavailable season note.                         |
| D Player  | Done. One-episode stage, centered lock card, side rail, smaller watch control.             |
| E Unlock  | Done. Centered sheet. Season and membership stay unavailable and do not spend coins.       |
| F Coins   | Done. Pack borders, ribbons, selected state, and the locked cover. VIP stays unavailable.  |
| G Library | Done. Phone poster grid, real continue progress, and a purchases list from wallet unlocks. |
| H Login   | Not started                                                                                |

