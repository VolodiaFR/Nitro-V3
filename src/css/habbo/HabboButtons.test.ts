import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
const pngSize = (path: string) => {
    const png = readFileSync(join(process.cwd(), path));

    return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
};

describe('AIR button chrome', () => {
    it('uses Ubuntu 9-slice skins — never CSS-gradient gold or green buy', () => {
        const theme = read('src/css/habbo/HabboTheme.css');
        const skin = read('src/css/habbo/HabboSkin.css');
        const buttons = read('src/css/common/Buttons.css');
        const catalog = read('src/css/catalog/CatalogView.css');
        const primary = theme.match(/\.habbo-btn-primary,[\s\S]*?\.habbo-btn-green:hover/s)?.[0] ?? theme;

        expect(skin).toContain('button-shiny-thick-green-default.png');
        expect(skin).toContain('--habbo-skin-shiny-thick-green');
        expect(primary).toContain('var(--habbo-skin-shiny-thick-green)');
        expect(primary).not.toContain('linear-gradient');
        expect(theme).toMatch(/\.habbo-btn-secondary,[\s\S]*var\(--habbo-skin-button\)/);
        expect(theme).toMatch(/\.habbo-btn-danger \{[\s\S]*--habbo-skin-shiny-red/s);

        expect(buttons).toContain('var(--habbo-skin-shiny-thick-green)');
        expect(buttons).not.toContain('#3dcc45');
        expect(buttons).not.toContain('#ffe66b');
        expect(theme).not.toContain('#ffe66b');
        expect(catalog).not.toContain('#ffe66b');
        expect(catalog).not.toContain('#3dcc45');
        expect(catalog).not.toContain('--catalog-admin-gold');
        const buyBlock = catalog.match(/\.nitro-catalog-window \.nitro-catalog-standard-buy-button \{[\s\S]*?\n\}/)?.[0] ?? '';
        expect(buyBlock).toContain('--habbo-skin-shiny-thick-green');
        expect(buyBlock).not.toContain('linear-gradient');
    });

    it('lands WIN63 shiny-thick and colorized default slices at AIR atlas sizes', () => {
        const slices = 'src/assets/images/habbo-skin/slices';
        const expected: Record<string, { width: number; height: number }> = {
            'button-shiny-default.png': { width: 11, height: 22 },
            'button-shiny-thick-default.png': { width: 11, height: 24 },
            'button-shiny-thick-green-default.png': { width: 11, height: 24 },
            'button-shiny-green-default.png': { width: 11, height: 22 },
            'button-default.png': { width: 7, height: 7 },
            'button-help-default.png': { width: 7, height: 7 },
            'button-logout-default.png': { width: 7, height: 7 },
            'button-settings-default.png': { width: 7, height: 7 }
        };

        for (const [file, size] of Object.entries(expected)) {
            const path = join(slices, file);

            expect(existsSync(join(process.cwd(), path)), path).toBe(true);
            expect(pngSize(path)).toEqual(size);
        }
    });
});
