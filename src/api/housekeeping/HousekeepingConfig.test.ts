import { describe, expect, it } from 'vitest';
import { HousekeepingTabId } from './HousekeepingActionType';
import { HOUSEKEEPING_TABS } from './HousekeepingConfig';

describe('HOUSEKEEPING_TABS', () => {
    it('lists every tab once, in menu order, with no light/full split', () => {
        expect(HOUSEKEEPING_TABS).toEqual([
            HousekeepingTabId.DASHBOARD,
            HousekeepingTabId.LIVE,
            HousekeepingTabId.USERS,
            HousekeepingTabId.ROOMS,
            HousekeepingTabId.SUPPORT,
            HousekeepingTabId.BANS,
            HousekeepingTabId.AUDIT,
            HousekeepingTabId.HOTEL,
            HousekeepingTabId.PERMISSIONS,
            HousekeepingTabId.SOUNDBOARD
        ]);
    });
});
