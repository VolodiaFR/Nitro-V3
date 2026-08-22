import { describe, expect, it } from 'vitest';
import {
    filterGiftRecipients,
    findGiftRecipientMatchIndex,
    getRandomGiftDefaultStuffType,
    limitGiftMessageLines,
    limitGiftMessageToTextarea,
    resolveGiftWrappingSelection,
    wrapGiftSelectionIndex
} from './CatalogGiftView.helpers';

describe('AIR catalog gift helpers', () => {
    it('can choose every configured default wrapper, including the final entry', () => {
        expect(getRandomGiftDefaultStuffType([10, 20, 30], () => 0)).toBe(10);
        expect(getRandomGiftDefaultStuffType([10, 20, 30], () => 0.999)).toBe(30);
        expect(getRandomGiftDefaultStuffType([], () => 0.5)).toBe(0);
    });

    it('wraps box and ribbon indexes in either direction', () => {
        expect(wrapGiftSelectionIndex(0, -1, 4)).toBe(3);
        expect(wrapGiftSelectionIndex(3, 1, 4)).toBe(0);
        expect(wrapGiftSelectionIndex(0, 1, 0)).toBe(0);
    });

    it('matches recipients by case-insensitive substring in friend-list order and caps the list at ten', () => {
        const friends = Array.from({ length: 14 }, (_, index) => ({ name: `${index % 2 ? 'AL' : 'al'}bert-${index}` }));

        expect(filterGiftRecipients(friends, 'LbErT')).toEqual(friends.slice(0, 10));
        expect(filterGiftRecipients(friends, '')).toEqual(friends.slice(0, 10));
    });

    it('preserves AIR pattern matching while tolerating an unfinished pattern', () => {
        expect(filterGiftRecipients([{ name: 'Albert' }, { name: 'Malbert' }], '^al')).toEqual([{ name: 'Albert' }]);
        expect(findGiftRecipientMatchIndex('Alice [VIP]', '[')).toBe(6);
    });

    it('keeps gift messages within AIR maximum of five explicit lines', () => {
        expect(limitGiftMessageLines('one\ntwo\nthree\nfour\nfive\nsix')).toBe('one\ntwo\nthree\nfour\nfive');
    });

    it('also removes text that soft-wraps beyond five visual rows', () => {
        const textarea = document.createElement('textarea');

        Object.defineProperty(textarea, 'scrollHeight', {
            configurable: true,
            get: () => Math.ceil(textarea.value.length / 4) * 16
        });

        expect(limitGiftMessageToTextarea('123456789012345678901234', textarea)).toBe('12345678901234567890');
    });

    it('resolves actual server box and ribbon types while preserving AIR default-box zero semantics', () => {
        expect(resolveGiftWrappingSelection(false, 999, 201, 8, 44)).toEqual({
            wrapperId: 201,
            boxType: 8,
            ribbonType: 44,
            previewExtraData: '8044'
        });
        expect(resolveGiftWrappingSelection(true, 999, 201, 8, 44)).toEqual({
            wrapperId: 999,
            boxType: 0,
            ribbonType: 0,
            previewExtraData: ''
        });
    });
});
