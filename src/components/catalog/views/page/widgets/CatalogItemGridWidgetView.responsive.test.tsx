import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CatalogItemGridWidgetView } from './CatalogItemGridWidgetView';

const catalogState = vi.hoisted(() => ({
    currentPage: { offers: [], pageId: 1 },
    currentType: 'NORMAL'
}));

vi.mock('../../../../../hooks', () => ({
    useCatalogActions: () => ({ selectCatalogOffer: vi.fn() }),
    useCatalogData: () => ({ currentOffer: null, currentPage: catalogState.currentPage }),
    useCatalogUiState: () => ({ currentType: catalogState.currentType, setCurrentPage: vi.fn() }),
    useInventoryFurni: () => ({ isVisible: false })
}));

describe('CatalogItemGridWidgetView responsive grid ownership', () => {
    beforeEach(() => {
        catalogState.currentPage = { offers: [], pageId: 1 };
        catalogState.currentType = 'NORMAL';
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it('applies the shared auto-fill grid class to every multi-column offer template', () => {
        render(<CatalogItemGridWidgetView columnCount={6} />);

        expect(screen.getByRole('listbox', { name: 'Catalog items' })).toHaveClass('nitro-catalog-grid');
    });

    it('does not turn a specialized single-column selector into an auto-fill grid', () => {
        render(<CatalogItemGridWidgetView columnCount={1} />);

        expect(screen.getByRole('listbox', { name: 'Catalog items' })).not.toHaveClass('nitro-catalog-grid');
    });

    it('packs an all-free standard AIR page with the 36px base template', () => {
        catalogState.currentPage = {
            offers: [{ offerId: 1, priceInCredits: 0, priceInActivityPoints: 0, product: {} }],
            pageId: 1
        } as any;

        render(
            <CatalogItemGridWidgetView
                className="nitro-catalog-grid nitro-catalog-grid-density-standard"
                columnCount={6}
                columnMinHeight={74}
                columnMinWidth={53}
            />
        );

        const grid = screen.getByRole('listbox', { name: 'Catalog items' });

        expect(grid).toHaveClass('uses-base-grid-template');
        expect(grid.style.getPropertyValue('--nitro-grid-column-min-height')).toBe('36px');
        expect(grid.style.getPropertyValue('--nitro-grid-column-min-width')).toBe('36px');
    });

    it('packs mixed paid and free offers into heterogeneous AIR columns', () => {
        vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(335);
        catalogState.currentPage = {
            offers: Array.from({ length: 8 }, (_, index) => ({
                offerId: index + 1,
                localizationName: `Offer ${index + 1}`,
                priceInCredits: index % 2,
                priceInActivityPoints: 0,
                pricingModel: 'single',
                product: {}
            })),
            pageId: 1
        } as any;

        const { container } = render(
            <CatalogItemGridWidgetView
                className="nitro-catalog-grid nitro-catalog-grid-density-standard"
                columnCount={6}
                columnMinHeight={74}
                columnMinWidth={53}
            />
        );

        const grid = screen.getByRole('listbox', { name: 'Catalog items' });
        const tiles = container.querySelectorAll('[data-air-offer-index]');

        expect(grid).toHaveClass('uses-mixed-grid-template');
        expect(tiles).toHaveLength(8);
        expect(container.querySelector('[data-air-offer-index="0"]')).toHaveStyle({ left: '0px', top: '0px', width: '36px', height: '36px' });
        expect(container.querySelector('[data-air-offer-index="7"]')).toHaveStyle({ left: '0px', top: '36px', width: '53px', height: '74px' });
    });

    it('publishes AIR admission counts for uniform standard grids at boundary widths', () => {
        vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(386);
        catalogState.currentPage = {
            offers: Array.from({ length: 7 }, (_, index) => ({
                offerId: index + 1,
                localizationName: `Paid ${index + 1}`,
                priceInCredits: 1,
                priceInActivityPoints: 0,
                pricingModel: 'single',
                product: {}
            })),
            pageId: 1
        } as any;

        render(
            <CatalogItemGridWidgetView
                className="nitro-catalog-grid nitro-catalog-grid-density-standard"
                columnCount={6}
                columnMinHeight={74}
                columnMinWidth={53}
            />
        );

        expect(screen.getByRole('listbox', { name: 'Catalog items' }).style.getPropertyValue('--nitro-air-column-count')).toBe('7');
    });

    it('marks Builders Club grids for orange selection in every density', () => {
        catalogState.currentType = 'BUILDERS_CLUB';
        catalogState.currentPage = {
            offers: [{ offerId: 1, priceInCredits: 1, priceInActivityPoints: 0, product: {} }],
            pageId: 1
        } as any;

        render(<CatalogItemGridWidgetView className="nitro-catalog-grid nitro-catalog-grid-density-compact" columnCount={7} />);

        expect(screen.getByRole('listbox', { name: 'Catalog items' })).toHaveClass('is-builder-grid');
    });
});
