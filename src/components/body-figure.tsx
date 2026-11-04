import Svg, { Circle, Path } from 'react-native-svg';

import { withAlpha } from '@/constants/themes';
import type { BodyShape } from '@/lib/body-visual';
import type { Sex } from '@/lib/targets';
import { useTheme } from '@/hooks/use-theme';

/**
 * A simple, stylised front-view figure whose proportions follow a BodyShape.
 * Deliberately abstract: it's an illustration, not a picture of anyone.
 */
export function BodyFigure({
  shape,
  sex,
  height = 220,
  highlight,
}: {
  shape: BodyShape;
  sex: Sex;
  height?: number;
  highlight?: boolean;
}) {
  const theme = useTheme();
  const { fat, muscle } = shape;
  const female = sex === 'female';
  const cx = 50;

  // Half-widths of each body part (the drawing is 100 × 220 units).
  const shoulder = 15 + muscle * 5 + fat * 2.5 - (female ? 2 : 0);
  const chest = 13 + muscle * 3 + fat * 5;
  const waist = 8.5 + fat * 12 + (female ? -1.5 : 0.5);
  const hip = 12 + fat * 7 + (female ? 3 : 0);
  const thigh = 5.5 + fat * 3 + muscle * 1.5;
  const arm = 3.2 + muscle * 2 + fat * 2.2;

  const torso = [
    `M ${cx - shoulder} 42`,
    `Q ${cx - chest - 1} 55 ${cx - chest} 66`,
    `Q ${cx - waist - 1.5} 82 ${cx - waist} 96`,
    `Q ${cx - hip - 1} 108 ${cx - hip} 118`,
    `L ${cx + hip} 118`,
    `Q ${cx + hip + 1} 108 ${cx + waist} 96`,
    `Q ${cx + waist + 1.5} 82 ${cx + chest} 66`,
    `Q ${cx + chest + 1} 55 ${cx + shoulder} 42`,
    `Q ${cx} 36 ${cx - shoulder} 42 Z`,
  ].join(' ');

  const leg = (side: -1 | 1) => {
    const outer = cx + side * hip;
    const inner = cx + side * 1.5;
    const ankleOuter = cx + side * (hip - thigh + 3);
    const ankleInner = cx + side * (hip - thigh - 1);
    return [
      `M ${outer} 116`,
      `Q ${outer + side * 1} 160 ${ankleOuter} 206`,
      `L ${ankleInner} 206`,
      `Q ${inner + side * 2} 160 ${inner} 120`,
      'Z',
    ].join(' ');
  };

  const armPath = (side: -1 | 1) => {
    // Arms hang beside the widest part of the body, tapering to the wrist.
    const topCentre = shoulder + arm * 0.7;
    const bottomCentre = Math.max(chest, hip, waist) + arm * 0.9 + 1;
    const topWidth = arm * 2;
    const bottomWidth = arm * 1.3;
    const x = (offset: number) => cx + side * offset;
    return [
      `M ${x(topCentre - topWidth / 2)} 47`,
      `Q ${x(topCentre)} 40 ${x(topCentre + topWidth / 2)} 47`,
      `L ${x(bottomCentre + bottomWidth / 2)} 118`,
      `Q ${x(bottomCentre)} 123 ${x(bottomCentre - bottomWidth / 2)} 118`,
      'Z',
    ].join(' ');
  };

  const fill = withAlpha(highlight ? theme.accent : theme.textTertiary, highlight ? 0.55 : 0.35);
  const stroke = highlight ? theme.accent : theme.textTertiary;

  return (
    <Svg width={(height * 100) / 220} height={height} viewBox="0 0 100 220" accessibilityElementsHidden>
      <Circle cx={cx} cy={20} r={11} fill={fill} stroke={stroke} strokeWidth={1.2} />
      <Path d={`M ${cx - 4} 30 L ${cx + 4} 30 L ${cx + 5} 40 L ${cx - 5} 40 Z`} fill={fill} />
      <Path d={armPath(-1)} fill={fill} stroke={stroke} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d={armPath(1)} fill={fill} stroke={stroke} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d={leg(-1)} fill={fill} stroke={stroke} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d={leg(1)} fill={fill} stroke={stroke} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d={torso} fill={fill} stroke={stroke} strokeWidth={1.2} strokeLinejoin="round" />
    </Svg>
  );
}
