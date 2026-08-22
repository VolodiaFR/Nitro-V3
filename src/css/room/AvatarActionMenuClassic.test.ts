import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const roomWidgetsCss = readFileSync(resolve(process.cwd(), 'src/css/room/RoomWidgets.css'), 'utf8');
const avatarMenuCss = roomWidgetsCss.slice(roomWidgetsCss.indexOf('.nitro-avatar-action-menu {'), roomWidgetsCss.indexOf('.nitro-context-menu.name-only'));

const getPngSize = (fileName: string) => {
    const png = readFileSync(resolve(process.cwd(), `src/assets/images/avatar-menu/air/${fileName}`));

    return [png.readUInt32BE(16), png.readUInt32BE(20)];
};

const AIR_ASSET_HASHES = {
    'arrow-down-hover.png': '6b479c682458154210913aa08f127c30efb3eab1bafc7146ac2caa54a617baa0',
    'arrow-down.png': '2bfee95a14854d712a16e62b0c7bc369fd0ff9939e82eb4eb0e0c058460266d2',
    'arrow-left.png': 'abec5bc9a87fa52a026abe60046c5f19070d62981a2dbe0dce0ed8ec890438b4',
    'arrow-right.png': '74037bdc2546d456e1699014bb02f93da4d6b04fe92fcd2566eb6f73e54057ad',
    'arrow-up-hover.png': '5f853e96fcb263a3e121a546eb20f716edfa6a733623ee837f493d8fa00a8e9a',
    'arrow-up.png': 'e2d70b5240db77de7650af4449f1ba00f490016c37ab439ed3d495b59dd91a97',
    'bubble-pointer-down.png': '83689638dd5bcec412a1ab898fb4f67e0e49a301825639c07b91bee709a37a2e',
    'bubble.png': '04843161b8123e13eaff91c5dce2aa5db2cbc4c3417d34c0944739ab4cade698',
    'button-grid-default.png': '0024e764d1ebdf3cd695ca3f375e084b73378f47bee3ff4e283c6b20eeb96e6b',
    'button-grid-disabled.png': '14d048641949d324506423594dcd2b77d2cb68d19a50a95dd05021b1dd557d04',
    'button-grid-hover.png': '08f51fb0dac0f5077624855693282f1f2e1b65193c1edfeb63b848b6b11dc156',
    'button-grid-pressed.png': '499af78bde1af1e6f340b13e00454e69e6be5966a9296ab878e7cec1d1b1fe21',
    'button-thick-default.png': 'e7506a02e74853d75c3c436c7996afaf20778ef0cb6f03ad24f5a179b1173778',
    'button-thick-disabled.png': '155cd0a7febb0ed6c11a1cdc43aae72c0e6332c0a73809a793e3634787ea1a5b',
    'button-thick-hover.png': '254269e6ccc47c88d05e973975dce5a33c2e27c79d4386af133bee196bc6702a',
    'button-thick-pressed.png': 'e5818aae4491773e4bf03f80e78c1ce24c6a75adf81c63823ab95558a5d9a8e1',
    'sign-exclamation.png': '6f6409afed264a260fad22d440bd2ed148bd566b4562a62a701df814dc743401',
    'sign-heart.png': 'ca5382a277df8fbb7302fafc9c9f7b840d7fb70c8a7896217e3f5dd1a86b548c',
    'sign-red.png': 'b3317993deeea8aa71865e1a0b651850a34a6105301eb1ff8b3bd2eac68a01d1',
    'sign-skull.png': '066f14537c8990cd0602213de60aadcd06b716c8af2204cacd7e4387dfaffb6d',
    'sign-smile.png': '1910c3133483631ea3a7188265d01b33def2d49b7203dd72ef0d2fc84249ecde',
    'sign-soccer.png': '597ce98d6f468be06e29e197666305af13de3236106c46c7041d839d788b116a',
    'sign-yellow.png': 'a615d5fa4aa5ec4a02278a95e06194e33b4f9f75c4f87e569634f7672d485c33',
    'vip.png': 'b454e67d641893d068862b832815f64b236f316980b7c9756f0091569f51d4d9'
} as const;

afterEach(() => {
    document.body.replaceChildren();
    document.head.replaceChildren();
});

