import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The catalog window widens itself to fit however many root categories the hotel publishes,
 * between the original client's 570px and a 1040px ceiling. Two things have to hold for that
 * to actually keep every category reachable, and neither is visible from a unit test of the
 * hook alone - jsdom has no layout, so the measurement it does returns zero.
 */
describe('catalog tab strip', () => {
    const hook = readFileSync(join(process.cwd(), 'src/components/catalog/useCatalogWindowWidth.ts'), 'utf8');
    const stylesheet = readFileSync(join(process.cwd(), 'src/css/catalog/CatalogView.css'), 'utf8');

    it('sizes the window from the tabs, from the original 570px up to a ceiling', () => {
        expect(hook).toContain('CATALOG_WINDOW_BASE_WIDTH = 570');
        expect(hook).toContain('CATALOG_WINDOW_MAX_WIDTH = 1040');
        expect(hook).toContain('measureCatalogTabStripWidth');
        // scrollWidth grows with the window it is used to size, so reading it feeds back into
        // itself. The comment naming that trap may stay; the call may not.
        const code = hook.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');

        expect(code).not.toContain('scrollWidth');
    });

    it('lets the tabs condense once the window cannot widen any further', () => {
        const rule = stylesheet.slice(
            stylesheet.indexOf('.nitro-catalog-window .nitro-catalog-tabs-shell .nitro-card-tab-item {'),
            stylesheet.indexOf('.nitro-catalog-window .nitro-catalog-tabs-shell .nitro-card-tab-item:last-of-type')
        );

        expect(rule).toContain('flex-shrink: 1');
        expect(rule).not.toContain('flex-shrink: 0');
        // Shrunk down to its icon a tab is still a target; shrunk to nothing it is not.
        expect(rule).toContain('min-width: 34px');
    });
});
