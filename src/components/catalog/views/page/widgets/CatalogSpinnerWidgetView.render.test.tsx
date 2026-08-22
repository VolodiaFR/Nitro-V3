import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GetConfigurationValue } from '../../../../../api';
import { useCatalogData, useCatalogUiState } from '../../../../../hooks';
import { CatalogSpinnerWidgetView } from './CatalogSpinnerWidgetView';

vi.mock('../../../../../api', () => ({
    CatalogType: { NORMAL: 'NORMAL', BUILDER: 'BUILDERS_CLUB' },
    GetConfigurationValue: vi.fn(() => true),
    LocalizeText: (key: string) => key
}));

vi.mock('../../../../../hooks', () => ({
    useCatalogData: vi.fn(),
    useCatalogUiState: vi.fn()
}));

let purchaseOptions: { quantity: number };

const setPurchaseOptions = vi.fn((updater: (value: typeof purchaseOptions) => typeof purchaseOptions) => {
    purchaseOptions = updater(purchaseOptions);
});

afterEach(cleanup);

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(GetConfigurationValue).mockReturnValue(true);
    purchaseOptions = { quantity: 1 };
    vi.mocked(useCatalogData).mockReturnValue({ currentOffer: { bundlePurchaseAllowed: true } } as any);
    vi.mocked(useCatalogUiState).mockImplementation(() => ({ purchaseOptions, setPurchaseOptions }) as any);
});

describe('catalog purchase quantity control', () => {
    it('stays hidden for offers that cannot be purchased in bundles', () => {
        vi.mocked(useCatalogData).mockReturnValue({ currentOffer: { bundlePurchaseAllowed: false } } as any);

        render(<CatalogSpinnerWidgetView />);

        expect(screen.queryByRole('textbox', { name: 'catalog.bundlewidget.quantity' })).not.toBeInTheDocument();
    });

    it('stays hidden in Builders Club', () => {
        vi.mocked(useCatalogUiState).mockImplementation(
            () =>
                ({
                    currentType: 'BUILDERS_CLUB',
                    purchaseOptions,
                    setPurchaseOptions
                }) as any
        );

        render(<CatalogSpinnerWidgetView />);

        expect(screen.queryByRole('textbox', { name: 'catalog.bundlewidget.quantity' })).not.toBeInTheDocument();
    });

    it('honors the multiple-purchase feature switch', () => {
        vi.mocked(GetConfigurationValue).mockReturnValue(false);

        render(<CatalogSpinnerWidgetView />);

        expect(GetConfigurationValue).toHaveBeenCalledWith('catalog.multiple.purchase.enabled', true);
        expect(screen.queryByRole('textbox', { name: 'catalog.bundlewidget.quantity' })).not.toBeInTheDocument();
    });

    it('renders an associated digit input without native number controls or arrow buttons', () => {
        render(<CatalogSpinnerWidgetView />);

        const input = screen.getByRole('textbox', { name: 'catalog.bundlewidget.quantity' });

        expect(input).toHaveAttribute('type', 'text');
        expect(input).toHaveAttribute('inputmode', 'numeric');
        expect(input).toHaveAttribute('pattern', '[0-9]*');
        expect(input).toHaveValue('1');
        expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('updates the controlled quantity and clamps typed values to the supported range', () => {
        const view = render(<CatalogSpinnerWidgetView />);
        const input = screen.getByRole('textbox', { name: 'catalog.bundlewidget.quantity' });

        fireEvent.change(input, { target: { value: '37' } });

        expect(purchaseOptions.quantity).toBe(37);
        view.rerender(<CatalogSpinnerWidgetView />);
        expect(screen.getByRole('textbox', { name: 'catalog.bundlewidget.quantity' })).toHaveValue('37');

        fireEvent.change(screen.getByRole('textbox', { name: 'catalog.bundlewidget.quantity' }), { target: { value: '101' } });

        expect(purchaseOptions.quantity).toBe(100);
        view.rerender(<CatalogSpinnerWidgetView />);

        fireEvent.change(screen.getByRole('textbox', { name: 'catalog.bundlewidget.quantity' }), { target: { value: '' } });

        expect(purchaseOptions.quantity).toBe(1);
        expect(screen.getByRole('textbox', { name: 'catalog.bundlewidget.quantity' })).toHaveValue('');

        fireEvent.change(screen.getByRole('textbox', { name: 'catalog.bundlewidget.quantity' }), { target: { value: '5' } });

        expect(purchaseOptions.quantity).toBe(5);
        expect(screen.getByRole('textbox', { name: 'catalog.bundlewidget.quantity' })).toHaveValue('5');
    });
});
