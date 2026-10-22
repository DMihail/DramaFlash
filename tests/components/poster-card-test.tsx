import TestRenderer, { act } from 'react-test-renderer';

import { fillFrame } from '@/components/fillFrame';
import { PosterCard } from '@/components/PosterCard';

describe('poster card', () => {
  test('fills the 2:3 frame instead of the asset pixel size', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <PosterCard image={3} size={{ width: 130, height: 195 }} title="The CEO and I" />,
      );
    });

    const image = renderer!.root.findByProps({ accessibilityIgnoresInvertColors: true });
    expect(image.props).toMatchObject({
      resizeMode: 'cover',
      style: fillFrame,
    });
    expect(fillFrame).toMatchObject({ width: '100%', height: '100%' });
  });
});
