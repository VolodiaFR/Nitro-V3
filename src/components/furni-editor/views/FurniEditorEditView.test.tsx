import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CatalogRef, FurniDetail } from '../../../hooks/furni-editor';
import { FurniEditorEditView } from './FurniEditorEditView';

vi.mock('../../../api', () => ({
    CopyToClipboard: () => Promise.resolve(true)
}));

vi.mock('../../../common', () => ({
    Button: ({ children, onClick, disabled }: any) => (
        <button type="button" onClick={onClick} disabled={disabled}>
            {children}
        </button>
    ),
    Column: ({ children }: any) => <div>{children}</div>,
    Flex: ({ children }: any) => <div>{children}</div>,
    Text: ({ children }: any) => <span>{children}</span>,
    LayoutFurniIconImageView: () => null
}));

const item: FurniDetail = {
    id: 42,
    spriteId: 4200,
    itemName: 'throne',
    publicName: 'Throne',
    type: 's',
    width: 1,
    length: 1,
    stackHeight: 1.5,
    allowStack: false,
    allowWalk: false,
    allowSit: true,
    allowLay: false,
    interactionType: 'default',
    interactionModesCount: 1,
    allowGift: true,
    allowTrade: true,
    allowRecycle: true,
    allowMarketplaceSell: true,
    allowInventoryStack: true,
    vendingIds: '',
    customparams: '',
    effectIdMale: 0,
    effectIdFemale: 0,
    clothingOnWalk: '',
    multiheight: '',
    description: 'Royal seat',
    usageCount: 3
};

const catalogItems: CatalogRef[] = [
    { id: 7, catalogName: 'throne', costCredits: 25, costPoints: 0, pointsType: 0, pageId: 3, pageName: 'Rares' },
    { id: 8, catalogName: 'throne_bundle', costCredits: 0, costPoints: 10, pointsType: 5, pageId: 9, pageName: 'Diamonds' }
];

const renderView = (overrides: Partial<React.ComponentProps<typeof FurniEditorEditView>> = {}) => {
    const props = {
        item,
        catalogItems,
        furniDataEntry: null,
        furniDataDiagnostic: null,
        interactions: ['default', 'gate'],
        loading: false,
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
        onBack: vi.fn(),
        onUpdateFurnidata: vi.fn(),
        onRevertFurnidata: vi.fn(),
        onSyncPublicName: vi.fn(),
        onImportText: vi.fn(),
        importResult: null,
        ...overrides
    };

    render(<FurniEditorEditView {...props} />);

    return props;
};

afterEach(() => cleanup());

