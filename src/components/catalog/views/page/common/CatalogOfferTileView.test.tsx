import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CatalogType } from '../../../../../api';
import { CatalogOfferTileView } from './CatalogOfferTileView';

const offer = (getIconUrl?: () => string) =>
    ({
        offerId: 90,
        localizationName: 'Sedia classica',
        priceInCredits: 4,
        priceInActivityPoints: 0,
        clubLevel: 0,
        pricingModel: 'single',
        product: {
            productType: 's',
            productClassId: 12,
            productCount: 1,
            furnitureData: { className: '' },
            getIconUrl
        }
    }) as any;

describe('catalog offer tile', () => {
    it('is keyboard selectable and does not expose technical ids to shoppers', () => {
        const selectOffer = vi.fn();
        const item = offer(() => 'icon.png');

        render(<CatalogOfferTileView offer={item} selectOffer={selectOffer} />);

        const tile = screen.getByRole('option', { name: 'Sedia classica' });
        expect(tile).not.toHaveAttribute('title', expect.stringContaining('Offer'));

        fireEvent.keyDown(tile, { key: 'Enter' });
        expect(selectOffer).toHaveBeenCalledWith(item);
    });

    it('keeps rendering when an imported product has no getIconUrl method', () => {
        expect(() => render(<CatalogOfferTileView offer={offer()} selectOffer={() => undefined} />)).not.toThrow();
    });

    it('shows the compact club-level marker and both configured prices on restricted offers', () => {
        const clubOffer = {
            ...offer(),
            clubLevel: 1,
            priceInCredits: 5,
            priceInActivityPoints: 200,
            activityPointType: 5
        };

        const { container } = render(<CatalogOfferTileView offer={clubOffer} selectOffer={() => undefined} />);

        expect(screen.getByLabelText('Habbo Club')).toBeInTheDocument();
        expect(container.querySelector('.nitro-catalog-grid-price')).toHaveClass('is-multi-price');
        expect(container.querySelectorAll('.nitro-catalog-grid-price-entry')).toHaveLength(2);
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('200')).toBeInTheDocument();
        expect(screen.getByText('+')).toBeInTheDocument();
    });

    it('keeps the AIR single-price template geometry when Polaris hides tile prices', () => {
        const { container } = render(<CatalogOfferTileView itemActive offer={offer()} selectOffer={() => undefined} showPrices={false} />);

        expect(container.querySelector('[role="option"]')).toHaveAttribute('aria-selected', 'true');
        expect(container.querySelector('.layout-grid-item')).toHaveClass('uses-single-price-template');
        expect(container.querySelector('.layout-grid-item')).toHaveClass('is-active');
        expect(container.querySelector('.layout-grid-item')).not.toHaveClass('is-grid-active');
        expect(container.querySelector('.nitro-catalog-grid-price')).toBeNull();
    });

    it('uses the 36px AIR base template for free and Builders Club offers', () => {
        const freeOffer = { ...offer(), priceInCredits: 0 };
        const { container, rerender } = render(<CatalogOfferTileView offer={freeOffer} selectOffer={() => undefined} />);

        expect(container.querySelector('.layout-grid-item')).toHaveClass('uses-base-grid-template');

        rerender(<CatalogOfferTileView currentType={CatalogType.BUILDER} offer={offer()} selectOffer={() => undefined} />);

        expect(container.querySelector('.layout-grid-item')).toHaveClass('uses-base-grid-template');
        expect(container.querySelector('.layout-grid-item')).not.toHaveClass('uses-single-price-template');
        expect(container.querySelector('.nitro-catalog-grid-price')).toBeNull();
    });
});
