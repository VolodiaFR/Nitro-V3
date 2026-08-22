import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'src/css/room/InfoStand.css'), 'utf8');
const userView = readFileSync(resolve(process.cwd(), 'src/components/room/widgets/avatar-info/infostand/InfoStandWidgetUserView.tsx'), 'utf8');
const badgeSlotView = readFileSync(resolve(process.cwd(), 'src/components/room/widgets/avatar-info/infostand/InfoStandBadgeSlotView.tsx'), 'utf8');

describe('AIR user infostand layout', () => {
    it('keeps the 190px frame and the AIR 170px content rail at x=10', () => {
        expect(css).toMatch(/\.nitro-infostand\s*\{[^}]*width:\s*190px;[^}]*padding:\s*4px;[^}]*border:\s*6px solid transparent;/s);
        expect(css).toMatch(/\.nitro-infostand__rule\s*\{[^}]*width:\s*170px;/s);
        expect(css).toMatch(/\.nitro-infostand__header\s*\{[^}]*width:\s*170px;[^}]*height:\s*12px;/s);
    });

    it('matches the AIR 132px figure strip and 42px badge coordinates', () => {
        expect(css).toMatch(/\.nitro-infostand__figure-row\s*\{[^}]*gap:\s*5px;[^}]*width:\s*170px;[^}]*min-height:\s*132px;/s);
        expect(css).not.toContain('background: #6d6d6d');
        expect(css).toMatch(/\.nitro-infostand__avatar-well\s*\{[^}]*background-color:\s*transparent;/s);
        expect(css).toMatch(/grid-template-columns:\s*42px 42px;/);
        expect(css).toMatch(/grid-auto-rows:\s*42px;/);
        expect(css).toMatch(/gap:\s*1px 1px;/);
        expect(css).toMatch(/margin-top:\s*1px;/);
    });

    it('uses AIR runtime motto sizing instead of the oversized XML initialization', () => {
        expect(css).toMatch(/\.nitro-infostand__motto\s*\{[^}]*min-height:\s*26px;[^}]*max-height:\s*53px;[^}]*background:\s*transparent;/s);
        expect(css).toMatch(/\.motto-input\s*\{[^}]*height:\s*23px;[^}]*min-height:\s*23px;/s);
    });

    it('uses the exported AIR home icon and separate score label/value rows', () => {
        expect(userView).toContain('assets/images/infostand/home-icon.png');
        expect(userView).toContain("<span>{LocalizeText('infostand.text.achievement_score')}</span>");
        expect(userView).toContain('<span>{avatarInfo.achievementScore}</span>');
        expect(css).toMatch(/\.nitro-infostand__score\s*\{[^}]*grid-template-rows:\s*15px 15px;[^}]*gap:\s*3px;/s);
    });

    it('retains clickable own-user empty slots with a visible plus placeholder', () => {
        expect(badgeSlotView).toContain("isOwnUser && !badgeCode ? 'is-empty cursor-pointer' : ''");
        expect(badgeSlotView).toMatch(/isOwnUser\s*&&\s*\(\s*<span className="nitro-infostand__badge-slot-plus"/s);
        expect(css).toMatch(/&\.is-empty\s*\{[^}]*border:\s*1px dashed rgba\(255, 255, 255, 0\.2\);/s);
    });
});
