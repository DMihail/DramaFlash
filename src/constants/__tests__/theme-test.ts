import { BottomTabInset, Colors, MaxContentWidth, Spacing } from '@/constants/theme';

describe('theme tokens', () => {
  test('light and dark themes expose the same color roles', () => {
    expect(Object.keys(Colors.light).sort()).toEqual(Object.keys(Colors.dark).sort());
  });

  test('color values are six-digit hex colors', () => {
    for (const scheme of [Colors.light, Colors.dark]) {
      for (const value of Object.values(scheme)) {
        expect(value).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    }
  });

  test('spacing values are positive and non-decreasing', () => {
    const values = Object.values(Spacing);

    expect(values.length).toBeGreaterThan(0);
    expect(values.every((value) => value > 0)).toBe(true);
    expect(values).toEqual([...values].sort((left, right) => left - right));
  });

  test('layout constants are positive', () => {
    expect(BottomTabInset).toBeGreaterThan(0);
    expect(MaxContentWidth).toBeGreaterThan(0);
  });
});
