import { type ReactNode } from 'react';
import { type StyleProp, type TextProps, type TextStyle, Text } from 'react-native';

import { useFontsReady } from '@/theme/fonts';
import { type ColorName, colors } from '@/theme/tokens';
import { resolveFontFamily, type TextRole, textRoles } from '@/theme/type';

type AppTextProps = Omit<TextProps, 'role' | 'style'> & {
  role: TextRole;
  color?: ColorName;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
};

export function AppText({ role, color, style, children, ...rest }: AppTextProps) {
  const fontsReady = useFontsReady();
  const roleStyle = textRoles[role];

  return (
    <Text
      {...rest}
      style={[
        roleStyle,
        color ? { color: colors[color] } : null,
        { fontFamily: resolveFontFamily(fontsReady, roleStyle.fontFamily) },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
