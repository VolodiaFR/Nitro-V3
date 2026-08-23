import { describe, expect, it, vi } from 'vitest';
import { IsNftAvatarPartSet } from './IsNftAvatarPartSet';

const partSet = (id: number, isSellable: boolean) => ({ id, isSellable }) as never;

describe('IsNftAvatarPartSet', () => {
    it('never classifies a base figure set as NFT from shared asset parts', () => {
        const detectFromAssets = vi.fn(() => true);

        expect(IsNftAvatarPartSet(partSet(1, false), new Set(), detectFromAssets)).toBe(false);
        expect(detectFromAssets).not.toHaveBeenCalled();
    });

    it('uses authoritative NFT set ids when the server provides them', () => {
        const detectFromAssets = vi.fn(() => true);
        const knownIds = new Set([42]);

        expect(IsNftAvatarPartSet(partSet(42, true), knownIds, detectFromAssets)).toBe(true);
        expect(IsNftAvatarPartSet(partSet(43, true), knownIds, detectFromAssets)).toBe(false);
        expect(detectFromAssets).not.toHaveBeenCalled();
    });

    it('falls back to asset detection only for sellable sets', () => {
        const detectFromAssets = vi.fn(() => true);
        const candidate = partSet(42, true);

        expect(IsNftAvatarPartSet(candidate, new Set(), detectFromAssets)).toBe(true);
        expect(detectFromAssets).toHaveBeenCalledWith(candidate);
    });
});
