import { describe, expect, it } from 'vitest';
import { WIRED_SNAPSHOT_REQUEST_COOLDOWN_MS } from '../../api/wired/createPacketCooldownGate';
import { WIRED_MONITOR_POLL_MS, WIRED_VARIABLES_POLL_MS } from './WiredCreatorTools.constants';

describe('wired snapshot poll intervals', () => {
    it('stay at or above the client cooldown so polls do not self-limit', () => {
        expect(WIRED_VARIABLES_POLL_MS).toBeGreaterThanOrEqual(WIRED_SNAPSHOT_REQUEST_COOLDOWN_MS);
        expect(WIRED_MONITOR_POLL_MS).toBeGreaterThanOrEqual(WIRED_SNAPSHOT_REQUEST_COOLDOWN_MS);
    });
});
