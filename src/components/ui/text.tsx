import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { Fonts, Type, type ThemeColor, type TypeVariant } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TextProps = RNTextProps & {
  variant?: TypeVariant;
  color?: ThemeColor;
  /** Use the rounded font, which suits large numbers. */
  rounded?: boolean;
  align?: 'left' | 'center' | 'right';
};

/** The app's only text component. Use it instead of React Native's <Text>. */
export function Text({
  variant = 'body',
  color = 'text',
  rounded,
  align,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();
  return (
    <RNText
      style={[
        Type[variant],
        { color: theme[color], textAlign: align },
        rounded && { fontFamily: Fonts.rounded },
        variant === 'overline' && { textTransform: 'uppercase' },
        style,
      ]}
      {...rest}
    />
  );
}
