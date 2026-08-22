import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('Avatar editor wardrobe AIR layout', () => {
    it('keeps wardrobe as a side panel with Habbo AIR slot geometry', () => {
        const view = readSource('src/components/avatar-editor/AvatarEditorView.tsx');
        const wardrobe = readSource('src/components/avatar-editor/AvatarEditorWardrobeView.tsx');
        const css = readSource('src/css/avatar-editor/AvatarEditorView.css');

        expect(view).toContain('nitro-avatar-editor-wardrobe-toggle');
        expect(view).toContain('is-wardrobe-open');
        expect(view).toContain('AvatarEditorFigureCategory.WARDROBE');
        expect(view).toContain('.filter((modelKey) => modelKey !== AvatarEditorFigureCategory.WARDROBE)');
        expect(view).not.toContain('tab-wardrobe');
        expect(view).not.toContain('w-[880px]');

        expect(wardrobe).toContain('SLOTS_PER_COL = 7');
        expect(wardrobe).toContain('HC_SLOT_LIMIT = 5');
        expect(wardrobe).toContain('wardrobe-empty-slot.png');
        expect(wardrobe).toContain('direction={4}');
        expect(wardrobe).not.toContain('InfiniteGrid');

        expect(css).toContain('width: 182px');
        expect(css).toContain('width: 56px');
        expect(css).toContain('height: 56px');
        expect(css).toContain('width: 139px');
        expect(css).toContain('height: 418px');
        expect(css).toContain('wardrobe-slots-border.png');
        expect(css).toContain('wardrobe-hanger.png');
        expect(css).toContain('wardrobe-arrow-save.png');
        expect(css).toContain('wardrobe-arrow-wear.png');
        expect(css).toContain('left: 29px');
        expect(css).toContain('left: 30px');
        expect(css).toContain('#83827e');
    });
});
