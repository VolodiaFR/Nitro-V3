import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

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

const pngDimensions = (relativePath: string) => {
    const png = readFileSync(join(process.cwd(), relativePath));

    return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
};

const fileSha256 = (relativePath: string) =>
    createHash('sha256')
        .update(readFileSync(join(process.cwd(), relativePath)))
        .digest('hex');

describe('AIR default catalog parity', () => {
    const catalogCss = readSource('src/css/catalog/CatalogView.css');
    const catalogExperienceCss = readSource('src/css/catalog/CatalogExperience.css');
    const skinCss = readSource('src/css/habbo/HabboSkin.css');
    const itemGridSource = readSource('src/components/catalog/views/page/widgets/CatalogItemGridWidgetView.tsx');
    const offerTileSource = readSource('src/components/catalog/views/page/common/CatalogOfferTileView.tsx');
    const builderStatusSource = readSource('src/components/catalog/views/catalog-header/CatalogBuildersClubStatusView.tsx');
    const purchaseWidgetSource = readSource('src/components/catalog/views/page/widgets/CatalogPurchaseWidgetView.tsx');
    const productPreviewSource = readSource('src/components/catalog/views/page/widgets/CatalogViewProductWidgetView.tsx');
    const defaultLayoutSource = readSource('src/components/catalog/views/page/layout/CatalogLayoutDefaultView.tsx');
    const colorGroupingLayoutSource = readSource('src/components/catalog/views/page/layout/CatalogLayoutColorGroupingView.tsx');
    const roomPreviewSource = readSource('src/common/layout/LayoutRoomPreviewerView.tsx');

    it('uses the active Ubuntu header and 360px product region geometry', () => {
        expect(ruleBody(catalogCss, '.nitro-catalog-standard-header')).toMatch(/(?:flex:\s*0 0|height:)\s*90px/);
        expect(ruleBody(catalogCss, '.nitro-catalog-standard-header-title')).toMatch(/font-size:\s*18px/);
        expect(ruleBody(catalogCss, '.nitro-catalog-standard-header-description')).toMatch(/font-size:\s*12px/);
        expect(ruleBody(catalogCss, '.nitro-catalog-search-shell')).toMatch(/margin:\s*0/);
        expect(catalogCss).not.toContain('calc(100% + 3px)');
    });

    it('pins the embedded quantity field to the XML coordinates', () => {
        expect(ruleBody(catalogCss, '.nitro-catalog-standard-spinner')).toMatch(/width:\s*200px/);
        expect(ruleBody(catalogCss, '.nitro-catalog-standard-spinner-label')).toMatch(/left:\s*0[;\s]/);
        expect(ruleBody(catalogCss, '.nitro-catalog-standard-spinner-label')).toMatch(/top:\s*3px/);
        expect(ruleBody(catalogCss, '.nitro-catalog-standard-spinner-label')).toMatch(/font-size:\s*12px/);
        expect(ruleBody(catalogCss, '.nitro-catalog-standard-spinner-input-frame')).toMatch(/left:\s*65px/);
        expect(ruleBody(catalogCss, '.nitro-catalog-standard-spinner-input-frame')).toMatch(/width:\s*30px/);
        expect(ruleBody(catalogCss, '.nitro-catalog-window .nitro-catalog-standard-spinner-value')).toMatch(/left:\s*3px/);
        expect(ruleBody(catalogCss, '.nitro-catalog-window .nitro-catalog-standard-spinner-value')).toMatch(/top:\s*5px/);
        expect(ruleBody(catalogCss, '.nitro-catalog-window .nitro-catalog-standard-spinner-value')).toMatch(/font-size:\s*10px/);
        expect(skinCss).toContain('--habbo-skin-border-white:');
        expect(pngDimensions('src/assets/images/habbo-skin/slices/border-white.png')).toEqual({ width: 18, height: 18 });
    });

    it('keeps the total price and purchase buttons at their fixed footer positions', () => {
        expect(ruleBody(catalogCss, '.nitro-catalog-default-layout')).toMatch(/height:\s*460px/);
        expect(ruleBody(catalogCss, '.nitro-catalog-grid-shell', 1)).toMatch(/height:\s*155px/);
        expect(ruleBody(catalogCss, '.nitro-catalog-grid-shell', 1)).toMatch(/padding:\s*3px;/);
        expect(ruleBody(catalogCss, '.nitro-catalog-price-row')).toMatch(/top:\s*405px/);
        expect(ruleBody(catalogCss, '.nitro-catalog-purchase-row', 1)).toMatch(/top:\s*430px/);
        expect(ruleBody(catalogCss, '.nitro-catalog-total-price-slot')).toMatch(/left:\s*180px/);
        expect(ruleBody(catalogCss, '.nitro-catalog-total-price-slot')).toMatch(/width:\s*180px/);
        expect(ruleBody(catalogCss, '.nitro-catalog-total-price-label')).toMatch(/left:\s*20px/);
        expect(ruleBody(catalogCss, '.nitro-catalog-total-price-value')).toMatch(/left:\s*85px/);
        expect(ruleBody(catalogCss, '.nitro-catalog-total-price-value .nitro-catalog-standard-price-display')).toMatch(/margin-left:\s*auto/);
        expect(ruleBody(catalogCss, '.nitro-catalog-offer-actions')).toMatch(/margin-top:\s*3px/);
        expect(pngDimensions('src/assets/images/catalog/air/currency-credit-big.png')).toEqual({ width: 22, height: 22 });
    });

    it('limits fixed AIR tile coordinates to standard density and sizes virtual rows from the selected density', () => {
        expect(catalogCss).toMatch(/\.nitro-catalog-grid-density-standard,[\s\S]*grid-template-columns:\s*repeat\(var\(--nitro-air-column-count, 6\), 53px\)/);
        expect(catalogCss).toContain('.nitro-catalog-grid-density-standard .nitro-catalog-grid-price.is-single-price');
        expect(catalogCss).toContain('.nitro-catalog-grid-density-standard .nitro-catalog-grid-price.is-multi-price');
        expect(catalogCss).toContain('.nitro-catalog-grid-density-standard .layout-grid-item.is-active');
        expect(catalogCss).toMatch(
            /\.nitro-catalog-grid-density-standard\.uses-base-grid-template,[\s\S]*grid-template-columns:\s*repeat\(var\(--nitro-air-column-count, 8\), 36px\)/
        );
        expect(catalogCss).toContain('.nitro-catalog-air-mixed-grid.uses-mixed-grid-template');
        expect(catalogCss).toContain('.nitro-catalog-item-grid-scroll-area:has(.nitro-catalog-grid-density-standard)');
        expect(catalogCss).toContain('.nitro-catalog-grid:not(.nitro-catalog-grid-density-standard):has(.layout-grid-item > .avatar-image)');
        expect(catalogCss).toContain('.nitro-catalog-grid-density-standard.is-builder-grid .layout-grid-item.is-active::before');
        expect(ruleBody(catalogCss, '.nitro-catalog-window .is-builder-grid .layout-grid-item.is-active')).toMatch(
            /border-color:\s*var\(--catalog-standard-bc-outer\)\s*!important/
        );
        expect(catalogCss).toContain('.layout-grid-item.uses-base-grid-template');
        expect(catalogExperienceCss).toContain(".nitro-catalog-window [role='option']:not([aria-selected='true']):focus-visible");
        expect(offerTileSource).not.toContain('itemActive={itemActive}');
        expect(itemGridSource).toContain("'--nitro-grid-column-min-height': `${effectiveColumnMinHeight}px`");
        expect(itemGridSource).toContain('columnGap={3}');
        expect(itemGridSource).toContain('itemMinWidth={effectiveColumnMinWidth}');
        expect(itemGridSource).toContain('rowGap={isAirStandardDensity ? 0 : 3}');
    });

    it('uses the dedicated AIR preview button skin and arrow crops', () => {
        expect(skinCss).toContain('--habbo-skin-shiny-large:');
        expect(skinCss).not.toContain('button.nitro-catalog-preview-btn');
        expect(pngDimensions('src/assets/images/habbo-skin/slices/button-shiny-large-default.png')).toEqual({ width: 20, height: 34 });
        expect(pngDimensions('src/assets/images/catalog/air/preview-arrow-left.png')).toEqual({ width: 10, height: 9 });
        expect(pngDimensions('src/assets/images/catalog/air/preview-arrow-right.png')).toEqual({ width: 10, height: 9 });
        expect(fileSha256('src/assets/images/catalog/air/preview-arrow-left.png')).toBe('56c8d2cbc37f33b3b27320464da52884fb8ab4fb4d3d23f833b2ef51cf122f79');
        expect(fileSha256('src/assets/images/catalog/air/preview-arrow-right.png')).toBe('4e46b38641476914644e076b173ae51c33d6bd3d144287262138bfca7b833d15');
        expect(ruleBody(catalogCss, '.nitro-catalog-window button.nitro-catalog-preview-btn')).toMatch(/border:\s*0\s*!important/);
        expect(ruleBody(catalogCss, '.nitro-catalog-window button.nitro-catalog-preview-btn::before')).toMatch(/border-image-slice:\s*6 6 7 6 fill/);
        expect(ruleBody(catalogCss, '.nitro-catalog-window .nitro-catalog-preview-controls .nitro-catalog-preview-arrow')).toMatch(
            /filter:\s*none\s*!important/
        );
    });

    it('renders the full 360x348 AIR room canvas through the borderless 360x240 viewport', () => {
        const productRegion = ruleBody(catalogCss, '.nitro-catalog-product-view');
        const roomSurface = ruleBody(catalogCss, '.nitro-catalog-offer-preview > .shadow-room-previewer');

        expect(productRegion).toMatch(/width:\s*360px\s*!important/);
        expect(productRegion).toMatch(/height:\s*240px/);
        expect(productRegion).toMatch(/border:\s*0/);
        expect(productRegion).toMatch(/border-radius:\s*0/);
        expect(roomSurface).toMatch(/height:\s*348px\s*!important/);
        expect(productPreviewSource).toContain('height = 240');
        expect(defaultLayoutSource).toContain('<CatalogViewProductWidgetView height={348} />');
        expect(colorGroupingLayoutSource).toContain('<CatalogViewProductWidgetView height={348} />');
        expect(productPreviewSource).toContain('roomPreviewer.reset(true)');
        expect(productPreviewSource).not.toContain("roomPreviewer.updateObjectRoom('111', '217', '1.1')");
        expect(productPreviewSource).not.toMatch(/LayoutRoomPreviewerView\s+key=/);
    });

    it('keeps AIR product text and capability art at their source coordinates', () => {
        const details = ruleBody(catalogExperienceCss, '.nitro-catalog-preview-details');

        expect(details).toMatch(/top:\s*12px/);
        expect(details).toMatch(/left:\s*10px/);
        expect(details).toMatch(/width:\s*280px/);
        expect(details).toMatch(/height:\s*64px/);
        expect(details).toMatch(/font-family:\s*HabboAirUbuntu/);
        expect(ruleBody(catalogExperienceCss, '.nitro-catalog-product-details-name')).toMatch(/line-height:\s*17px[;\s\S]*overflow-wrap:\s*anywhere/);
        expect(ruleBody(catalogExperienceCss, '.nitro-catalog-product-details-description')).toMatch(/line-height:\s*15px[;\s\S]*overflow-wrap:\s*anywhere/);
        expect(ruleBody(catalogExperienceCss, '.nitro-catalog-product-details-description:empty')).toMatch(/height:\s*4px[;\s\S]*line-height:\s*4px/);
        expect(ruleBody(catalogExperienceCss, '.nitro-catalog-product-capability.is-no-trade,\n.nitro-catalog-product-capability.is-no-trade img')).toMatch(
            /width:\s*40px[;\s\S]*height:\s*16px/
        );
    });

    it('blits room frames to one canvas without PNG or CSS-image churn', () => {
        expect(roomPreviewSource).toContain('texture.getPixels(texture)');
        expect(roomPreviewSource).toContain('context.putImageData(frameImageData, 0, 0)');
        expect(roomPreviewSource).not.toContain("toDataURL('image/png')");
        expect(roomPreviewSource).not.toContain('style.backgroundImage');
        expect(roomPreviewSource).toContain('width === textureWidth');
    });

    it('keeps Buy visible at low balance and checks affordability on click', () => {
        expect(purchaseWidgetSource).toContain('showInsufficientBalanceAlert');
        expect(purchaseWidgetSource).not.toContain('if (priceCredits > getCurrencyAmount(-1))');
        expect(purchaseWidgetSource).not.toContain('if (pricePoints > getCurrencyAmount(currentOffer.activityPointType))');
        expect(purchaseWidgetSource).toContain("const purchaseButtonClassNames = [...standardButtonClassNames, 'nitro-catalog-standard-buy-button']");
    });

    it('keeps the AIR catalog tab dimensions above the shared Nitro card cascade', () => {
        const shell = ruleBody(catalogCss, '.nitro-catalog-window .nitro-catalog-tabs-shell');
        const tab = ruleBody(catalogCss, '.nitro-catalog-window .nitro-catalog-tabs-shell .nitro-card-tab-item');

        expect(shell).toMatch(/height:\s*35px/);
        expect(tab).toMatch(/height:\s*30px\s*!important/);
        expect(tab).toMatch(/padding:\s*4px 8px 6px\s*!important/);
    });

    it('renders all three parameterized Builders Club header lines', () => {
        expect(builderStatusSource).toContain("['BCSTATUS']");
        expect(builderStatusSource).toContain("['DURATION']");
        expect(builderStatusSource).toContain("'builder.header.status.limit'");
        expect(ruleBody(catalogCss, '.nitro-catalog-standard-header.is-builder .nitro-catalog-standard-header-description.is-builder-membership')).toMatch(
            /top:\s*30px/
        );
        expect(ruleBody(catalogCss, '.nitro-catalog-standard-header.is-builder .nitro-catalog-standard-header-description.is-builder-limit')).toMatch(
            /top:\s*45px/
        );
    });
});
