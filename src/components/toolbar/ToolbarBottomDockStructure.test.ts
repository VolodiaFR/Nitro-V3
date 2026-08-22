import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('AIR bottom dock integration', () => {
    it('measures both desktop rails and positions chat from the resolved dock layout', () => {
        const source = readSource('src/components/toolbar/ToolbarView.tsx');

        expect(source).toContain('resolveBottomDockLayout');
        expect(source).toContain('leftDockRef');
        expect(source).toContain('rightDockRef');
        expect(source).toContain('dockLayout.chatBottom');
        expect(source).not.toContain("const compactFramePosition = 'bottom-[90px] min-[1700px]:bottom-[7px]'");
    });

    it('persists manual rail collapse without using the desktop width as a fake input mode', () => {
        const source = readSource('src/components/toolbar/ToolbarView.tsx');

        expect(source).toContain("'nitro.toolbar.leftCollapsed'");
        expect(source).toContain("'nitro.toolbar.rightCollapsed'");
        expect(source).not.toContain("'hidden min-[1700px]:flex'");
    });

    it('uses AIR tab capacity instead of limiting the friend bar to three friends', () => {
        const source = readSource('src/components/friends/views/friends-bar/FriendsBarView.tsx');

        expect(source).toContain('resolveAirFriendTabCapacity');
        expect(source).not.toContain('MAX_DISPLAY_COUNT');
    });

    it('keeps pixel icons stable and uses AIR disabled-arrow feedback', () => {
        const toolbarSource = readSource('src/components/toolbar/ToolbarView.tsx');
        const toolbarCss = readSource('src/css/toolbar/ToolBar.css');
        const friendsCss = readSource('src/css/friends/FriendsView.css');
        const toolbarIconCss = toolbarCss.slice(toolbarCss.indexOf('.tb-icon'), toolbarCss.indexOf('.tb-avatar-head'));

        expect(toolbarSource).not.toContain('whileHover={ { scale: 1.08 } }');
        expect(toolbarIconCss).not.toContain('scale(');
        expect(toolbarCss).toContain('translate(-1px, -1px)');
        expect(friendsCss).toContain('.friend-bar .friend-bar-button.left:disabled{opacity:.2}');
        expect(friendsCss).toContain('.friend-bar .friend-bar-button.right:disabled{opacity:.2}');
    });

    it('uses the AIR bitmap-window geometry instead of aligning the raw PNG canvases', () => {
        const toolbarCss = readSource('src/css/toolbar/ToolBar.css');

        expect(toolbarCss).toMatch(
            /\.icon-progression\s*\{[^}]*left:\s*0;[^}]*top:\s*0;[^}]*width:\s*44px;[^}]*height:\s*37px;[^}]*background-position:\s*6px 1px;/s
        );
        expect(toolbarCss).toMatch(
            /\.icon-game\s*\{[^}]*left:\s*6px;[^}]*top:\s*0;[^}]*width:\s*33px;[^}]*height:\s*43px;[^}]*background-position:\s*4px 3px;/s
        );
        expect(toolbarCss).toMatch(
            /\.icon-stories\s*\{[^}]*left:\s*5px;[^}]*top:\s*1px;[^}]*width:\s*35px;[^}]*height:\s*37px;[^}]*background-position:\s*0 -1px;/s
        );
        expect(toolbarCss).toMatch(
            /\.icon-buildersclub\s*\{[^}]*left:\s*5px;[^}]*top:\s*1px;[^}]*width:\s*35px;[^}]*height:\s*37px;[^}]*background-position:\s*1px 2px;/s
        );
        expect(toolbarCss).toMatch(
            /\.icon-wired-tools\s*\{[^}]*left:\s*3px;[^}]*top:\s*0;[^}]*width:\s*38px;[^}]*height:\s*45px;[^}]*background-position:\s*-1px 2px;/s
        );
        expect(toolbarCss).toMatch(/\.tb-divider\s*\{[^}]*align-self:\s*flex-start;/s);
        expect(toolbarCss).toMatch(/\.tb-open-shell-right \.tb-divider\s*\{[^}]*margin-top:\s*2px;/s);
        expect(toolbarCss).toMatch(/\.tb-collapse img\s*\{[^}]*top:\s*-1px;[^}]*left:\s*1px;/s);
    });
});
