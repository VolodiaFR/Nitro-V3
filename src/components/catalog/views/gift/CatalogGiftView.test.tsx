import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SendMessageComposer } from '../../../../api';
import { CatalogInitGiftEvent } from '../../../../events';
import { useMessageEvent, useNotification, useUiEvent } from '../../../../hooks';
import { CatalogGiftView } from './CatalogGiftView';

const rendererMocks = vi.hoisted(() => {
    class GiftReceiverNotFoundEvent {}
    class NotEnoughBalanceMessageEvent {}

    class PurchaseFromCatalogAsGiftComposer {
        public constructor(
            public readonly pageId: number,
            public readonly offerId: number,
            public readonly extraData: string,
            public readonly receiverName: string,
            public readonly message: string,
            public readonly wrapperId: number,
            public readonly boxType: number,
            public readonly ribbonType: number,
            public readonly showMyFace: boolean
        ) {}
    }

    const session = {
        figure: 'hd-180-1',
        userName: 'Owner',
        isModerator: false,
        getFloorItemData: vi.fn((id: number) => ({ colors: [id] })),
        hasSecurity: vi.fn(() => false)
    };

    const resetPlacedOfferData = vi.fn();
    const setGiftReceiver = vi.fn();

    return { GiftReceiverNotFoundEvent, NotEnoughBalanceMessageEvent, PurchaseFromCatalogAsGiftComposer, resetPlacedOfferData, session, setGiftReceiver };
});

vi.mock('@nitrots/nitro-renderer', () => ({
    GetSessionDataManager: () => rendererMocks.session,
    GiftReceiverNotFoundEvent: rendererMocks.GiftReceiverNotFoundEvent,
    NitroEvent: class {},
    NotEnoughBalanceMessageEvent: rendererMocks.NotEnoughBalanceMessageEvent,
    PurchaseFromCatalogAsGiftComposer: rendererMocks.PurchaseFromCatalogAsGiftComposer,
    SecurityLevel: { MODERATOR: 5 }
}));

const configuration = {
    boxTypes: [3, 8],
    defaultStuffTypes: [900],
    isEnabled: true,
    price: 10,
    ribbonTypes: [0, 44, 2, 3, 4, 5, 6, 7, 8, 9, 99],
    stuffTypes: [201, 202]
};

vi.mock('../../../../api', () => ({
    ColorUtils: { makeColorNumberHex: (color: number) => `#${color.toString(16).padStart(6, '0')}` },
    GetConfigurationValue: vi.fn((key: string, fallback: unknown) => {
        if (key === 'catalog.purchase.gift_wrapping.default_box_index') return 0;
        return fallback;
    }),
    LocalizeText: (key: string, _names?: string[], values?: string[]) => `${key}${values?.length ? `:${values.join(',')}` : ''}`,
    ProductTypeEnum: { FLOOR: 's' },
    OpenUrl: vi.fn(),
    SendMessageComposer: vi.fn()
}));

vi.mock('../../../../common', () => ({
    LayoutAvatarImageView: ({ compactHead, direction, headOnly, nativeCroppedHead }: any) => (
        <div
            data-compact-head={compactHead ? 'true' : 'false'}
            data-direction={direction}
            data-head-only={headOnly ? 'true' : 'false'}
            data-native-cropped-head={nativeCroppedHead ? 'true' : 'false'}
            data-testid="gift-avatar"
        />
    ),
    LayoutFurniImageView: ({ direction, extraData, productClassId }: { direction: number; extraData: string; productClassId: number }) => (
        <div data-direction={direction} data-extra-data={extraData} data-product-class-id={productClassId} data-testid="gift-furni" />
    ),
    NitroCardContentView: ({ children, classNames }: { children: React.ReactNode; classNames: string[] }) => (
        <main className={classNames.join(' ')}>{children}</main>
    ),
    NitroCardHeaderView: ({ headerText, onCloseClick }: { headerText: string; onCloseClick: () => void }) => (
        <header>
            {headerText}
            <button aria-label="close" type="button" onClick={onCloseClick} />
        </header>
    ),
    NitroCardView: ({ children, classNames }: { children: React.ReactNode; classNames: string[] }) => (
        <section className={classNames.join(' ')}>{children}</section>
    )
}));

