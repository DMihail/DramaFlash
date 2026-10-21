import { AccessibilityInfo, Animated } from 'react-native';

import TestRenderer, { act } from 'react-test-renderer';

import { Skeleton, skeletonMotion, skeletonOpacity } from '@/components/Skeleton';

describe('skeleton motion', () => {
  test('pulses by default and stays still when reduced motion is on', () => {
    expect(skeletonMotion(false)).toBe('pulse');
    expect(skeletonMotion(true)).toBe('static');
    expect(skeletonOpacity.visible).toBeGreaterThan(skeletonOpacity.dim);
  });
});

describe('skeleton animation', () => {
  const start = jest.fn();
  const stop = jest.fn();

  beforeEach(() => {
    start.mockClear();
    stop.mockClear();
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({ remove: jest.fn() });
    jest.spyOn(Animated, 'loop').mockReturnValue({ start, stop, reset: jest.fn() });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('starts a pulse and stops it when the skeleton unmounts', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    await act(async () => {
      renderer = TestRenderer.create(<Skeleton height={24} width={80} />);
      await Promise.resolve();
    });

    expect(start).toHaveBeenCalledTimes(1);

    await act(async () => {
      renderer?.unmount();
    });

    expect(stop).toHaveBeenCalledTimes(1);
  });

  test('does not pulse when reduced motion is enabled', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);

    await act(async () => {
      TestRenderer.create(<Skeleton height={24} width={80} />);
      await Promise.resolve();
    });

    expect(start).not.toHaveBeenCalled();
  });
});
