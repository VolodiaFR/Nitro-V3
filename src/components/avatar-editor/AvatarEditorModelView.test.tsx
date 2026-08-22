import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AvatarEditorModelView } from './AvatarEditorModelView';

const mocks = vi.hoisted(() => ({
    editor: {
        maxPaletteCount: 1,
        gender: 'M',
        setGender: vi.fn(),
        selectedColorParts: {} as Record<string, unknown[]>,
        getFirstSelectableColor: vi.fn(() => 1),
        selectEditorColor: vi.fn()
    }
}));

vi.mock('@nitrots/nitro-renderer', () => ({
    AvatarEditorFigureCategory: { GENERIC: 'generic' },
    AvatarFigurePartType: { FEMALE: 'F', MALE: 'M' },
    FigureDataContainer: { FEMALE: 'F', MALE: 'M' }
}));

vi.mock('../../api', () => ({
    CreateLinkEvent: vi.fn(),
    GetClubMemberLevel: () => 1,
    LocalizeText: (key: string) => key
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
    AvatarEditorFigureSetView: ({ category }: { category: { setType: string } }) => <div data-testid="figure-set">{category.setType}</div>
}));

vi.mock('./palette-set', () => ({
    AvatarEditorAdvancedColorView: () => null,
    AvatarEditorPaletteSetView: () => null
}));

const category = (setType: string) => ({
    setType,
    partItems: [],
    colorItems: [[], []]
});

describe('AvatarEditorModelView', () => {
    beforeEach(() => {
        mocks.editor.selectedColorParts = {};
        mocks.editor.selectEditorColor.mockClear();
    });

    it('renders the first subcategory immediately and falls back without a blank frame', () => {
        const { rerender } = render(<AvatarEditorModelView name="head" categories={[category('hr'), category('ha')] as never} />);

        expect(screen.getByTestId('figure-set')).toHaveTextContent('hr');
        expect(mocks.editor.selectEditorColor).toHaveBeenCalledWith('hr', 0, 1);

        rerender(<AvatarEditorModelView name="torso" categories={[category('ch'), category('cc')] as never} />);

        expect(screen.getByTestId('figure-set')).toHaveTextContent('ch');
        expect(mocks.editor.selectEditorColor).toHaveBeenCalledWith('ch', 0, 1);
    });
});