vi.mock('../../../../events', () => {
    class CatalogInitGiftEvent {
        public readonly type = 'catalog-init-gift';

        public constructor(
            public readonly pageId: number,
            public readonly offerId: number,
            public readonly extraData: string,
            public readonly receiverName: string = ''
        ) {}
    }

    return {
        CatalogEvent: { INIT_GIFT: 'catalog-init-gift' },
        CatalogInitGiftEvent,
        CatalogPurchasedEvent: { PURCHASE_SUCCESS: 'purchase-success' },
        CatalogPurchaseFailureEvent: { PURCHASE_FAILED: 'purchase-failed' },
        CatalogPurchaseNotAllowedEvent: { NOT_ALLOWED: 'purchase-not-allowed' },
        CatalogPurchaseSoldOutEvent: { SOLD_OUT: 'purchase-sold-out' }
    };
});

vi.mock('../../../../hooks', () => ({
    useCatalogActions: vi.fn(() => ({ resetPlacedOfferData: rendererMocks.resetPlacedOfferData })),
    useCatalogUiState: vi.fn(() => ({ setGiftReceiver: rendererMocks.setGiftReceiver })),
    useFriends: vi.fn(() => ({
        friends: Array.from({ length: 12 }, (_, index) => ({ id: index + 1, name: `${index % 2 ? 'AL' : 'al'}bert-${index}` }))
    })),
    useGiftConfiguration: vi.fn(() => ({ data: configuration })),
    useMessageEvent: vi.fn(),
    useNotification: vi.fn(),
    useUiEvent: vi.fn()
}));

let catalogEventHandler: ((event: unknown) => void) | null = null;
let receiverNotFoundHandler: (() => void) | null = null;
let notEnoughBalanceHandler: ((event: unknown) => void) | null = null;
let simpleAlert: ReturnType<typeof vi.fn>;
let showConfirm: ReturnType<typeof vi.fn>;

const openGift = async (receiverName = '') => {
    render(<CatalogGiftView />);

    act(() => catalogEventHandler?.(new CatalogInitGiftEvent(71, 81, 'product-extra', receiverName)));

    await screen.findByRole('textbox', { name: 'catalog.gift_wrapping_new.name_hint' });
};

afterEach(cleanup);

beforeEach(() => {
    vi.clearAllMocks();
    catalogEventHandler = null;
    receiverNotFoundHandler = null;
    notEnoughBalanceHandler = null;
    simpleAlert = vi.fn();
    showConfirm = vi.fn();
    rendererMocks.session.hasSecurity.mockReturnValue(false);
    vi.mocked(useNotification).mockReturnValue({ showConfirm, simpleAlert } as never);
    vi.mocked(useUiEvent).mockImplementation((_types: string | string[], handler: (event: unknown) => void) => {
        catalogEventHandler = handler;
    });
    vi.mocked(useMessageEvent).mockImplementation((eventType: unknown, handler: () => void) => {
        if (eventType === rendererMocks.GiftReceiverNotFoundEvent) receiverNotFoundHandler = handler;
        else if (eventType === rendererMocks.NotEnoughBalanceMessageEvent) notEnoughBalanceHandler = handler;
    });
});

