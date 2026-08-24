import { describe, expect, it } from 'vitest';
import { createPacketCooldownGate } from './createPacketCooldownGate';

describe('createPacketCooldownGate', () => {
    it('sends the first request immediately', () => {
        let now = 1_000;
        const sent: string[] = [];
        const gate = createPacketCooldownGate(100, () => now);

        expect(gate.request(() => sent.push('poll'))).toBe(true);
        expect(sent).toEqual(['poll']);
    });

    it('drops a stacked save refresh inside the cooldown window', () => {
        let now = 1_000;
        const sent: string[] = [];
        const gate = createPacketCooldownGate(100, () => now);

        expect(gate.request(() => sent.push('poll'))).toBe(true);
        now = 1_049;
        expect(gate.request(() => sent.push('save'))).toBe(false);
        expect(sent).toEqual(['poll']);
    });

    it('does not queue a trailing send after a dropped request', () => {
        let now = 1_000;
        const sent: string[] = [];
        const gate = createPacketCooldownGate(100, () => now);

        gate.request(() => sent.push('poll'));
        now = 1_010;
        gate.request(() => sent.push('save'));
        now = 1_100;
        expect(sent).toEqual(['poll']);
    });

    it('allows another request once the cooldown has elapsed', () => {
        let now = 1_000;
        const sent: string[] = [];
        const gate = createPacketCooldownGate(100, () => now);

        gate.request(() => sent.push('poll'));
        now = 1_100;
        expect(gate.request(() => sent.push('save'))).toBe(true);
        expect(sent).toEqual(['poll', 'save']);
    });
});
