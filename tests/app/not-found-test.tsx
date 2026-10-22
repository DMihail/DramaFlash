import { type Metrics, SafeAreaProvider } from 'react-native-safe-area-context';
import TestRenderer, { act } from 'react-test-renderer';

import NotFoundScreen from '@/app/+not-found';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    replace: (...args: unknown[]) => mockReplace(...args),
  },
}));

jest.mock('lucide-react-native', () => {
  const Icon = () => null;
  return new Proxy({}, { get: () => Icon });
});

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

describe('unknown routes', () => {
  test('show a branded page that returns home', async () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(
        <SafeAreaProvider initialMetrics={metrics}>
          <NotFoundScreen />
        </SafeAreaProvider>,
      );
      await Promise.resolve();
    });

    if (!renderer) {
      throw new Error('expected a screen');
    }

    const text = JSON.stringify(renderer.toJSON());
    expect(text).toContain('Page not found');
    expect(text).not.toContain('Sitemap');

    const goHome = renderer.root.find(
      (node) =>
        node.props.accessibilityLabel === 'Go to Home' && typeof node.props.onPress === 'function',
    );

    await act(async () => {
      (goHome.props.onPress as () => void)();
    });

    expect(mockReplace).toHaveBeenCalledWith('/');

    await act(async () => {
      renderer?.unmount();
    });
  });
});
