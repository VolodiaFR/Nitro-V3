import { describe, expect, it } from 'vitest';
import { getCameraAchievementLevel, getNextEmptyCameraSlot, joinCameraPhotoUrl, willFillLastCameraSlot } from './CameraAirUtilities';

describe('AIR camera state helpers', () => {
    it('uses the achieved CameraPhotoCount level from explore, then archive', () => {
        expect(
            getCameraAchievementLevel([
                { code: 'explore', achievements: [{ badgeId: 'ACH_CameraPhotoCount4', finalLevel: false, level: 4 }] },
                { code: 'archive', achievements: [{ badgeId: 'ACH_CameraPhotoCount9', finalLevel: true, level: 9 }] }
            ])
        ).toBe(3);

        expect(
            getCameraAchievementLevel([
                { code: 'explore', achievements: [{ badgeId: 'ACH_CameraPhotoCount1', finalLevel: false, level: 1 }] },
                { code: 'archive', achievements: [{ badgeId: 'ACH_CameraPhotoCount6', finalLevel: true, level: 6 }] }
            ])
        ).toBe(6);
    });

    it('keeps sparse roll slots addressable and detects only the final fill', () => {
        const sparseRoll = [{ id: 1 }, null, { id: 3 }, null, { id: 5 }];

        expect(getNextEmptyCameraSlot(sparseRoll)).toBe(1);
        expect(willFillLastCameraSlot(sparseRoll, 1)).toBe(false);
        expect(willFillLastCameraSlot([{ id: 1 }, { id: 2 }, { id: 3 }, null, { id: 5 }], 3)).toBe(true);
        expect(willFillLastCameraSlot([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }], 3)).toBe(false);
    });

    it('always joins server-relative paths to the AIR stories image host', () => {
        expect(joinCameraPhotoUrl('https://images.example/stories/', '/camera/photo.png')).toBe('https://images.example/stories/camera/photo.png');
        expect(joinCameraPhotoUrl('https://images.example/stories/', 'camera/photo.png')).toBe('https://images.example/stories/camera/photo.png');
        expect(joinCameraPhotoUrl('https://images.example/stories/', 'https://cdn.example/photo.png')).toBe('https://cdn.example/photo.png');
    });
});
