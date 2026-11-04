/// <reference types="jest" />

import { goalProgress, weightSeries, type CheckIn } from '@/lib/check-ins';

jest.mock('@/lib/supabase', () => ({ supabase: {} }));

describe('goalProgress', () => {
  it('works when losing weight', () => {
    expect(goalProgress(90, 85, 80)).toBeCloseTo(0.5);
  });

  it('works when gaining weight', () => {
    expect(goalProgress(60, 63, 66)).toBeCloseTo(0.5);
  });

  it('never goes below 0 or above 1', () => {
    expect(goalProgress(90, 92, 80)).toBe(0);
    expect(goalProgress(90, 78, 80)).toBe(1);
  });

  it('counts as complete when the start is already the goal', () => {
    expect(goalProgress(75, 75, 75)).toBe(1);
  });
});

describe('weightSeries', () => {
  const base: CheckIn = {
    id: '1',
    measuredOn: '2026-11-01',
    weightKg: 80,
    waist_cm: null,
    hips_cm: null,
    chest_cm: null,
    arm_cm: null,
    thigh_cm: null,
    note: null,
  };

  it('keeps only check-ins with a weight', () => {
    const series = weightSeries([
      base,
      { ...base, id: '2', measuredOn: '2026-11-02', weightKg: null, waist_cm: 85 },
      { ...base, id: '3', measuredOn: '2026-11-03', weightKg: 79.5 },
    ]);
    expect(series).toEqual([
      { date: '2026-11-01', weightKg: 80 },
      { date: '2026-11-03', weightKg: 79.5 },
    ]);
  });
});
