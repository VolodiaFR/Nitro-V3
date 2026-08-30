import { describe, expect, it } from 'vitest';
import { getAutoCloseSeconds } from './useNotification';

describe('Notification auto close delay', () => {
    it('reads the delay the server sent with the notification', () => {
        expect(getAutoCloseSeconds(new Map([['timeout', '120']]))).toBe(120);
    });

    it('leaves notifications without a delay open until they are closed by hand', () => {
        expect(getAutoCloseSeconds(new Map())).toBeNull();
    });

    it('ignores a delay that is not a positive number of seconds', () => {
        expect(getAutoCloseSeconds(new Map([['timeout', 'soon']]))).toBeNull();
        expect(getAutoCloseSeconds(new Map([['timeout', '0']]))).toBeNull();
        expect(getAutoCloseSeconds(new Map([['timeout', '-30']]))).toBeNull();
    });
});
