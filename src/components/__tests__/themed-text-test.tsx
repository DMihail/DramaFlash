import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

describe('ThemedText', () => {
  test('renders its label in a theme text color', async () => {
    const { getByText } = await render(<ThemedText>DramaFlash</ThemedText>);
    const text = getByText('DramaFlash');
    const style = StyleSheet.flatten(text.props.style);

    expect([Colors.light.text, Colors.dark.text]).toContain(style.color);
  });
});
