import { type ImageSourcePropType } from 'react-native';

import avatarHomeHeader from '../../../assets/drama/avatar-home-header.jpg';
import heroHome from '../../../assets/drama/hero-home.jpg';
import heroTheCeoAndI from '../../../assets/drama/hero-the-ceo-and-i.jpg';
import posterAvengingAngel from '../../../assets/drama/poster-avenging-angel.jpg';
import posterBandOfFate from '../../../assets/drama/poster-band-of-fate.jpg';
import posterBloodyRoses from '../../../assets/drama/poster-bloody-roses.jpg';
import posterDarkDesire from '../../../assets/drama/poster-dark-desire.jpg';
import posterForbiddenVows from '../../../assets/drama/poster-forbidden-vows.jpg';
import posterLoveInTheFastLane from '../../../assets/drama/poster-love-in-the-fast-lane.jpg';
import posterLoveOnDetours from '../../../assets/drama/poster-love-on-detours.jpg';
import posterMySecretLife from '../../../assets/drama/poster-my-secret-life.jpg';
import posterSecondChance from '../../../assets/drama/poster-second-chance.jpg';
import posterShadowKiss from '../../../assets/drama/poster-shadow-kiss.jpg';
import posterTheCeoAndI from '../../../assets/drama/poster-the-ceo-and-i.jpg';
import posterTheHeirsDilemma from '../../../assets/drama/poster-the-heirs-dilemma.jpg';

const posters = {
  'the-ceo-and-i': posterTheCeoAndI,
  'my-secret-life': posterMySecretLife,
  'love-on-detours': posterLoveOnDetours,
  'bloody-roses': posterBloodyRoses,
  'shadow-kiss': posterShadowKiss,
  'dark-desire': posterDarkDesire,
  'avenging-angel': posterAvengingAngel,
  'band-of-fate': posterBandOfFate,
  'second-chance': posterSecondChance,
  'forbidden-vows': posterForbiddenVows,
  'love-in-the-fast-lane': posterLoveInTheFastLane,
  'the-heirs-dilemma': posterTheHeirsDilemma,
} as const satisfies Record<string, ImageSourcePropType>;

type PosterId = keyof typeof posters;

export const homeAvatar: ImageSourcePropType = avatarHomeHeader;

/** Home spotlight still from the board hero, separate from the series poster. */
export const homeHeroArt: ImageSourcePropType = heroHome;

const seriesHeroes = {
  'the-ceo-and-i': heroTheCeoAndI,
} as const satisfies Record<string, ImageSourcePropType>;

/**
 * Wide hero for a series when the board supplies one.
 *
 * Other series use their poster. A missing id returns undefined.
 */
export function seriesHeroArt(seriesId: string): ImageSourcePropType | undefined {
  if (seriesId === 'the-ceo-and-i') {
    return seriesHeroes['the-ceo-and-i'];
  }

  return posterArt(seriesId);
}

function isPosterId(seriesId: string): seriesId is PosterId {
  return Object.hasOwn(posters, seriesId);
}

export function posterArt(seriesId: string): ImageSourcePropType | undefined {
  if (!isPosterId(seriesId)) {
    return undefined;
  }

  return posters[seriesId];
}