describe('FurniEditorEditView', () => {
    it('renders the items_base fields that the server accepts but the form used to hide', () => {
        renderView({ item: { ...item, effectIdMale: 12, effectIdFemale: 13, clothingOnWalk: 'ch-210', vendingIds: '1,2', multiheight: '0.5,1.0' } });

        expect(screen.getByLabelText('Effect ID (male)')).toHaveValue(12);
        expect(screen.getByLabelText('Effect ID (female)')).toHaveValue(13);
        expect(screen.getByLabelText('Clothing on walk')).toHaveValue('ch-210');
        expect(screen.getByLabelText('Vending IDs')).toHaveValue('1,2');
        expect(screen.getByLabelText('Multiheight')).toHaveValue('0.5,1.0');
        expect(screen.getByLabelText('Description (DB)')).toHaveValue('Royal seat');
    });

    it('confirms a save through a diff of the changed fields only, without the immutable identity columns', () => {
        const onUpdate = vi.fn<(id: number, fields: Record<string, unknown>) => void>();
        renderView({ onUpdate });

        expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

        fireEvent.change(screen.getByLabelText('Effect ID (male)'), { target: { value: '5' } });
        fireEvent.change(screen.getByLabelText('Multiheight'), { target: { value: '0.5,1.0' } });

        fireEvent.click(screen.getByRole('button', { name: 'Save (2)' }));

        const dialog = screen.getByRole('dialog', { name: 'Confirm changes' });
        expect(within(dialog).getByText('Effect ID (male)')).toBeInTheDocument();
        expect(within(dialog).getByText('Multiheight')).toBeInTheDocument();
        expect(within(dialog).queryByText('Width')).toBeNull();
        expect(onUpdate).not.toHaveBeenCalled();

        fireEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));

        expect(onUpdate).toHaveBeenCalledTimes(1);
        const [id, fields] = onUpdate.mock.calls[0];
        expect(id).toBe(42);
        expect(fields).toMatchObject({ effectIdMale: 5, multiheight: '0.5,1.0', width: 1 });
        expect(fields).not.toHaveProperty('itemName');
        expect(fields).not.toHaveProperty('spriteId');
        expect(fields).not.toHaveProperty('type');
    });

    it('rejects values outside the server bounds before offering the save', () => {
        renderView();

        fireEvent.change(screen.getByLabelText('Multiheight'), { target: { value: 'x'.repeat(51) } });

        expect(screen.getByText('Max 50 chars')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Save (1)' })).toBeDisabled();
    });

    it('lists the catalogue offers that sell this furni', () => {
        renderView();

        const section = screen.getByTestId('furni-editor-catalog');
        expect(within(section).getByText('Rares')).toBeInTheDocument();
        expect(within(section).getByText('25 credits')).toBeInTheDocument();
        expect(within(section).getByText('Diamonds')).toBeInTheDocument();
        expect(within(section).getByText('10 points (type 5)')).toBeInTheDocument();
    });

    it('says so when the furni is not sold anywhere', () => {
        renderView({ catalogItems: [] });

        expect(within(screen.getByTestId('furni-editor-catalog')).getByText('Not in the catalogue')).toBeInTheDocument();
    });

    it('guards a dirty form behind an in-app dialog instead of window.confirm', () => {
        const confirmSpy = vi.spyOn(window, 'confirm');
        const { onBack } = renderView();

        fireEvent.change(screen.getByLabelText('Effect ID (male)'), { target: { value: '5' } });
        fireEvent.click(screen.getByRole('button', { name: 'Back' }));

        expect(confirmSpy).not.toHaveBeenCalled();
        expect(onBack).not.toHaveBeenCalled();

        const dialog = screen.getByRole('dialog', { name: 'Unsaved changes' });
        fireEvent.click(within(dialog).getByRole('button', { name: 'Discard' }));

        expect(onBack).toHaveBeenCalledTimes(1);
        confirmSpy.mockRestore();
    });

    it('flags a stored interaction type that no server class is registered for, and keeps it selectable', () => {
        renderView({ item: { ...item, interactionType: 'wf_trg_typo' } });

        expect(screen.getByText('No class registered for this type: the furni behaves as default')).toBeInTheDocument();
        expect(screen.getByRole('combobox')).toHaveValue('wf_trg_typo');
    });

    it('does not flag a registered interaction type, whatever its case', () => {
        renderView({ item: { ...item, interactionType: 'Gate' } });

        expect(screen.queryByText('No class registered for this type: the furni behaves as default')).toBeNull();
    });

    it('shows one field group at a time and marks the groups holding unsaved changes', () => {
        renderView();

        const names = screen.getByRole('tab', { name: 'Names' });
        const behaviour = screen.getByRole('tab', { name: 'Behaviour' });
        expect(names).toHaveAttribute('aria-selected', 'true');
        expect(behaviour).toHaveAttribute('aria-selected', 'false');

        fireEvent.change(screen.getByLabelText('Effect ID (male)'), { target: { value: '5' } });

        expect(within(behaviour).getByLabelText('1 unsaved')).toBeInTheDocument();
        expect(within(names).queryByLabelText(/unsaved/)).toBeNull();

        fireEvent.click(behaviour);
        expect(behaviour).toHaveAttribute('aria-selected', 'true');
    });

    it('lists every unsaved change in the sidebar and jumps to the catalogue from its status row', () => {
        renderView();

        fireEvent.change(screen.getByLabelText('Effect ID (male)'), { target: { value: '5' } });
        expect(screen.getByText('1 unsaved change')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: '2 offers ›' }));
        expect(screen.getByRole('tab', { name: 'Catalogue' })).toHaveAttribute('aria-selected', 'true');
    });

    it('resets every field to the stored values with one click', () => {
        renderView();

        fireEvent.change(screen.getByLabelText('Effect ID (male)'), { target: { value: '5' } });
        fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }));

        expect(screen.getByLabelText('Effect ID (male)')).toHaveValue(0);
        expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });
});
