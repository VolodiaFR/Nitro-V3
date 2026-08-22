import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DispatchUiEvent } from '../../../../../api';
import { CatalogPurchaseWidgetView } from './CatalogPurchaseWidgetView';

const testState = vi.hoisted(() => ({
    currentOffer: null as any,
    eventHandlers: new Map<string, (event: any) => void>(),
    getCurrencyAmount: vi.fn(),
    getNodesByOfferId: vi.fn(),
    giftReceiver: 'Gift Friend',
    giftWrappingEnabled: true,
    resetPlacedOfferData: vi.fn(),
    sendMessage: vi.fn(),
    setCatalogPlaceMultipleObjects: vi.fn(),
    setPurchaseOptions: vi.fn(),
    showConfirm: vi.fn(),
    simpleAlert: vi.fn(),
    skipConfirmation: false
}));

const composerTypes = vi.hoisted(() => {
    class PurchaseFromCatalogComposer {
        public constructor(
            public readonly pageId: number,
            public readonly offerId: number,
            public readonly extraData: string,
            public readonly amount: number
        ) {}
    }

    return { PurchaseFromCatalogComposer };
});

vi.mock('@nitrots/nitro-renderer', () => ({
    CreateLinkEvent: vi.fn(),
    PurchaseFromCatalogComposer: composerTypes.PurchaseFromCatalogComposer
}));

vi.mock('../../../../../api', () => ({
    BuilderFurniPlaceableStatus: {
        FURNI_LIMIT_REACHED: 1,
        MISSING_OFFER: 2,
        NOT_GROUP_ADMIN: 3,
        NOT_IN_ROOM: 4,
        NOT_ROOM_OWNER: 5,
        OKAY: 0,
        VISITORS_IN_ROOM: 6
    },
    CatalogPurchaseState: { CONFIRM: 1, FAILED: 3, NONE: 0, PURCHASE: 2, SOLD_OUT: 4 },
    CatalogType: { BUILDER: 'builder', NORMAL: 'normal' },
    DispatchUiEvent: vi.fn(),
    GetClubMemberLevel: vi.fn(() => 0),
    GetConfigurationValue: vi.fn((_key: string, fallback: string) => fallback),
    LocalizeText: (key: string, _names?: string[], values?: string[]) => `${key}${values?.length ? `:${values.join(',')}` : ''}`,
    NotificationBubbleType: { INFO: 'info' },
    OpenUrl: vi.fn(),
    Offer: { PRICING_MODEL_SINGLE: 'single' },
    ProductTypeEnum: { FLOOR: 'floor', WALL: 'wall' },
    SendMessageComposer: testState.sendMessage
}));

vi.mock('../../../../../common', () => ({
    Button: ({ children, classNames = [], disabled = false, onClick = undefined }: any) => (
        <div aria-disabled={disabled || undefined} className={classNames.join(' ')} onClick={disabled ? undefined : onClick}>
            {children}
        </div>
    ),
    LayoutLoadingSpinnerView: () => <span data-testid="loading" />,
    Text: ({ children }: any) => <span>{children}</span>
}));

vi.mock('../../../../../events', () => ({
    CatalogEvent: class {},
    CatalogInitGiftEvent: class {
        public constructor(
            public pageId: number,
            public offerId: number,
            public extraData: string,
            public receiverName: string
        ) {}
    },
    CatalogPurchasedEvent: { PURCHASE_SUCCESS: 'purchase-success' },
    CatalogPurchaseFailureEvent: { PURCHASE_FAILED: 'purchase-failed' },
    CatalogPurchaseNotAllowedEvent: { NOT_ALLOWED: 'purchase-not-allowed' },
    CatalogPurchaseSoldOutEvent: { SOLD_OUT: 'purchase-sold-out' }
}));

vi.mock('../../../../../hooks', () => ({
    useCatalogActions: () => ({ getNodesByOfferId: testState.getNodesByOfferId, resetPlacedOfferData: testState.resetPlacedOfferData }),
    useCatalogData: () => ({ currentOffer: testState.currentOffer, currentPage: null }),
    useCatalogSkipPurchaseConfirmation: () => [testState.skipConfirmation],
    useGiftConfiguration: () => ({ data: { isEnabled: testState.giftWrappingEnabled } }),
    useCatalogUiState: () => ({
        currentType: 'normal',
        giftReceiver: testState.giftReceiver,
        purchaseOptions: { extraData: '', extraParamRequired: false, quantity: 1 },
        setCatalogPlaceMultipleObjects: testState.setCatalogPlaceMultipleObjects,
        setPurchaseOptions: testState.setPurchaseOptions
    }),
    useNotification: () => ({ showConfirm: testState.showConfirm, showSingleBubble: vi.fn(), simpleAlert: testState.simpleAlert }),
    usePurse: () => ({ getCurrencyAmount: testState.getCurrencyAmount }),
    useUiEvent: (type: string, handler: (event: any) => void) => testState.eventHandlers.set(type, handler)
}));

