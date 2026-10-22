import { Image } from 'react-native';

import TestRenderer, { act } from 'react-test-renderer';

import { coverPosition } from '@/components/coverCrop';
import { CoverImage } from '@/components/CoverImage.web';

const mockFromModule = jest.fn();

jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: (source: unknown) => mockFromModule(source),
  },
}));

describe('web cover image', () => {
  beforeEach(() => {
    mockFromModule.mockReset();
  });

  test('uses the bundled asset URL and the upper crop', () => {
    mockFromModule.mockReturnValue({ uri: '/assets/hero.jpg' });

    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<CoverImage label="Hero" source={7} />);
    });

    const image = renderer!.root.findByType('img');
    expect(mockFromModule).toHaveBeenCalledWith(7);
    expect(image.props).toMatchObject({
      src: '/assets/hero.jpg',
      alt: 'Hero',
      style: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: coverPosition,
      },
    });
  });


  test('keeps a remote URI', () => {
    const source = { uri: 'https://example.com/poster.jpg' };
    mockFromModule.mockReturnValue({ uri: source.uri });

    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<CoverImage source={source} />);
    });

    expect(renderer!.root.findByType('img').props.src).toBe(source.uri);
  });

  test('falls back to Image when the asset cannot be resolved', () => {
    mockFromModule.mockImplementation(() => {
      throw new Error('missing');
    });

    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<CoverImage label="Missing" source={4} />);
    });

    expect(renderer!.root.findAllByType('img')).toHaveLength(0);
    const fallback = renderer!.root.findByType(Image);
    expect(fallback.props.source).toBe(4);
    expect(fallback.props.accessibilityLabel).toBe('Missing');
  });
});
