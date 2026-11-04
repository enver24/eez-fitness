/**
 * Body check-ins: weight and optional measurements, one per day.
 * Row Level Security keeps each user's check-ins private.
 */

import { supabase } from '@/lib/supabase';

export type Measurement = 'waist_cm' | 'hips_cm' | 'chest_cm' | 'arm_cm' | 'thigh_cm';

export const MEASUREMENTS: { key: Measurement; label: string }[] = [
  { key: 'waist_cm', label: 'Waist' },
  { key: 'hips_cm', label: 'Hips' },
  { key: 'chest_cm', label: 'Chest' },
  { key: 'arm_cm', label: 'Arm' },
  { key: 'thigh_cm', label: 'Thigh' },
];

export type CheckIn = {
  id: string;
  measuredOn: string;
  weightKg: number | null;
  note: string | null;
} & Record<Measurement, number | null>;

export type CheckInInput = Omit<CheckIn, 'id'>;

type Row = {
  id: string;
  measured_on: string;
  weight_kg: number | string | null;
  note: string | null;
} & Record<Measurement, number | string | null>;

const COLUMNS = 'id, measured_on, weight_kg, waist_cm, hips_cm, chest_cm, arm_cm, thigh_cm, note';

const num = (value: number | string | null) => (value === null ? null : Number(value));

function fromRow(row: Row): CheckIn {
  return {
    id: row.id,
    measuredOn: row.measured_on,
    weightKg: num(row.weight_kg),
    waist_cm: num(row.waist_cm),
    hips_cm: num(row.hips_cm),
    chest_cm: num(row.chest_cm),
    arm_cm: num(row.arm_cm),
    thigh_cm: num(row.thigh_cm),
    note: row.note,
  };
}

/** All check-ins, oldest first. */
export async function fetchCheckIns(): Promise<CheckIn[]> {
  const { data, error } = await supabase
    .from('body_check_ins')
    .select(COLUMNS)
    .order('measured_on', { ascending: true })
    .limit(1000);
  if (error) throw error;
  return (data as Row[]).map(fromRow);
}

/** Saves the check-in for a day, replacing any existing one for that day. */
export async function saveCheckIn(input: CheckInInput) {
  const { error } = await supabase.from('body_check_ins').upsert(
    {
      measured_on: input.measuredOn,
      weight_kg: input.weightKg,
      waist_cm: input.waist_cm,
      hips_cm: input.hips_cm,
      chest_cm: input.chest_cm,
      arm_cm: input.arm_cm,
      thigh_cm: input.thigh_cm,
      note: input.note,
    },
    { onConflict: 'user_id,measured_on' },
  );
  if (error) throw error;
}

export async function deleteCheckIn(id: string) {
  const { error } = await supabase.from('body_check_ins').delete().eq('id', id);
  if (error) throw error;
}

/** Dates (YYYY-MM-DD) with at least one food entry since `fromDate`. */
export async function fetchFoodLoggedDays(fromDate: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('food_entries')
    .select('eaten_on')
    .gte('eaten_on', fromDate)
    .limit(1000);
  if (error) throw error;
  return [...new Set((data as { eaten_on: string }[]).map((row) => row.eaten_on))];
}

/** Weight-only check-ins as chart points, oldest first. */
export function weightSeries(checkIns: CheckIn[]) {
  return checkIns
    .filter((c): c is CheckIn & { weightKg: number } => c.weightKg !== null)
    .map((c) => ({ date: c.measuredOn, weightKg: c.weightKg }));
}

/** Progress towards a goal weight, from 0 to 1 (works for losing or gaining). */
export function goalProgress(startKg: number, currentKg: number, goalKg: number) {
  const total = goalKg - startKg;
  if (total === 0) return 1;
  return Math.min(Math.max((currentKg - startKg) / total, 0), 1);
}
