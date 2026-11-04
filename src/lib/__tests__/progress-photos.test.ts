/// <reference types="jest" />

import { comparisonPair, isPhotoCheckInDue, type ProgressPhoto } from '@/lib/progress-photos';

jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('expo-file-system', () => ({ File: jest.fn() }));
jest.mock('expo-image-manipulator', () => ({ ImageManipulator: {}, SaveFormat: { JPEG: 'jpeg' } }));

function photo(takenOn: string, pose: ProgressPhoto['pose'] = 'front'): ProgressPhoto {
  return { id: takenOn + pose, storagePath: `user/${takenOn}.jpg`, takenOn, pose, note: null };
}

// 2 Nov 2026 is a Monday and 8 Nov 2026 is a Sunday.
const monday = new Date('2026-11-02T09:00:00');
const wednesday = new Date('2026-11-04T09:00:00');
const sunday = new Date('2026-11-08T09:00:00');

describe('weekly photo check-in', () => {
  it('is never due when switched off', () => {
    expect(isPhotoCheckInDue('off', [], monday)).toBe(false);
  });

  it('is due on Monday for the start of the week, but not mid-week', () => {
    expect(isPhotoCheckInDue('week_start', [], monday)).toBe(true);
    expect(isPhotoCheckInDue('week_start', [], wednesday)).toBe(false);
  });

  it('is due on Sunday for the end of the week', () => {
    expect(isPhotoCheckInDue('week_end', [], sunday)).toBe(true);
    expect(isPhotoCheckInDue('week_end', [], monday)).toBe(false);
  });

  it('is not due once a photo has been taken that week', () => {
    expect(isPhotoCheckInDue('week_end', [photo('2026-11-03')], sunday)).toBe(false);
    // A photo from last week doesn't count.
    expect(isPhotoCheckInDue('week_end', [photo('2026-11-01')], sunday)).toBe(true);
  });
});

describe('before/after comparison', () => {
  it('pairs the earliest and latest photo of the same pose', () => {
    const pair = comparisonPair(
      [photo('2026-11-02'), photo('2026-10-05'), photo('2026-10-20'), photo('2026-09-01', 'side')],
      'front',
    );
    expect(pair?.before.takenOn).toBe('2026-10-05');
    expect(pair?.after.takenOn).toBe('2026-11-02');
  });

  it('needs at least two photos of that pose', () => {
    expect(comparisonPair([photo('2026-11-02'), photo('2026-10-01', 'side')], 'front')).toBeNull();
  });
});
