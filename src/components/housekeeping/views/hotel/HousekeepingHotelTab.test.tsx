/* @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HousekeepingHotelTab } from './HousekeepingHotelTab';

const reloadHotel = vi.fn((target: string) => Promise.resolve({ ok: true, actionId: null, message: target }));
const sendHotelAlert = vi.fn();
const confirm = vi.fn((_message: string, onConfirm: () => void) => onConfirm());

vi.mock('../../../../hooks', () => ({
    useHousekeeping: () => ({ isActionPending: false, sendHotelAlert, reloadHotel }),
    useHousekeepingConfirm: () => confirm
}));

vi.mock('../../../../api', () => ({
    LocalizeText: (key: string) => key,
    formatHousekeepingDateTime: () => 'now',
    HOUSEKEEPING_RELOAD_TARGETS: ['catalog', 'texts', 'permissions', 'items', 'navigator', 'config', 'wordfilter']
}));

describe('HousekeepingHotelTab', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('offers one reload per server table', () => {
        render(<HousekeepingHotelTab />);

        expect(screen.getAllByText('housekeeping.hotel.reload.run')).toHaveLength(7);
    });

    it('asks first, then reloads the chosen table and shows when it was done', async () => {
        render(<HousekeepingHotelTab />);

        fireEvent.click(screen.getAllByText('housekeeping.hotel.reload.run')[2]);

        expect(confirm).toHaveBeenCalledTimes(1);
        expect(reloadHotel).toHaveBeenCalledWith('permissions');
        await waitFor(() => expect(screen.getByText('housekeeping.hotel.reload.done_at')).toBeTruthy());
    });
});
