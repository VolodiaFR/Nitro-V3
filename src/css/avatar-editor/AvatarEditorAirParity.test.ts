import { createHash } from 'node:crypto';
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

const fileSha256 = (relativePath: string) =>
    createHash('sha256')
        .update(readFileSync(join(process.cwd(), relativePath)))
        .digest('hex');

describe('AIR avatar editor parity', () => {
    const css = readSource('src/css/avatar-editor/AvatarEditorView.css');
    const source = readSource('src/components/avatar-editor/AvatarEditorView.tsx');

    it('uses the AIR style-3 frame and fixed 490px content plane', () => {
        expect(source).toContain('frameStyle={3}');
        expect(ruleBody(css, '.nitro-avatar-editor')).toMatch(/width:\s*490px[;\s\S]*height:\s*523px/);

        const content = ruleBody(css, '.nitro-avatar-editor .nitro-avatar-editor-content.nitro-card-content-shell');

        expect(content).toMatch(/top:\s*33px/);
        expect(content).toMatch(/height:\s*490px/);
        expect(content).toMatch(/padding:\s*0\s*!important/);
    });

    it('attaches the 182px wardrobe side container at AIR x=487', () => {
        expect(ruleBody(css, '.nitro-avatar-editor.is-wardrobe-open')).toMatch(/width:\s*669px/);

        const wardrobe = ruleBody(css, '.nitro-avatar-editor-wardrobe');

        expect(wardrobe).toMatch(/width:\s*182px/);
        expect(wardrobe).toMatch(/margin-left:\s*-3px/);
        expect(css).toMatch(/@media[^}]+\}[\s\S]*\.nitro-avatar-editor\.is-wardrobe-open\s*\{[^}]*min-width:\s*0/);
    });

    it('locks the username to AIR Ubuntu Bold 28 white without a synthetic shadow', () => {
        const name = ruleBody(css, '.nitro-avatar-editor .nitro-avatar-editor-nameplate span');

        expect(name).toMatch(/left:\s*40px[;\s\S]*top:\s*15px[;\s\S]*width:\s*400px[;\s\S]*height:\s*35px/);
        expect(name).toMatch(/color:\s*#fff\s*!important/);
        expect(name).toMatch(/font-family:\s*HabboAirUbuntu/);
        expect(name).toMatch(/font-size:\s*28px\s*!important/);
        expect(name).toMatch(/font-weight:\s*700\s*!important/);
        expect(name).toMatch(/text-shadow:\s*none\s*!important/);
    });

    it('renders the exact hanger bitmap above the shiny button fill', () => {
        expect(source).toContain("import wardrobeHangerSrc from '../../assets/images/avatareditor/wardrobe-hanger.png'");
        expect(source).toContain('src={wardrobeHangerSrc}');
        expect(pngDimensions('src/assets/images/avatareditor/wardrobe-hanger.png')).toEqual({ width: 29, height: 21 });
        expect(fileSha256('src/assets/images/avatareditor/wardrobe-hanger.png')).toBe('eb29205bd762b98d1d5b0fb930580a7e65d60cff193a3ceaafa1d2afdf9d8bdd');

        const foreground = ruleBody(css, '.nitro-avatar-editor-wardrobe-toggle > img');

        expect(foreground).toMatch(/z-index:\s*1/);
        expect(foreground).toMatch(/width:\s*29px[;\s\S]*height:\s*21px/);
        expect(css).not.toContain('.nitro-avatar-editor-wardrobe-toggle.is-open');
    });

    it('uses the native AIR tab strip offset, 32px atlas chrome, and official surviving order', () => {
        expect(ruleBody(css, '.nitro-avatar-editor-tab-row')).toMatch(/left:\s*9px[;\s\S]*top:\s*79px/);

        const tab = ruleBody(css, '.nitro-avatar-editor .avatar-editor-tabs .nitro-avatar-editor-main-tab');

        expect(tab).toMatch(/height:\s*46px/);
        expect(tab).toMatch(/tab-default\.png[^;]*52px 32px/);
        expect(pngDimensions('src/assets/images/avatareditor/air/tab-default.png')).toEqual({ width: 52, height: 32 });
        expect(pngDimensions('src/assets/images/avatareditor/air/tab-hover.png')).toEqual({ width: 52, height: 32 });
        expect(pngDimensions('src/assets/images/avatareditor/air/tab-selected.png')).toEqual({ width: 52, height: 32 });
        expect(pngDimensions('src/assets/images/avatareditor/air/tab-content.png')).toEqual({ width: 486, height: 365 });

        const order = source.slice(source.indexOf('const MAIN_TAB_ORDER'));
        const markers = [
            'AvatarEditorFigureCategory.GENERIC',
            'AvatarEditorFigureCategory.HEAD',
            'AvatarEditorFigureCategory.TORSO',
            'AvatarEditorFigureCategory.LEGS',
            'AvatarEditorFigureCategory.MISC',
            'AvatarEditorFigureCategory.NFT',
            'AvatarEditorFigureCategory.PETS'
        ];
        const positions = markers.map((marker) => order.indexOf(marker));

        expect(positions.every((position) => position >= 0)).toBe(true);
        expect(positions).toEqual([...positions].sort((left, right) => left - right));
    });

    it('uses the native AIR misc bitmap and preserves intrinsic icon sizes', () => {
        expect(pngDimensions('src/assets/images/avatareditor/air/main-misc.png')).toEqual({ width: 24, height: 9 });
        expect(fileSha256('src/assets/images/avatareditor/air/main-misc.png')).toBe('a54d675e2e97c5dc5a8c5be6f18735b1ced4957c867a8886fe9559cc563c44c9');

        const icon = ruleBody(css, '.nitro-avatar-editor .nitro-avatar-editor-main-tab-icon');

        expect(icon).toMatch(/width:\s*auto/);
        expect(icon).toMatch(/height:\s*auto/);
        expect(source).toContain('`is-${modelKey}`');
        expect(ruleBody(css, '.nitro-avatar-editor .nitro-avatar-editor-main-tab.is-hd .nitro-avatar-editor-main-tab-icon')).toMatch(
            /top:\s*5px[;\s\S]*margin-left:\s*1px/
        );
        expect(ruleBody(css, '.nitro-avatar-editor .nitro-avatar-editor-main-tab.is-misc .nitro-avatar-editor-main-tab-icon')).toMatch(/top:\s*13px/);
    });

    it('keeps the AIR save anchor while using gray thick chrome and exact typography', () => {
        const save = ruleBody(css, '.nitro-avatar-editor .nitro-avatar-editor-save');

        expect(save).toMatch(/left:\s*357px[;\s\S]*top:\s*443px/);
        expect(save).toMatch(/width:\s*122px[;\s\S]*height:\s*28px/);
        expect(save).toMatch(/padding:\s*0 8px\s*!important/);
        expect(save).toMatch(/border-image-source:\s*var\(--habbo-skin-shiny-thick\)\s*!important/);
        expect(save).toMatch(/font-family:\s*HabboAirUbuntu/);
        expect(save).toMatch(/font-size:\s*12px\s*!important/);
        expect(source).not.toContain('className="nitro-avatar-editor-save" variant="success"');
    });

    it('keeps all Polaris-only avatar controls while using semantic native buttons', () => {
        expect(css).toContain('.nitro-avatar-editor .nitro-avatar-editor-advanced-color');
        expect(source).toContain('AvatarEditorAction.ACTION_RESET');
        expect(source).toContain('AvatarEditorAction.ACTION_CLEAR');
        expect(source).toContain('AvatarEditorAction.ACTION_RANDOMIZE');
        expect(source).toContain('AvatarEditorFigureCategory.PETS');
        expect(source).toContain('AvatarEditorFigureCategory.NFT');
        expect(source).not.toContain('<ButtonGroup className="nitro-avatar-editor-secondary-actions">');
    });
});
