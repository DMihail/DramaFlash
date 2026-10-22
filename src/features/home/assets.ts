import { type ImageSourcePropType } from 'react-native';

import { type StoryCastId, storySeriesId } from '@/data/seriesStory';

import avatarHomeHeader from '../../../assets/drama/avatar-home-header.jpg';

import castElena from '../../../assets/drama/cast-elena.jpg';
import castJulianVance from '../../../assets/drama/cast-julian-vance.jpg';
import castMarcus from '../../../assets/drama/cast-marcus.jpg';
import castSarahLin from '../../../assets/drama/cast-sarah-lin.jpg';
import episodeCeo1 from '../../../assets/drama/episode-the-ceo-and-i-1.jpg';
import episodeCeo2 from '../../../assets/drama/episode-the-ceo-and-i-2.jpg';
import episodeCeo3 from '../../../assets/drama/episode-the-ceo-and-i-3.jpg';
import episodeCeo4 from '../../../assets/drama/episode-the-ceo-and-i-4.jpg';
import episodeCeo5 from '../../../assets/drama/episode-the-ceo-and-i-5.jpg';
import episodeCeo6 from '../../../assets/drama/episode-the-ceo-and-i-6.jpg';

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

const castPortraits = {
  elena: castElena,
  'julian-vance': castJulianVance,
  'sarah-lin': castSarahLin,
  marcus: castMarcus,
} as const satisfies Record<StoryCastId, ImageSourcePropType>;

const ceoEpisodeStills = {
  1: episodeCeo1,
  2: episodeCeo2,
  3: episodeCeo3,
  4: episodeCeo4,
  5: episodeCeo5,
  6: episodeCeo6,
} as const satisfies Record<number, ImageSourcePropType>;

export function castPortrait(id: StoryCastId): ImageSourcePropType {
  return castPortraits[id];
}

/** Episode still from the series-detail frame. Other episodes have no still. */
export function episodeStill(seriesId: string, episode: number): ImageSourcePropType | undefined {
  if (seriesId !== storySeriesId) {
    return undefined;
  }

  return ceoEpisodeStills[episode as keyof typeof ceoEpisodeStills];
}

export function posterArt(seriesId: string): ImageSourcePropType | undefined {
  if (!isPosterId(seriesId)) {
    return undefined;
  }

  return posters[seriesId];
}
