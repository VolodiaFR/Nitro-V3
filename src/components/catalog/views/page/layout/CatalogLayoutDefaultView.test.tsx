import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GetConfigurationValue } from '../../../../../api';
import { useCatalogData, useCatalogDisplayPreferences, useCatalogUiState } from '../../../../../hooks';
import { CatalogLayoutDefaultView } from './CatalogLayoutDefaultView';

vi.mock('../../../../../api', () => ({
    CatalogType: { NORMAL: 'NORMAL', BUILDER: 'BUILDERS_CLUB' },
    GetConfigurationValue: vi.fn((key: string) => key === 'catalog.multiple.purchase.enabled'),
    LocalizeText: (key: string) => key,
    ProductTypeEnum: { BADGE: 'b', FLOOR: 's' },
    SanitizeHtml: (value: string) => value
}));

vi.mock('../../../../../common', () => ({ Text: () => null }));

vi.mock('../../../../../hooks', () => ({
    getCatalogGridMetrics: () => ({}),
    useCatalogData: vi.fn(),
    useCatalogDisplayPreferences: vi.fn(),
    useCatalogUiState: vi.fn(() => ({ currentType: 'NORMAL' }))
}));

vi.mock('../../catalog-header/CatalogHeaderView', () => ({ CatalogHeaderView: () => null }));
vi.mock('../widgets/CatalogAddOnBadgeWidgetView', () => ({ CatalogAddOnBadgeWidgetView: () => null }));
vi.mock('../widgets/CatalogItemGridWidgetView', () => ({ CatalogItemGridWidgetView: () => null }));
vi.mock('../widgets/CatalogLimitedItemWidgetView', () => ({ CatalogLimitedItemWidgetView: () => null }));
vi.mock('../widgets/CatalogPreviewControls', () => ({ CatalogPreviewControls: () => null }));
vi.mock('../widgets/CatalogProductDetailsView', () => ({ CatalogProductDetailsView: () => null }));
vi.mock('../widgets/CatalogPurchaseSelectionPrompt', () => ({ CatalogPurchaseSelectionPrompt: () => null }));
vi.mock('../widgets/CatalogPurchaseWidgetView', () => ({ CatalogPurchaseWidgetView: () => null }));
vi.mock('../widgets/CatalogSpinnerWidgetView', () => ({ CatalogSpinnerWidgetView: () => null }));
vi.mock('../widgets/CatalogTotalPriceWidget', () => ({
    CatalogTotalPriceWidget: ({ classNames = [] }: { classNames?: string[] }) => <div className={classNames.join(' ')} />
}));
vi.mock('../widgets/CatalogViewProductWidgetView', () => ({ CatalogViewProductWidgetView: () => null }));

const page = {
    localization: {
        getImage: () => '',
        getText: () => ''
    }
};

afterEach(cleanup);

beforeEach(() => {
    vi.mocked(GetConfigurationValue).mockImplementation((key: string) => key === 'catalog.multiple.purchase.enabled');
    vi.mocked(useCatalogDisplayPreferences).mockReturnValue({ density: 'standard', showTilePrices: true } as any);
    vi.mocked(useCatalogUiState).mockReturnValue({ currentType: 'NORMAL' } as any);
    vi.mocked(useCatalogData).mockReturnValue({
        currentOffer: { product: { productType: 's' } },
        currentPage: page,
        roomPreviewer: null
    } as any);
});

describe('default catalog layout', () => {
    it('lets the product preview fill the exact 360px AIR region', () => {
        const view = render(<CatalogLayoutDefaultView hideNavigation={() => undefined} page={page as any} />);
        const preview = view.container.querySelector<HTMLElement>('.nitro-catalog-offer-preview');

        expect(preview).not.toBeNull();
        expect(preview.style.width).toBe('100%');
        expect(preview.style.minWidth).toBe('0px');
        expect(preview.style.flexGrow).toBe('1');
    });

    it('shows the embedded quantity and total-price row only for bundle purchases', () => {
        const nonBundleView = render(<CatalogLayoutDefaultView hideNavigation={() => undefined} page={page as any} />);

        expect(nonBundleView.container.querySelector('.nitro-catalog-price-row')).toBeNull();
        nonBundleView.unmount();

        vi.mocked(useCatalogData).mockReturnValue({
            currentOffer: { bundlePurchaseAllowed: true, product: { productType: 's' } },
            currentPage: page,
            roomPreviewer: null
        } as any);

        const bundleView = render(<CatalogLayoutDefaultView hideNavigation={() => undefined} page={page as any} />);

        expect(bundleView.container.querySelector('.nitro-catalog-price-row')).not.toBeNull();
        expect(bundleView.container.querySelector('.nitro-catalog-total-price-value')).not.toBeNull();
    });

    it('hides the quantity and total-price row when multiple purchase is disabled', () => {
        vi.mocked(useCatalogData).mockReturnValue({
            currentOffer: { bundlePurchaseAllowed: true, product: { productType: 's' } },
            currentPage: page,
            roomPreviewer: null
        } as any);
        vi.mocked(GetConfigurationValue).mockReturnValue(false);

        const disabledView = render(<CatalogLayoutDefaultView hideNavigation={() => undefined} page={page as any} />);

        expect(disabledView.container.querySelector('.nitro-catalog-price-row')).toBeNull();
    });

    it('hides the quantity and total-price row in Builders Club', () => {
        vi.mocked(useCatalogData).mockReturnValue({
            currentOffer: { bundlePurchaseAllowed: true, product: { productType: 's' } },
            currentPage: page,
            roomPreviewer: null
        } as any);
        vi.mocked(useCatalogUiState).mockReturnValue({ currentType: 'BUILDERS_CLUB' } as any);

        const builderView = render(<CatalogLayoutDefaultView hideNavigation={() => undefined} page={page as any} />);

        expect(builderView.container.querySelector('.nitro-catalog-price-row')).toBeNull();
    });
});
