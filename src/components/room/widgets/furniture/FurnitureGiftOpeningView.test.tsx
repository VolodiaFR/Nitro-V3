import { CreateLinkEvent } from '@nitrots/nitro-renderer';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCatalogUiState } from '../../../../hooks';
import { FurnitureGiftOpeningView } from './FurnitureGiftOpeningView';

const testState = vi.hoisted(() => ({
    setGiftReceiver: vi.fn()
}));

vi.mock('@nitrots/nitro-renderer', () => ({ CreateLinkEvent: vi.fn() }));

vi.mock('../../../../api', () => ({
    attemptItemPlacement: vi.fn(),
    CatalogPageName: { GIFT_SHOP: 'gift_shop' },
    LocalizeText: (key: string, _names?: string[], values?: string[]) => `${key}${values?.length ? `:${values.join(',')}` : ''}`
}));

vi.mock('../../../../common', () => ({
    Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
    Column: ({ children }: any) => <div>{children}</div>,
    LayoutGiftTagView: () => <div />,
    LayoutImage: () => <div />,
    NitroCardContentView: ({ children }: any) => <main>{children}</main>,
    NitroCardHeaderView: ({ headerText }: any) => <header>{headerText}</header>,
    NitroCardView: ({ children }: any) => <section>{children}</section>,
    Text: ({ children }: any) => <span>{children}</span>
}));

vi.mock('../../../../hooks', () => ({
    useCatalogUiState: vi.fn(),
    useFurniturePresentWidget: () => ({
        isOwnerOfFurniture: true,
        objectId: 1,
        onClose: vi.fn(),
        openPresent: vi.fn(),
        placedItemId: -1,
        senderFigure: 'hd-180-1',
        senderName: 'Alice',
        text: 'Hello'
    }),
    useInventoryFurni: () => ({ groupItems: [] })
}));

afterEach(cleanup);

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCatalogUiState).mockReturnValue({ setGiftReceiver: testState.setGiftReceiver } as never);
});

describe('AIR present gift-back flow', () => {
    it('caches the sender before opening the catalog', () => {
        render(<FurnitureGiftOpeningView />);

        fireEvent.click(screen.getByRole('button', { name: 'widget.furni.present.give_gift:Alice' }));

        expect(testState.setGiftReceiver).toHaveBeenCalledWith('Alice');
        expect(CreateLinkEvent).toHaveBeenCalledWith('catalog/open/gift_shop');
    });
});
