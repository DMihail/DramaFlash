import { type ImageSourcePropType } from 'react-native';

import avatarHomeHeader from '../../../assets/drama/avatar-home-header.jpg';
import heroHomeSpotlight from '../../../assets/drama/hero-home-spotlight-verbotene-liebe.jpg';
import posterAvengingAngel from '../../../assets/drama/poster-avenging-angel.jpg';
import posterBandOfFate from '../../../assets/drama/poster-band-of-fate.jpg';
import posterBloodyRoses from '../../../assets/drama/poster-bloody-roses.jpg';
import posterDarkDesire from '../../../assets/drama/poster-dark-desire.jpg';
import posterLoveOnDetours from '../../../assets/drama/poster-love-on-detours.jpg';
import posterMySecretLife from '../../../assets/drama/poster-my-secret-life.jpg';
import posterSecondChance from '../../../assets/drama/poster-second-chance.jpg';
import posterShadowKiss from '../../../assets/drama/poster-shadow-kiss.jpg';
import posterTheCeoAndI from '../../../assets/drama/poster-the-ceo-and-i.jpg';

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
} as const satisfies Record<string, ImageSourcePropType>;

type PosterId = keyof typeof posters;

export const homeHeroArt: ImageSourcePropType = heroHomeSpotlight;
export const homeAvatar: ImageSourcePropType = avatarHomeHeader;

function isPosterId(seriesId: string): seriesId is PosterId {
  return Object.hasOwn(posters, seriesId);
}

export function posterArt(seriesId: string): ImageSourcePropType | undefined {
  if (!isPosterId(seriesId)) {
    return undefined;
  }

  return posters[seriesId];
}