vi.mock('../../CatalogPurchaseConfirmView', () => ({
    CatalogPurchaseConfirmView: ({ isGift = false, isSubmitting = false, onCancel, onConfirm }: any) => (
        <div>
            <button disabled={isSubmitting} data-testid={isGift ? 'gift-confirmation' : 'purchase-confirmation'} type="button" onClick={onConfirm}>
                {isGift ? 'confirm-gift' : 'confirm-purchase'}
            </button>
            <button disabled={isSubmitting} data-testid="cancel-confirmation" type="button" onClick={onCancel}>
                cancel
            </button>
        </div>
    )
}));

vi.mock('./CatalogClubUpgradeButton', () => ({ CatalogClubUpgradeButton: () => <div /> }));

const makeOffer = (credits: number, activityPoints: number) => ({
    activityPointType: 5,
    clubLevel: 0,
    giftable: false,
    haveOffer: true,
    isLazy: false,
    isRentOffer: false,
    offerId: 77,
    page: { pageId: 8 },
    priceInActivityPoints: activityPoints,
    priceInCredits: credits,
    pricingModel: 'single',
    product: { isUniqueLimitedItem: false, productType: 'floor' }
});

afterEach(cleanup);

beforeEach(() => {
    vi.clearAllMocks();
    testState.eventHandlers.clear();
    testState.currentOffer = makeOffer(0, 0);
    testState.getCurrencyAmount.mockReturnValue(100);
    testState.getNodesByOfferId.mockReturnValue([]);
    testState.giftReceiver = 'Gift Friend';
    testState.giftWrappingEnabled = true;
    testState.skipConfirmation = false;
});

