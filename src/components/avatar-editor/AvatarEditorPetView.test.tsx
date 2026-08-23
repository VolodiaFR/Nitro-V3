import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AvatarEditorPetView } from './AvatarEditorPetView';

const mocks = vi.hoisted(() => ({
    editor: {
        selectedParts: {} as Record<string, number>,
        selectEditorPart: vi.fn(),
        selectedColorParts: {} as Record<string, unknown[]>,
        maxPaletteCount: 1,
        getFirstSelectableColor: vi.fn(() => 1),
        selectEditorColor: vi.fn()
    }
}));

vi.mock('../../api', () => ({
    AvatarEditorThumbnailsHelper: { build: vi.fn() },
    CreateLinkEvent: vi.fn(),
    GetClubMemberLevel: () => 0
}));

vi.mock('../../common', () => ({
    LayoutCurrencyIcon: () => null
}));

vi.mock('../../hooks', () => ({
    useAvatarEditor: () => mocks.editor
}));

vi.mock('./AvatarEditorIcon', () => ({
    AvatarEditorIcon: ({ icon }: { icon: string }) => <span>{icon}</span>
}));

vi.mock('./figure-set', () => ({
    AvatarEditorFigureSetView: () => <div data-testid="figure-set" />
}));

vi.mock('./palette-set', () => ({
    AvatarEditorAdvancedColorView: () => null,
    AvatarEditorPaletteSetView: () => null
}));

const petCategory = {
    setType: 'pt',
    partItems: [{ id: -1, isClear: true }],
    colorItems: [[], []]
};

describe('AvatarEditorPetView', () => {
    beforeEach(() => {
        mocks.editor.selectedParts = {};
        mocks.editor.selectedColorParts = {};
        mocks.editor.selectEditorColor.mockClear();
    });

    it('opens safely when no companion or slot thumbnail is selected', () => {
        render(<AvatarEditorPetView categories={[petCategory] as never} />);

        expect(screen.getByText('No companion selected')).toBeInTheDocument();
        expect(screen.getByTestId('figure-set')).toBeInTheDocument();
    });
});
