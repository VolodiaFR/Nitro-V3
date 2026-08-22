import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('club membership catalog layout', () => {
    it('matches the AIR vip_buy geometry and integrated offer actions', () => {
        const css = readFileSync(join(process.cwd(), 'src/css/catalog/CatalogVipBuyView.css'), 'utf8');
        const teaser = css.match(/\.nitro-club-teaser\s*\{([^}]+)\}/)?.[1] ?? '';
        const introCopy = css.match(/\.nitro-club-vip-copy\s*\{([^}]+)\}/)?.[1] ?? '';
        const offers = css.match(/\.nitro-club-vip-offers\s*\{([^}]+)\}/)?.[1] ?? '';
        const wideOffer = css.match(/\.nitro-club-offer\.is-wide\s*\{([^}]+)\}/)?.[1] ?? '';

        expect(teaser).toContain('top: 3px');
        expect(teaser).toContain('left: 3px');
        expect(teaser).toContain('width: 152px');
        expect(teaser).toContain('height: 291px');
        expect(teaser).toContain('object-fit: none');
        expect(introCopy).toContain('left: 161px');
        expect(introCopy).toContain('width: 198px');
        expect(introCopy).toContain('text-align: center');
        expect(offers).toContain('left: 19px');
        expect(offers).toContain('top: 170px');
        expect(offers).toContain('width: 336px');
        expect(offers).toContain('height: 257px');
        expect(offers).toContain('overflow: hidden');
        expect(wideOffer).toContain('width: 320px');
        expect(wideOffer).toContain('height: 75px');
        expect(css).toContain('left: 225px');
        expect(css).toContain('border-image-source: var(--habbo-skin-shiny-thick-green)');
    });

    it('matches the AIR club purchase confirmation frame and control geometry', () => {
        const css = readFileSync(join(process.cwd(), 'src/css/catalog/CatalogVipBuyView.css'), 'utf8');
        const frame = css.match(/\.nitro-card-shell\.nitro-club-purchase-confirm\s*\{([^}]+)\}/)?.[1] ?? '';
        const content = css.match(/\.nitro-club-purchase-confirm > \.nitro-club-purchase-confirm-content\.nitro-card-content-shell\s*\{([^}]+)\}/)?.[1] ?? '';
        const icon = css.match(/\.nitro-club-purchase-confirm-icon\s*\{([^}]+)\}/)?.[1] ?? '';
        const actions = css.match(/\.nitro-club-purchase-confirm-actions\s*\{([^}]+)\}/)?.[1] ?? '';

        expect(frame).toContain('width: 369px !important');
        expect(frame).toContain('height: 210px !important');
        expect(css).toContain('.draggable-window:has(> .nitro-club-purchase-confirm)');
        expect(content).toContain('top: 35px');
        expect(content).toContain('left: 2px');
        expect(content).toContain('width: 362px');
        expect(content).toContain('height: 161px');
        expect(icon).toContain('top: 20px');
        expect(icon).toContain('left: 12px');
        expect(icon).toContain('width: 85px');
        expect(icon).toContain('height: 40px');
        expect(icon).toContain('-177px -49px');
        expect(actions).toContain('top: 107px');
        expect(css).toContain('.nitro-club-purchase-confirm-content.has-disclaimer .nitro-club-purchase-confirm-actions');
        expect(css).toContain('top: 134px');
        expect(css).toContain('.nitro-club-purchase-confirm .nitro-club-purchase-confirm-cancel');
        expect(css).toContain('left: 9px');
        expect(css).toContain('border-image-source: var(--habbo-skin-shiny)');
        expect(css).toContain('font-weight: 400');
        expect(css).toContain('.nitro-club-purchase-confirm .nitro-club-purchase-confirm-submit');
        expect(css).toContain('left: 235px');
        expect(css).toContain('text-shadow: none');
        expect(css).toContain('catalog/air/gift/checkbox-default.png');
        expect(css).toContain('catalog/air/gift/checkbox-selected.png');
        expect(css).not.toContain('.nitro-club-confirmation {');
    });
});
