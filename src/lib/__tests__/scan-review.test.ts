/// <reference types="jest" />

import { reviewItemFromScan, scaleReviewItem } from '@/lib/scan-review';

const rice = {
  name: 'Steamed white rice',
  estimated_grams: 200,
  calories: 260,
  protein_g: 4.8,
  carbs_g: 57.2,
  fat_g: 0.6,
  confidence: 'medium' as const,
};

describe('scan review', () => {
  it('keeps the AI estimate when the amount is unchanged', () => {
    expect(scaleReviewItem(reviewItemFromScan(rice))).toEqual({
      name: 'Steamed white rice',
      grams: 200,
      calories: 260,
      protein: 4.8,
      carbs: 57.2,
      fat: 0.6,
    });
  });

  it('scales nutrition when the user corrects the amount', () => {
    const item = { ...reviewItemFromScan(rice), grams: '150' };
    expect(scaleReviewItem(item)).toMatchObject({ grams: 150, calories: 195, carbs: 42.9 });
  });

  it('rejects rows without a name or a valid amount', () => {
    const item = reviewItemFromScan(rice);
    expect(scaleReviewItem({ ...item, name: '  ' })).toBeNull();
    expect(scaleReviewItem({ ...item, grams: '' })).toBeNull();
    expect(scaleReviewItem({ ...item, grams: '-5' })).toBeNull();
  });
});
