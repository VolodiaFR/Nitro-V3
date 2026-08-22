import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('AIR catalog purchase chrome', () => {
    it('uses Ubuntu style-3 gift + 00aa00 buy at AIR sizes, with the WIN63 spinner', () => {
        const css = readFileSync(join(process.cwd(), 'src/css/catalog/CatalogView.css'), 'utf8');
        const skin = readFileSync(join(process.cwd(), 'src/css/habbo/HabboSkin.css'), 'utf8');
        const spinner = readFileSync(join(process.cwd(), 'src/components/catalog/views/page/widgets/CatalogSpinnerWidgetView.tsx'), 'utf8');
        const buyBlock = css.match(/\.nitro-catalog-window \.nitro-catalog-standard-buy-button \{[\s\S]*?\n\}/)?.[0] ?? '';
        const giftBlock = css.match(/\.nitro-catalog-window \.nitro-catalog-standard-gift-button \{[\s\S]*?\n\}/)?.[0] ?? '';

        expect(giftBlock).toContain('width: 170px');
        expect(giftBlock).toContain('height: 24px');
        expect(buyBlock).toContain('width: 170px');
        expect(buyBlock).toContain('height: 24px');
        expect(buyBlock).not.toContain('#3dcc45');
        expect(buyBlock).not.toContain('#ffe66b');
        expect(giftBlock).not.toContain('#ffe66b');
        expect(skin).toContain('button-shiny-thick-green-default.png');
        expect(skin).toContain('--habbo-skin-shiny-thick-green');
        expect(skin).toContain('--habbo-skin-shiny');
        expect(skin).toMatch(/\.nitro-catalog-standard-gift-button \{[\s\S]*--habbo-skin-shiny/s);
        expect(skin).toMatch(/\.nitro-catalog-standard-buy-button \{[\s\S]*--habbo-skin-shiny-thick-green/s);
        expect(css).not.toContain('linear-gradient(180deg, #b6e86b');
        expect(spinner).toContain('nitro-catalog-standard-spinner-button-more');
        expect(spinner).toContain('nitro-catalog-standard-spinner-button-less');
        expect(spinner).toContain('spinner-arrow-up.png');
        expect(spinner).toContain('catalog.bundlewidget.spinner.select.amount');
        expect(spinner).not.toContain('bundlePurchaseAllowed');
        expect(spinner).not.toContain('FaPlus');
        expect(css).toContain('width: 14px');
        expect(css).toContain('width: 24px');
    });
});
