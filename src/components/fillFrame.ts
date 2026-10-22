import { StyleSheet } from 'react-native';

/**
 * Fills a sized parent without keeping the asset's pixel size.
 *
 * React Native Web applies the source width and height to `Image`. Absolute
 * edges alone do not override those values, so a poster can paint at 832×1248
 * inside a 130×195 card. Width and height `100%` replace that intrinsic size.
 */
export const fillFrame = StyleSheet.create({
  image: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
}).image;
