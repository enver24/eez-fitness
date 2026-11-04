/**
 * Maths for the illustrated body visualiser. It turns height and weight into
 * simple "shape" numbers that control a stylised drawing. This is an
 * illustration only: it can't predict how a real body will change.
 */

import type { FitnessGoal, Sex } from '@/lib/targets';

export type BodyShape = {
  /** 0 = very lean, 1 = carrying much more body fat. */
  fat: number;
  /** 0 = little muscle, 1 = very muscular. */
  muscle: number;
};

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export function bmi(weightKg: number, heightCm: number) {
  const metres = heightCm / 100;
  return weightKg / (metres * metres);
}

/** Maps BMI 18–35 onto the 0–1 fat scale used by the drawing. */
function fatFromBmi(value: number) {
  return clamp01((value - 18) / 17);
}

/** Maps a body-fat percentage onto the 0–1 fat scale (different ranges by sex). */
function fatFromBodyFat(percent: number, sex: Sex) {
  return sex === 'male' ? clamp01((percent - 8) / 27) : clamp01((percent - 16) / 27);
}

/**
 * Shapes for "now" and "goal". If the user gave a body-fat estimate, it sets
 * the starting point; the goal moves from there by the change in BMI.
 */
export function bodyShapes(input: {
  sex: Sex;
  heightCm: number;
  weightKg: number;
  goalWeightKg: number;
  goal: FitnessGoal;
  bodyFatPercent: number | null;
}): { now: BodyShape; goal: BodyShape } {
  const bmiNow = bmi(input.weightKg, input.heightCm);
  const bmiGoal = bmi(input.goalWeightKg, input.heightCm);
  const fatNow =
    input.bodyFatPercent !== null ? fatFromBodyFat(input.bodyFatPercent, input.sex) : fatFromBmi(bmiNow);
  const buildsMuscle = input.goal === 'build_muscle' || input.goal === 'recomp';
  // When building muscle, extra weight is drawn mostly as muscle, not fat.
  const weightChangeAsFat = buildsMuscle && bmiGoal > bmiNow ? 0.3 : 1;
  const fatGoal = clamp01(fatNow + ((bmiGoal - bmiNow) / 17) * weightChangeAsFat);
  return {
    now: { fat: fatNow, muscle: 0.3 },
    goal: { fat: fatGoal, muscle: buildsMuscle ? 0.65 : input.goal === 'lose_fat' ? 0.35 : 0.3 },
  };
}

/** A shape partway between two others (t from 0 to 1). */
export function blendShapes(from: BodyShape, to: BodyShape, t: number): BodyShape {
  return { fat: from.fat + (to.fat - from.fat) * t, muscle: from.muscle + (to.muscle - from.muscle) * t };
}

/**
 * A rough number of weeks to reach the goal weight at a steady, generally
 * sustainable pace: 0.5 kg a week to lose, 0.25 kg a week to gain.
 */
export function weeksToGoal(weightKg: number, goalWeightKg: number) {
  const change = goalWeightKg - weightKg;
  if (Math.abs(change) < 0.1) return 0;
  const perWeek = change < 0 ? 0.5 : 0.25;
  return Math.ceil(Math.abs(change) / perWeek);
}