describe('AIR catalog purchase balance behavior', () => {
    it('keeps Buy visible and shows the credit shortage only after click', () => {
        testState.currentOffer = makeOffer(50, 0);
        testState.getCurrencyAmount.mockImplementation((type: number) => (type === -1 ? 0 : 100));
        render(<CatalogPurchaseWidgetView />);

        const buy = screen.getByText('catalog.purchase_confirmation.buy');

        expect(screen.queryByText('catalog.alert.notenough.title')).not.toBeInTheDocument();

        fireEvent.click(buy);

        expect(testState.showConfirm).toHaveBeenCalledWith(
            'catalog.alert.notenough.credits.description',
            expect.any(Function),
            expect.any(Function),
            null,
            null,
            'catalog.alert.notenough.title'
        );
        expect(screen.queryByTestId('purchase-confirmation')).not.toBeInTheDocument();
        expect(testState.sendMessage).not.toHaveBeenCalled();
    });

    it('keeps Buy visible and shows an activity-point shortage only after click', () => {
        testState.currentOffer = makeOffer(0, 50);
        testState.getCurrencyAmount.mockImplementation((type: number) => (type === 5 ? 0 : 100));
        render(<CatalogPurchaseWidgetView />);

        fireEvent.click(screen.getByText('catalog.purchase_confirmation.buy'));

        expect(testState.simpleAlert).toHaveBeenCalledWith(
            'catalog.alert.notenough.activitypoints.description',
            null,
            null,
            null,
            'catalog.alert.notenough.activitypoints.title.5'
        );
        expect(screen.queryByTestId('purchase-confirmation')).not.toBeInTheDocument();
        expect(testState.sendMessage).not.toHaveBeenCalled();
    });

    it('submits an affordable offer when confirmation is skipped', () => {
        testState.currentOffer = makeOffer(10, 5);
        testState.skipConfirmation = true;
        render(<CatalogPurchaseWidgetView />);

        fireEvent.click(screen.getByText('catalog.purchase_confirmation.buy'));

        expect(testState.simpleAlert).not.toHaveBeenCalled();
        expect(testState.sendMessage).toHaveBeenCalledWith(expect.any(composerTypes.PurchaseFromCatalogComposer));
        expect(testState.sendMessage.mock.calls[0][0]).toMatchObject({ amount: 1, offerId: 77, pageId: 8 });
        expect(screen.queryByTestId('purchase-confirmation')).not.toBeInTheDocument();
    });

    it('keeps the AIR confirmation visible and disabled until the purchase outcome arrives', () => {
        testState.currentOffer = makeOffer(10, 5);
        render(<CatalogPurchaseWidgetView />);

        fireEvent.click(screen.getByText('catalog.purchase_confirmation.buy'));
        fireEvent.click(screen.getByTestId('purchase-confirmation'));

        expect(testState.sendMessage).toHaveBeenCalledWith(expect.any(composerTypes.PurchaseFromCatalogComposer));
        expect(screen.getByTestId('purchase-confirmation')).toBeDisabled();
        expect(screen.getByTestId('cancel-confirmation')).toBeDisabled();

        act(() => testState.eventHandlers.get('purchase-success')?.({ type: 'purchase-success' }));

        expect(screen.queryByTestId('purchase-confirmation')).not.toBeInTheDocument();
    });

    it('checks gift affordability before opening the AIR customizer', () => {
        testState.currentOffer = { ...makeOffer(50, 0), giftable: true };
        testState.getCurrencyAmount.mockImplementation((type: number) => (type === -1 ? 0 : 100));
        render(<CatalogPurchaseWidgetView />);

        fireEvent.click(screen.getByText('catalog.purchase_confirmation.gift'));

        expect(testState.showConfirm).toHaveBeenCalledWith(
            'catalog.alert.notenough.credits.description',
            expect.any(Function),
            expect.any(Function),
            null,
            null,
            'catalog.alert.notenough.title'
        );
        expect(DispatchUiEvent).not.toHaveBeenCalled();
    });

    it('hides the gift affordance when wrapping is disabled by the server', () => {
        testState.currentOffer = { ...makeOffer(10, 0), giftable: true };
        testState.giftWrappingEnabled = false;
        render(<CatalogPurchaseWidgetView />);

        expect(screen.queryByText('catalog.purchase_confirmation.gift')).not.toBeInTheDocument();
    });

    it('resolves search-page gifts and carries the cached gift-back recipient', () => {
        testState.currentOffer = { ...makeOffer(10, 0), giftable: true, page: { pageId: -1 } };
        testState.getNodesByOfferId.mockReturnValue([{ pageId: 42 }]);
        render(<CatalogPurchaseWidgetView />);

        fireEvent.click(screen.getByText('catalog.purchase_confirmation.gift'));

        expect(DispatchUiEvent).not.toHaveBeenCalled();
        fireEvent.click(screen.getByTestId('gift-confirmation'));

        expect(DispatchUiEvent).toHaveBeenCalledWith(expect.objectContaining({ extraData: '', offerId: 77, pageId: 42, receiverName: 'Gift Friend' }));
    });

    it('resets placed-offer state when the gift confirmation is cancelled', () => {
        testState.currentOffer = { ...makeOffer(10, 0), giftable: true };
        render(<CatalogPurchaseWidgetView />);

        fireEvent.click(screen.getByText('catalog.purchase_confirmation.gift'));
        fireEvent.click(screen.getByTestId('cancel-confirmation'));

        expect(testState.resetPlacedOfferData).toHaveBeenCalledOnce();
        expect(screen.queryByTestId('gift-confirmation')).not.toBeInTheDocument();
    });

    it('ignores gift outcomes while no normal catalog purchase is in flight', () => {
        render(<CatalogPurchaseWidgetView />);

        act(() => testState.eventHandlers.get('purchase-failed')?.({ type: 'purchase-failed' }));

        expect(screen.queryByText('generic.failed')).not.toBeInTheDocument();
        expect(screen.getByText('catalog.purchase_confirmation.buy')).toBeInTheDocument();
    });

    it('drops stale normal-purchase ownership before a later gift outcome', () => {
        vi.useFakeTimers();

        try {
            testState.currentOffer = { ...makeOffer(10, 0), giftable: true };
            testState.skipConfirmation = true;
            render(<CatalogPurchaseWidgetView />);

            fireEvent.click(screen.getByText('catalog.purchase_confirmation.buy'));
            act(() => vi.advanceTimersByTime(10000));

            expect(screen.getByText('catalog.purchase_confirmation.buy')).toBeInTheDocument();

            fireEvent.click(screen.getByText('catalog.purchase_confirmation.gift'));
            fireEvent.click(screen.getByTestId('gift-confirmation'));

            expect(DispatchUiEvent).toHaveBeenCalledOnce();

            act(() => testState.eventHandlers.get('purchase-failed')?.({ type: 'purchase-failed' }));

            expect(screen.queryByText('generic.failed')).not.toBeInTheDocument();
        } finally {
            vi.useRealTimers();
        }
    });
});
