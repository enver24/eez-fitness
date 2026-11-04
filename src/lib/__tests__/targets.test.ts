/// <reference types="jest" />

import { ageFromBirthYear, calculateBmr, calculateTargets, MIN_CALORIES } from '@/lib/targets';

describe('calculateBmr (Mifflin–St Jeor)', () => {
  it('matches the published formula for men', () => {
    // 10×85 + 6.25×180 − 5×30 + 5 = 1830
    expect(
      calculateBmr({ sex: 'male', age: 30, heightCm: 180, weightKg: 85, activityLevel: 'moderate', goal: 'maintain' }),
    ).toBe(1830);
  });

  it('matches the published formula for women', () => {
    // 10×60 + 6.25×165 − 5×25 − 161 = 1345.25
    expect(
      calculateBmr({ sex: 'female', age: 25, heightCm: 165, weightKg: 60, activityLevel: 'sedentary', goal: 'maintain' }),
    ).toBeCloseTo(1345.25);
  });
});

describe('calculateTargets', () => {
  it('gives a 20% deficit for fat loss, with protein from body weight', () => {
    const targets = calculateTargets({
      sex: 'male',
      age: 30,
      heightCm: 180,
      weightKg: 85,
      activityLevel: 'moderate',
      goal: 'lose_fat',
    });
    // Maintenance 1830 × 1.55 = 2836.5, minus 20% = 2269 → rounded to 2270.
    expect(targets).toEqual({ calories: 2270, proteinG: 170, fatG: 63, carbsG: 256 });
  });

  it('never goes below the safe minimum', () => {
    const targets = calculateTargets({
      sex: 'female',
      age: 60,
      heightCm: 150,
      weightKg: 45,
      activityLevel: 'sedentary',
      goal: 'lose_fat',
    });
    expect(targets.calories).toBe(MIN_CALORIES.female);
  });

  it('caps a fat-loss deficit at 750 kcal a day', () => {
    const targets = calculateTargets({
      sex: 'male',
      age: 25,
      heightCm: 200,
      weightKg: 150,
      activityLevel: 'very_active',
      goal: 'lose_fat',
    });
    // Maintenance 2630 × 1.9 = 4997; a 20% cut would be ~999 kcal, so cap at 750.
    expect(targets.calories).toBe(4250);
  });

  it('adds a surplus to build muscle', () => {
    const maintain = calculateTargets({
      sex: 'male', age: 30, heightCm: 180, weightKg: 85, activityLevel: 'moderate', goal: 'maintain',
    });
    const build = calculateTargets({
      sex: 'male', age: 30, heightCm: 180, weightKg: 85, activityLevel: 'moderate', goal: 'build_muscle',
    });
    expect(build.calories).toBeGreaterThan(maintain.calories);
  });

  it('macros add up to roughly the calorie target', () => {
    const t = calculateTargets({
      sex: 'female', age: 35, heightCm: 170, weightKg: 70, activityLevel: 'active', goal: 'recomp',
    });
    const fromMacros = t.proteinG * 4 + t.carbsG * 4 + t.fatG * 9;
    expect(Math.abs(fromMacros - t.calories)).toBeLessThan(15);
  });
});

describe('ageFromBirthYear', () => {
  it('works out age from the year of birth', () => {
    expect(ageFromBirthYear(2000, new Date('2026-11-04'))).toBe(26);
  });
});
