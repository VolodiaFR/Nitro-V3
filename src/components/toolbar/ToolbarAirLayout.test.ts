import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');
const pngSize = (path: string) => {
    const png = readFileSync(join(root, path));

    return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
};

describe('AIR bottom bar bitmaps and slot layout', () => {
    it('lands WIN63 bottom_bar_* PNGs at the official sizes', () => {
        const air = 'src/assets/images/toolbar/air';
        const expected: Record<string, { width: number; height: number }> = {
            'logo.png': { width: 28, height: 28 },
            'home.png': { width: 32, height: 30 },
            'navigator.png': { width: 44, height: 30 },
            'games.png': { width: 25, height: 37 },
            'shop.png': { width: 37, height: 37 },
            'buildersclub.png': { width: 32, height: 33 },
            'inventory.png': { width: 44, height: 41 },
            'memenu-bg.png': { width: 45, height: 45 },
            'memenu-circle.png': { width: 45, height: 45 },
            'wired.png': { width: 40, height: 40 },
            'camera.png': { width: 38, height: 45 },
            'divider.png': { width: 1, height: 40 },
            'collapse-left.png': { width: 13, height: 45 },
            'collapse-right.png': { width: 13, height: 45 },
            'all-friends.png': { width: 32, height: 33 },
            'search-habbos.png': { width: 29, height: 33 },
            'messenger.png': { width: 26, height: 32 },
            'friends-browse-bg.png': { width: 29, height: 31 },
            'friend-browse-arrow-left.png': { width: 5, height: 10 },
            'friend-browse-arrow-right.png': { width: 5, height: 10 }
        };

        for(const [ file, size ] of Object.entries(expected))
        {
            const path = join(air, file);

            expect(existsSync(join(root, path)), path).toBe(true);
            expect(pngSize(path)).toEqual(size);
        }
    });

    it('paints official toolbar icons from those SWF bitmaps', () => {
        const icons = read('src/css/icons/icons.css');

        expect(icons).toContain('toolbar/air/shop.png');
        expect(icons).toContain('toolbar/air/games.png');
        expect(icons).toContain('toolbar/air/navigator.png');
        expect(icons).toContain('toolbar/air/buildersclub.png');
        expect(icons).toContain('toolbar/air/inventory.png');
        expect(icons).toContain('toolbar/air/logo.png');
        expect(icons).toContain('toolbar/air/camera.png');
        expect(icons).toContain('toolbar/air/wired.png');
        expect(icons).toContain('toolbar/air/all-friends.png');
        expect(icons).toContain('toolbar/air/search-habbos.png');
        expect(icons).toContain('toolbar/air/messenger.png');
        expect(icons).not.toContain('toolbar/icons/game.png');
    });

    it('uses AIR slot metrics: 46px #55534E bar, 45px slots, 8px gap', () => {
        const css = read('src/css/toolbar/ToolBar.css');

        expect(css).toContain('height: 46px');
        expect(css).toContain('background: #55534e');
        expect(css).toContain('width: 45px');
        expect(css).toContain('height: 41px');
        expect(css).toContain('gap: 8px');
        expect(css).toContain('padding-top: 1px');
        expect(css).not.toContain('inset 0 5px 0 -3px');
    });

    it('keeps official left order then Polaris extras after the divider', () => {
        const source = read('src/components/toolbar/ToolbarView.tsx');
        const left = source.slice(source.indexOf('ref={ leftDockRef }'), source.indexOf('ref={ rightDockRef }'));
        const icons = [ ...left.matchAll(/icon="([^"]+)"/g) ].map(match => match[1]);

        expect(icons).toEqual([
            'habbo',
            'house',
            'rooms',
            'progression',
            'game',
            'stories',
            'catalog',
            'buildersclub',
            'inventory',
            'wired-tools',
            'camera',
            'fortune-wheel',
            'youtube',
            'soundboard',
            'buildheight',
            'modtools',
            'housekeeping'
        ]);
        expect(left.indexOf('memenu-bg')).toBeGreaterThan(-1);
        expect(left.indexOf('memenu-circle')).toBeGreaterThan(-1);
        expect(left.indexOf('tb-divider')).toBeGreaterThan(left.indexOf('icon="camera"'));
        expect(left.indexOf('icon="fortune-wheel"')).toBeGreaterThan(left.indexOf('tb-divider'));
    });

    it('keeps official right-rail icons then Polaris mentions', () => {
        const source = read('src/components/toolbar/ToolbarView.tsx');
        const rightStart = source.indexOf('ref={ rightDockRef }');
        const right = source.slice(rightStart, source.indexOf('id="toolbar-friend-bar-container-desktop"', rightStart));
        const icons = [ ...right.matchAll(/icon="([^"]+)"/g) ].map(match => match[1]);

        expect(icons).toEqual([ 'friendall', 'friendsearch', 'message', 'mentions' ]);
        expect(right.indexOf('tb-divider')).toBeGreaterThan(-1);
        expect(right.indexOf('icon="friendsearch"')).toBeGreaterThan(right.indexOf('icon="friendall"'));
        expect(right.indexOf('icon="mentions"')).toBeGreaterThan(right.indexOf('icon="message"'));
    });

    it('keeps official desktop icons on the 46px bar and paints friend-bar arrows from SWF bitmaps', () => {
        const source = read('src/components/toolbar/ToolbarView.tsx');
        const friends = read('src/components/friends/views/friends-bar/FriendsBarView.tsx');
        const friendsCss = read('src/css/friends/FriendsView.css');

        expect(source).not.toContain('COMPACT_DESKTOP_QUERY');
        expect(source).not.toContain('NARROW_DESKTOP_QUERY');
        expect(source).not.toContain('compactDesktop');
        expect(source).toContain('collapse-left.png');
        expect(source).not.toContain('collapse-chevron.png');
        expect(source).toContain("iconState === MessengerIconState.UNREAD ? (messengerNotifyFrame === 1 ? 'is-notify-1' : 'is-notify-0')");
        expect(friends).toContain('friend-browse-arrow-left.png');
        expect(friends).toContain('friends-browse-bg.png');
        expect(friends).not.toContain('FaChevronLeft');
        expect(friendsCss).not.toMatch(/friend-bar-button\.(left|right)\{background:url\(data:/);
        expect(friendsCss).toContain('friend-bar-browse-bg');
        expect(friendsCss).toContain('transform: scaleX(-1)');
    });
});
