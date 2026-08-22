import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CatalogPurchaseConfirmView } from './CatalogPurchaseConfirmView';

const configuration = vi.hoisted(() => ({ spendingDisclaimerEnabled: false }));

vi.mock('../../../api', async () => {
    const actual = await vi.importActual<typeof import('../../../api')>('../../../api');

    return {
        ...actual,
        GetConfigurationValue: (key: string) =>
            key === 'disclaimer.credit_spending.enabled' ? configuration.spendingDisclaimerEnabled : '/currency/%type%.png',
        LocalizeText: (key: string) => key
    };
});

afterEach(() => {
    configuration.spendingDisclaimerEnabled = false;
    cleanup();
});

const offer = {
    localizationName: 'Sedia classica',
    localizationDescription: 'Una sedia molto comoda',
    priceInCredits: 25,
    priceInActivityPoints: 5,
    activityPointType: 0,
    isRentOffer: false,
    offerId: 42,
    product: {
        getIconUrl: () => '/catalog/sedia.png'
    }
} as any;

describe('catalog purchase confirmation', () => {
    it('shows the exact product, quantity and total before buying', () => {
        render(<CatalogPurchaseConfirmView offer={offer} quantity={2} onCancel={() => undefined} onConfirm={() => undefined} />);

        expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
        expect(screen.getByText('Sedia classica')).toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'Sedia classica' })).toHaveAttribute('src', '/catalog/sedia.png');
        expect(screen.getByText('X 2')).toBeInTheDocument();
        expect(screen.getByText('50')).toBeInTheDocument();
        expect(screen.getByText('+ 10')).toBeInTheDocument();
        expect(screen.queryByText('Una sedia molto comoda')).not.toBeInTheDocument();
    });

    it('supports explicit confirmation and Escape cancellation', () => {
        const onCancel = vi.fn();
        const onConfirm = vi.fn();
        const { rerender } = render(<CatalogPurchaseConfirmView offer={offer} quantity={1} onCancel={onCancel} onConfirm={onConfirm} />);

        fireEvent.click(screen.getByRole('button', { name: /catalog\.purchase_confirmation\.buy/i }));
        expect(onConfirm).toHaveBeenCalledOnce();

        rerender(<CatalogPurchaseConfirmView offer={offer} quantity={1} onCancel={onCancel} onConfirm={onConfirm} />);
        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
        expect(onCancel).toHaveBeenCalledOnce();
    });

    it('disables both AIR actions while the purchase request is in flight', () => {
        render(<CatalogPurchaseConfirmView isSubmitting offer={offer} quantity={1} onCancel={() => undefined} onConfirm={() => undefined} />);

        expect(screen.getByRole('button', { name: /generic\.cancel/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /catalog\.purchase_confirmation\.buy/i })).toBeDisabled();
    });

    it('turns the confirmation into AIR gifting before opening the wrapper dialog', () => {
        render(<CatalogPurchaseConfirmView isGift offer={offer} quantity={1} onCancel={() => undefined} onConfirm={() => undefined} />);

        expect(screen.getByText('catalog.purchase_confirmation.gift.title')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'catalog.purchase_confirmation.gift' })).toBeInTheDocument();
        expect(screen.queryByText('X 1')).not.toBeInTheDocument();
    });

    it('shows the remaining limited stock before confirmation', () => {
        const limitedOffer = {
            ...offer,
            product: {
                ...offer.product,
                isUniqueLimitedItem: true,
                uniqueLimitedItemsLeft: 7,
                uniqueLimitedItemSeriesSize: 100
            }
        } as any;

        render(<CatalogPurchaseConfirmView offer={limitedOffer} quantity={1} onCancel={() => undefined} onConfirm={() => undefined} />);

        expect(screen.getByText('7 / 100')).toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveClass('nitro-catalog-purchase-confirm-limited');
    });

    it('uses the AIR spending disclaimer gate when configured', () => {
        configuration.spendingDisclaimerEnabled = true;

        render(<CatalogPurchaseConfirmView offer={offer} quantity={1} onCancel={() => undefined} onConfirm={() => undefined} />);

        const buyButton = screen.getByRole('button', { name: 'catalog.purchase_confirmation.buy' });
        const checkbox = screen.getByRole('checkbox', { name: 'disclaimer.credit_spending' });

        expect(buyButton).toBeDisabled();
        fireEvent.click(checkbox);
        expect(buyButton).toBeEnabled();
    });

    it('keeps the AIR zero-credit price display for a free offer', () => {
        render(
            <CatalogPurchaseConfirmView
                offer={{ ...offer, priceInActivityPoints: 0, priceInCredits: 0 } as any}
                quantity={1}
                onCancel={() => undefined}
                onConfirm={() => undefined}
            />
        );

        expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('traps keyboard focus and restores it to the opener when closed', () => {
        const opener = document.createElement('button');
        document.body.appendChild(opener);
        opener.focus();

        const { unmount } = render(<CatalogPurchaseConfirmView offer={offer} quantity={1} onCancel={() => undefined} onConfirm={() => undefined} />);
        const dialog = screen.getByRole('dialog');
        const buttons = within(dialog).getAllByRole('button');

        buttons.at(-1)?.focus();
        fireEvent.keyDown(dialog, { key: 'Tab' });
        expect(buttons[0]).toHaveFocus();

        unmount();
        expect(opener).toHaveFocus();
        opener.remove();
    });
});
