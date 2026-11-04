/// <reference types="jest" />

import { blendShapes, bmi, bodyShapes, weeksToGoal } from '@/lib/body-visual';

describe('body visualiser maths', () => {
  it('works out BMI', () => {
    expect(bmi(80, 180)).toBeCloseTo(24.7, 1);
  });

  it('draws the goal leaner when losing weight', () => {
    const { now, goal } = bodyShapes({ sex: 'male', heightCm: 180, weightKg: 95, goalWeightKg: 82, goal: 'lose_fat', bodyFatPercent: null });
    expect(goal.fat).toBeLessThan(now.fat);
  });

  it('draws extra weight mostly as muscle when building muscle', () => {
    const { now, goal } = bodyShapes({ sex: 'female', heightCm: 165, weightKg: 58, goalWeightKg: 62, goal: 'build_muscle', bodyFatPercent: 24 });
    expect(goal.muscle).toBeGreaterThan(now.muscle);
    expect(goal.fat - now.fat).toBeLessThan(0.05);
  });

  it('keeps shapes within 0–1 and blends between them', () => {
    const { now, goal } = bodyShapes({ sex: 'male', heightCm: 170, weightKg: 150, goalWeightKg: 60, goal: 'lose_fat', bodyFatPercent: null });
    for (const value of [now.fat, goal.fat, now.muscle, goal.muscle]) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
    expect(blendShapes(now, goal, 0.5).fat).toBeCloseTo((now.fat + goal.fat) / 2);
  });

  it('estimates weeks at a steady pace', () => {
    expect(weeksToGoal(90, 85)).toBe(10); // 0.5 kg a week
    expect(weeksToGoal(60, 62)).toBe(8); // 0.25 kg a week
    expect(weeksToGoal(70, 70)).toBe(0);
  });
});
