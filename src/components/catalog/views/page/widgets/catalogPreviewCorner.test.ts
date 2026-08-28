import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The limited-edition plate and the rotation controls share the top-right corner of the product
 * preview, and in the original client they overlap: `limitedItemWidget` spans 186..360 of a
 * 360-wide box while `rotate_avatar_left/right` sit at 300..354 of the same box. That works
 * there because the plaque is artwork aligned to its left edge. Ours is text, so it has to stop
 * where the controls begin.
 */
describe('catalog preview top-right corner', () => {
    const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
    const experience = read('src/css/catalog/CatalogExperience.css');
    const catalog = read('src/css/catalog/CatalogView.css');
    const widget = read('src/components/catalog/views/page/widgets/CatalogLimitedItemWidgetView.tsx');

    // Anchored at a line start: the same class also appears inside longer, more specific
    // selectors, and a bare indexOf lands in the first of those instead.
    const rule = (stylesheet: string, selector: string) => {
        const start = stylesheet.indexOf(`
${selector} {`);

        expect(start).toBeGreaterThan(-1);

        return stylesheet.slice(start, stylesheet.indexOf('}', start));
    };

    it('keeps the original placement for both', () => {
        const plate = rule(experience, '.nitro-catalog-preview-limited');
        const controls = rule(catalog, '.nitro-catalog-preview-controls');

        expect(plate).toContain('left: 186px');
        expect(plate).toContain('top: 5px');
        expect(plate).toContain('width: 174px');
        expect(controls).toContain('right: 6px');
        expect(controls).toContain('width: 54px');
    });

    it('stops the plate where the controls begin', () => {
        const plate = rule(experience, '.nitro-catalog-preview-limited');

        // 54px of buttons and the 6px they are inset by: 186 + 174 - 60 = 300, where the
        // original puts rotate_avatar_left.
        expect(plate).toContain('padding-right: 60px');
        // Centred, the text sits under those buttons however much room is reserved.
        expect(widget).not.toContain('mx-auto');
    });
});
