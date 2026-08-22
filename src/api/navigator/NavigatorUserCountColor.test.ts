import { describe, expect, it } from 'vitest';
import {
    NAVIGATOR_USERCOUNT_EMPTY,
    NAVIGATOR_USERCOUNT_GREEN,
    NAVIGATOR_USERCOUNT_RED,
    NAVIGATOR_USERCOUNT_YELLOW,
    getNavigatorUserCountColor
} from './NavigatorUserCountColor';

describe('getNavigatorUserCountColor', () => {
    it('matches AIR occupancy thresholds', () => {
        expect(getNavigatorUserCountColor(0, 50)).toBe(NAVIGATOR_USERCOUNT_EMPTY);
        expect(getNavigatorUserCountColor(1, 50)).toBe(NAVIGATOR_USERCOUNT_GREEN);
        expect(getNavigatorUserCountColor(25, 50)).toBe(NAVIGATOR_USERCOUNT_YELLOW);
        expect(getNavigatorUserCountColor(46, 50)).toBe(NAVIGATOR_USERCOUNT_RED);
    });

    it('does not treat a missing max as a full room', () => {
        expect(getNavigatorUserCountColor(0, 0)).toBe(NAVIGATOR_USERCOUNT_EMPTY);
        expect(getNavigatorUserCountColor(1, 0)).toBe(NAVIGATOR_USERCOUNT_GREEN);
    });
});