describe('AIR catalog gift dialog', () => {
    it('renders the AIR fields without the obsolete receiver heading or normal-user privacy control', async () => {
        await openGift();

        expect(document.querySelector('.nitro-catalog-gift')).toBeInTheDocument();
        expect(screen.queryByText('catalog.gift_wrapping.receiver')).not.toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'catalog.gift_wrapping_new.name_hint' })).toHaveAttribute('maxLength', '32');
        expect(screen.getByRole('textbox', { name: 'catalog.gift_wrapping_new.message_hint' })).toHaveAttribute('maxLength', '140');
        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
        expect(screen.getByTestId('gift-furni')).toHaveAttribute('data-direction', '180');
        expect(screen.getByTestId('gift-avatar')).toHaveAttribute('data-direction', '2');
        expect(screen.getByTestId('gift-avatar')).toHaveAttribute('data-head-only', 'true');
        expect(screen.getByTestId('gift-avatar')).toHaveAttribute('data-native-cropped-head', 'true');
        expect(screen.getByTestId('gift-avatar')).toHaveAttribute('data-compact-head', 'false');
        expect(screen.getByTestId('gift-furni')).toHaveAttribute('data-product-class-id', '201');
        expect(screen.getByTestId('gift-furni')).toHaveAttribute('data-extra-data', '3000');
        expect(screen.getByRole('textbox', { name: 'catalog.gift_wrapping_new.name_hint' })).toHaveFocus();
    });

    it('prefills an explicit gift recipient and moves focus to the message field', async () => {
        await openGift('Alice');

        expect(screen.getByRole('textbox', { name: 'catalog.gift_wrapping_new.name_hint' })).toHaveValue('Alice');
        expect(screen.getByRole('textbox', { name: 'catalog.gift_wrapping_new.message_hint' })).toHaveFocus();
    });

    it('does not reset placement on open or consume another catalog purchase outcome', async () => {
        render(<CatalogGiftView />);

        act(() => catalogEventHandler?.({ type: 'purchase-success' }));
        act(() => catalogEventHandler?.(new CatalogInitGiftEvent(71, 81, 'product-extra')));

        await screen.findByRole('button', { name: 'catalog.gift_wrapping.give_gift' });
        expect(rendererMocks.resetPlacedOfferData).not.toHaveBeenCalled();

        act(() => catalogEventHandler?.({ code: 2, type: 'purchase-failed' }));

        expect(screen.getByRole('button', { name: 'catalog.gift_wrapping.give_gift' })).toBeInTheDocument();
        expect(simpleAlert).not.toHaveBeenCalled();
        expect(rendererMocks.resetPlacedOfferData).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'close' }));

        expect(rendererMocks.resetPlacedOfferData).toHaveBeenCalledTimes(1);
    });

    it('sends configured box and ribbon values instead of their array indexes', async () => {
        await openGift();

        fireEvent.change(screen.getByRole('textbox', { name: 'catalog.gift_wrapping_new.name_hint' }), { target: { value: 'Alice' } });
        fireEvent.change(screen.getByRole('textbox', { name: 'catalog.gift_wrapping_new.message_hint' }), { target: { value: 'Hello' } });
        fireEvent.click(screen.getAllByRole('button', { name: 'catalog.gift_wrapping.pick_ribbon.title' })[1]);
        fireEvent.click(screen.getByRole('button', { name: 'catalog.gift_wrapping.give_gift' }));

        const composer = vi.mocked(SendMessageComposer).mock.calls[0][0];

        expect(composer).toBeInstanceOf(rendererMocks.PurchaseFromCatalogAsGiftComposer);
        expect(composer).toMatchObject({
            boxType: 3,
            extraData: 'product-extra',
            message: 'Hello',
            offerId: 81,
            pageId: 71,
            receiverName: 'Alice',
            ribbonType: 44,
            showMyFace: true,
            wrapperId: 201
        });
        expect(rendererMocks.setGiftReceiver).toHaveBeenCalledWith(null);
        expect(screen.getByRole('button', { name: 'catalog.gift_wrapping.give_gift' })).toBeDisabled();
    });

    it('uses the default wrapper furniture with empty preview data and sends zero box and ribbon types', async () => {
        await openGift();

        fireEvent.click(screen.getAllByRole('button', { name: 'catalog.gift_wrapping.pick_box' })[0]);

        expect(screen.getByTestId('gift-furni')).toHaveAttribute('data-product-class-id', '900');
        expect(screen.getByTestId('gift-furni')).toHaveAttribute('data-extra-data', '');
        expect(screen.getAllByRole('button', { name: 'catalog.gift_wrapping.pick_ribbon.title' })[0]).toBeDisabled();

        fireEvent.click(screen.getByRole('button', { name: 'catalog.gift_wrapping.give_gift' }));

        expect(vi.mocked(SendMessageComposer).mock.calls[0][0]).toMatchObject({ boxType: 0, ribbonType: 0, wrapperId: 900 });
    });

    it('forces Valentine boxes to ribbon index ten and disables both ribbon and color controls', async () => {
        await openGift();

        fireEvent.click(screen.getAllByRole('button', { name: 'catalog.gift_wrapping.pick_box' })[1]);

        expect(screen.getByTestId('gift-furni')).toHaveAttribute('data-extra-data', '8099');
        expect(screen.getAllByRole('button', { name: 'catalog.gift_wrapping.pick_ribbon.title' })[0]).toBeDisabled();
        expect(screen.getAllByRole('button', { name: /^#/ })[0]).toBeDisabled();

        fireEvent.click(screen.getByRole('button', { name: 'catalog.gift_wrapping.give_gift' }));

        expect(vi.mocked(SendMessageComposer).mock.calls[0][0]).toMatchObject({ boxType: 8, ribbonType: 99 });
    });

    it('shows AIR privacy controls only to moderators and sends the unchecked incognito state', async () => {
        rendererMocks.session.hasSecurity.mockReturnValue(true);
        await openGift();

        const checkbox = screen.getByRole('checkbox', { name: 'catalog.gift_wrapping.show_face.title' });

        expect(checkbox).toBeChecked();
        fireEvent.click(checkbox);

        expect(document.querySelector('.nitro-catalog-gift-incognito')).toBeInTheDocument();
        expect(document.querySelector('.nitro-catalog-gift-signature')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'catalog.gift_wrapping.give_gift' }));

        expect(vi.mocked(SendMessageComposer).mock.calls[0][0]).toMatchObject({ showMyFace: false });
    });

    it('matches autocomplete names case-insensitively, preserves order, and caps the list at ten', async () => {
        await openGift();

        const recipient = screen.getByRole('textbox', { name: 'catalog.gift_wrapping_new.name_hint' });

        fireEvent.change(recipient, { target: { value: 'LbErT' } });

        expect(screen.getAllByRole('option')).toHaveLength(10);
        expect(screen.getAllByRole('option')[0]).toHaveTextContent('albert-0');
        expect(screen.getAllByRole('option')[0].querySelector('strong')).toHaveTextContent('lbert');

        fireEvent.change(recipient, { target: { value: '' } });
        expect(screen.getAllByRole('option')).toHaveLength(10);
    });

    it('re-enables submission and opens the AIR receiver alert after a server rejection', async () => {
        await openGift();

        const submit = screen.getByRole('button', { name: 'catalog.gift_wrapping.give_gift' });

        fireEvent.click(submit);
        expect(submit).toBeDisabled();

        act(() => receiverNotFoundHandler?.());

        await waitFor(() => expect(submit).toBeEnabled());
        expect(simpleAlert).toHaveBeenCalledWith(
            'catalog.gift_wrapping.receiver_not_found.info',
            null,
            null,
            null,
            'catalog.gift_wrapping.receiver_not_found.title'
        );
    });

    it('re-enables submission on insufficient balance and closes after a generic purchase failure', async () => {
        await openGift();

        const submit = screen.getByRole('button', { name: 'catalog.gift_wrapping.give_gift' });

        fireEvent.click(submit);
        act(() =>
            notEnoughBalanceHandler?.({
                getParser: () => ({ activityPointType: 0, notEnoughActivityPoints: false, notEnoughCredits: true })
            })
        );

        await waitFor(() => expect(submit).toBeEnabled());
        expect(showConfirm).toHaveBeenCalledWith(
            'catalog.alert.notenough.credits.description',
            expect.any(Function),
            expect.any(Function),
            null,
            null,
            'catalog.alert.notenough.title'
        );

        fireEvent.click(submit);
        act(() => catalogEventHandler?.({ code: 2, type: 'purchase-failed' }));

        await waitFor(() => expect(screen.queryByRole('button', { name: 'catalog.gift_wrapping.give_gift' })).not.toBeInTheDocument());
        expect(simpleAlert).toHaveBeenCalledWith('catalog.alert.purchaseerror.description.2', null, null, null, 'catalog.alert.purchaseerror.title');
    });

    it('uses the AIR actionable confirmation for insufficient Duckets', async () => {
        await openGift();

        const submit = screen.getByRole('button', { name: 'catalog.gift_wrapping.give_gift' });

        fireEvent.click(submit);
        act(() =>
            notEnoughBalanceHandler?.({
                getParser: () => ({ activityPointType: 0, notEnoughActivityPoints: true, notEnoughCredits: false })
            })
        );

        await waitFor(() => expect(submit).toBeEnabled());
        expect(showConfirm).toHaveBeenCalledWith(
            'catalog.alert.notenough.activitypoints.description:tooltip.duckets',
            expect.any(Function),
            expect.any(Function),
            null,
            null,
            'catalog.alert.notenough.activitypoints.title:tooltip.duckets'
        );
    });
});