describe('AIR own_avatar_menu bubble', () => {
    it('matches the 115px shell, header, 26px rows, and 18px footer from the XML', () => {
        const stylesheet = document.createElement('style');
        const menu = document.createElement('div');
        const header = document.createElement('div');
        const buttons = document.createElement('div');
        const item = document.createElement('div');
        const footer = document.createElement('div');

        stylesheet.textContent = avatarMenuCss;
        menu.className = 'nitro-context-menu nitro-avatar-action-menu nitro-avatar-action-menu--own';
        header.className = 'nitro-context-menu-header';
        buttons.className = 'air-avatar-menu-buttons';
        item.className = 'nitro-context-menu-item';
        footer.className = 'nitro-context-menu-footer';
        buttons.append(item);
        menu.append(header, buttons, footer);
        document.head.append(stylesheet);
        document.body.append(menu);

        const menuStyle = getComputedStyle(menu);
        const headerStyle = getComputedStyle(header);
        const buttonsStyle = getComputedStyle(buttons);
        const itemStyle = getComputedStyle(item);
        const footerStyle = getComputedStyle(footer);

        expect(menuStyle.width).toBe('115px');
        expect(menuStyle.minWidth).toBe('115px');
        expect(menuStyle.maxWidth).toBe('115px');
        expect(menuStyle.padding).toBe('11px 0px 10px');
        expect(menuStyle.borderWidth).toBe('0px');
        expect(menuStyle.textShadow).toBe('rgba(0, 0, 0, 0)');
        expect(headerStyle.width).toBe('107px');
        expect(headerStyle.height).toBe('16px');
        expect(headerStyle.marginLeft).toBe('4px');
        expect(headerStyle.marginBottom).toBe('5px');
        expect(headerStyle.fontWeight).toBe('700');
        expect(buttonsStyle.width).toBe('105px');
        expect(buttonsStyle.marginLeft).toBe('5px');
        expect(buttonsStyle.gap).toBe('1px');
        expect(itemStyle.width).toBe('103px');
        expect(itemStyle.height).toBe('26px');
        expect(itemStyle.marginLeft).toBe('1px');
        expect(itemStyle.backgroundColor).toBe('rgba(0, 0, 0, 0)');
        expect(itemStyle.borderWidth).toBe('0px');
        expect(footerStyle.width).toBe('100px');
        expect(footerStyle.height).toBe('18px');
        expect(footerStyle.marginLeft).toBe('8px');
    });

    it('matches the 45 by 35 minimized bubble and 38 by 30 expand region', () => {
        const stylesheet = document.createElement('style');
        const menu = document.createElement('div');
        const footer = document.createElement('div');

        stylesheet.textContent = avatarMenuCss;
        menu.className = 'nitro-context-menu nitro-avatar-action-menu nitro-avatar-action-menu--own menu-hidden';
        footer.className = 'nitro-context-menu-footer';
        menu.append(footer);
        document.head.append(stylesheet);
        document.body.append(menu);

        const menuStyle = getComputedStyle(menu);
        const footerStyle = getComputedStyle(footer);

        expect(menuStyle.width).toBe('45px');
        expect(menuStyle.minWidth).toBe('45px');
        expect(menuStyle.height).toBe('35px');
        expect(menuStyle.minHeight).toBe('35px');
        expect(menuStyle.padding).toBe('0px');
        expect(footerStyle.width).toBe('38px');
        expect(footerStyle.height).toBe('30px');
        expect(footerStyle.marginTop).toBe('4px');
        expect(footerStyle.marginLeft).toBe('4px');
    });

    it('forces AIR re-anchoring when the minimized view is swapped under the pointer', () => {
        const contextMenuSource = readFileSync(
            resolve(process.cwd(), 'src/components/room/widgets/context-menu/ContextMenuView.tsx'),
            'utf8'
        );

        expect(contextMenuSource).toContain('forcePositionUpdateRef.current = true');
        expect(contextMenuSource).toContain('isPointerOverRef.current && !forcePositionUpdateRef.current');
        expect(contextMenuSource).toContain('forcePositionUpdateRef.current = false');
        expect(roomWidgetsCss).toMatch(
            /\.nitro-avatar-action-menu--own \.nitro-context-menu-footer::before\s*\{[^}]*top:\s*7px;[^}]*left:\s*45px;[^}]*width:\s*13px;[^}]*height:\s*10px;/s
        );
        expect(roomWidgetsCss).toMatch(
            /\.nitro-avatar-action-menu--own\.menu-hidden \.nitro-context-menu-footer::before\s*\{[^}]*top:\s*11px;[^}]*left:\s*14px;[^}]*width:\s*15px;[^}]*height:\s*15px;/s
        );
    });

    it('keeps the separate peer-avatar menu at its 151px AIR width', () => {
        const stylesheet = document.createElement('style');
        const peerMenu = document.createElement('div');

        stylesheet.textContent = avatarMenuCss;
        peerMenu.className = 'nitro-context-menu nitro-avatar-action-menu';
        document.head.append(stylesheet);
        document.body.append(peerMenu);

        const peerStyle = getComputedStyle(peerMenu);

        expect(peerStyle.width).toBe('151px');
        expect(peerStyle.minWidth).toBe('151px');
        expect(peerMenu).not.toHaveClass('nitro-avatar-action-menu--own');
    });

    it('uses the exact AIR states, pointer placement, sign grid, and exported bitmap dimensions', () => {
        expect(roomWidgetsCss).toMatch(/\.nitro-avatar-action-menu--own::after\s*\{[^}]*bottom:\s*0;/s);
        expect(roomWidgetsCss).toMatch(
            /\.air-avatar-menu-buttons > \.nitro-context-menu-item::before\s*\{[^}]*top:\s*-4px;[^}]*left:\s*-3px;[^}]*width:\s*109px;[^}]*height:\s*35px;/s
        );
        expect(roomWidgetsCss).toContain('avatar-menu/air/button-thick-default.png');
        expect(roomWidgetsCss).toContain('avatar-menu/air/button-thick-hover.png');
        expect(roomWidgetsCss).toContain('avatar-menu/air/button-thick-pressed.png');
        expect(roomWidgetsCss).toContain('avatar-menu/air/button-thick-disabled.png');
        expect(roomWidgetsCss).toMatch(
            /\.air-avatar-menu-buttons > \.nitro-context-menu-item\.air-avatar-menu-item--locked::before,[^}]*locked:hover::before,[^}]*locked:active::before\s*\{[^}]*button-thick-disabled\.png/s
        );
        expect(roomWidgetsCss).toMatch(
            /\.nitro-avatar-action-menu--own \.air-avatar-menu-sign-cell::before\s*\{[^}]*top:\s*-3px;[^}]*left:\s*-3px;[^}]*width:\s*39px;[^}]*height:\s*29px;/s
        );
        expect(roomWidgetsCss).toContain('avatar-menu/air/button-grid-default.png');
        expect(roomWidgetsCss).toContain('avatar-menu/air/button-grid-hover.png');
        expect(roomWidgetsCss).toContain('avatar-menu/air/button-grid-pressed.png');
        expect(roomWidgetsCss).toMatch(/grid-template-columns:\s*34px 33px 33px;/);
        expect(roomWidgetsCss).toMatch(/grid-template-rows:\s*repeat\(6, 25px\);/);
        expect(roomWidgetsCss).toContain('avatar-menu/air/arrow-left.png');
        expect(roomWidgetsCss).toContain('avatar-menu/air/arrow-right.png');
        expect(roomWidgetsCss).toContain('avatar-menu/air/vip.png');

        expect(getPngSize('bubble-pointer-down.png')).toEqual([13, 9]);
        expect(getPngSize('arrow-left.png')).toEqual([5, 10]);
        expect(getPngSize('arrow-right.png')).toEqual([5, 10]);
        expect(getPngSize('arrow-up.png')).toEqual([10, 5]);
        expect(getPngSize('arrow-down.png')).toEqual([10, 5]);
        expect(getPngSize('vip.png')).toEqual([15, 15]);
        expect(getPngSize('button-thick-default.png')).toEqual([11, 24]);
        expect(getPngSize('button-grid-default.png')).toEqual([7, 7]);
        expect(getPngSize('sign-soccer.png')).toEqual([20, 20]);
    });

    it('keeps every pixel-compared AIR bitmap byte-for-byte stable', () => {
        for (const [fileName, expectedHash] of Object.entries(AIR_ASSET_HASHES)) {
            const png = readFileSync(resolve(process.cwd(), `src/assets/images/avatar-menu/air/${fileName}`));

            expect(createHash('sha256').update(png).digest('hex'), fileName).toBe(expectedHash);
        }
    });
});
