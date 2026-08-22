import { describe, expect, it } from 'vitest';
import { CatalogType } from '../../../../../api';
import { getAirCatalogColumnCount, getAirCatalogOfferDimensions, isAirBaseCatalogOffer, layoutAirCatalogOffers } from './catalogAirGrid.helpers';

const offer = (priceInCredits: number, priceInActivityPoints = 0) => ({ priceInCredits, priceInActivityPoints }) as any;

describe('AIR catalog grid packing', () => {
    it('selects the 36px base template for free and Builders Club offers', () => {
        expect(isAirBaseCatalogOffer(offer(0), CatalogType.NORMAL)).toBe(true);
        expect(getAirCatalogOfferDimensions(offer(0), CatalogType.NORMAL)).toEqual({ width: 36, height: 36 });
        expect(getAirCatalogOfferDimensions(offer(3), CatalogType.NORMAL)).toEqual({ width: 53, height: 74 });
        expect(getAirCatalogOfferDimensions(offer(3), CatalogType.BUILDER)).toEqual({ width: 36, height: 36 });
    });

    it('establishes heterogeneous first-row columns from each ordered template width', () => {
        const offers = [offer(0), offer(3), offer(0), offer(3), offer(0), offer(3), offer(0), offer(3)];

        expect(getAirCatalogColumnCount(offers, 335, CatalogType.NORMAL)).toBe(7);
    });

    it('preserves AIR gap-omitting admission at exact responsive boundaries', () => {
        const offers = Array.from({ length: 7 }, () => offer(3));

        expect(getAirCatalogColumnCount(offers, 385, CatalogType.NORMAL)).toBe(6);
        expect(getAirCatalogColumnCount(offers, 386, CatalogType.NORMAL)).toBe(7);
    });

    it('positions later offers round-robin while widening and independently stacking columns', () => {
        const offers = [offer(0), offer(3), offer(0), offer(3), offer(0), offer(3), offer(0), offer(3), offer(0), offer(3)];
        const layout = layoutAirCatalogOffers(offers, 7, CatalogType.NORMAL);

        expect(layout.entries.map(({ index, x, y }) => ({ index, x, y }))).toEqual([
            { index: 0, x: 0, y: 0 },
            { index: 1, x: 56, y: 0 },
            { index: 2, x: 112, y: 0 },
            { index: 3, x: 168, y: 0 },
            { index: 4, x: 224, y: 0 },
            { index: 5, x: 263, y: 0 },
            { index: 6, x: 319, y: 0 },
            { index: 7, x: 0, y: 36 },
            { index: 8, x: 56, y: 74 },
            { index: 9, x: 112, y: 36 }
        ]);
        expect(layout.height).toBe(110);
    });
});
