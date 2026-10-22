import { fillFrame } from '@/components/fillFrame';

describe('fill frame', () => {
  test('overrides intrinsic asset size with a full parent box', () => {
    expect(fillFrame).toMatchObject({
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      width: '100%',
      height: '100%',
    });
  });
});
