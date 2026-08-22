import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), 'utf8');

const ruleBody = (css: string, selector: string, occurrence = 0) => {
    let start = -1;
    let fromIndex = 0;

    for (let index = 0; index <= occurrence; index++) {
        start = css.indexOf(`${selector} {`, fromIndex);
        fromIndex = start + selector.length;
    }

    expect(start, `missing CSS rule ${selector}`).toBeGreaterThanOrEqual(0);

    const bodyStart = css.indexOf('{', start) + 1;
    const bodyEnd = css.indexOf('}', bodyStart);

    return css.slice(bodyStart, bodyEnd);
};

const pngMetadata = (relativePath: string) => {
    const png = readFileSync(resolve(process.cwd(), relativePath));

    return {
        width: png.readUInt32BE(16),
        height: png.readUInt32BE(20),
        sha256: createHash('sha256').update(png).digest('hex')
    };
};

describe('WIN63 AIR catalog gift parity', () => {
    const css = readSource('src/css/catalog/CatalogGiftView.css');
    const catalogCss = readSource('src/css/catalog/CatalogExperience.css');
    const frameCss = readSource('src/css/nitrocard/NitroCardView.css');
    const source = readSource('src/components/catalog/views/gift/CatalogGiftView.tsx');
    const confirmationSource = readSource('src/components/catalog/views/CatalogPurchaseConfirmView.tsx');

    it('pins the frame, body, gift card, and footer to the official XML coordinate plane', () => {
        const frame = ruleBody(css, '.nitro-card-shell.nitro-catalog-gift');
        const body = ruleBody(css, '.nitro-card-shell.nitro-catalog-gift .nitro-catalog-gift-content.container-fluid');

        expect(frame).toMatch(/width:\s*342px\s*!important/);
        expect(frame).toMatch(/height:\s*482px\s*!important/);
        expect(body).toMatch(/top:\s*34px\s*!important/);
        expect(body).toMatch(/left:\s*5px\s*!important/);
        expect(body).toContain('x=6/y=35');
        expect(body).toMatch(/width:\s*330px\s*!important/);
        expect(body).toMatch(/height:\s*440px\s*!important/);
        expect(ruleBody(css, '.nitro-catalog-gift-card')).toMatch(/top:\s*56px[\s\S]*left:\s*10px[\s\S]*width:\s*306px[\s\S]*height:\s*149px/);
        expect(ruleBody(css, '.nitro-catalog-gift-box-picker')).toMatch(/top:\s*253px[\s\S]*left:\s*10px[\s\S]*width:\s*306px[\s\S]*height:\s*83px/);
        expect(ruleBody(css, '.nitro-catalog-gift-submit', 1)).toMatch(/top:\s*404px[\s\S]*left:\s*171px[\s\S]*width:\s*150px[\s\S]*height:\s*25px/);
    });

    it('uses the shared AIR frame-3 titlebar, close states, typography, and shadow', () => {
        expect(source).toContain('frameStyle={3}');
        expect(css).not.toContain('nitro-card-header-shell');
        expect(css).not.toContain('close-3-');

        const frame = ruleBody(frameCss, '.nitro-card-shell.nitro-card-frame-3');
        const frameSkin = ruleBody(frameCss, '.nitro-card-shell.nitro-card-frame-3::before');
        const header = ruleBody(frameCss, '.nitro-card-shell.nitro-card-frame-3 > .nitro-card-header-shell');
        const title = ruleBody(frameCss, '.nitro-card-shell.nitro-card-frame-3 > .nitro-card-header-shell .nitro-card-title');
        const close = ruleBody(frameCss, '.nitro-card-shell.nitro-card-frame-3 > .nitro-card-header-shell .nitro-card-close-button');

        expect(frame).toMatch(/drop-shadow\(2\.828px 2\.828px 4px rgba\(0, 0, 0, 0\.349\)\)/);
        expect(frame).toMatch(/overflow:\s*visible\s*!important/);
        expect(frameSkin).toMatch(/border-image-slice:\s*33 10 10 10 fill/);
        expect(header).toMatch(/top:\s*5px[\s\S]*left:\s*5px[\s\S]*height:\s*27px[\s\S]*background:\s*transparent/);
        expect(title).toMatch(
            /top:\s*2px[\s\S]*height:\s*15px[\s\S]*HabboAirUbuntu[\s\S]*font-size:\s*12px[\s\S]*font-weight:\s*700[\s\S]*text-shadow:\s*none\s*!important/
        );
        expect(close).toMatch(/top:\s*2px[\s\S]*right:\s*0[\s\S]*width:\s*19px[\s\S]*height:\s*20px/);
    });

    it('keeps the gift-mode purchase confirmation on the official AIR frame and coordinate plane', () => {
        const frame = ruleBody(catalogCss, '.nitro-card-shell.nitro-catalog-purchase-confirm');
        const content = ruleBody(catalogCss, '.nitro-card-shell.nitro-catalog-purchase-confirm .nitro-catalog-purchase-confirm-content.container-fluid');

        expect(confirmationSource).toContain('frameStyle={3}');
        expect(confirmationSource).not.toContain('purchase-confirm-backdrop');
        expect(catalogCss).not.toContain('.nitro-catalog-purchase-confirm-backdrop');
        expect(frame).toMatch(/width:\s*325px[\s\S]*height:\s*339px/);
        expect(content).toMatch(/top:\s*32px[\s\S]*left:\s*0[\s\S]*width:\s*323px[\s\S]*height:\s*294px/);
        expect(ruleBody(catalogCss, '.nitro-catalog-purchase-confirm-preview')).toMatch(
            /top:\s*12px[\s\S]*left:\s*10px[\s\S]*width:\s*126px[\s\S]*height:\s*152px/
        );
        expect(ruleBody(catalogCss, '.nitro-catalog-purchase-confirm-properties')).toMatch(/top:\s*8px[\s\S]*left:\s*143px[\s\S]*width:\s*176px/);
        expect(ruleBody(catalogCss, '.nitro-catalog-purchase-confirm-actions', 1)).toMatch(
            /top:\s*181px[\s\S]*left:\s*13px[\s\S]*width:\s*315px[\s\S]*height:\s*27px/
        );
        expect(ruleBody(catalogCss, '.nitro-catalog-purchase-confirm-content.has-disclaimer.has-limited .nitro-catalog-purchase-confirm-actions')).toMatch(
            /top:\s*267px/
        );
        expect(ruleBody(catalogCss, '.nitro-catalog-purchase-confirm-button.is-cancel')).toMatch(/left:\s*0\s*!important/);
        expect(ruleBody(catalogCss, '.nitro-catalog-purchase-confirm-button.is-buy')).toMatch(/left:\s*186px\s*!important/);
        expect(ruleBody(catalogCss, '.nitro-catalog-purchase-confirm-preview img,\n.nitro-catalog-purchase-confirm-preview .furni-image')).toMatch(
            /width:\s*auto[\s\S]*max-width:\s*none[\s\S]*height:\s*auto[\s\S]*max-height:\s*none/
        );
        expect(ruleBody(catalogCss, '.nitro-catalog-purchase-confirm-preview::before')).toMatch(
            /border-image-source:\s*var\(--nitro-catalog-purchase-confirm-image-border\)[\s\S]*border-image-slice:\s*6 fill/
        );
        expect(ruleBody(catalogCss, '.nitro-catalog-purchase-confirm-summary')).toMatch(/justify-content:\s*flex-start[\s\S]*width:\s*288px/);
        expect(ruleBody(catalogCss, '.nitro-catalog-purchase-confirm-button.is-cancel')).toMatch(/border-image-source:\s*var\(--habbo-skin-shiny\)/);
        expect(ruleBody(catalogCss, '.nitro-catalog-purchase-confirm-button.is-buy')).toMatch(/border-image-source:\s*var\(--habbo-skin-shiny-thick-green\)/);
    });

    it('keeps the AIR text limits, dynamic 80px furniture render, and moderator-only identity control', () => {
        expect(source).toContain('maxLength={32}');
        expect(source).toContain('maxLength={140}');
        expect(source).toContain('direction={180}');
        expect(source).toContain('nativeCroppedHead');
        expect(source).not.toContain('uniqueKey="catalog-gift"');
        expect(source).toContain('{isModerator && (');
        expect(source).toContain('showPurchaserIdentity');
        expect(source).not.toContain("catalog.gift_wrapping.receiver'");
        expect(source).not.toContain('FaChevron');
        expect(source).not.toContain('variant="success"');
        expect(ruleBody(css, '.nitro-catalog-gift-product-image')).toMatch(/width:\s*80px[\s\S]*height:\s*80px/);
        expect(ruleBody(css, '.nitro-catalog-gift-avatar .nitro-catalog-gift-avatar-image img')).toMatch(
            /width:\s*auto[\s\S]*max-width:\s*none[\s\S]*height:\s*auto/
        );
    });

    it('uses the exact SWF bitmaps at their native dimensions', () => {
        const expectedAssets: Record<string, [number, number, string]> = {
            'arrow-left.png': [10, 9, '56c8d2cbc37f33b3b27320464da52884fb8ab4fb4d3d23f833b2ef51cf122f79'],
            'arrow-right.png': [10, 9, '4e46b38641476914644e076b173ae51c33d6bd3d144287262138bfca7b833d15'],
            'border-slot-e9e9e9.png': [7, 7, '74ec58678982f208c2b3ae825e3994b02ea599947ccec693410579e382b98887'],
            'button-default.png': [7, 7, '2af53c3eccd0dc4b4c2e91a75fd3cdd4c5c092e3ca423a47c76e86f20d587c9b'],
            'button-disabled.png': [7, 7, 'd3c5b9d799aea205f3d496e808b7c8b135277db55e5d5b5899323a01aef2564a'],
            'button-hover.png': [7, 7, '8417dd20ec12673b83055f2f2d33a12934745df113ce7b132b5abe7250f36313'],
            'button-pressed.png': [7, 7, '887f0404a45386741174f2d91383d356cb255875e7b8cf3690fc1c4bb7fe5fe3'],
            'checkbox-default.png': [15, 15, 'a2f932606f40cdf9ecb234a6149ad82e554e563251d1e498902853b4ccc2d40d'],
            'checkbox-selected.png': [15, 15, '3374f4c11f797afd856f42ce039d9e5c7a7c20e0e290fe0360075723d6eed5b9'],
            'gift-card-blank.png': [306, 149, 'db908e04b2185e96fb9e509c0b282f6284410b80e155960899a2610c352211d5'],
            'image-border-f1f1f1.png': [18, 18, 'c372ddb0a732158a3f3ac942d698aea3069fdbb3afa2cd753df6d0df8599e8b6'],
            'incognito.png': [37, 48, 'a720da5619d31cb969b7ffc6252a57d89f8c26e7e0912c0a20636cd1e5056bdc'],
            'palette-border.png': [27, 22, 'fdb0738f2ec293320710494ddbb66aa7d31ae2c4ca5fa889da79007b78303f49'],
            'palette-color.png': [27, 22, '852f7a92f67e389f5be36bdaf92ca8a0aa29206d91b6c61a64416c85910e8513'],
            'palette-selection.png': [27, 22, 'ea5110b54564c017922755cce903aa09918a47481cb746c2ed00719e97b450e5'],
            'small-coin.png': [16, 16, '3bb822f7627cebf8b8116114f93e2be41c5ef61941d759f7e8d95207054e1286'],
            'small-pen.png': [17, 18, 'afdd765a6c798c6cde547832a564ce5fec94544539d240fce7fc341927eff002']
        };

        for (const [filename, [width, height, sha256]] of Object.entries(expectedAssets)) {
            const metadata = pngMetadata(`src/assets/images/catalog/air/gift/${filename}`);

            expect(metadata.width, filename).toBe(width);
            expect(metadata.height, filename).toBe(height);
            expect(metadata.sha256, filename).toBe(sha256);
        }

        const purchaseAssets: Record<string, [number, number, string]> = {
            'border-thin-dark-ebf9fc.png': [13, 13, '81ae8d98442695d5747fce9a2ce965f3f3dca6128bd955050aaa4d4df96c93e9'],
            'unique-item-large-tile-upright.png': [34, 37, 'b5754a5a4e8cd73fe91d3e0fa67ceac2679c56e057bb04133bc42f789f12e42f']
        };

        for (const [filename, [width, height, sha256]] of Object.entries(purchaseAssets)) {
            const metadata = pngMetadata(`src/assets/images/catalog/air/${filename}`);

            expect(metadata.width, filename).toBe(width);
            expect(metadata.height, filename).toBe(height);
            expect(metadata.sha256, filename).toBe(sha256);
        }

        const sharedChromeAssets: Record<string, [number, number, string]> = {
            'close-3-default.png': [19, 20, '9d4dcdf0ee3daa91dd25718ba1be8a360d75c4cf12e80620fa85b5a77e18eb61'],
            'close-3-hover.png': [19, 20, '14917f746f6c32682efa2367cbfcc75a111fc16d30fb3fbccf0fda0ea3d0e27d'],
            'close-3-pressed.png': [19, 20, '3fdd4e027a3ae88dac0ac4df9d64b07cd357b541caea045a03fec8e1a7b81ba9'],
            'frame-ubuntu-3.png': [26, 55, 'c5c7213dda5a01ec51d49d65344a883803225612f4d89cdb8f50e158a712e195']
        };

        for (const [filename, [width, height, sha256]] of Object.entries(sharedChromeAssets)) {
            const metadata = pngMetadata(`src/assets/images/habbo-skin/slices/${filename}`);

            expect(metadata.width, filename).toBe(width);
            expect(metadata.height, filename).toBe(height);
            expect(metadata.sha256, filename).toBe(sha256);
        }
    });

    it('uses neutral AIR skins instead of green catalog controls', () => {
        expect(css).toContain('--nitro-gift-button: url("../../assets/images/catalog/air/gift/button-default.png")');
        expect(ruleBody(css, '.nitro-catalog-gift-arrow::before')).toMatch(/border-image-source:\s*var\(--nitro-gift-button\)/);
        expect(ruleBody(css, '.nitro-catalog-gift-submit::before')).toMatch(/border-image-source:\s*var\(--habbo-skin-shiny-thick\)/);
        expect(css).not.toContain('shiny-thick-green');
    });
});
