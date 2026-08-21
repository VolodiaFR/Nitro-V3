import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const roomWidgetsCss = readFileSync(resolve(process.cwd(), 'src/css/room/RoomWidgets.css'), 'utf8');

afterEach(() => {
    document.body.replaceChildren();
    document.head.replaceChildren();
});

describe('Classic avatar action menu geometry', () => {
    it('matches the classic menu shell, rows and minimize footer', () => {
        const stylesheet = document.createElement('style');
        const menu = document.createElement('div');
        const header = document.createElement('div');
        const item = document.createElement('div');
        const split = document.createElement('div');
        const splitItem = document.createElement('div');
        const footer = document.createElement('div');

        stylesheet.textContent = roomWidgetsCss;
        menu.className = 'nitro-context-menu nitro-avatar-action-menu';
        header.className = 'nitro-context-menu-header';
        item.className = 'nitro-context-menu-item';
        split.className = 'menu-list-split-3';
        splitItem.className = 'nitro-context-menu-item';
        split.append(splitItem);
        footer.className = 'nitro-context-menu-footer';
        menu.append(header, item, split, footer);
        document.head.append(stylesheet);
        document.body.append(menu);

        const menuStyle = getComputedStyle(menu);
        const headerStyle = getComputedStyle(header);
        const itemStyle = getComputedStyle(item);
        const splitStyle = getComputedStyle(split);
        const splitItemStyle = getComputedStyle(splitItem);
        const footerStyle = getComputedStyle(footer);

        expect(menuStyle.width).toBe('115px');
        expect(menuStyle.minWidth).toBe('115px');
        expect(menuStyle.padding).toBe('7px 3px 5px');
        expect(menuStyle.backgroundColor).toBe('rgb(110, 107, 103)');
        expect(headerStyle.width).toBe('107px');
        expect(headerStyle.height).toBe('16px');
        expect(itemStyle.width).toBe('103px');
        expect(itemStyle.height).toBe('26px');
        expect(itemStyle.backgroundColor).toBe('rgb(45, 42, 39)');
        expect(splitStyle.width).toBe('103px');
        expect(splitItemStyle.width).toBe('calc(33.3333%)');
        expect(splitItemStyle.margin).toBe('0px');
        expect(footerStyle.width).toBe('100px');
        expect(footerStyle.height).toBe('18px');
        expect(footerStyle.backgroundColor).toBe('rgb(110, 107, 103)');
        expect(roomWidgetsCss).toMatch(/\.nitro-avatar-action-menu:not\(\.menu-hidden\)::after[\s\S]*border-top:\s*6px solid #6e6b67/);
    });

    it('matches the classic minimized bubble and region geometry', () => {
        const stylesheet = document.createElement('style');
        const menu = document.createElement('div');
        const footer = document.createElement('div');

        stylesheet.textContent = roomWidgetsCss;
        menu.className = 'nitro-context-menu nitro-avatar-action-menu menu-hidden';
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
        expect(menuStyle.backgroundColor).toBe('rgb(110, 107, 103)');
        expect(footerStyle.width).toBe('38px');
        expect(footerStyle.height).toBe('30px');
        expect(footerStyle.backgroundColor).toBe('rgb(110, 107, 103)');
    });
});
