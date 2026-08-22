import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

const ruleBody = (css: string, selector: string) => {
    const start = css.indexOf(`${selector} {`);

    expect(start, `missing CSS rule ${selector}`).toBeGreaterThanOrEqual(0);

    const bodyStart = css.indexOf('{', start) + 1;
    const bodyEnd = css.indexOf('}', bodyStart);

    return css.slice(bodyStart, bodyEnd);
};

const pngDimensions = (relativePath: string) => {
    const png = readFileSync(join(process.cwd(), relativePath));

    return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
};

const expectInOrder = (source: string, markers: string[]) => {
    const positions = markers.map((marker) => source.indexOf(marker));

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((left, right) => left - right));
};

describe('AIR user settings parity', () => {
    const settingsCss = readSource('src/css/user-settings/UserSettingsView.css');
    const settingsSource = readSource('src/components/user-settings/UserSettingsView.tsx');

    it('matches the official menu and sound panel coordinates', () => {
        expect(ruleBody(settingsCss, '.user-settings-window.air-settings-window')).toMatch(/--air-settings-width:\s*180px/);
        expect(ruleBody(settingsCss, '.air-settings-window__title')).toMatch(/top:\s*5px/);
        expect(ruleBody(settingsCss, '.air-settings-window__title')).toMatch(/left:\s*20px/);
        expect(ruleBody(settingsCss, '.air-settings-window__divider')).toMatch(/top:\s*22px/);
        expect(ruleBody(settingsCss, '.air-settings-window__divider')).toMatch(/left:\s*5px/);

        expect(ruleBody(settingsCss, '.air-settings-window--audio')).toMatch(/--air-settings-width:\s*312px/);
        expect(ruleBody(settingsCss, '.air-settings-audio__heading')).toMatch(/top:\s*32px/);
        expect(ruleBody(settingsCss, '.air-settings-audio__rows')).toMatch(/top:\s*48px/);
        expect(ruleBody(settingsCss, '.air-settings-volume-row')).toMatch(/height:\s*28px/);
        expect(ruleBody(settingsCss, '.air-settings-volume-row__slider')).toMatch(/left:\s*98px/);
        expect(ruleBody(settingsCss, '.air-settings-volume-row__slider')).toMatch(/width:\s*144px/);
    });

    it('uses the exact AIR slider and speaker bitmap dimensions', () => {
        expect(pngDimensions('src/assets/images/user-settings/air/slider-base.png')).toEqual({ width: 139, height: 20 });
        expect(pngDimensions('src/assets/images/user-settings/air/slider-button.png')).toEqual({ width: 12, height: 15 });
        expect(pngDimensions('src/assets/images/user-settings/air/sounds-off-white.png')).toEqual({ width: 29, height: 22 });
        expect(pngDimensions('src/assets/images/user-settings/air/sounds-on-white.png')).toEqual({ width: 29, height: 22 });
    });

    it('keeps AIR entries first and appends every Polaris-only setting', () => {
        expectInOrder(settingsSource, ['id="volumeSystem"', 'id="volumeFurni"', 'id="volumeTrax"', '<SoundboardVolumeControl']);
        expectInOrder(settingsSource, [
            "'memenu.settings.other.ignore.room.invites'",
            "'memenu.settings.other.disable.room.camera.follow'",
            "'memenu.settings.other.place.multiple.objects'",
            "'memenu.settings.other.skip.purchase.confirmation'",
            "'memenu.settings.other.catalog.grid.density'",
            "'memenu.settings.other.catalog.show.prices'",
            "'memenu.settings.other.keyboard.movement'"
        ]);
        expect(settingsSource).toContain("CreateLinkEvent('user-account-settings/show')");
        expectInOrder(settingsSource, ["openMenuSection('privacy')", "'usersettings.open.title'"]);
    });

    it('uses AIR chrome instead of the generic Nitro card controls', () => {
        expect(settingsSource).toContain('<AirSettingsFrame');
        expect(settingsSource).not.toContain('NitroCardView');
        expect(settingsSource).not.toContain('FaVolume');
        expect(settingsCss).toContain('border-ubuntu-6-79756e.png');
    });
});
